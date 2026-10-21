import type { CourseCalendarEventDto } from '../lib/courseCalendarTypes';
import type { BogotaWeekRange, CourseDateBounds } from '../lib/courseVacacionalWeek';

/** Puntero pequeño — leído primero por el frontend para evitar snapshots grandes. */
export type CourseRuntimeDoc = {
  courseId: string;
  calendarVersion: number;
  attendanceVersion: number;
  /** Bump en pipeline ingest compilados → invalida caché LS del estudiante. */
  materialsVersion?: number;
  materialsUpdatedAt?: string;
  calendarUpdatedAt?: string;
  attendanceUpdatedAt?: string;
  activeFrom?: string;
  activeTo?: string;
  calendarDocPath: string;
  calendarId?: string;
  label?: string;
  stats?: CourseRuntimeStats;
};

export type CourseRuntimeStats = {
  eventCount: number;
  sessionsCompleted: number;
  sessionsUpcoming: number;
  cancelledCount?: number;
};

/** Snapshot completo del calendario vacacional por curso. */
export type CourseCalendarSnapshotDoc = {
  courseId: string;
  version: number;
  source: 'google_api' | 'ics';
  calendarId: string;
  label?: string;
  range: CourseDateBounds;
  events: CourseCalendarEventDto[];
  weeks?: BogotaWeekRange[];
  stats: CourseRuntimeStats;
  updatedAt: string;
};

export const COURSE_RUNTIME_COLLECTION = 'courseRuntime';
export const COURSE_CALENDAR_SNAPSHOTS_COLLECTION = 'courseCalendarSnapshots';
export const COURSE_STUDENT_MATERIALS_COLLECTION = 'courseStudentMaterials';

export function courseRuntimeDocPath(courseId: string): string {
  return `${COURSE_RUNTIME_COLLECTION}/${courseId}`;
}

export function courseCalendarSnapshotDocPath(courseId: string): string {
  return `${COURSE_CALENDAR_SNAPSHOTS_COLLECTION}/${courseId}`;
}
