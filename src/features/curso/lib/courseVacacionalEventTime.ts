import type { CourseCalendarEventDto } from './courseCalendarTypes';
import { isVacacionalRecordingAttachment } from './courseVacacionalAttachmentPolicy';
import { bogotaTodayKey } from './courseVacacionalWeek';

const BOGOTA = 'America/Bogota';

export function vacacionalEventStartDate(event: CourseCalendarEventDto): Date | null {
  const raw = event.start.dateTime || event.start.date;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function vacacionalEventEndDate(event: CourseCalendarEventDto): Date | null {
  const raw = event.end?.dateTime || event.end?.date;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function vacacionalEventDayKey(event: CourseCalendarEventDto): string {
  const d = vacacionalEventStartDate(event);
  if (!d) return '';
  return d.toLocaleDateString('en-CA', { timeZone: BOGOTA });
}

/** Grabación ICS publicada → clase ya dictada (aunque el horario ICS siga en futuro). */
export function vacacionalEventHasPublishedRecording(event: CourseCalendarEventDto): boolean {
  return event.attachments?.some((att) => isVacacionalRecordingAttachment(att)) ?? false;
}

/** Dictada por horario o porque ya hay grabación en el calendario. */
export function isVacacionalClassFinishedForAttendance(
  event: CourseCalendarEventDto,
  now = Date.now(),
): boolean {
  return isVacacionalEventEnded(event, now) || vacacionalEventHasPublishedRecording(event);
}

/** La reunión ya terminó → no enlazar a Meet. */
export function isVacacionalEventEnded(event: CourseCalendarEventDto, now = Date.now()): boolean {
  const end = vacacionalEventEndDate(event);
  if (end) return end.getTime() < now;
  const start = vacacionalEventStartDate(event);
  if (!start) return false;
  const fallbackEnd = start.getTime() + 2 * 60 * 60 * 1000;
  return fallbackEnd < now;
}

/** La clase es hoy (zona Bogotá). */
export function isVacacionalMeetDay(event: CourseCalendarEventDto, now = Date.now()): boolean {
  const day = vacacionalEventDayKey(event);
  return Boolean(day) && day === bogotaTodayKey(new Date(now));
}

/** Otra clase el mismo día (más temprana) aún en curso → bloquear Meet de la siguiente. */
export function isVacacionalMeetBlockedByPriorSameDayClass(
  event: CourseCalendarEventDto,
  allEvents: CourseCalendarEventDto[],
  now = Date.now(),
): boolean {
  if (!event.hangoutLink || !isVacacionalMeetDay(event, now) || isVacacionalEventEnded(event, now)) {
    return false;
  }
  const myStart = vacacionalEventStartDate(event)?.getTime() ?? 0;
  const day = vacacionalEventDayKey(event);
  for (const other of allEvents) {
    if (other.id === event.id) continue;
    if (vacacionalEventDayKey(other) !== day) continue;
    if (!other.hangoutLink) continue;
    const otherStart = vacacionalEventStartDate(other)?.getTime() ?? 0;
    if (otherStart >= myStart) continue;
    if (!isVacacionalEventEnded(other, now)) return true;
  }
  return false;
}

/** Meet solo el día de la clase y mientras no haya terminado. */
export function isVacacionalMeetJoinable(
  event: CourseCalendarEventDto,
  now = Date.now(),
  allEvents?: CourseCalendarEventDto[],
): boolean {
  if (
    !event.hangoutLink ||
    isVacacionalEventEnded(event, now) ||
    !isVacacionalMeetDay(event, now)
  ) {
    return false;
  }
  if (allEvents?.length && isVacacionalMeetBlockedByPriorSameDayClass(event, allEvents, now)) {
    return false;
  }
  return true;
}

/** Meet programado pero bloqueado hasta el día de la clase. */
export function isVacacionalMeetLockedByDay(event: CourseCalendarEventDto, now = Date.now()): boolean {
  if (!event.hangoutLink || isVacacionalEventEnded(event, now)) return false;
  return !isVacacionalMeetDay(event, now);
}

export type VacacionalClassPhase = 'upcoming' | 'starting-soon' | 'live' | 'ended';

const FIVE_MIN_MS = 5 * 60 * 1000;

export function vacacionalClassPhase(
  event: CourseCalendarEventDto,
  now = Date.now(),
): VacacionalClassPhase {
  const start = vacacionalEventStartDate(event);
  if (!start) return 'upcoming';
  const end = vacacionalEventEndDate(event);
  const startMs = start.getTime();
  const endMs = end?.getTime() ?? startMs + 2 * 60 * 60 * 1000;

  if (now >= endMs) return 'ended';
  if (now >= startMs) return 'live';
  if (now >= startMs - FIVE_MIN_MS) return 'starting-soon';
  return 'upcoming';
}

export type VacacionalCountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  showHours: boolean;
  showDays: boolean;
};

export function getCountdownToClassStartParts(
  start: Date,
  now = Date.now(),
): VacacionalCountdownParts | null {
  const diffMs = start.getTime() - now;
  if (diffMs <= 0) return null;
  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return {
    days,
    hours,
    minutes,
    seconds,
    showDays: days > 0,
    showHours: days > 0 || hours > 0,
  };
}

export function formatCountdownToClassStart(start: Date, now = Date.now()): string {
  const diffMs = start.getTime() - now;
  if (diffMs <= 0) return 'La clase ya empezó';
  const totalMin = Math.ceil(diffMs / 60_000);
  if (totalMin < 60) return `Faltan ${totalMin} min`;
  const dayMin = 24 * 60;
  if (totalMin >= dayMin) {
    const days = Math.floor(totalMin / dayMin);
    const hours = Math.floor((totalMin % dayMin) / 60);
    const dayLabel = days === 1 ? 'día' : 'días';
    if (hours === 0) return `Faltan ${days} ${dayLabel}`;
    return `Faltan ${days} ${dayLabel} ${hours} h`;
  }
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (mins === 0) return `Faltan ${hours} h`;
  return `Faltan ${hours} h ${mins} min`;
}

export function isVacacionalLiveClassReminderActive(
  event: CourseCalendarEventDto,
  now = Date.now(),
): boolean {
  if (!event.hangoutLink || event.status === 'cancelled') return false;
  if (!isVacacionalMeetDay(event, now)) return false;
  const phase = vacacionalClassPhase(event, now);
  return phase === 'starting-soon' || phase === 'live';
}

/** Cualquier inducción (específica u otra) — no cuenta como clase en vivo. */
const VACACIONAL_INDUCTION_TOPIC_RE = /inducci[oó]n/i;

export function isVacacionalInductionTopic(topic?: string | null): boolean {
  return VACACIONAL_INDUCTION_TOPIC_RE.test(topic || '');
}

export function isVacacionalInductionEvent(event: CourseCalendarEventDto): boolean {
  return isVacacionalInductionTopic(event.summary);
}

export function formatVacacionalEventClockBogota(date: Date): string {
  return date.toLocaleTimeString('es-CO', {
    timeZone: BOGOTA,
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Horario programado ICS → entrada/salida para inducciones dadas (parcial). */
export function vacacionalScheduledSessionTimes(event: CourseCalendarEventDto): {
  joinedAt: string;
  leftAt: string;
  minutes: number;
  durationLabel: string;
} {
  const start = vacacionalEventStartDate(event);
  if (!start) {
    return { joinedAt: '—', leftAt: '—', minutes: 0, durationLabel: 'Parcial' };
  }
  const end = vacacionalEventEndDate(event) ?? new Date(start.getTime() + 60 * 60 * 1000);
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
  return {
    joinedAt: formatVacacionalEventClockBogota(start),
    leftAt: formatVacacionalEventClockBogota(end),
    minutes,
    durationLabel: 'Parcial · horario programado',
  };
}
