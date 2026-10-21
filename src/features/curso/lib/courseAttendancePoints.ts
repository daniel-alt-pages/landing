import type {
  CourseRecentSession,
  CourseSimulacroBonus,
  CourseStudentMetrics,
} from '../types/courseTypes';
import {
  dayIsPerfectForStreak,
  isSundayBogota,
  type AttendanceStreakOptions,
} from './courseAttendanceExcusas';
import { filterVacacionalLiveRecentSessions } from './courseVacacionalAttendance';
import {
  isTrackableSession,
  mergeWeekSessionsWithSchedule,
  type WeekScheduledClass,
} from './courseAttendanceWeek';

/** 1 punto por minuto en vivo (base). */
export const POINTS_PER_MINUTE = 1;
/** Tras 10 días perfectos consecutivos, cada minuto suma el doble. */
export const STREAK_MULTIPLIER_DAY_THRESHOLD = 10;
/** Minutos mínimos por clase para contar el día en la racha. */
export const MIN_MINUTES_PER_CLASS_FOR_STREAK = 60;
/** Tope del bonus diario por racha (control de inflación). */
export const MAX_DAILY_STREAK_BONUS = 12;

export type AttendancePointsBreakdown = {
  /** Puntos base por minutos (1 pt/min). */
  minutos: number;
  /** Puntos extra del multiplicador 2× (solo tras 10+ días de racha). */
  multiplicador: number;
  /** Bonus incremental por días perfectos consecutivos. */
  rachaDias: number;
  /** Puntos por simulacros del vacacional (puntaje global ICFES). */
  simulacros?: number;
};

export type AttendancePoints = {
  total: number;
  breakdown: AttendancePointsBreakdown;
  /** Racha de días perfectos al cierre del período calculado. */
  currentDayStreak: number;
  /** ¿Multiplicador 2× activo al final? */
  streakMultiplierActive: boolean;
};

export const ATTENDANCE_POINTS_BREAKDOWN_LABELS: Record<
  keyof Omit<AttendancePointsBreakdown, 'simulacros'>,
  string
> = {
  minutos: 'Minutos en vivo',
  multiplicador: 'Bonus racha 10+ días',
  rachaDias: 'Racha diaria perfecta',
};

export const SIMULACRO_POINTS_BREAKDOWN_LABEL = 'Simulacros vacacional';

export function sumSimulacroBonusPoints(bonuses?: CourseSimulacroBonus[]): number {
  return (bonuses ?? []).reduce((sum, b) => sum + Math.max(0, Number(b.points) || 0), 0);
}

export function mergeSimulacroIntoAttendancePoints(
  points: AttendancePoints,
  bonuses?: CourseSimulacroBonus[],
): AttendancePoints {
  const simulacros = sumSimulacroBonusPoints(bonuses);
  if (!simulacros) return points;
  return {
    ...points,
    breakdown: { ...points.breakdown, simulacros },
    total: points.total + simulacros,
  };
}

/** Firestore trae simulacroBonuses; métricas locales de Meet/ICS no. */
export function mergeSimulacroBonusesIntoMetrics<T extends CourseStudentMetrics>(
  metrics: T,
  source?: Pick<CourseStudentMetrics, 'simulacroBonuses'> | null,
): T {
  const fromSource = source?.simulacroBonuses;
  if (!fromSource?.length) return metrics;
  if (metrics.simulacroBonuses?.length) return metrics;
  return { ...metrics, simulacroBonuses: fromSource };
}

const EMPTY_BREAKDOWN: AttendancePointsBreakdown = {
  minutos: 0,
  multiplicador: 0,
  rachaDias: 0,
};

function attended(status: CourseRecentSession['status']): boolean {
  return status === 'present' || status === 'partial';
}

function orderedTrackableSessions(
  sessions: CourseRecentSession[] | undefined,
  weekSchedules?: WeekScheduledClass[][],
): CourseRecentSession[] {
  const list = weekSchedules?.length
    ? weekSchedules.flatMap((schedule) => mergeWeekSessionsWithSchedule(sessions, schedule))
    : [...(sessions || [])];

  return list
    .filter(isTrackableSession)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.startsAtIso || '').localeCompare(b.startsAtIso || '') ||
        (a.topic || '').localeCompare(b.topic || ''),
    );
}

function finalizeDay(
  daySessions: CourseRecentSession[],
  date: string,
  dayStreak: number,
  breakdown: AttendancePointsBreakdown,
  excusaDates?: ReadonlySet<string>,
): number {
  if (!daySessions.length && !excusaDates?.has(date)) return dayStreak;

  const perfect = dayIsPerfectForStreak(daySessions, date, excusaDates);
  if (perfect) {
    const next = dayStreak + 1;
    breakdown.rachaDias += Math.min(next, MAX_DAILY_STREAK_BONUS);
    return next;
  }
  return 0;
}

function addMinutePoints(
  minutes: number,
  dayStreakBeforeDay: number,
  breakdown: AttendancePointsBreakdown,
): void {
  if (minutes <= 0) return;
  breakdown.minutos += minutes;
  if (dayStreakBeforeDay >= STREAK_MULTIPLIER_DAY_THRESHOLD) {
    breakdown.multiplicador += minutes;
  }
}

/**
 * Puntos acumulativos: minutos (+ bonus 2× tras 10 días perfectos) + racha diaria incremental.
 * Excusas protegen racha pero no aportan minutos. Domingos no alteran la racha.
 */
export function computeAttendancePoints(
  sessions: CourseRecentSession[] | undefined,
  weekSchedules?: WeekScheduledClass[][],
  courseId = 'preicfes-sg26',
  options?: AttendanceStreakOptions,
): AttendancePoints {
  const scoped =
    courseId === 'preicfes-sg26'
      ? filterVacacionalLiveRecentSessions(sessions, courseId)
      : sessions || [];

  const ordered = orderedTrackableSessions(scoped, weekSchedules);
  const excusaDates = options?.excusaDates;
  if (!ordered.length && !excusaDates?.size) {
    return {
      total: 0,
      breakdown: { ...EMPTY_BREAKDOWN },
      currentDayStreak: 0,
      streakMultiplierActive: false,
    };
  }

  const breakdown: AttendancePointsBreakdown = { ...EMPTY_BREAKDOWN };
  let dayStreak = 0;
  let currentDate = '';
  let daySessions: CourseRecentSession[] = [];
  let dayStreakAtDayStart = 0;

  const flushDay = () => {
    if (!currentDate || isSundayBogota(currentDate)) {
      daySessions = [];
      return;
    }
    dayStreak = finalizeDay(daySessions, currentDate, dayStreak, breakdown, excusaDates);
    daySessions = [];
  };

  for (const session of ordered) {
    const date = session.date || '';
    if (date && date !== currentDate) {
      if (currentDate) flushDay();
      currentDate = date;
      dayStreakAtDayStart = dayStreak;
    }
    if (date && !isSundayBogota(date)) daySessions.push(session);

    if (attended(session.status)) {
      if (session.countTowardPoints !== false) {
        addMinutePoints(session.minutes || 0, dayStreakAtDayStart, breakdown);
      }
    }
  }

  if (currentDate) flushDay();

  const total =
    breakdown.minutos +
    breakdown.multiplicador +
    breakdown.rachaDias +
    (breakdown.simulacros ?? 0);

  return {
    total,
    breakdown,
    currentDayStreak: dayStreak,
    streakMultiplierActive: dayStreak >= STREAK_MULTIPLIER_DAY_THRESHOLD,
  };
}
