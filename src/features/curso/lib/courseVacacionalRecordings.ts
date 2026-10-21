import type { CourseCalendarEventDto } from './courseCalendarTypes';
import type { CourseRecording } from '../types/courseTypes';
import {
  inferPlataformaFromTitle,
} from '@shared/lib/sgClasesExtra';
import {
  extractDriveFileId,
  isVacacionalRecordingAttachment,
} from './courseVacacionalAttachmentPolicy';
import { isVacacionalLiveClassEvent } from './courseVacacionalAttendance';
import { extractVacacionalClaseNumber } from './courseVacacionalClaseTitle';
import { vacacionalRecordingCanon } from './courseVacacionalRecordingCanon';
import { vacacionalEventDayKey, vacacionalEventStartDate } from './courseVacacionalEventTime';
import { PLATAFORMA_AREA_KEY } from '@shared/lib/sgClasesExtra';

/** Inducciones vacacional — grabaciones fijas, no entran a calendario/asistencia. */
const PREICFES_SG26_INDUCTION_RECORDINGS: CourseRecording[] = [
  {
    id: 'preicfes-sg26-ind-ingles',
    title: 'Inglés · Inducción específica',
    area: 'inglés',
    classType: 'Inducción específica',
    catalogSegment: 'induction',
    driveFileId: '1nRxd1TrN0MuMBH5jcUCU8TrZoL9Edng-',
    recordedAt: '2026-06-03',
    sortOrder: 10,
    visibleToStudents: true,
  },
  {
    id: 'preicfes-sg26-ind-lectura',
    title: 'Lectura crítica · Inducción específica',
    area: 'lectura crítica',
    classType: 'Inducción específica',
    catalogSegment: 'induction',
    driveFileId: '1Kgi5OeJaik0EMNxoSUiJAKu1j7Tqv89_',
    recordedAt: '2026-06-04',
    sortOrder: 20,
    visibleToStudents: true,
  },
  {
    id: 'preicfes-sg26-ind-ciudadanas',
    title: 'Competencias ciudadanas · Inducción específica',
    area: 'sociales y ciudadanas',
    classType: 'Inducción específica',
    catalogSegment: 'induction',
    driveFileId: '1sZikyDK7Nt6I_sOxQY41PEgvdequnj3r',
    recordedAt: '2026-06-04',
    sortOrder: 30,
    visibleToStudents: true,
  },
  {
    id: 'preicfes-sg26-ind-ciencias',
    title: 'Ciencias naturales · Inducción específica',
    area: 'ciencias naturales',
    classType: 'Inducción específica',
    catalogSegment: 'induction',
    driveFileId: '1YZ0MUXiZbInOBjj5mdWC3Wp3pJPyErLn',
    recordedAt: '2026-06-04',
    sortOrder: 40,
    visibleToStudents: true,
  },
  {
    id: 'preicfes-sg26-ind-matematicas',
    title: 'Matemáticas · Inducción específica',
    area: 'matemáticas',
    classType: 'Inducción específica',
    catalogSegment: 'induction',
    driveFileId: '1tGQ3-QZ2drfx6QY0dejTFE1DgiRIoVxJ',
    recordedAt: '2026-06-05',
    sortOrder: 50,
    visibleToStudents: true,
  },
  {
    id: 'preicfes-sg26-ind-plataforma',
    title: 'Plataforma de simulacros · Inducción específica',
    area: PLATAFORMA_AREA_KEY,
    classType: 'Inducción específica',
    catalogSegment: 'induction',
    driveFileId: '1bwl5Pm_hUuFBhnr3Q0NFavVdmYsZ5_UL',
    recordedAt: '2026-06-06',
    sortOrder: 60,
    visibleToStudents: true,
  },
];

function stableRecordingId(eventId: string, url: string, driveFileId?: string): string {
  return `ics-${eventId}-${driveFileId || url}`;
}

export function vacacionalRecordingId(
  eventId: string,
  attachmentUrl: string,
  driveFileId?: string | null,
): string {
  return stableRecordingId(eventId, attachmentUrl, driveFileId ?? undefined);
}

/** Grabaciones ICS → catálogo del panel Grabaciones (segmentación por área vía título). */
export function buildVacacionalClassRecordings(
  events: CourseCalendarEventDto[],
  courseId = 'preicfes-sg26',
): CourseRecording[] {
  const rows: CourseRecording[] = [];
  const scoped =
    courseId === 'preicfes-sg26'
      ? events.filter((event) => isVacacionalLiveClassEvent(event, courseId))
      : events;
  for (const event of scoped) {
    if (!event.attachments?.length) continue;
    const start = vacacionalEventStartDate(event);
    const dayKey = vacacionalEventDayKey(event);
    for (const attachment of event.attachments) {
      if (!isVacacionalRecordingAttachment(attachment)) continue;
      const driveFileId = extractDriveFileId(attachment.url) ?? undefined;
      const canon = vacacionalRecordingCanon(driveFileId);
      const title =
        canon?.title ||
        event.summary?.trim() ||
        attachment.title.trim() ||
        'Clase grabada';
      rows.push({
        id: stableRecordingId(event.id, attachment.url, driveFileId),
        title,
        classType: 'Clase oficial',
        catalogSegment: 'official',
        driveFileId,
        videoUrl: driveFileId ? undefined : attachment.url,
        recordedAt: canon?.recordedAt || dayKey || undefined,
        sortOrder: start?.getTime() ?? 999,
        visibleToStudents: true,
      });
    }
  }
  return rows;
}

