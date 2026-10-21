import type { CourseRecordingCatalogSegment, SimRecording } from '@features/recordings/lib/recordingsTypes';
import { recordingCourseClassType } from '@features/recordings/lib/recordingsCatalog';
import { extractVacacionalClaseNumber } from './courseVacacionalClaseTitle';

export const COURSE_RECORDING_SEGMENT_LABELS: Record<CourseRecordingCatalogSegment, string> = {
  official: 'Clases oficiales',
  induction: 'Inducciones',
};

export const COURSE_RECORDING_SEGMENT_HINTS: Record<CourseRecordingCatalogSegment, string> = {
  official: 'Clases en vivo del curso (desde 8 jun). Cuentan para asistencia.',
  induction: 'Sesiones introductorias previas al inicio. Solo grabación — no cuentan en asistencia.',
};

export function isCourseInductionSimRecording(rec: SimRecording): boolean {
  if (rec.catalogSegment === 'induction') return true;
  if (rec.catalogSegment === 'official') return false;
  const classType = recordingCourseClassType(rec);
  if (/inducci[oó]n/i.test(classType)) return true;
  if (/inducci[oó]n/i.test(rec.title)) return true;
  return false;
}

export function courseRecordingCatalogSegment(
  rec: SimRecording,
): CourseRecordingCatalogSegment {
  if (rec.catalogSegment) return rec.catalogSegment;
  return isCourseInductionSimRecording(rec) ? 'induction' : 'official';
}

export function filterSimRecordingsBySegment(
  recordings: SimRecording[],
  segment: CourseRecordingCatalogSegment,
): SimRecording[] {
  return recordings.filter((r) => courseRecordingCatalogSegment(r) === segment);
}

export function countSimRecordingsBySegment(
  recordings: SimRecording[],
): Record<CourseRecordingCatalogSegment, number> {
  let official = 0;
  let induction = 0;
  for (const rec of recordings) {
    if (courseRecordingCatalogSegment(rec) === 'induction') induction += 1;
    else official += 1;
  }
  return { official, induction };
}
