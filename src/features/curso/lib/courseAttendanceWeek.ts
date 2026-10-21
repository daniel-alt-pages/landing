import type { CourseCalendarEventDto } from './courseCalendarTypes';
import type { CourseRecentSession } from '../types/courseTypes';
import { compareSessionsHistorialDesc } from './courseSessionSort';
import type { BogotaWeekRange } from './courseVacacionalWeek';
import { formatMinutesAsDuration, statusLabel } from './courseMeetAttendance';
import { isVacacionalLiveClassEvent } from './courseVacacionalAttendance';
import {
  isVacacionalInductionTopic,
  vacacionalEventDayKey,
  vacacionalEventEndDate,
  vacacionalEventStartDate,
  vacacionalEventHasPublishedRecording,
} from './courseVacacionalEventTime';

/** Clases en vivo del vacacional SEAMOSGENIOS (primera clase → fin curso). */
export const PREICFES_SG26_VACACIONAL_LIVE_BOUNDS = {
  start: '2026-06-08',
  end: '2026-07-26',
} as const;

export type WeekScheduledClass = {
  sessionId: string;
  date: string;
  topic: string;
  startsAtIso?: string;
  endsAtIso?: string;
  /** ICS ya tiene adjunto de grabación → no contar como pendiente. */
  hasPublishedRecording?: boolean;
};

export type WeekAttendanceStats = {
  /** Clases programadas en el calendario para esta semana. */
  sessionsScheduled: number;
  /** Clases ya finalizadas (dictadas). */
  sessionsCompleted: number;
  /** Presente + parcial. */
  sessionsAttended: number;
  sessionsPresent: number;
  sessionsPartial: number;
  /** Dictada sin asistencia Meet. */
  sessionsAbsent: number;
  /** Aún no dictadas (programadas futuras en la semana). */
  sessionsPending: number;
  attendedMinutes: number;
  attendedHours: number;
};

export function sessionInWeek(session: CourseRecentSession, week: BogotaWeekRange): boolean {
  const date = session.date;
  if (!date) return false;
  return date >= week.start && date <= week.end;
}

function isCompletedSession(status: CourseRecentSession['status']): boolean {
  return status !== 'upcoming' && status !== 'live-soon';
}

function isAttendedSession(status: CourseRecentSession['status']): boolean {
  return status === 'present' || status === 'partial';
}

function isPendingSession(status: CourseRecentSession['status']): boolean {
  return status === 'upcoming' || status === 'live-soon';
}

/** Programación ICS por semana (fuente única, independiente por semana). */
export function buildWeekSchedulesFromCalendar(
  calendarEvents: CourseCalendarEventDto[],
  weeks: BogotaWeekRange[],
  courseId = 'preicfes-sg26',
): WeekScheduledClass[][] {
  const classEvents = calendarEvents
    .filter((e) => isVacacionalLiveClassEvent(e, courseId))
    .sort(
      (a, b) =>
        (vacacionalEventStartDate(a)?.getTime() ?? 0) -
        (vacacionalEventStartDate(b)?.getTime() ?? 0),
    );

  return weeks.map((week) =>
    classEvents
      .filter((event) => {
        const date = vacacionalEventDayKey(event);
        return date >= week.start && date <= week.end;
      })
      .map((event) => ({
        sessionId: event.id,
        date: vacacionalEventDayKey(event),
        topic: event.summary || 'Clase vacacional',
        startsAtIso: vacacionalEventStartDate(event)?.toISOString(),
        endsAtIso: vacacionalEventEndDate(event)?.toISOString(),
        hasPublishedRecording: vacacionalEventHasPublishedRecording(event),
      })),
  );
}

