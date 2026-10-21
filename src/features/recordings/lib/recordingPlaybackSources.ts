import {
  driveRecordingPrecacheUrls,
  driveRecordingStreamUrls,
} from '@features/recordings/lib/driveRecordingUrls';
import { driveVideoMediaUrl } from '@features/recordings/lib/driveVideoMediaUrl';
import type { SimRecording } from '@features/recordings/lib/recordingsTypes';

function isLocalDevHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

/** Fuentes del reproductor — Drive primero (prod); API local solo en dev. */
export function recordingPlaybackSources(rec: SimRecording): string[] {
  const urls: string[] = [];
  if (rec.videoUrl?.trim()) urls.push(rec.videoUrl.trim());
  urls.push(...driveRecordingStreamUrls(rec.driveFileId));
  if (isLocalDevHost()) urls.push(driveVideoMediaUrl(rec.driveFileId));
  return [...new Set(urls)];
}

/** Todas las URLs Drive a precargar por clase (stream + preview). */
export function recordingDrivePrecacheUrls(rec: SimRecording): string[] {
  const urls = [...driveRecordingPrecacheUrls(rec.driveFileId)];
  if (rec.videoUrl?.trim()) urls.unshift(rec.videoUrl.trim());
  return [...new Set(urls)];
}
