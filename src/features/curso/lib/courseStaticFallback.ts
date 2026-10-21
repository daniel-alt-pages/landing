import type { CourseDoc } from '../types/courseTypes';

/** Parches locales cuando Firestore (p. ej. prod) aún no tiene campos nuevos del curso. */
const STATIC_PATCHES: Record<
  string,
  Partial<
    Pick<
      CourseDoc,
      'calendarEmbedUrl' | 'calendarProgram' | 'classLinks' | 'type' | 'courseStartDate' | 'courseEndDate'
    >
  >
> = {
  'preicfes-sg26': {
    type: 'vacacional',
    calendarProgram: 'vacacional',
    courseStartDate: '2026-06-01',
    courseEndDate: '2026-07-26',
    calendarEmbedUrl:
      'https://calendar.google.com/calendar/embed?src=c_6bfa64bf381ad765e2f4131a0452d9ec6885ad2ad7f189393261487f5c1baebd%40group.calendar.google.com&ctz=America%2FBogota',
  },
};

export function applyCourseStaticPatch(doc: CourseDoc | null): CourseDoc | null {
  if (!doc) return null;
  const patch = STATIC_PATCHES[doc.id];
  if (!patch) return doc;

  return {
    ...doc,
    type: patch.type ?? doc.type,
    calendarProgram: doc.calendarProgram ?? patch.calendarProgram,
    courseStartDate: doc.courseStartDate ?? patch.courseStartDate,
    courseEndDate: doc.courseEndDate ?? patch.courseEndDate,
    calendarEmbedUrl: doc.calendarEmbedUrl?.trim() || patch.calendarEmbedUrl,
    classLinks:
      doc.classLinks.length > 0 ? doc.classLinks : (patch.classLinks ?? doc.classLinks),
  };
}
