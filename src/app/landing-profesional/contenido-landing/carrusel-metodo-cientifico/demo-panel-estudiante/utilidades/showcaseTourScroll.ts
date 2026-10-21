/** Suavizado exponencial del scrollTop (ms). Menor = más fluido, más lento al alcanzar target. */
export const SHOWCASE_SCROLL_SMOOTH_TAU_MS = 165;

/** Salto grande (cambio de tab): ir directo para no “perseguir” durante segundos. */
export const SHOWCASE_SCROLL_SNAP_DELTA_PX = 420;

export function smoothScrollTopToward(
  current: number,
  target: number,
  deltaMs: number,
  tauMs = SHOWCASE_SCROLL_SMOOTH_TAU_MS,
): number {
  const delta = target - current;
  if (Math.abs(delta) >= SHOWCASE_SCROLL_SNAP_DELTA_PX) return target;
  if (deltaMs <= 0 || Math.abs(delta) < 0.35) return target;
  const alpha = 1 - Math.exp(-deltaMs / tauMs);
  return current + delta * alpha;
}

/** Tour: 60 fps aunque landing esté en tier eco (evita scroll a tirones). */
export function getShowcaseTourFrameIntervalMs(): number {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 1000 / 30;
  }
  return 1000 / 60;
}
