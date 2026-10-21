import type { CourseDoc } from '../types/courseTypes';
import { extractCalendarSrc } from './courseCalendarEmbed';

export type CourseCalendarProgram = 'vacacional';

export function resolveCourseCalendarProgram(
  course: Pick<CourseDoc, 'calendarProgram' | 'type' | 'id'>,
): CourseCalendarProgram | null {
  if (course.calendarProgram === 'vacacional') return 'vacacional';
  if (course.type === 'vacacional') return 'vacacional';
  if (course.id === 'preicfes-sg26') return 'vacacional';
  return null;
}

/** Embed del curso (URL pública). El ID del calendario vive en Firestore/JSON, no en código. */
export function resolveCourseCalendarSrc(
  course: Pick<CourseDoc, 'calendarEmbedUrl' | 'calendarProgram' | 'type' | 'id'>,
): string | null {
  const url = course.calendarEmbedUrl?.trim();
  if (!url) return null;
  return extractCalendarSrc(url) || (url.includes('@') ? url : null);
}

/** Entrada normalizada para `buildCalendarEmbedUrl`. */
export function buildCourseCalendarEmbedInput(
  course: Pick<CourseDoc, 'calendarEmbedUrl' | 'calendarProgram' | 'type' | 'id'>,
): string | undefined {
  const src = resolveCourseCalendarSrc(course);
  if (src) return src;
  return course.calendarEmbedUrl?.trim() || undefined;
}

export const VACACIONAL_CALENDAR_LABEL = 'PREICFES Vacacional 2026';

/** Servidor ICS local — `scripts/calendar-api-server.mjs` en dev (:3099). */
export const LOCAL_VACACIONAL_CALENDAR_API = 'http://127.0.0.1:3099';

export function buildCourseCalendarEventsUrl(params?: {
  start?: string;
  end?: string;
  weeks?: number;
  includeCancelled?: boolean;
}): string {
  const isDev =
    process.env.NODE_ENV === 'development' &&
    typeof window !== 'undefined';
  if (!isDev) return '';

  const base = LOCAL_VACACIONAL_CALENDAR_API;
  const search = new URLSearchParams();
  if (params?.start) search.set('start', params.start);
  if (params?.end) search.set('end', params.end);
  if (params?.weeks) search.set('weeks', String(params.weeks));
  if (params?.includeCancelled) search.set('includeCancelled', '1');
  const qs = search.toString();
  return `${base}/api/events/vacacional${qs ? `?${qs}` : ''}`;
}
