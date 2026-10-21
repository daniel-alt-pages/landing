/**
 * Política de TTL cliente alineada con Spark (Firestore gratis).
 *
 * - Simulacros cerrados: 30 días sin re-descarga (invalidación vía simVersions/dataVersion).
 * - Simulacro activo: 24 h + bump simVersions en cada publish del pipeline.
 * - appConfig: 30 min (1 read barato; dispara checkDataVersion / checkSimVersions).
 *
 * Ver: config/app { dataVersion, simVersions } en Firestore.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Simulacros históricos / cerrados — ~1 descarga/mes por usuario. */
export const CACHE_TTL_CLOSED_SIM_MS = 30 * DAY_MS;

/** Simulacro activo — ventana corta; refresco real = simVersions en pipeline. */
export const CACHE_TTL_ACTIVE_SIM_MS = DAY_MS;

/** Config global — detectar cambios de versión pronto. */
export const CACHE_TTL_APP_CONFIG_MS = 30 * 60 * 1000;

/** Default persistSet cuando no hay simId. */
export const CACHE_TTL_DEFAULT_MS = CACHE_TTL_CLOSED_SIM_MS;

/** SWR stale window para appConfig (servir cache viejo mientras revalida). */
export const CACHE_SWR_APP_CONFIG_MAX_AGE_MS = 4 * 60 * 60 * 1000;

const HOUR_MS = 60 * 60 * 1000;

/** Entitlements courseAccess — 12 h. */
export const CACHE_TTL_COURSE_ACCESS_MS = 12 * HOUR_MS;

/** Curso publicado estable — 30 d. */
export const CACHE_TTL_COURSE_DOC_MS = CACHE_TTL_CLOSED_SIM_MS;

/** Curso activo — 24 h. */
export const CACHE_TTL_COURSE_DOC_ACTIVE_MS = CACHE_TTL_ACTIVE_SIM_MS;

/** Métricas asistencia — 6 h. */
export const CACHE_TTL_COURSE_METRICS_MS = 6 * HOUR_MS;

/** Feature curso: TTLs adicionales (leaderboard, materiales) en `features/curso/lib/courseCache.ts`. */

export function normalizeSimIdForCache(simId: string): string {
  return String(simId || '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase();
}

/** Lee activeSimulation desde localStorage (cualquier CACHE_VERSION_appConfig). */
export function readCachedActiveSimulation(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.endsWith('_appConfig')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { data?: { activeSimulation?: string } };
      const active = parsed?.data?.activeSimulation;
      if (active) return active;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** TTL de datos de simulacro (Firestore + panel bundle). */
export function resolveSimDataCacheTTL(
  simId: string,
  activeSimulationId?: string | null,
): number {
  const normalized = normalizeSimIdForCache(simId);
  if (!normalized) return CACHE_TTL_CLOSED_SIM_MS;

  const active = activeSimulationId ?? readCachedActiveSimulation();
  if (active && normalizeSimIdForCache(active) === normalized) {
    return CACHE_TTL_ACTIVE_SIM_MS;
  }
  return CACHE_TTL_CLOSED_SIM_MS;
}
