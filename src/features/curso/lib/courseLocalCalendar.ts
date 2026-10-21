import type { CourseCalendarEventDto } from './courseCalendarTypes';

export type CourseCalendarSnapshotFile = {
  courseId: string;
  version?: number;
  syncedAt?: string;
  source?: string;
  bounds?: { start: string; end: string };
  count?: number;
  events: CourseCalendarEventDto[];
};

const snapshotMem = new Map<string, CourseCalendarSnapshotFile>();

/** Snapshot procesado en repo → `/data/calendar/{courseId}.json`. */
export async function fetchLocalCourseCalendarSnapshot(
  courseId: string,
): Promise<CourseCalendarSnapshotFile | null> {
  if (!courseId || typeof window === 'undefined') return null;
  if (snapshotMem.has(courseId)) return snapshotMem.get(courseId)!;

  const url = `/data/calendar/${encodeURIComponent(courseId)}.json`;
  try {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) return null;
    const raw = (await res.json()) as CourseCalendarSnapshotFile;
    if (!raw?.events?.length) return null;
    snapshotMem.set(courseId, raw);
    return raw;
  } catch {
    return null;
  }
}

export function filterCalendarEventsInBounds(
  events: CourseCalendarEventDto[],
  start?: string,
  end?: string,
  includeCancelled = false,
): CourseCalendarEventDto[] {
  const min = start ? new Date(`${start}T00:00:00-05:00`).getTime() : 0;
  const max = end ? new Date(`${end}T23:59:59-05:00`).getTime() : Number.MAX_SAFE_INTEGER;

  return events.filter((event) => {
    if (!includeCancelled && event.status === 'cancelled') return false;
    const raw = event.start?.dateTime || event.start?.date || '';
    const t = new Date(raw).getTime();
    if (Number.isNaN(t)) return false;
    return t >= min && t <= max;
  });
}
