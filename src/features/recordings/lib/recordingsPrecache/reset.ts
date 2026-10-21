import {
  RECORDINGS_PRECACHE_GENERATION_KEY,
  RECORDINGS_PRECACHE_STORAGE_KEY,
} from '@features/recordings/lib/recordingsPrecache/constants';
import { postToRecordingsPrecacheSw, clearRecordingsPrecacheRegistration } from '@features/recordings/lib/recordingsPrecache/registerServiceWorker';

/** Bump al cambiar estrategia Drive / SW — fuerza precarga limpia en todos los clientes. */
export const RECORDINGS_PRECACHE_GENERATION = 'drive-v6';

export async function resetRecordingsPrecache(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(RECORDINGS_PRECACHE_STORAGE_KEY);
  } catch {
    /* ignore */
  }

  postToRecordingsPrecacheSw({ type: 'SG_RECORDINGS_PURGE_ALL' });

  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => key.startsWith('sg-recordings')).map((key) => caches.delete(key)),
    );
  }

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((reg) => reg.active?.scriptURL.includes('recordings-precache-sw'))
        .map((reg) => reg.unregister()),
    );
    clearRecordingsPrecacheRegistration();
  }
}

/** Si cambió la generación, purga caché viejo antes de precargar. */
export async function ensureRecordingsPrecacheGeneration(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  let stored: string | null = null;
  try {
    stored = localStorage.getItem(RECORDINGS_PRECACHE_GENERATION_KEY);
  } catch {
    stored = null;
  }

  if (stored === RECORDINGS_PRECACHE_GENERATION) return false;

  await resetRecordingsPrecache();

  try {
    localStorage.setItem(RECORDINGS_PRECACHE_GENERATION_KEY, RECORDINGS_PRECACHE_GENERATION);
  } catch {
    /* ignore */
  }

  return true;
}
