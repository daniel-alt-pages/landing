const STORAGE_PREFIX = 'sg:course-recording-playback:';

export type CourseRecordingPlaybackSnapshot = {
  activeId: string | null;
  startedIds: string[];
  times: Record<string, number>;
};

function emptySnapshot(): CourseRecordingPlaybackSnapshot {
  return { activeId: null, startedIds: [], times: {} };
}

function storageKey(courseId: string) {
  return `${STORAGE_PREFIX}${courseId}`;
}

export function loadCourseRecordingPlayback(courseId: string): CourseRecordingPlaybackSnapshot {
  if (typeof window === 'undefined') return emptySnapshot();
  try {
    const raw = sessionStorage.getItem(storageKey(courseId));
    if (!raw) return emptySnapshot();
    const parsed = JSON.parse(raw) as Partial<CourseRecordingPlaybackSnapshot>;
    return {
      activeId: parsed.activeId ?? null,
      startedIds: Array.isArray(parsed.startedIds) ? parsed.startedIds : [],
      times: parsed.times && typeof parsed.times === 'object' ? parsed.times : {},
    };
  } catch {
    return emptySnapshot();
  }
}

export function saveCourseRecordingPlayback(
  courseId: string,
  snapshot: CourseRecordingPlaybackSnapshot,
): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(storageKey(courseId), JSON.stringify(snapshot));
  } catch {
    /* quota / private mode */
  }
}

export function rememberRecordingTime(
  courseId: string,
  recordingId: string,
  seconds: number,
): void {
  const snap = loadCourseRecordingPlayback(courseId);
  snap.times[recordingId] = seconds;
  saveCourseRecordingPlayback(courseId, snap);
}

export function readRecordingTime(courseId: string, recordingId: string): number | null {
  const value = loadCourseRecordingPlayback(courseId).times[recordingId];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
