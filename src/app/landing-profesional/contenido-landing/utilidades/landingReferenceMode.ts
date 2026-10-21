export type LandingReferenceMode = 'local' | 'firestore';

const PRODUCTION_HOSTS = new Set([
  'simulacros-sg.web.app',
  'simulacros-sg.firebaseapp.com',
]);

function isLocalHostname() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return true;
  if (/^192\.168\.\d+\.\d+$/.test(host)) return true;
  if (/^10\.\d+\.\d+\.\d+$/.test(host)) return true;
  if (host.endsWith('.local')) return true;
  return false;
}

function isProductionHostname() {
  if (typeof window === 'undefined') return false;
  return PRODUCTION_HOSTS.has(window.location.hostname);
}

/**
 * Origen de datos de la landing (métricas, mapa, catálogo ventas).
 *
 * | Modo       | Métricas / mapa / colegios                          |
 * |------------|-----------------------------------------------------|
 * | `local`    | `public/data/landing/*`, bundle en repo, sin FS     |
 * | `firestore`| `landing_reference/*` en Firebase producción      |
 *
 * Override: `NEXT_PUBLIC_LANDING_REFERENCE_SOURCE=local|firestore`
 *
 * Por defecto:
 * - `next dev`, localhost o IP LAN → local
 * - Host producción (`simulacros-sg.web.app`, …) → firestore
 * - Resto (preview deploy, etc.) → firestore
 */
export function getLandingReferenceMode(): LandingReferenceMode {
  const forced = process.env.NEXT_PUBLIC_LANDING_REFERENCE_SOURCE?.trim().toLowerCase();
  if (forced === 'local' || forced === 'firestore') {
    return forced;
  }

  if (typeof window !== 'undefined' && isProductionHostname()) {
    return 'firestore';
  }

  if (process.env.NODE_ENV === 'development') {
    return 'local';
  }

  if (isLocalHostname()) {
    return 'local';
  }

  return 'firestore';
}

export function isLandingReferenceLocal() {
  return getLandingReferenceMode() === 'local';
}

/** Solo dev: etiqueta visible en consola al cargar la landing. */
export function logLandingReferenceModeOnce() {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') return;
  const key = '__sg_landing_ref_mode_logged';
  if ((window as unknown as Record<string, boolean>)[key]) return;
  (window as unknown as Record<string, boolean>)[key] = true;
  console.info(`[landing] reference source: ${getLandingReferenceMode()}`);
}
