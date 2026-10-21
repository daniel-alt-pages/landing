import type {
  CourseAttendanceManifest,
  CourseIdentity,
  CourseStudentMetrics,
} from '../types/courseTypes';
import { COURSE_DEFAULT_TOTAL_HOURS } from '../types/courseTypes';
import type { CourseCalendarEventDto } from './courseCalendarTypes';
import {
  buildMetricsFromMeetSessions,
  parseMeetAttendanceCsv,
} from './courseMeetAttendance';
import {
  buildMetricsFromVacacionalCalendar,
  fetchVacacionalCalendarEventsForAttendance,
} from './courseVacacionalAttendance';
import { excusaSessionOverridesForEmail } from './courseExcusaSessionOverrides';
import { buildCoursePersonKey } from './courseAccessKeys';
import {
  CACHE_TTL_COURSE_METRICS_MS,
  courseCacheGet,
  courseCacheSet,
  courseMetricsCacheKey,
  isCourseClientCacheEnabled,
} from './courseCache';
import { readStudentDisplayName } from './courseStudentSession';

const manifestMem = new Map<string, CourseAttendanceManifest>();
const sessionMem = new Map<string, string>();

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      credentials: 'same-origin',
      cache: isCourseClientCacheEnabled() ? 'default' : 'no-store',
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function fetchExcusasManifest(
  courseId: string,
): Promise<import('./courseAttendanceExcusas').CourseExcusasManifest | null> {
  if (!courseId) return null;
  const url = `/data/attendance/${encodeURIComponent(courseId)}/excusas.json`;
  const text = await fetchText(url);
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as import('./courseAttendanceExcusas').CourseExcusasManifest;
    if (!parsed?.courseId || !Array.isArray(parsed.excusas)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function fetchExcusaSessionOverridesManifest(
  courseId: string,
): Promise<import('./courseExcusaSessionOverrides').ExcusaSessionOverridesManifest | null> {
  if (!courseId) return null;
  const url = `/data/attendance/${encodeURIComponent(courseId)}/excusa-session-overrides.json`;
  const text = await fetchText(url);
  if (!text) return null;
  try {
    const parsed = JSON.parse(
      text,
    ) as import('./courseExcusaSessionOverrides').ExcusaSessionOverridesManifest;
    if (!parsed?.courseId || !Array.isArray(parsed.entries)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function fetchAttendanceManifest(
  courseId: string,
): Promise<CourseAttendanceManifest | null> {
  if (!courseId) return null;
  if (isCourseClientCacheEnabled() && manifestMem.has(courseId)) {
    return manifestMem.get(courseId)!;
  }

  const url = `/data/attendance/${encodeURIComponent(courseId)}/manifest.json`;
  const text = await fetchText(url);
  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as CourseAttendanceManifest;
    if (!parsed?.courseId || !parsed.totalHours) return null;
    if (isCourseClientCacheEnabled()) manifestMem.set(courseId, parsed);
    return parsed;
  } catch {
    return null;
  }
}

async function fetchSessionCsv(courseId: string, file: string): Promise<string | null> {
  const key = `${courseId}::${file}`;
  if (isCourseClientCacheEnabled() && sessionMem.has(key)) return sessionMem.get(key)!;

  const url = `/data/attendance/${encodeURIComponent(courseId)}/${file.replace(/^\//, '')}`;
  const text = await fetchText(url);
  if (text && isCourseClientCacheEnabled()) sessionMem.set(key, text);
  return text;
}

export async function loadMeetSessionsForManifest(courseId: string, manifest: CourseAttendanceManifest) {
  if (!manifest.sessions?.length) return [];
  return (
    await Promise.all(
      manifest.sessions.map(async (meta) => {
        const csv = await fetchSessionCsv(courseId, meta.file);
        if (!csv) return null;
        return { meta, rows: parseMeetAttendanceCsv(csv) };
      }),
    )
  ).filter((item): item is NonNullable<typeof item> => Boolean(item?.rows.length));
}

async function resolveAttendanceManifest(courseId: string): Promise<CourseAttendanceManifest> {
  const manifest = await fetchAttendanceManifest(courseId);
  if (manifest) return manifest;
  return {
    courseId,
    totalHours: COURSE_DEFAULT_TOTAL_HOURS,
    sessions: [],
  };
}

/** Misma fuente ICS que grabaciones/clases → seguimiento en sync. */
export async function computeVacacionalMetricsFromEvents(
  courseId: string,
  identity: CourseIdentity,
  calendarEvents: CourseCalendarEventDto[],
  displayName?: string,
  now = Date.now(),
  excusaSessionOverrides?: import('./courseExcusaSessionOverrides').ExcusaSessionOverridesManifest | null,
): Promise<CourseStudentMetrics | null> {
  if (!calendarEvents.length) return null;
  const manifest = await resolveAttendanceManifest(courseId);
  const studentName = displayName || readStudentDisplayName();
  const loaded = await loadMeetSessionsForManifest(courseId, manifest);
  const overrides = excusaSessionOverridesForEmail(
    excusaSessionOverrides,
    identity.emailLower,
  );
  return buildMetricsFromVacacionalCalendar(
    courseId,
    identity,
    manifest,
    calendarEvents,
    loaded,
    studentName,
    now,
    overrides.size ? overrides : undefined,
  );
}

/** Métricas de asistencia: calendario vacacional + CSV Meet opcional. */
export async function fetchMeetAttendanceMetrics(
  courseId: string,
  identity: CourseIdentity,
  displayName?: string,
): Promise<CourseStudentMetrics | null> {
  if (!courseId || typeof window === 'undefined') return null;

  const manifest = await fetchAttendanceManifest(courseId);
  if (!manifest) return null;

  const sessionOverridesManifest = await fetchExcusaSessionOverridesManifest(courseId);
  const overrides = excusaSessionOverridesForEmail(sessionOverridesManifest, identity.emailLower);

  const personKey = buildCoursePersonKey(identity);
  const attVer =
    (manifest.attendanceVersion ?? manifest.sessions?.length ?? 0) +
    (sessionOverridesManifest?.version ?? 0) * 1000;
  const cacheKey = courseMetricsCacheKey(courseId, `${personKey}_meet_v${attVer}`);
  const cached = courseCacheGet<CourseStudentMetrics>(cacheKey);
  if (cached) return cached;

  const studentName = displayName || readStudentDisplayName();
  const loaded = await loadMeetSessionsForManifest(courseId, manifest);
  const calendarEvents = await fetchVacacionalCalendarEventsForAttendance();
  const overrideMap = overrides.size ? overrides : undefined;

  let metrics: CourseStudentMetrics | null = null;
  if (calendarEvents.length) {
    metrics = buildMetricsFromVacacionalCalendar(
      courseId,
      identity,
      manifest,
      calendarEvents,
      loaded,
      studentName,
      Date.now(),
      overrideMap,
    );
  } else if (loaded.length) {
    if (!studentName?.trim()) return null;
    metrics = buildMetricsFromMeetSessions(courseId, identity, manifest, loaded, studentName);
  } else {
    metrics = buildMetricsFromVacacionalCalendar(
      courseId,
      identity,
      manifest,
      [],
      [],
      studentName,
      Date.now(),
      overrideMap,
    );
  }

  if (metrics) {
    courseCacheSet(cacheKey, metrics, CACHE_TTL_COURSE_METRICS_MS);
  }
  return metrics;
}

export function clearMeetAttendanceMemoryCache(): void {
  manifestMem.clear();
  sessionMem.clear();
}
