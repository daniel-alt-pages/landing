import type { CourseRecentSession } from '../types/courseTypes';
import { MIN_MINUTES_PER_CLASS_FOR_STREAK } from './courseAttendancePoints';
import {
  attendedForClassStreak,
  dayIsPerfectForStreak,
  type AttendanceStreakOptions,
  streakTrackableDate,
} from './courseAttendanceExcusas';
import { filterVacacionalLiveRecentSessions } from './courseVacacionalAttendance';
import {
  isTrackableSession,
  mergeWeekSessionsWithSchedule,
  type WeekScheduledClass,
} from './courseAttendanceWeek';

export type AttendanceStreakStats = {
  currentClassStreak: number;
  bestClassStreak: number;
  currentDayStreak: number;
  bestDayStreak: number;
};

const EMPTY_STREAKS: AttendanceStreakStats = {
  currentClassStreak: 0,
  bestClassStreak: 0,
  currentDayStreak: 0,
  bestDayStreak: 0,
};

function attended(status: CourseRecentSession['status']): boolean {
  return status === 'present' || status === 'partial';
}

/** Día perfecto: todas las clases del día cumplen el mínimo vigente en vivo. */
export function sessionQualifiesForDayStreak(session: CourseRecentSession): boolean {
  if (!attended(session.status)) return false;
  return (session.minutes || 0) >= MIN_MINUTES_PER_CLASS_FOR_STREAK;
}

function orderedSessions(
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

function computeClassStreaks(
  completed: CourseRecentSession[],
  excusaDates?: ReadonlySet<string>,
): Pick<AttendanceStreakStats, 'currentClassStreak' | 'bestClassStreak'> {
  const scoped = completed.filter((session) => streakTrackableDate(session.date || ''));
  if (!scoped.length) return { currentClassStreak: 0, bestClassStreak: 0 };

  let best = 0;
  let run = 0;
  for (const session of scoped) {
    if (attendedForClassStreak(session.status, session.date, excusaDates)) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }

  let current = 0;
  for (let i = scoped.length - 1; i >= 0; i -= 1) {
    if (attendedForClassStreak(scoped[i].status, scoped[i].date, excusaDates)) current += 1;
    else break;
  }

  return { currentClassStreak: current, bestClassStreak: best };
}

function computeDayStreaks(
  completed: CourseRecentSession[],
  excusaDates?: ReadonlySet<string>,
): Pick<AttendanceStreakStats, 'currentDayStreak' | 'bestDayStreak'> {
  const byDate = new Map<string, CourseRecentSession[]>();
  for (const session of completed) {
    if (!session.date || !streakTrackableDate(session.date)) continue;
    const bucket = byDate.get(session.date) || [];
    bucket.push(session);
    byDate.set(session.date, bucket);
  }

  if (excusaDates?.size) {
    for (const date of excusaDates) {
      if (!streakTrackableDate(date)) continue;
      if (!byDate.has(date)) byDate.set(date, []);
    }
  }

  const dates = [...byDate.keys()].sort((a, b) => a.localeCompare(b));
  if (!dates.length) return { currentDayStreak: 0, bestDayStreak: 0 };

  let best = 0;
  let run = 0;
  for (const date of dates) {
    if (dayIsPerfectForStreak(byDate.get(date) || [], date, excusaDates)) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }

  let current = 0;
  for (let i = dates.length - 1; i >= 0; i -= 1) {
    if (dayIsPerfectForStreak(byDate.get(dates[i]) || [], dates[i], excusaDates)) current += 1;
    else break;
  }

  return { currentDayStreak: current, bestDayStreak: best };
}

export function computeAttendanceStreaks(
  sessions: CourseRecentSession[] | undefined,
  weekSchedules?: WeekScheduledClass[][],
  courseId = 'preicfes-sg26',
  options?: AttendanceStreakOptions,
): AttendanceStreakStats {
  const scoped =
    courseId === 'preicfes-sg26'
      ? filterVacacionalLiveRecentSessions(sessions, courseId)
      : sessions;
  const completed = orderedSessions(scoped, weekSchedules);
  if (!completed.length && !options?.excusaDates?.size) return { ...EMPTY_STREAKS };

  const excusaDates = options?.excusaDates;
  return {
    ...computeClassStreaks(completed, excusaDates),
    ...computeDayStreaks(completed, excusaDates),
  };
}
