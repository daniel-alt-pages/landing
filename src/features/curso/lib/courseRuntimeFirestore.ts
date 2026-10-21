import { doc } from 'firebase/firestore';
import { db } from '@features/auth/lib/firebase';
import { gatedGetDoc } from '@features/simulacro/lib/firestoreService';
import type { CourseCalendarEventDto } from './courseCalendarTypes';
import {
  mapCourseCalendarSnapshotDoc,
  mapCourseRuntimeDoc,
} from './courseMappers';
import {
  CACHE_TTL_COURSE_RUNTIME_MS,
  courseCacheGet,
  courseCacheSet,
  courseCalendarSnapshotCacheKey,
  courseRuntimeCacheKey,
  isCourseClientCacheEnabled,
} from './courseCache';
import type { CourseCalendarSnapshotDoc, CourseRuntimeDoc } from '../types/courseRuntimeTypes';
import {
  COURSE_CALENDAR_SNAPSHOTS_COLLECTION,
  COURSE_RUNTIME_COLLECTION,
} from '../types/courseRuntimeTypes';
import { ensureCourseFirestoreAuth } from './ensureCourseFirestoreAuth';
import { isVacacionalLiveClassEvent } from './courseVacacionalAttendance';

const runtimeMem = new Map<string, CourseRuntimeDoc>();

/** ICS :3099 solo con `NEXT_PUBLIC_COURSE_CALENDAR_SOURCE=local`. Por defecto: Firestore. */
export function isLocalCourseCalendarApiEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return process.env.NEXT_PUBLIC_COURSE_CALENDAR_SOURCE === 'local';
}

function filterScheduledCalendarEvents(
  courseId: string,
  events: CourseCalendarEventDto[],
): CourseCalendarEventDto[] {
  if (courseId === 'preicfes-sg26') {
    return events.filter((event) => isVacacionalLiveClassEvent(event, courseId));
  }
  return events;
}

export function peekCachedCalendarEvents(courseId: string): CourseCalendarEventDto[] {
  if (!courseId || !isCourseClientCacheEnabled()) return [];
  const runtime = peekCachedCourseRuntime(courseId);
  if (!runtime?.calendarVersion) return [];
  const key = courseCalendarSnapshotCacheKey(courseId, runtime.calendarVersion);
  const snap = courseCacheGet<CourseCalendarSnapshotDoc>(key);
  if (snap?.events?.length) return filterScheduledCalendarEvents(courseId, snap.events);
  const legacy = courseCacheGet<{ events: CourseCalendarEventDto[] }>(key);
  return filterScheduledCalendarEvents(courseId, legacy?.events ?? []);
}

export function peekCachedCourseRuntime(courseId: string): CourseRuntimeDoc | null {
  if (!courseId || !isCourseClientCacheEnabled()) return null;
  if (runtimeMem.has(courseId)) return runtimeMem.get(courseId)!;
  return courseCacheGet<CourseRuntimeDoc>(courseRuntimeCacheKey(courseId));
}

export function invalidateCourseRuntimeMemory(courseId?: string): void {
  if (courseId) runtimeMem.delete(courseId);
  else runtimeMem.clear();
}

export async function fetchCourseRuntime(
  courseId: string,
  options?: { force?: boolean },
): Promise<CourseRuntimeDoc | null> {
  if (!courseId) return null;
  const force = options?.force ?? false;

  const cacheEnabled = isCourseClientCacheEnabled();
  if (cacheEnabled && !force && runtimeMem.has(courseId)) return runtimeMem.get(courseId)!;

  const cacheKey = courseRuntimeCacheKey(courseId);
  if (cacheEnabled && !force) {
    const cached = courseCacheGet<CourseRuntimeDoc>(cacheKey);
    if (cached) {
      runtimeMem.set(courseId, cached);
      return cached;
    }
  }

  if (!(await ensureCourseFirestoreAuth('fetchCourseRuntime'))) {
    return null;
  }

  const ref = doc(db, COURSE_RUNTIME_COLLECTION, courseId);
  let snap;
  try {
    snap = await gatedGetDoc(ref, 'fetchCourseRuntime');
  } catch {
    return null;
  }
  if (!snap?.exists()) return null;

  const mapped = mapCourseRuntimeDoc(courseId, snap.data() as Record<string, unknown>);
  if (cacheEnabled) {
    runtimeMem.set(courseId, mapped);
    courseCacheSet(cacheKey, mapped, CACHE_TTL_COURSE_RUNTIME_MS);
  }
  return mapped;
}

export async function fetchCourseCalendarSnapshot(
  courseId: string,
  calendarVersion?: number,
): Promise<{ runtime: CourseRuntimeDoc; snapshot: CourseCalendarSnapshotDoc } | null> {
  const runtime = await fetchCourseRuntime(courseId);
  if (!runtime) return null;

  const version = calendarVersion ?? runtime.calendarVersion;
  const snapshotCacheKey = courseCalendarSnapshotCacheKey(courseId, version);
  if (isCourseClientCacheEnabled()) {
    const cachedSnapshot = courseCacheGet<CourseCalendarSnapshotDoc>(snapshotCacheKey);
    if (cachedSnapshot && cachedSnapshot.version === version) {
      return { runtime, snapshot: cachedSnapshot };
    }
  }

  const ref = doc(db, COURSE_CALENDAR_SNAPSHOTS_COLLECTION, courseId);
  let snap;
  try {
    snap = await gatedGetDoc(ref, 'fetchCourseCalendarSnapshot');
  } catch {
    return null;
  }
  if (!snap?.exists()) return null;

  const snapshot = mapCourseCalendarSnapshotDoc(courseId, snap.data() as Record<string, unknown>);
  if (isCourseClientCacheEnabled()) {
    const cacheKeyForSnapshot = courseCalendarSnapshotCacheKey(courseId, snapshot.version);
    courseCacheSet(cacheKeyForSnapshot, snapshot, Number.MAX_SAFE_INTEGER);
  }
  return { runtime, snapshot };
}

export async function fetchCourseCalendarEventsFromFirestore(
  courseId: string,
): Promise<{
  events: CourseCalendarEventDto[];
  runtime: CourseRuntimeDoc;
  snapshot: CourseCalendarSnapshotDoc;
} | null> {
  const payload = await fetchCourseCalendarSnapshot(courseId);
  if (!payload) return null;
  return {
    events: payload.snapshot.events,
    runtime: payload.runtime,
    snapshot: payload.snapshot,
  };
}

export function clearCourseRuntimeMemoryCache(): void {
  runtimeMem.clear();
}
