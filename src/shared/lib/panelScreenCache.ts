import {
  CACHE_TTL_CLOSED_SIM_MS,
  normalizeSimIdForCache,
} from '@shared/lib/cachePolicy';

const STORAGE_PREFIX = 'sg_panel_cache:';
const DEFAULT_TTL_MS = CACHE_TTL_CLOSED_SIM_MS;
const MAX_MEMORY_ENTRIES = 40;
const COURSE_PANEL_SCREEN_PREFIX = 'course-panel:';

function isCoursePanelDevBypass(key: string): boolean {
  return process.env.NODE_ENV === 'development' && key.startsWith(COURSE_PANEL_SCREEN_PREFIX);
}

type CacheEnvelope<T = unknown> = {
  data: T;
  updatedAt: number;
  version?: string;
};

const memory = new Map<string, CacheEnvelope>();

function pruneMemory(): void {
  if (memory.size <= MAX_MEMORY_ENTRIES) return;
  const oldest = [...memory.entries()].sort((a, b) => a[1].updatedAt - b[1].updatedAt);
  const toDrop = oldest.slice(0, memory.size - MAX_MEMORY_ENTRIES);
  toDrop.forEach(([key]) => memory.delete(key));
}

function cacheKeyMatchesSim(cacheKey: string, simId: string): boolean {
  const norm = normalizeSimIdForCache(simId);
  if (!norm) return false;
  const segments = cacheKey.split(':');
  const tail = segments[segments.length - 1] ?? '';
  if (normalizeSimIdForCache(tail) === norm) return true;
  return normalizeSimIdForCache(cacheKey).includes(norm);
}

/** Lee caché en memoria (prioridad) y sessionStorage (misma pestaña, TTL + versión). */
export function getPanelScreenCache<T>(
  key: string,
  ttlMs: number = DEFAULT_TTL_MS,
  expectedVersion?: string,
): T | null {
  if (isCoursePanelDevBypass(key)) return null;
  const now = Date.now();

  const acceptEnvelope = (envelope: CacheEnvelope<T> | null | undefined): T | null => {
    if (!envelope?.updatedAt) return null;
    if (now - envelope.updatedAt >= ttlMs) return null;
    if (expectedVersion && envelope.version && envelope.version !== expectedVersion) return null;
    return envelope.data as T;
  };

  const fromMem = memory.get(key) as CacheEnvelope<T> | undefined;
  const memHit = acceptEnvelope(fromMem);
  if (memHit) return memHit;
  if (fromMem && expectedVersion && fromMem.version !== expectedVersion) {
    memory.delete(key);
  }

  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    const hit = acceptEnvelope(parsed);
    if (!hit) {
      sessionStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }
    memory.set(key, parsed);
    return hit;
  } catch {
    return null;
  }
}

/** Guarda en memoria; sessionStorage best-effort (puede fallar por tamaño). */
export function setPanelScreenCache<T>(
  key: string,
  data: T,
  _ttlMs: number = DEFAULT_TTL_MS,
  version?: string,
): void {
  if (isCoursePanelDevBypass(key)) return;
  void _ttlMs;
  const envelope: CacheEnvelope<T> = {
    data,
    updatedAt: Date.now(),
    version,
  };
  memory.set(key, envelope);
  pruneMemory();

  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(envelope));
  } catch {
    /* QuotaExceeded — memoria basta para navegación atrás en la misma sesión */
  }
}

export function invalidatePanelScreenCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    memory.clear();
    if (typeof window === 'undefined') return;
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k?.startsWith(STORAGE_PREFIX)) sessionStorage.removeItem(k);
      }
    } catch {
      /* ignore */
    }
    return;
  }

  for (const key of [...memory.keys()]) {
    if (key.startsWith(keyPrefix)) memory.delete(key);
  }

  if (typeof window === 'undefined') return;

  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX + keyPrefix)) sessionStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

/** Invalida entradas de panel cache asociadas a un simulacro (checkSimVersions). */
export function invalidatePanelScreenCacheForSim(simId: string): void {
  const norm = normalizeSimIdForCache(simId);
  if (!norm) return;

  for (const key of [...memory.keys()]) {
    if (cacheKeyMatchesSim(key, simId)) memory.delete(key);
  }

  if (typeof window === 'undefined') return;

  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (!k?.startsWith(STORAGE_PREFIX)) continue;
      const logicalKey = k.slice(STORAGE_PREFIX.length);
      if (cacheKeyMatchesSim(logicalKey, simId)) sessionStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

/** TTL por defecto (sim cerrado); preferir resolveSimDataCacheTTL(simId) por pantalla. */
export const PANEL_SCREEN_CACHE_TTL_MS = DEFAULT_TTL_MS;