/** Cruza programación semanal con el historial del estudiante. */
export function mergeWeekSessionsWithSchedule(
  studentSessions: CourseRecentSession[] | undefined,
  schedule: WeekScheduledClass[],
): CourseRecentSession[] {
  if (!schedule.length) {
    return [];
  }

  const sessionList = studentSessions || [];
  const byId = new Map<string, CourseRecentSession>();
  const byDate = new Map<string, CourseRecentSession[]>();

  for (const session of sessionList) {
    if (session.sessionId) byId.set(session.sessionId, session);
    if (!session.date) continue;
    const bucket = byDate.get(session.date) || [];
    bucket.push(session);
    byDate.set(session.date, bucket);
  }

  return schedule.map((planned) => {
    let hit = byId.get(planned.sessionId);
    if (!hit && planned.date) {
      const sameDay = byDate.get(planned.date) || [];
      hit =
        sameDay.find((s) => (s.topic || '').trim() === planned.topic.trim()) ||
        sameDay[0];
    }

    if (hit) {
      const merged: CourseRecentSession = {
        ...hit,
        sessionId: planned.sessionId || hit.sessionId,
        date: planned.date,
        topic: planned.topic || hit.topic,
        startsAtIso: hit.startsAtIso || planned.startsAtIso,
        endsAtIso: hit.endsAtIso || planned.endsAtIso,
      };
      if (planned.hasPublishedRecording && isPendingSession(merged.status)) {
        return reconcileSessionForHistorial({
          ...merged,
          attended: Boolean(merged.attended || (merged.minutes ?? 0) > 0),
          durationLabel:
            merged.durationLabel ||
            ((merged.minutes ?? 0) > 0 ? undefined : 'Sin registro Meet · grabación publicada'),
        });
      }
      return reconcileSessionForHistorial(merged);
    }

    if (planned.hasPublishedRecording) {
      return {
        sessionId: planned.sessionId,
        date: planned.date,
        topic: planned.topic,
        attended: false,
        minutes: 0,
        status: 'absent',
        durationLabel: 'Sin registro Meet · grabación publicada',
        startsAtIso: planned.startsAtIso,
        endsAtIso: planned.endsAtIso,
      };
    }

    return {
      sessionId: planned.sessionId,
      date: planned.date,
      topic: planned.topic,
      attended: false,
      minutes: 0,
      status: 'upcoming',
      durationLabel: 'Programada',
      startsAtIso: planned.startsAtIso,
      endsAtIso: planned.endsAtIso,
    };
  });
}

export function aggregateWeekAttendance(
  sessions: CourseRecentSession[] | undefined,
  week: BogotaWeekRange,
  schedule?: WeekScheduledClass[],
): WeekAttendanceStats {
  const scoped = schedule?.length
    ? mergeWeekSessionsWithSchedule(sessions, schedule)
    : (sessions || [])
        .filter((s) => sessionInWeek(s, week))
        .map((s) => reconcileSessionForHistorial(s));

  let sessionsCompleted = 0;
  let sessionsAttended = 0;
  let sessionsPresent = 0;
  let sessionsPartial = 0;
  let sessionsAbsent = 0;
  let sessionsPending = 0;
  let attendedMinutes = 0;

  for (const session of scoped) {
    const status = session.status;
    if (isPendingSession(status)) {
      sessionsPending += 1;
      continue;
    }

    sessionsCompleted += 1;
    if (isAttendedSession(status)) {
      sessionsAttended += 1;
      attendedMinutes += session.minutes || 0;
    }
    if (status === 'present') sessionsPresent += 1;
    else if (status === 'partial') sessionsPartial += 1;
    else sessionsAbsent += 1;
  }

  return {
    sessionsScheduled: scoped.length,
    sessionsCompleted,
    sessionsAttended,
    sessionsPresent,
    sessionsPartial,
    sessionsAbsent,
    sessionsPending,
    attendedMinutes,
    attendedHours: Math.round((attendedMinutes / 60) * 10) / 10,
  };
}

export function buildAllWeekStats(
  sessions: CourseRecentSession[] | undefined,
  weeks: BogotaWeekRange[],
  weekSchedules?: WeekScheduledClass[][],
): WeekAttendanceStats[] {
  return weeks.map((week, index) =>
    aggregateWeekAttendance(sessions, week, weekSchedules?.[index]),
  );
}

/** Asistidas / programadas en la semana. */
export function weekAttendanceRate(stats: WeekAttendanceStats): number {
  if (stats.sessionsScheduled <= 0) return 0;
  return stats.sessionsAttended / stats.sessionsScheduled;
}

