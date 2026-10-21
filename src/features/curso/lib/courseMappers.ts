import type {
  CourseAccessDoc,
  CourseClassLink,
  CourseDoc,
  CourseMaterial,
  CourseRecording,
  CourseStudentMetrics,
} from '../types/courseTypes';
import { sanitizeVacacionalStudentMetrics } from './courseVacacionalAttendance';
import type {
  CourseCalendarSnapshotDoc,
  CourseRuntimeDoc,
  CourseRuntimeStats,
} from '../types/courseRuntimeTypes';

function sortByOrder<T extends { order?: number; sortOrder?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ao = a.order ?? a.sortOrder ?? 999;
    const bo = b.order ?? b.sortOrder ?? 999;
    return ao - bo;
  });
}

export function mapCourseDoc(id: string, raw: Record<string, unknown>): CourseDoc {
  const materials = sortByOrder(
    ((raw.materials as CourseMaterial[]) || []).filter((m) => m?.visible !== false),
  );
  const recordings = sortByOrder(
    ((raw.recordings as CourseRecording[]) || []).filter((r) => r?.visibleToStudents !== false),
  ).sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
  const classLinks = sortByOrder(
    ((raw.classLinks as CourseClassLink[]) || []).filter((c) => c?.visible !== false),
  );

  return {
    id,
    name: String(raw.name || id),
    slug: String(raw.slug || id),
    type: (raw.type as CourseDoc['type']) || 'curso_intensivo',
    status: (raw.status as CourseDoc['status']) || 'published',
    active: raw.active !== false,
    order: Number(raw.order ?? 0),
    version: Number(raw.version ?? 1),
    audienceLabel: raw.audienceLabel as string | undefined,
    hero: (raw.hero as CourseDoc['hero']) || { title: String(raw.name || id) },
    materials,
    recordings,
    classLinks,
    calendarEmbedUrl:
      typeof raw.calendarEmbedUrl === 'string' && raw.calendarEmbedUrl.trim()
        ? raw.calendarEmbedUrl.trim()
        : undefined,
    calendarProgram:
      raw.calendarProgram === 'vacacional' ? 'vacacional' : undefined,
    courseStartDate:
      typeof raw.courseStartDate === 'string' && raw.courseStartDate.trim()
        ? raw.courseStartDate.trim()
        : undefined,
    courseEndDate:
      typeof raw.courseEndDate === 'string' && raw.courseEndDate.trim()
        ? raw.courseEndDate.trim()
        : undefined,
    associatedSimulations: raw.associatedSimulations as string[] | undefined,
    updatedAt: raw.updatedAt as CourseDoc['updatedAt'],
  };
}

export function mapCourseAccessDoc(id: string, raw: Record<string, unknown>): CourseAccessDoc {
  return {
    id,
    courseId: String(raw.courseId || ''),
    active: raw.active !== false,
    role: (raw.role as CourseAccessDoc['role']) || 'student',
    emailLower: raw.emailLower as string | undefined,
    documento: raw.documento as string | undefined,
    studentId: raw.studentId as string | undefined,
    publicStudentCode: raw.publicStudentCode as string | undefined,
    source: (raw.source as CourseAccessDoc['source']) || 'pipeline',
    grantedAt: raw.grantedAt as CourseAccessDoc['grantedAt'],
    expiresAt: raw.expiresAt as CourseAccessDoc['expiresAt'],
  };
}

export function mapCourseStudentMetrics(
  raw: Record<string, unknown>,
  courseId: string,
  personKey: string,
): CourseStudentMetrics {
  const attendance = (raw.attendance as CourseStudentMetrics['attendance']) || {
    totalHours: 0,
    attendedHours: 0,
    attendanceRate: 0,
    sessionsAttended: 0,
    sessionsTotal: 0,
  };
  return sanitizeVacacionalStudentMetrics({
    courseId,
    personKey,
    studentId: raw.studentId as string | undefined,
    emailLower: raw.emailLower as string | undefined,
    documento: raw.documento as string | undefined,
    displayName: raw.displayName as string | undefined,
    attendance,
    recentSessions: raw.recentSessions as CourseStudentMetrics['recentSessions'],
    simulacroBonuses: raw.simulacroBonuses as CourseStudentMetrics['simulacroBonuses'],
    version: Number(raw.version ?? 1),
    attendanceVersion:
      raw.attendanceVersion != null ? Number(raw.attendanceVersion) : undefined,
  });
}

export function mapCourseRuntimeDoc(
  courseId: string,
  raw: Record<string, unknown>,
): CourseRuntimeDoc {
  return {
    courseId,
    calendarVersion: Number(raw.calendarVersion ?? 0),
    attendanceVersion: Number(raw.attendanceVersion ?? 0),
    materialsVersion:
      raw.materialsVersion != null ? Number(raw.materialsVersion) : undefined,
    materialsUpdatedAt: raw.materialsUpdatedAt as string | undefined,
    calendarUpdatedAt: raw.calendarUpdatedAt as string | undefined,
    attendanceUpdatedAt: raw.attendanceUpdatedAt as string | undefined,
    activeFrom: raw.activeFrom as string | undefined,
    activeTo: raw.activeTo as string | undefined,
    calendarDocPath: String(raw.calendarDocPath || `courseCalendarSnapshots/${courseId}`),
    calendarId: raw.calendarId as string | undefined,
    label: raw.label as string | undefined,
    stats: raw.stats as CourseRuntimeStats | undefined,
  };
}

export function mapCourseCalendarSnapshotDoc(
  courseId: string,
  raw: Record<string, unknown>,
): CourseCalendarSnapshotDoc {
  return {
    courseId,
    version: Number(raw.version ?? 0),
    source: raw.source === 'google_api' ? 'google_api' : 'ics',
    calendarId: String(raw.calendarId || courseId),
    label: raw.label as string | undefined,
    range: (raw.range as CourseCalendarSnapshotDoc['range']) || {
      start: '',
      end: '',
    },
    events: (raw.events as CourseCalendarSnapshotDoc['events']) || [],
    weeks: raw.weeks as CourseCalendarSnapshotDoc['weeks'],
    stats: (raw.stats as CourseRuntimeStats) || {
      eventCount: 0,
      sessionsCompleted: 0,
      sessionsUpcoming: 0,
    },
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
  };
}

export function isCourseAccessExpired(access: CourseAccessDoc): boolean {
  if (!access.expiresAt) return false;
  const ts =
    typeof access.expiresAt === 'object' && 'toMillis' in access.expiresAt
      ? (access.expiresAt as { toMillis: () => number }).toMillis()
      : new Date(String(access.expiresAt)).getTime();
  return Number.isFinite(ts) && ts < Date.now();
}

export function isCoursePublished(course: CourseDoc): boolean {
  return course.active && course.status === 'published';
}
