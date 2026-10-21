import {
  CACHE_TTL_CLOSED_SIM_MS,
  CACHE_TTL_ACTIVE_SIM_MS,
} from '@shared/lib/cachePolicy';

/** Bump en cada deploy staging/prod → invalida claves viejas en todos los navegadores. */
export const CACHE_VERSION = 'sg_v40';

const HOUR_MS = 60 * 60 * 1000;

/** Entitlements courseAccess — corto porque define visibilidad estricta del botón Curso. */
export const CACHE_TTL_COURSE_ACCESS_MS = HOUR_MS;

/** Curso publicado estable — 30 d (misma ventana sim cerrado). */
export const CACHE_TTL_COURSE_DOC_MS = CACHE_TTL_CLOSED_SIM_MS;

/** Curso con cambios frecuentes — 24 h. */
export const CACHE_TTL_COURSE_DOC_ACTIVE_MS = CACHE_TTL_ACTIVE_SIM_MS;

/** Métricas versionadas — 30 d; invalidación = attendanceVersion en runtime. */
export const CACHE_TTL_COURSE_METRICS_MS = CACHE_TTL_CLOSED_SIM_MS;

/** Métricas propias — ventana “fresca” sin refetch al cambiar de tab. */
export const CACHE_TTL_COURSE_METRICS_FRESH_MS = 10 * 60 * 1000;

/** Leaderboard agregado (mem + LS) — alineado con poll runtime. */
export const CACHE_TTL_COURSE_LEADERBOARD_MS = 15 * 60 * 1000;

/** Materiales personalizados del estudiante (porción propia en LS). */
export const CACHE_TTL_COURSE_STUDENT_MATERIALS_MS = 8 * HOUR_MS;

/** Shell panel curso (pestaña reiniciada) — 30 d. */
export const CACHE_TTL_COURSE_PANEL_MS = CACHE_TTL_CLOSED_SIM_MS;

/** Calendario vacacional legacy (solo source=local). */
export const CACHE_TTL_COURSE_CALENDAR_MS =
  process.env.NODE_ENV === 'production' ? 5 * 60 * 1000 : 2 * 60 * 1000;

/** Puntero courseRuntime en localStorage — 30 d; revalidación en background por poll. */
export const CACHE_TTL_COURSE_RUNTIME_MS = CACHE_TTL_CLOSED_SIM_MS;

/** Poll background (no bloquea paint desde caché). */
export const COURSE_RUNTIME_REVALIDATE_MS = 15 * 60 * 1000;

/** Re-fetch versión calendario en prod — alineado con runtime cache (menos trabajo). */
export const COURSE_CALENDAR_POLL_MS =
  process.env.NODE_ENV === 'production'
    ? COURSE_RUNTIME_REVALIDATE_MS
    : CACHE_TTL_COURSE_CALENDAR_MS;

/** Actualiza cuenta regresivas en seguimiento sin re-fetch. */
export const COURSE_CALENDAR_UI_TICK_MS = 30 * 1000;

const PREFIX = `${CACHE_VERSION}_course`;

/**
 * Dev (`next dev`): sin LS/mem de curso — cambios al instante.
 * Grabaciones Drive siguen en `resolveDriveDirectUrl` (sessionStorage).
 */
export function isCourseClientCacheEnabled(): boolean {
  return process.env.NODE_ENV !== 'development';
}

/** Prefijo versionado para invalidación selectiva (courseVersioning). */
export const COURSE_CACHE_PREFIX = PREFIX;

export const COURSE_CALENDAR_CACHE_PREFIX = `${PREFIX}CalWeek_`;

export function courseAccessCacheKey(identityKey: string): string {
  return `${PREFIX}Access_${identityKey}`;
}

export function courseDocCacheKey(courseId: string): string {
  return `${PREFIX}_${courseId}`;
}

export function courseMetricsCacheKey(
  courseId: string,
  personKey: string,
  attendanceVersion?: number,
): string {
  const versionSuffix =
    attendanceVersion != null && attendanceVersion > 0 ? `_v${attendanceVersion}` : '';
  return `${PREFIX}Metrics_${courseId}_${personKey}${versionSuffix}`;
}

export function courseRuntimeCacheKey(courseId: string): string {
  return `${PREFIX}Runtime_${courseId}`;
}

export function courseCalendarSnapshotCacheKey(courseId: string, calendarVersion: number): string {
  return `${COURSE_CALENDAR_CACHE_PREFIX}${courseId}_v${calendarVersion}`;
}

export function coursePanelPersistKey(courseId: string): string {
  return `${PREFIX}Panel_${courseId}`;
}

export function courseLeaderboardCacheKey(
  courseId: string,
  attendanceVersion?: number,
  topLimit?: number,
): string {
  const versionSuffix =
    attendanceVersion != null && attendanceVersion > 0 ? `_v${attendanceVersion}` : '';
  const limitSuffix = topLimit != null && topLimit > 0 ? `_top${topLimit}` : '';
  return `${PREFIX}Leaderboard_${courseId}${versionSuffix}${limitSuffix}`;
}

export function courseStudentMaterialsCacheKey(
  courseId: string,
  personKey: string,
  materialsVersion?: number,
): string {
  const versionSuffix =
    materialsVersion != null && materialsVersion > 0 ? `_v${materialsVersion}` : '';
  return `${PREFIX}StudentMaterials_${courseId}_${personKey}${versionSuffix}`;
}

export function courseCalendarWeekCacheKey(weekStart: string, weekEnd?: string): string {
  return weekEnd
    ? `${COURSE_CALENDAR_CACHE_PREFIX}${weekStart}_${weekEnd}`
    : `${COURSE_CALENDAR_CACHE_PREFIX}${weekStart}`;
}

export function clearCourseSessionCaches(): void {
  courseCacheClearPrefix(COURSE_CACHE_PREFIX);
}

export function courseCacheIsFresh(key: string, maxAgeMs: number): boolean {
  if (!isCourseClientCacheEnabled()) return false;
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { ts: number; ttl: number };
    if (Date.now() - parsed.ts > parsed.ttl) return false;
    return Date.now() - parsed.ts <= maxAgeMs;
  } catch {
    return false;
  }
}

export function courseCacheGet<T>(key: string): T | null {
  if (!isCourseClientCacheEnabled()) return null;
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; ts: number; ttl: number };
    if (Date.now() - parsed.ts > parsed.ttl) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function courseCacheSet<T>(key: string, data: T, ttlMs: number): void {
  if (!isCourseClientCacheEnabled()) return;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ data, ts: Date.now(), ttl: ttlMs }),
    );
  } catch {
    /* quota — ignore */
  }
}

export function courseCacheClearPrefix(prefix: string): void {
  if (typeof window === 'undefined') return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (k?.startsWith(prefix)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}
