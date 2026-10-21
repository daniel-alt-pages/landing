import type { CourseRecentSession } from '../types/courseTypes';
import { parseMeetClockToMinutesOfDay } from './courseMeetAttendance';
import { filterVacacionalLiveRecentSessions } from './courseVacacionalAttendance';

export type AttendanceRankingTieBreak = {
  /** Minutos totales en vivo (precisión Meet, no horas redondeadas). */
  attendedMinutes: number;
  /** Entrada más temprana del historial — menor es mejor. */
  earliestJoinMinutes: number;
  /** Salida más tardía — mayor es mejor. */
  latestLeaveMinutes: number;
};

const NO_JOIN = 24 * 60;

function isAttended(status: CourseRecentSession['status']): boolean {
  return status === 'present' || status === 'partial';
}

export function computeAttendanceRankingTieBreak(
  sessions: CourseRecentSession[] | undefined,
  courseId = 'preicfes-sg26',
): AttendanceRankingTieBreak {
  const scoped =
    courseId === 'preicfes-sg26'
      ? filterVacacionalLiveRecentSessions(sessions, courseId)
      : sessions || [];

  let attendedMinutes = 0;
  let earliestJoin = NO_JOIN;
  let latestLeave = 0;

  for (const session of scoped) {
    if (!isAttended(session.status)) continue;
    attendedMinutes += session.minutes || 0;
    const join = parseMeetClockToMinutesOfDay(session.joinedAt);
    const leave = parseMeetClockToMinutesOfDay(session.leftAt);
    if (join != null) earliestJoin = Math.min(earliestJoin, join);
    if (leave != null) latestLeave = Math.max(latestLeave, leave);
  }

  return {
    attendedMinutes,
    earliestJoinMinutes: earliestJoin === NO_JOIN ? NO_JOIN : earliestJoin,
    latestLeaveMinutes: latestLeave,
  };
}

/** Desempate: más minutos → entró más temprano → salió más tarde. */
export function compareAttendanceRankingTieBreak(
  a: AttendanceRankingTieBreak,
  b: AttendanceRankingTieBreak,
): number {
  if (b.attendedMinutes !== a.attendedMinutes) return b.attendedMinutes - a.attendedMinutes;
  if (a.earliestJoinMinutes !== b.earliestJoinMinutes) {
    return a.earliestJoinMinutes - b.earliestJoinMinutes;
  }
  if (b.latestLeaveMinutes !== a.latestLeaveMinutes) {
    return b.latestLeaveMinutes - a.latestLeaveMinutes;
  }
  return 0;
}
