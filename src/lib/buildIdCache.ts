import { clearDataCaches } from '@/lib/storageCleanup';
import { invalidatePanelScreenCache } from '@shared/lib/panelScreenCache';

const BUILD_ID_KEY = 'sg_app_build_id';

export function getAppBuildId(): string {
  return process.env.NEXT_PUBLIC_BUILD_ID || '';
}

/** Limpia cachés locales si el bundle trae un BUILD_ID distinto (deploy o reinicio dev). */
export function clearCachesIfBuildIdChanged(): boolean {
  if (typeof window === 'undefined') return false;

  const current = getAppBuildId();
  if (!current) return false;

  const stored = localStorage.getItem(BUILD_ID_KEY);
  if (stored === current) return false;

  clearDataCaches();
  invalidatePanelScreenCache();

  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('sg_panel_cache:')) sessionStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }

  localStorage.setItem(BUILD_ID_KEY, current);
  console.warn(`[BuildId] Build nuevo (${current}). Caché de panel limpiada.`);
  return true;
}
