/** URLs Drive para `<video>` (stream directo). */
export function driveRecordingStreamUrls(fileId: string): string[] {
  const id = encodeURIComponent(fileId);
  return [
    `https://drive.usercontent.google.com/download?id=${id}&export=view`,
    `https://drive.usercontent.google.com/download?id=${id}&export=download`,
    `https://drive.google.com/uc?export=view&id=${id}`,
    `https://drive.google.com/uc?export=download&id=${id}`,
  ];
}

/** Todas las URLs a cachear (stream + preview iframe) — precarga masiva 30 días. */
export function driveRecordingPrecacheUrls(fileId: string): string[] {
  const id = encodeURIComponent(fileId);
  return [
    ...driveRecordingStreamUrls(fileId),
    `https://drive.google.com/file/d/${id}/preview`,
  ];
}

export function driveRecordingPrimaryUrl(fileId: string): string {
  return driveRecordingStreamUrls(fileId)[0];
}

export function isDriveRecordingUrl(url: string): boolean {
  return (
    url.includes('drive.google.com/uc') ||
    url.includes('drive.google.com/file/d/') ||
    url.includes('drive.usercontent.google.com') ||
    url.includes('googleusercontent.com')
  );
}
