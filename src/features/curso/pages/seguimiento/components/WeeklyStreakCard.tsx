'use client';

import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Check, X, Zap } from 'lucide-react';
import StreakFlameIcon from '../../../components/StreakFlameIcon';
import type { CourseRecentSession } from '../../../types/courseTypes';
import { computeAttendanceStreaks } from '../../../lib/courseAttendanceStreaks';
import { dayIsPerfectForStreak, isSundayBogota } from '../../../lib/courseAttendanceExcusas';
import { isTrackableSession } from '../../../lib/courseAttendanceWeek';
import { filterVacacionalLiveRecentSessions } from '../../../lib/courseVacacionalAttendance';
import { bogotaTodayKey, bogotaWeekRange } from '../../../lib/courseVacacionalWeek';
import { useCourseTheme } from '../../../hooks/useCourseTheme';
import {
  MIN_MINUTES_PER_CLASS_FOR_STREAK,
  STREAK_MULTIPLIER_DAY_THRESHOLD,
} from '../../../lib/courseAttendancePoints';
import {
  streakContextMessage,
  streakTier,
  streakTierBadgeNumberClass,
  type StreakTier,
} from '../lib/seguimientoStreakUi';

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;

function streakRankGradient(tier: StreakTier): string {
  if (tier >= 7) return 'linear-gradient(135deg, #818CF8, #6366F1, #818CF8, #A5B4FC)';
  if (tier >= 6) return 'linear-gradient(135deg, #FB7185, #F43F5E, #FB923C, #FDA4AF)';
  if (tier >= 3) return 'linear-gradient(135deg, #CD7F32, #F97316, #FDBA74, #E8A849)';
  if (tier >= 1) return 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700, #FFEC8B)';
  return 'linear-gradient(135deg, #C0C0C0, #E8E8E8, #A8A8A8, #D4D4D4)';
}

function streakRankTextShadow(tier: StreakTier): string {
  if (tier >= 7) return '0 2px 5px rgba(0,0,0,0.75), 0 0 14px rgba(99,102,241,0.55)';
  if (tier >= 6) return '0 2px 5px rgba(0,0,0,0.75), 0 0 14px rgba(244,63,94,0.5)';
  return '0 2px 5px rgba(0,0,0,0.75), 0 0 16px rgba(255,165,0,0.45)';
}

export type WeekDayStreakState = 'perfect' | 'partial' | 'missed' | 'neutral' | 'pending';

type WeekDayCell = {
  date: string;
  label: string;
  state: WeekDayStreakState;
  isToday: boolean;
};

function isPendingSession(status: CourseRecentSession['status']): boolean {
  return status === 'upcoming' || status === 'live-soon';
}

function attended(status: CourseRecentSession['status']): boolean {
  return status === 'present' || status === 'partial';
}

function computeWeekDayCells(
  sessions: CourseRecentSession[],
  weekKeys: string[],
  today: string,
  excusaDates?: ReadonlySet<string>,
): WeekDayCell[] {
  const byDate = new Map<string, CourseRecentSession[]>();
  for (const session of sessions) {
    if (!session.date) continue;
    const bucket = byDate.get(session.date) || [];
    bucket.push(session);
    byDate.set(session.date, bucket);
  }

  return weekKeys.map((date, index) => {
    const daySessions = byDate.get(date) || [];
    const label = WEEKDAY_LABELS[index] ?? '?';
    const isToday = date === today;

    if (isSundayBogota(date)) {
      return { date, label, state: 'neutral' as WeekDayStreakState, isToday };
    }

    if (!daySessions.length) {
      if (excusaDates?.has(date)) {
        return { date, label, state: 'perfect' as WeekDayStreakState, isToday };
      }
      return { date, label, state: 'neutral' as WeekDayStreakState, isToday };
    }

    if (date > today) {
      return { date, label, state: 'neutral' as WeekDayStreakState, isToday };
    }

    const completed = daySessions.filter((s) => !isPendingSession(s.status));
    const pending = daySessions.filter((s) => isPendingSession(s.status));

    if (completed.length === 0 && pending.length > 0) {
      return {
        date,
        label,
        state: isToday ? 'pending' : 'neutral',
        isToday,
      };
    }

    const allQualify =
      dayIsPerfectForStreak(completed, date, excusaDates) && pending.length === 0;

    if (allQualify) {
      return { date, label, state: 'perfect', isToday };
    }

    const anyAttended = completed.some((s) => attended(s.status));
    if (anyAttended) {
      return { date, label, state: 'partial', isToday };
    }

    if (completed.length > 0) {
      return { date, label, state: 'missed', isToday };
    }

    return { date, label, state: 'neutral', isToday };
  });
}

