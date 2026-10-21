import type { CourseAttendanceReport } from './courseAttendanceReport';
import {
  CACHE_TTL_COURSE_LEADERBOARD_MS,
  courseCacheGet,
  courseCacheSet,
  courseLeaderboardCacheKey,
  isCourseClientCacheEnabled,
} from './courseCache';

const LEADERBOARD_MEM_TTL_MS = CACHE_TTL_COURSE_LEADERBOARD_MS;

type LeaderboardMemEntry = { report: CourseAttendanceReport; ts: number };

const leaderboardMem = new Map<string, LeaderboardMemEntry>();
let leaderboardInFlight: Promise<CourseAttendanceReport> | null = null;
let leaderboardInFlightKey = '';

export function leaderboardRuntimeCacheKey(
  courseId: string,
  attendanceVersion?: number,
  topLimit?: number,
): string {
  return `${courseId}:${attendanceVersion ?? 0}:${topLimit ?? 0}`;
}

export function clearLeaderboardMemoryCache(): void {
  leaderboardMem.clear();
  leaderboardInFlight = null;
  leaderboardInFlightKey = '';
}

export function peekCachedLeaderboardReport(
  courseId: string,
  attendanceVersion?: number,
  topLimit?: number,
): CourseAttendanceReport | null {
  if (!courseId || !isCourseClientCacheEnabled()) return null;

  const memKey = leaderboardRuntimeCacheKey(courseId, attendanceVersion, topLimit);
  const memHit = leaderboardMem.get(memKey);
  if (memHit && Date.now() - memHit.ts < LEADERBOARD_MEM_TTL_MS) {
    return memHit.report;
  }

  const lsKey = courseLeaderboardCacheKey(courseId, attendanceVersion, topLimit);
  const lsHit = courseCacheGet<CourseAttendanceReport>(lsKey);
  if (lsHit) {
    leaderboardMem.set(memKey, { report: lsHit, ts: Date.now() });
    return lsHit;
  }

  return null;
}

function persistLeaderboardReport(
  courseId: string,
  report: CourseAttendanceReport,
  topLimit?: number,
): void {
  if (!isCourseClientCacheEnabled()) return;
  const version = report.attendanceVersion;
  const memKey = leaderboardRuntimeCacheKey(courseId, version, topLimit);
  leaderboardMem.set(memKey, { report, ts: Date.now() });
  courseCacheSet(
    courseLeaderboardCacheKey(courseId, version, topLimit),
    report,
    CACHE_TTL_COURSE_LEADERBOARD_MS,
  );
}

/** Cache mem + LS + dedup in-flight para el reporte de ranking. */
export async function getOrFetchCourseAttendanceReport(
  courseId: string,
  attendanceVersion: number | undefined,
  topLimit: number | undefined,
  fetchUncached: () => Promise<CourseAttendanceReport>,
): Promise<CourseAttendanceReport> {
  const peeked = peekCachedLeaderboardReport(courseId, attendanceVersion, topLimit);
  if (peeked) return peeked;

  const inflightKey = leaderboardRuntimeCacheKey(courseId, attendanceVersion, topLimit);
  if (leaderboardInFlight && leaderboardInFlightKey === inflightKey) {
    return leaderboardInFlight;
  }

  leaderboardInFlightKey = inflightKey;
  leaderboardInFlight = fetchUncached()
    .then((report) => {
      persistLeaderboardReport(courseId, report, topLimit);
      return report;
    })
    .finally(() => {
      leaderboardInFlight = null;
      leaderboardInFlightKey = '';
    });

  return leaderboardInFlight;
}
