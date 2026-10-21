/** 30 días — una precarga completa por mes/dispositivo; alinea con ventana límites Drive. */
export const RECORDINGS_PRECACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const RECORDINGS_PRECACHE_STORAGE_KEY = 'sg:recordings-precache:v5';

export const RECORDINGS_PRECACHE_GENERATION_KEY = 'sg:recordings-precache-gen';

export const RECORDINGS_PRECACHE_SW_URL = '/recordings-precache-sw.js?v=drive-v6';

/** Pausa entre ítems Drive (evita rate-limit en precarga inicial). */
export const RECORDINGS_PRECACHE_STAGGER_MS = 1500;

/** Tiempo máximo por video en cola (clases largas). */
export const RECORDINGS_PRECACHE_ITEM_TIMEOUT_MS = 8 * 60 * 1000;

/** Descargas Drive en paralelo durante precarga masiva. */
export const RECORDINGS_PRECACHE_CONCURRENCY = 2;

export function recordingsCatalogJsonPath(simulationId: string): string {
  return `/data/recordings/${encodeURIComponent(simulationId)}.json`;
}

export function recordingsCacheBucketId(simulationId: string, catalogVersion: string): string {
  const safeVersion = catalogVersion.replace(/[^\w.-]/g, '_');
  return `sg-recordings-drive-v6-${simulationId}-${safeVersion}`;
}
