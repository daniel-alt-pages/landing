import { driveRecordingPrimaryUrl } from '@features/recordings/lib/driveRecordingUrls';

/** Stream directo Drive (static export — sin route handler /api). */
export function driveVideoMediaUrl(fileId: string): string {
  return driveRecordingPrimaryUrl(fileId);
}

/** Respaldo cliente si la API no resuelve (misma origen Drive, sin iframe). */
export function driveVideoMediaFallbackUrls(fileId: string): string[] {
  const id = encodeURIComponent(fileId);
  return [
    `https://drive.google.com/uc?export=view&id=${id}`,
    `https://drive.google.com/uc?export=download&id=${id}`,
  ];
}
