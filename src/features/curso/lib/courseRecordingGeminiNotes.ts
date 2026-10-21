import type { CourseCalendarEventDto } from './courseCalendarTypes';
import {
  classifyVacacionalAttachment,
  extractDriveFileId,
  isVacacionalRecordingAttachment,
} from './courseVacacionalAttachmentPolicy';
import { vacacionalRecordingTitleMatchesEvent } from './courseVacacionalClaseTitle';
import {
  geminiDocUrl,
  VACACIONAL_RECORDING_CANON_BY_DRIVE,
  vacacionalRecordingCanon,
} from './courseVacacionalRecordingCanon';
import { vacacionalRecordingId } from './courseVacacionalRecordings';
import { vacacionalEventDayKey } from './courseVacacionalEventTime';

export type RecordingGeminiNote = {
  recordingId: string;
  sessionTitle: string;
  attachmentTitle: string;
  url: string;
};

function geminiAttachments(event: CourseCalendarEventDto) {
  return (event.attachments ?? []).filter(
    (att) => classifyVacacionalAttachment(att) === 'gemini',
  );
}

function noteFromEvent(
  event: CourseCalendarEventDto,
  recordingId: string,
  gemini: (ReturnType<typeof geminiAttachments>[number]) | undefined,
  recordingDriveFileId?: string | null,
): RecordingGeminiNote | null {
  const canon = vacacionalRecordingCanon(recordingDriveFileId);
  const url = canon?.geminiDocId
    ? geminiDocUrl(canon.geminiDocId)
    : gemini?.url?.trim();
  if (!url) return null;
  const sessionTitle = canon?.title?.trim() || event.summary?.trim() || 'Clase';
  return {
    recordingId,
    sessionTitle,
    attachmentTitle: gemini?.title.trim() || 'Notas de Gemini',
    url,
  };
}

function findEventByDriveFileId(
  driveFileId: string,
  events: CourseCalendarEventDto[],
): CourseCalendarEventDto | undefined {
  for (const event of events) {
    for (const att of event.attachments ?? []) {
      if (!isVacacionalRecordingAttachment(att)) continue;
      const attDrive = extractDriveFileId(att.url);
      if (attDrive === driveFileId) return event;
    }
  }
  return undefined;
}

/** Índice recordingId (+ driveFileId) → notas Gemini. */
export function buildRecordingGeminiNotesIndex(
  events: CourseCalendarEventDto[],
): Map<string, RecordingGeminiNote> {
  const map = new Map<string, RecordingGeminiNote>();

  for (const event of events) {
    const geminiList = geminiAttachments(event);
    const primaryGemini = geminiList[0];

    for (const att of event.attachments ?? []) {
      if (!isVacacionalRecordingAttachment(att)) continue;
      const driveFileId = extractDriveFileId(att.url);
      const recordingId = vacacionalRecordingId(event.id, att.url, driveFileId);
      const note = noteFromEvent(event, recordingId, primaryGemini, driveFileId);
      if (!note) continue;
      map.set(recordingId, note);
      if (driveFileId) map.set(`drive:${driveFileId}`, note);
    }
  }

  for (const [driveFileId, canon] of Object.entries(VACACIONAL_RECORDING_CANON_BY_DRIVE)) {
    if (!canon.geminiDocId) continue;
    const note: RecordingGeminiNote = {
      recordingId: `drive:${driveFileId}`,
      sessionTitle: canon.title,
      attachmentTitle: 'Notas de Gemini',
      url: geminiDocUrl(canon.geminiDocId),
    };
    map.set(`drive:${driveFileId}`, note);
  }

  return map;
}

type RecordingMatchFields = {
  id: string;
  title: string;
  recordedAt?: string;
  driveFileId?: string;
};

function noteFromCanon(
  recording: RecordingMatchFields,
  events: CourseCalendarEventDto[],
): RecordingGeminiNote | null {
  const canon = vacacionalRecordingCanon(recording.driveFileId);
  if (!canon?.geminiDocId) return null;
  const event = recording.driveFileId
    ? findEventByDriveFileId(recording.driveFileId, events)
    : undefined;
  return {
    recordingId: recording.id,
    sessionTitle: canon.title,
    attachmentTitle: 'Notas de Gemini',
    url: geminiDocUrl(canon.geminiDocId),
  };
}

function resolveNoteFromIndex(
  recording: RecordingMatchFields,
  index: Map<string, RecordingGeminiNote>,
): RecordingGeminiNote | null {
  const direct = index.get(recording.id);
  if (direct) return direct;
  if (recording.driveFileId) {
    const byDrive = index.get(`drive:${recording.driveFileId}`);
    if (byDrive) return { ...byDrive, recordingId: recording.id };
  }
  return null;
}

