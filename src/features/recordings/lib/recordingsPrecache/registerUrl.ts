import { postToRecordingsPrecacheSw } from '@features/recordings/lib/recordingsPrecache/registerServiceWorker';

/** Registra URL de media en SW para cache-first 30 días. */
export function registerRecordingMediaUrl(url: string | null | undefined): void {
  const trimmed = url?.trim();
  if (!trimmed) return;
  postToRecordingsPrecacheSw({ type: 'SG_RECORDINGS_REGISTER_URL', url: trimmed });
  postToRecordingsPrecacheSw({ type: 'SG_RECORDINGS_PRECACHE_ONE', url: trimmed });
}