function DayCircle({
  cell,
  dark,
}: {
  cell: WeekDayCell;
  dark: boolean;
}) {
  const base =
    'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition';

  if (cell.state === 'perfect') {
    return (
      <div className="flex flex-col items-center gap-1">
        <span
          className={`${base} ${
            dark
              ? 'bg-gradient-to-b from-orange-400 to-orange-600 text-white shadow-[0_2px_8px_rgba(249,115,22,0.35)]'
              : 'bg-gradient-to-b from-orange-400 to-orange-500 text-white shadow-sm'
          }`}
          aria-label={`${cell.label}: día perfecto`}
        >
          <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
        </span>
        <span
          className={`text-[10px] font-bold ${cell.isToday ? 'text-[var(--course-accent)]' : 'text-[var(--course-text-muted)]'}`}
        >
          {cell.label}
        </span>
      </div>
    );
  }

  if (cell.state === 'partial') {
    return (
      <div className="flex flex-col items-center gap-1">
        <span
          className={`${base} border-2 ${
            dark
              ? 'border-amber-400/60 bg-amber-500/15 text-amber-300'
              : 'border-amber-400 bg-amber-50 text-amber-700'
          }`}
          aria-label={`${cell.label}: asistencia parcial`}
        >
          ½
        </span>
        <span
          className={`text-[10px] font-bold ${cell.isToday ? 'text-[var(--course-accent)]' : 'text-[var(--course-text-muted)]'}`}
        >
          {cell.label}
        </span>
      </div>
    );
  }

  if (cell.state === 'missed') {
    return (
      <div className="flex flex-col items-center gap-1">
        <span
          className={`${base} ${
            dark
              ? 'border border-white/15 bg-white/5 text-white/35'
              : 'border border-[var(--course-border)] bg-[var(--course-surface-muted)]/50 text-[var(--course-text-muted)]'
          }`}
          aria-label={`${cell.label}: sin cumplir`}
        >
          <X className="h-3.5 w-3.5 opacity-60" aria-hidden />
        </span>
        <span className="text-[10px] font-bold text-[var(--course-text-muted)]">{cell.label}</span>
      </div>
    );
  }

  if (cell.state === 'pending') {
    return (
      <div className="flex flex-col items-center gap-1">
        <span
          className={`${base} border-2 border-dashed ${
            dark
              ? 'border-[var(--course-accent)]/50 bg-[var(--course-accent)]/10 text-[var(--course-accent)]'
              : 'border-[var(--course-accent)]/40 bg-[var(--course-accent)]/5 text-[var(--course-accent)]'
          }`}
          aria-label={`${cell.label}: pendiente hoy`}
        >
          ·
        </span>
        <span className="text-[10px] font-bold text-[var(--course-accent)]">{cell.label}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={`${base} ${
          dark
            ? 'border border-white/10 bg-white/5 text-white/30'
            : 'border border-[var(--course-border)] bg-[var(--course-surface-muted)]/40 text-[var(--course-text-muted)]/50'
        }`}
        aria-label={`${cell.label}: sin clase`}
      />
      <span className="text-[10px] font-bold text-[var(--course-text-muted)]">{cell.label}</span>
    </div>
  );
}

type WeeklyStreakCardProps = {
  recentSessions: CourseRecentSession[] | undefined;
  courseId?: string;
  excusaDates?: ReadonlySet<string>;
  /** Versión compacta para modal de ranking (menos padding, sin borde exterior fuerte). */
  embedded?: boolean;
};

export default function WeeklyStreakCard({
  recentSessions,
  courseId = 'preicfes-sg26',
  excusaDates,
  embedded = false,
}: WeeklyStreakCardProps) {
  const { dark } = useCourseTheme();
  const today = bogotaTodayKey();
  const week = bogotaWeekRange();

  const scoped = useMemo(
    () => filterVacacionalLiveRecentSessions(recentSessions, courseId).filter(isTrackableSession),
    [recentSessions, courseId],
  );

  const streaks = useMemo(
    () =>
      computeAttendanceStreaks(
        scoped,
        undefined,
        courseId,
        excusaDates?.size ? { excusaDates } : undefined,
      ),
    [scoped, courseId, excusaDates],
  );

  const weekCells = useMemo(
    () => computeWeekDayCells(scoped, week.keys, today, excusaDates),
    [scoped, week.keys, today, excusaDates],
  );

  const todayPending = weekCells.some((c) => c.isToday && c.state === 'pending');
  const tier = streakTier(streaks.currentDayStreak);
  const message = streakContextMessage(streaks.currentDayStreak, todayPending);

  const border = dark ? 'border-[var(--course-border)]' : 'border-[var(--course-border)]';
  const cardBg = dark
    ? 'bg-[var(--course-surface)]'
    : 'bg-[var(--course-surface)]';
  const rankGradient = streakRankGradient(tier);
  const rankAuraStyle: CSSProperties = {
    backgroundImage: rankGradient,
    backgroundSize: '300% 300%',
    animation: 'liquidShift 3s ease infinite',
    filter: `blur(${embedded ? '10px' : '16px'})`,
    opacity: embedded ? 0.2 : 0.3,
  };
  const countBadgeStyle: CSSProperties = {
    backgroundImage: rankGradient,
    backgroundSize: '300% 300%',
    animation: 'liquidShift 3s ease infinite',
    textShadow: streakRankTextShadow(tier),
  };

  const sectionClass = embedded
    ? `relative overflow-hidden rounded-xl border ${border} bg-[var(--course-surface-muted)]/35 px-3 py-3 shadow-sm`
    : `relative overflow-hidden rounded-2xl border ${border} ${cardBg} px-4 py-4 shadow-sm sm:px-5`;

  return (
    <section className={sectionClass} aria-label="Racha semanal de asistencia">
      <div className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-45" style={countBadgeStyle} />
      <div className="pointer-events-none absolute inset-x-8 -top-3 h-8 rounded-full" style={rankAuraStyle} />
      <div className="pointer-events-none absolute inset-x-6 -bottom-4 h-8 rounded-full" style={rankAuraStyle} />
      <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] bg-[var(--course-surface)] opacity-95" />

      <div className="relative z-10">
        <div className="flex flex-col items-center text-center">
          <div className="relative inline-flex shrink-0 items-center justify-center">
            <StreakFlameIcon
              dayStreak={streaks.currentDayStreak}
              tier={tier}
              size={embedded ? 56 : 72}
              className={embedded ? 'h-11 w-11 sm:h-12 sm:w-12' : 'h-14 w-14 sm:h-16 sm:w-16'}
            />
            <span
              className={`absolute -bottom-0.5 -right-1 z-10 inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-white/60 px-1.5 text-sm font-black tabular-nums text-white shadow-xl ${streakTierBadgeNumberClass(
                tier,
                dark,
              )}`}
              style={countBadgeStyle}
              aria-label={`${streaks.currentDayStreak} días de racha`}
            >
              {streaks.currentDayStreak}
            </span>
            {streaks.currentDayStreak >= STREAK_MULTIPLIER_DAY_THRESHOLD ? (
              <span
                className={`absolute -right-2 -top-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase ${
                  dark ? 'bg-violet-500 text-white' : 'bg-[var(--course-accent)] text-white'
                }`}
              >
                <Zap className="h-2.5 w-2.5" aria-hidden />
                2×
              </span>
            ) : null}
          </div>

          <div className={embedded ? 'mt-1.5' : 'mt-2'}>
            <p className="text-xs font-black text-[var(--course-text)]">
              {streaks.currentDayStreak === 1 ? 'día de racha' : 'días de racha'}
            </p>
            {streaks.bestDayStreak > streaks.currentDayStreak ? (
              <p className="mt-0.5 text-[10px] text-[var(--course-text-muted)]">
                Mejor racha: {streaks.bestDayStreak} días
              </p>
            ) : null}
          </div>
        </div>

        <div
          className={`${embedded ? 'mt-3' : 'mt-4'} flex justify-between gap-1 px-1 sm:justify-center sm:gap-2`}
        >
          {weekCells.map((cell) => (
            <DayCircle key={cell.date} cell={cell} dark={dark} />
          ))}
        </div>

        <p
          className={`${embedded ? 'mt-3' : 'mt-4'} text-center text-[11px] leading-relaxed text-[var(--course-text-muted)] sm:text-xs`}
        >
          {message}
        </p>
        {!embedded ? (
          <p className="mt-1 text-center text-[10px] text-[var(--course-text-muted)]">
            Mínimo {MIN_MINUTES_PER_CLASS_FOR_STREAK} min por clase para contar el día.
          </p>
        ) : null}
      </div>
    </section>
  );
}
