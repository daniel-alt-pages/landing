'use client';

import { isValidWgs84Geo } from '../mapa-impacto/impactData';

const CACHE_VERSION = 'sg_landing_assets_v2';
const LS_PREFIX = `${CACHE_VERSION}_json_`;

const inflight = new Map<string, Promise<unknown>>();

type StoredPayload<T> = {
  v: string;
  ts: number;
  data: T;
};

function lsKey(url: string) {
  return `${LS_PREFIX}${url.replace(/[^a-z0-9]+/gi, '_').slice(0, 120)}`;
}

function readLocalStorage<T>(url: string, maxAgeMs: number): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(lsKey(url));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPayload<T>;
    if (parsed.v !== CACHE_VERSION) return null;
    if (Date.now() - parsed.ts > maxAgeMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeLocalStorage<T>(url: string, data: T) {
  if (typeof window === 'undefined') return;
  try {
    const payload: StoredPayload<T> = { v: CACHE_VERSION, ts: Date.now(), data };
    window.localStorage.setItem(lsKey(url), JSON.stringify(payload));
  } catch {
    // quota — ignore
  }
}

async function readCacheApi(url: string): Promise<Response | null> {
  if (typeof window === 'undefined' || !('caches' in window)) return null;
  try {
    const cache = await caches.open(CACHE_VERSION);
    return (await cache.match(url)) ?? null;
  } catch {
    return null;
  }
}

async function writeCacheApi(url: string, response: Response) {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const cache = await caches.open(CACHE_VERSION);
    await cache.put(url, response);
  } catch {
    // ignore
  }
}

export type FetchCachedJsonOptions = {
  /** TTL localStorage (default 7 días). Cache API se mantiene hasta deploy nuevo. */
  maxAgeMs?: number;
  /** Omite localStorage y Cache API (reintento tras caché corrupta). */
  networkOnly?: boolean;
};

export function isLandingGeoJson(value: unknown): value is { features: unknown[] } {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as { features?: unknown }).features) &&
    (value as { features: unknown[] }).features.length > 0 &&
    isValidWgs84Geo(value as { features: unknown[] })
  );
}

/** Quita entradas inválidas de geo (p. ej. HTML del SPA cacheado como JSON). */
export function clearLandingGeoCache() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(lsKey(LANDING_GEO_URL));
  } catch {
    // ignore
  }
  if ('caches' in window) {
    void caches.open(CACHE_VERSION).then((cache) => cache.delete(LANDING_GEO_URL));
  }
  inflight.delete(LANDING_GEO_URL);
}

/**
 * GET JSON con dedup, Cache API, localStorage y red.
 * Pensado para landing: GeoJSON mapa y catálogo ventas.
 */
export async function fetchCachedJson<T>(
  url: string,
  options: FetchCachedJsonOptions = {},
): Promise<T> {
  const maxAgeMs = options.maxAgeMs ?? 7 * 24 * 60 * 60 * 1000;

  if (inflight.has(url)) {
    return inflight.get(url)! as Promise<T>;
  }

  const promise = (async () => {
    if (!options.networkOnly) {
      const cached = readLocalStorage<T>(url, maxAgeMs);
      if (cached) {
        if (url !== LANDING_GEO_URL || isLandingGeoJson(cached)) {
          return cached;
        }
        clearLandingGeoCache();
      }

      const cacheHit = await readCacheApi(url);
      if (cacheHit) {
        const contentType = cacheHit.headers.get('content-type') ?? '';
        if (!contentType.includes('text/html')) {
          const data = (await cacheHit.json()) as T;
          if (url !== LANDING_GEO_URL || isLandingGeoJson(data)) {
            writeLocalStorage(url, data);
            return data;
          }
        }
        clearLandingGeoCache();
      }
    }

    const response = await fetch(`${url}?v=${CACHE_VERSION}`, {
      credentials: 'same-origin',
      cache: options.networkOnly ? 'no-store' : 'default',
    });
    if (!response.ok) {
      throw new Error(`fetch_failed:${url}:${response.status}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('text/html')) {
      throw new Error(`fetch_spa_html:${url}`);
    }

    const clone = response.clone();
    const data = (await response.json()) as T;
    if (url === LANDING_GEO_URL && !isLandingGeoJson(data)) {
      throw new Error(`invalid_geo:${url}`);
    }
    // Catálogos grandes pueden exceder quota; no bloquear la carga.
    try {
      writeLocalStorage(url, data);
    } catch {
      // ignore
    }
    void writeCacheApi(url, clone);
    return data;
  })();

  inflight.set(url, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(url);
  }
}

export const LANDING_GEO_URL = '/data/landing/colombia-departments-latlon.geo.json';
export const LANDING_IMPACT_URL = '/data/landing/landingImpactSummary.json';
export const LANDING_SALES_CATALOG_URL = '/data/sales-catalogs/colombia_sales_catalog.json';
export const LANDING_DEPARTMENTS_URL = '/data/sales-catalogs/colombia_departments.json';

export function landingMunicipalitiesShardUrl(departmentSlug: string) {
  return `/data/sales-catalogs/shards/municipalities__${departmentSlug}.json`;
}

export function landingSchoolsShardUrl(departmentSlug: string, municipalitySlug: string) {
  return `/data/sales-catalogs/shards/schools__${departmentSlug}__${municipalitySlug}.json`;
}