/** Asistidas / dictadas (solo clases ya dadas). */
export function weekCompletedAttendanceRate(stats: WeekAttendanceStats): number {
  if (stats.sessionsCompleted <= 0) return 0;
  return stats.sessionsAttended / stats.sessionsCompleted;
}

export function studentWeekSessions(
  studentSessions: CourseRecentSession[] | undefined,
  weekSchedules: WeekScheduledClass[][],
  weekIndex: number,
): CourseRecentSession[] {
  const schedule = weekSchedules[weekIndex] || [];
  return mergeWeekSessionsWithSchedule(studentSessions, schedule);
}

export function isTrackableSession(session: CourseRecentSession): boolean {
  if (isVacacionalInductionTopic(session.topic)) return false;
  return !isPendingSession(session.status);
}

/** Clase ya pasó según ICS aunque el doc remoto diga upcoming. */
export function isSessionEndedBySchedule(session: CourseRecentSession, now = Date.now()): boolean {
  const endMs = session.endsAtIso ? new Date(session.endsAtIso).getTime() : NaN;
  if (Number.isFinite(endMs)) return endMs < now;
  const startMs = session.startsAtIso ? new Date(session.startsAtIso).getTime() : NaN;
  if (Number.isFinite(startMs)) return startMs + 2 * 60 * 60 * 1000 < now;
  return false;
}

/** Evita “Programada / en curso” en historial para clases ya dictadas sin Meet. */
export function reconcileSessionForHistorial(
  session: CourseRecentSession,
  now = Date.now(),
): CourseRecentSession {
  if (!isPendingSession(session.status) || !isSessionEndedBySchedule(session, now)) {
    return session;
  }
  const minutes = session.minutes ?? 0;
  const attended = Boolean(session.attended || minutes > 0);
  let status = session.status;
  if (attended && isPendingSession(status)) {
    status = minutes >= 30 ? 'present' : 'partial';
  } else if (!attended) {
    status = 'absent';
  }
  return {
    ...session,
    attended,
    status,
    durationLabel: attended
      ? session.durationLabel || formatMinutesAsDuration(minutes)
      : 'Sin registro Meet',
  };
}

export function sessionsInWeek(
  sessions: CourseRecentSession[] | undefined,
  week: BogotaWeekRange,
): CourseRecentSession[] {
  return (sessions || [])
    .filter((s) => sessionInWeek(s, week) && isTrackableSession(s))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.topic || '').localeCompare(b.topic || ''));
}

export function scheduledSessionsForReport(
  studentSessions: CourseRecentSession[] | undefined,
  weekSchedules: WeekScheduledClass[][],
  weekIndex?: number,
): CourseRecentSession[] {
  if (weekIndex != null && weekIndex >= 0 && weekIndex < weekSchedules.length) {
    return studentWeekSessions(studentSessions, weekSchedules, weekIndex);
  }

  const all = weekSchedules.flatMap((schedule, index) =>
    mergeWeekSessionsWithSchedule(studentSessions, schedule).map((session) => ({
      ...session,
      topic: session.topic,
    })),
  );

  return all.sort(compareSessionsHistorialDesc);
}

/** @deprecated usar scheduledSessionsForReport */
export function completedSessionsForReport(
  sessions: CourseRecentSession[] | undefined,
  week?: BogotaWeekRange,
): CourseRecentSession[] {
  const scoped = (sessions || []).filter((s) => !isPendingSession(s.status));
  const filtered = week ? scoped.filter((s) => sessionInWeek(s, week)) : scoped;
  return filtered.sort(compareSessionsHistorialDesc);
}

export function sessionDurationLabel(session: CourseRecentSession): string {
  if (isPendingSession(session.status)) return 'Programada';
  if (session.durationLabel?.trim()) return session.durationLabel.trim();
  if (session.minutes && session.minutes > 0) return formatMinutesAsDuration(session.minutes);
  return '—';
}

export function sessionStatusText(session: CourseRecentSession): string {
  if (session.status === 'upcoming' || session.status === 'live-soon') return 'Pendiente';
  return session.status ? statusLabel(session.status) : '—';
}