/** Resuelve título del evento de calendario (summary ICS) para una grabación. */
export function resolveRecordingSessionTitle(
  recording: RecordingMatchFields,
  index: Map<string, RecordingGeminiNote>,
  events: CourseCalendarEventDto[],
): string | null {
  const canon = vacacionalRecordingCanon(recording.driveFileId);
  if (canon?.title) return canon.title;

  const fromNote = resolveNoteFromIndex(recording, index)?.sessionTitle?.trim();
  if (fromNote) return fromNote;

  const fromResolve = resolveRecordingGeminiNote(recording, index, events)?.sessionTitle?.trim();
  if (fromResolve) return fromResolve;

  if (recording.driveFileId) {
    const event = findEventByDriveFileId(recording.driveFileId, events);
    if (event?.summary?.trim()) return event.summary.trim();
  }

  for (const event of events) {
    const summary = event.summary?.trim();
    if (!summary) continue;
    const dayKey = vacacionalEventDayKey(event);
    if (recording.recordedAt && dayKey && recording.recordedAt !== dayKey) continue;

    for (const att of event.attachments ?? []) {
      if (!isVacacionalRecordingAttachment(att)) continue;
      const driveFileId = extractDriveFileId(att.url);
      const recordingId = vacacionalRecordingId(event.id, att.url, driveFileId);
      if (recordingId === recording.id) return summary;
      if (recording.driveFileId && driveFileId && recording.driveFileId === driveFileId) {
        return summary;
      }
    }

    if (vacacionalRecordingTitleMatchesEvent(recording.title, summary)) return summary;
  }

  return recording.title?.trim() || null;
}

/** Fecha del evento ICS si la grabación no trae recordedAt. */
export function resolveRecordingEventDate(
  recording: RecordingMatchFields,
  events: CourseCalendarEventDto[],
): string | null {
  const canon = vacacionalRecordingCanon(recording.driveFileId);
  if (canon?.recordedAt) return canon.recordedAt;
  if (recording.recordedAt?.trim()) return recording.recordedAt;

  if (recording.driveFileId) {
    const event = findEventByDriveFileId(recording.driveFileId, events);
    if (event) {
      const dayKey = vacacionalEventDayKey(event);
      if (dayKey) return dayKey;
    }
  }

  for (const event of events) {
    const dayKey = vacacionalEventDayKey(event);
    if (!dayKey) continue;

    for (const att of event.attachments ?? []) {
      if (!isVacacionalRecordingAttachment(att)) continue;
      const driveFileId = extractDriveFileId(att.url);
      const recordingId = vacacionalRecordingId(event.id, att.url, driveFileId);
      if (recordingId === recording.id) return dayKey;
      if (recording.driveFileId && driveFileId && recording.driveFileId === driveFileId) {
        return dayKey;
      }
    }

    if (vacacionalRecordingTitleMatchesEvent(recording.title, event.summary ?? '')) return dayKey;
  }

  return null;
}

/** Resuelve notas Gemini para una grabación (id ICS, drive o heurística). */
export function resolveRecordingGeminiNote(
  recording: RecordingMatchFields,
  index: Map<string, RecordingGeminiNote>,
  events: CourseCalendarEventDto[],
): RecordingGeminiNote | null {
  const fromIndex = resolveNoteFromIndex(recording, index);
  if (fromIndex) return fromIndex;

  const fromCanon = noteFromCanon(recording, events);
  if (fromCanon) return fromCanon;

  for (const event of events) {
    const dayKey = vacacionalEventDayKey(event);
    if (recording.recordedAt && dayKey && recording.recordedAt !== dayKey) continue;

    const geminiList = geminiAttachments(event);
    const primaryGemini = geminiList[0];
    if (!primaryGemini?.url) continue;

    if (!vacacionalRecordingTitleMatchesEvent(recording.title, event.summary ?? '')) continue;

    for (const att of event.attachments ?? []) {
      if (!isVacacionalRecordingAttachment(att)) continue;
      const driveFileId = extractDriveFileId(att.url);
      if (recording.driveFileId && driveFileId && recording.driveFileId !== driveFileId) {
        continue;
      }
      return noteFromEvent(event, recording.id, primaryGemini, recording.driveFileId);
    }

    return noteFromEvent(event, recording.id, primaryGemini, recording.driveFileId);
  }

  return null;
}
