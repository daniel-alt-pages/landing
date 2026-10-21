import {
  CACHE_TTL_COURSE_PANEL_MS,
  courseCacheGet,
  courseCacheSet,
  coursePanelPersistKey,
} from './courseCache';
import type {
  CourseDoc,
  CourseEntitlementsResult,
  CourseSectionTab,
  CourseStudentMetrics,
} from '../types/courseTypes';
import { getPanelScreenCache, setPanelScreenCache } from '@shared/lib/panelScreenCache';

/** Shell liviano: calendario vive en localStorage versionado (courseCalWeek_*_vN). */
export type CoursePanelSnapshot = {
  courseId: string;
  course: CourseDoc | null;
  entitlements: CourseEntitlementsResult | null;
  metrics: CourseStudentMetrics | null;
  calendarVersion: number | null;
  attendanceVersion: number | null;
  updatedAt: number;
};

export function coursePanelCacheVersion(
  calendarVersion?: number | null,
  attendanceVersion?: number | null,
): string {
  return `cal:${calendarVersion ?? 0}|att:${attendanceVersion ?? 0}`;
}

const CALENDAR_TABS = new Set<CourseSectionTab>(['clases', 'seguimiento', 'grabaciones']);

export function coursePanelNeedsCalendar(
  tab: CourseSectionTab,
  isVacacionalProgram: boolean,
): boolean {
  return isVacacionalProgram && CALENDAR_TABS.has(tab);
}

export function coursePanelCacheKey(courseId: string): string {
  return `course-panel:${courseId}`;
}

function readPersistedPanel(
  courseId: string,
  expectedVersion?: string,
): CoursePanelSnapshot | null {
  const envelope = courseCacheGet<
    CoursePanelSnapshot & { cacheVersion?: string }
  >(coursePanelPersistKey(courseId));
  if (!envelope) return null;
  if (expectedVersion && envelope.cacheVersion && envelope.cacheVersion !== expectedVersion) {
    return null;
  }
  const { cacheVersion: _cv, ...snap } = envelope;
  return snap;
}

function writePersistedPanel(snapshot: CoursePanelSnapshot, cacheVersion: string): void {
  courseCacheSet(
    coursePanelPersistKey(snapshot.courseId),
    { ...snapshot, cacheVersion },
    CACHE_TTL_COURSE_PANEL_MS,
  );
}

/**
 * Instant paint: session (misma pestaña) → localStorage (reinicio pestaña).
 * Si `expectedVersion` no coincide, devuelve último shell conocido (stale-while-revalidate).
 */
export function peekCoursePanelSnapshot(
  courseId: string,
  expectedVersion?: string,
): CoursePanelSnapshot | null {
  if (!courseId) return null;
  const key = coursePanelCacheKey(courseId);

  if (expectedVersion) {
    const exact =
      getPanelScreenCache<CoursePanelSnapshot>(key, CACHE_TTL_COURSE_PANEL_MS, expectedVersion) ??
      readPersistedPanel(courseId, expectedVersion);
    if (exact) return exact;
  }

  return (
    getPanelScreenCache<CoursePanelSnapshot>(key, CACHE_TTL_COURSE_PANEL_MS) ??
    readPersistedPanel(courseId)
  );
}

export function writeCoursePanelSnapshot(snapshot: CoursePanelSnapshot): void {
  if (!snapshot.courseId) return;
  const cacheVersion = coursePanelCacheVersion(
    snapshot.calendarVersion,
    snapshot.attendanceVersion,
  );
  const payload = { ...snapshot, updatedAt: Date.now() };
  setPanelScreenCache(
    coursePanelCacheKey(snapshot.courseId),
    payload,
    CACHE_TTL_COURSE_PANEL_MS,
    cacheVersion,
  );
  writePersistedPanel(payload, cacheVersion);
}