function applyVacacionalRecordingCanon(rec: CourseRecording): CourseRecording {
  const canon = vacacionalRecordingCanon(rec.driveFileId);
  if (!canon) return rec;
  const recordedAt = canon.recordedAt || rec.recordedAt;
  return {
    ...rec,
    title: canon.title || rec.title,
    recordedAt,
    sortOrder: recordedAt
      ? new Date(`${recordedAt}T12:00:00`).getTime()
      : rec.sortOrder,
  };
}

/** Catálogo fijo de inducciones (no vienen del ICS filtrado desde 8-jun). */
export function buildVacacionalInductionRecordings(courseId = 'preicfes-sg26'): CourseRecording[] {
  if (courseId !== 'preicfes-sg26') return [];
  return PREICFES_SG26_INDUCTION_RECORDINGS.map(applyVacacionalRecordingCanon);
}

/** Firestore + inducciones + clases ICS. */
export function mergeVacacionalRecordingsCatalog(
  firestore: CourseRecording[],
  events: CourseCalendarEventDto[],
  courseId = 'preicfes-sg26',
): CourseRecording[] {
  const inductions = buildVacacionalInductionRecordings(courseId);
  const fromIcs = buildVacacionalClassRecordings(events, courseId);
  return mergeCourseRecordingsWithIcs(
    mergeCourseRecordingsWithIcs(firestore, inductions),
    fromIcs,
  );
}

function normalizeRecordingTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const INDUCTION_AREA_PATTERNS: Array<{ pattern: RegExp; topic: string }> = [
  { pattern: /plataforma/, topic: 'plataforma' },
  { pattern: /lectura\s*cr[ií]tica/, topic: 'lectura crítica' },
  { pattern: /competencias?\s*ciudadanas?|sociales\s*y\s*ciudadanas?/, topic: 'sociales y ciudadanas' },
  { pattern: /ciencias?\s*naturales?/, topic: 'ciencias naturales' },
  { pattern: /matem[aá]ticas?/, topic: 'matemáticas' },
  { pattern: /\bingl[eé]s\b/, topic: 'inglés' },
];

function inductionTopicFromTitle(title: string): string | null {
  const normalized = normalizeRecordingTitle(title);
  if (!/inducci[oó]n/i.test(normalized) && !inferPlataformaFromTitle(title)) return null;
  for (const { pattern, topic } of INDUCTION_AREA_PATTERNS) {
    if (pattern.test(normalized)) return topic;
  }
  return 'general';
}

/** Clave de dedup: inducción por tema+fecha; clases por título+fecha. */
export function courseRecordingMergeKey(rec: CourseRecording): string {
  const title = rec.title?.trim() || '';
  const inductionTopic = inductionTopicFromTitle(title);
  if (inductionTopic) {
    return `induccion|${inductionTopic}|${rec.recordedAt ?? ''}`;
  }
  const claseNum = extractVacacionalClaseNumber(title);
  if (claseNum != null) return `clase|${claseNum}|${rec.recordedAt ?? ''}`;
  const normalized = normalizeRecordingTitle(title);
  if (!normalized) return rec.id;
  return `clase|${normalized}|${rec.recordedAt ?? ''}`;
}

export function mergeCourseRecordingsWithIcs(
  firestore: CourseRecording[],
  fromIcs: CourseRecording[],
): CourseRecording[] {
  const byKey = new Map<string, CourseRecording>();
  const seenDrive = new Set<string>();

  const tryAdd = (rec: CourseRecording, preferIcs = false) => {
    if (rec.driveFileId && seenDrive.has(rec.driveFileId)) return;
    const key = courseRecordingMergeKey(rec);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, rec);
      if (rec.driveFileId) seenDrive.add(rec.driveFileId);
      return;
    }
    if (preferIcs) {
      if (existing.driveFileId) seenDrive.delete(existing.driveFileId);
      byKey.set(key, rec);
      if (rec.driveFileId) seenDrive.add(rec.driveFileId);
    }
  };

  for (const rec of firestore) tryAdd(rec, false);
  for (const rec of fromIcs) tryAdd(rec, true);

  return [...byKey.values()].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
}

export function countVacacionalRecordings(event: CourseCalendarEventDto): number {
  return (event.attachments ?? []).filter(isVacacionalRecordingAttachment).length;
}

export function firstVacacionalRecordingId(
  event: CourseCalendarEventDto,
): string | undefined {
  for (const attachment of event.attachments ?? []) {
    if (!isVacacionalRecordingAttachment(attachment)) continue;
    const driveFileId = extractDriveFileId(attachment.url) ?? undefined;
    return stableRecordingId(event.id, attachment.url, driveFileId);
  }
  return undefined;
}

/**
 * ID del catálogo Grabaciones para un evento ICS.
 * Firestore y ICS usan ids distintos para el mismo Drive file — priorizar driveFileId.
 */
export function resolveVacacionalRecordingCatalogId(
  event: CourseCalendarEventDto,
  catalog: CourseRecording[],
): string | undefined {
  for (const attachment of event.attachments ?? []) {
    if (!isVacacionalRecordingAttachment(attachment)) continue;
    const driveFileId = extractDriveFileId(attachment.url) ?? undefined;
    const icsId = stableRecordingId(event.id, attachment.url, driveFileId);

    const byIcsId = catalog.find((r) => r.id === icsId);
    if (byIcsId) return byIcsId.id;

    if (driveFileId) {
      const byDrive = catalog.find((r) => r.driveFileId === driveFileId);
      if (byDrive) return byDrive.id;
    }

    if (attachment.url) {
      const byUrl = catalog.find((r) => r.videoUrl === attachment.url);
      if (byUrl) return byUrl.id;
    }

    return icsId;
  }
  return undefined;
}
