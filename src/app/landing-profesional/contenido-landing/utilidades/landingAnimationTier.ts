/** Perfil de animación para landing (tour, galería WebGL, Drive). */

export type LandingAnimationTier = 'full' | 'eco';

let cachedTier: LandingAnimationTier | null = null;

export function getLandingAnimationTier(): LandingAnimationTier {
  if (cachedTier) return cachedTier;
  if (typeof window === 'undefined') return 'full';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cachedTier = 'eco';
    return cachedTier;
  }

  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) {
    cachedTier = 'eco';
    return cachedTier;
  }

  const cores = navigator.hardwareConcurrency ?? 8;
  if (cores <= 4) {
    cachedTier = 'eco';
    return cachedTier;
  }

  if (window.matchMedia('(max-width: 768px)').matches) {
    cachedTier = 'eco';
    return cachedTier;
  }

  cachedTier = 'full';
  return cachedTier;
}

/** Intervalo mínimo entre frames del tour / Drive (ms). */
export function getLandingFrameIntervalMs(tier: LandingAnimationTier = getLandingAnimationTier()): number {
  return tier === 'eco' ? 1000 / 30 : 1000 / 60;
}

/** DPR máximo para CircularGallery (WebGL). */
export function getLandingGalleryMaxDpr(tier: LandingAnimationTier = getLandingAnimationTier()): number {
  return tier === 'eco' ? 1.25 : 2;
}

export function isDocumentHidden(): boolean {
  return typeof document !== 'undefined' && document.hidden;
}
