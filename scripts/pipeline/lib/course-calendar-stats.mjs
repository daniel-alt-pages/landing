/** Estadísticas de calendario vacacional — espejo de courseVacacionalAttendance. */

import {
  isVacacionalDisplayPlaceholderSummary,
  isVacacionalIcsRecurringGarbageSummary,
} from '../../lib/course-calendar-summary-normalize.mjs';

const VACACIONAL_INDUCTION_RE = /inducci[oó]n/i;
const PREICFES_SG26_LIVE_START = '2026-06-08';

function eventStartMs(event) {
  const raw = event.start?.dateTime || event.start?.date;
  if (!raw) return 0;
  const ms = new Date(raw).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function eventEndMs(event) {
  const raw = event.end?.dateTime || event.end?.date;
  if (!raw) {
    const start = eventStartMs(event);
    return start ? start + 2 * 60 * 60 * 1000 : 0;
  }
  const ms = new Date(raw).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

export function isVacacionalClassEvent(event) {
  if (event.status === 'cancelled') return false;
  return Boolean(event.start?.dateTime);
}

function vacacionalEventDayKey(event) {
  const raw = event.start?.dateTime || event.start?.date;
  if (!raw) return '';
  const ms = new Date(raw).getTime();
  if (Number.isNaN(ms)) return '';
  return new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}

/** Clases del curso con seguimiento (excluye inducciones y pre-08-jun en vacacional SG26). */
export function isVacacionalLiveClassEvent(event, courseId) {
  if (isVacacionalIcsRecurringGarbageSummary(event.summary)) return false;
  if (isVacacionalDisplayPlaceholderSummary(event.summary)) return false;
  if (!isVacacionalClassEvent(event)) return false;
  if (VACACIONAL_INDUCTION_RE.test(String(event.summary || ''))) return false;
  if (courseId === 'preicfes-sg26') {
    const date = vacacionalEventDayKey(event);
    if (date && date < PREICFES_SG26_LIVE_START) return false;
  }
  return true;
}

export function filterCourseScheduledClassEvents(events, courseId = 'preicfes-sg26') {
  return events.filter((e) => isVacacionalLiveClassEvent(e, courseId));
}

/** Calendario UI: clases en vivo + placeholders reales (sin basura ICS ni inducciones). */
export function filterCourseCalendarDisplayEvents(events, courseId = 'preicfes-sg26') {
  return events.filter((e) => {
    if (e.status === 'cancelled') return false;
    if (!isVacacionalClassEvent(e)) return false;
    if (VACACIONAL_INDUCTION_RE.test(String(e.summary || ''))) return false;
    if (isVacacionalIcsRecurringGarbageSummary(e.summary)) return false;
    if (isVacacionalDisplayPlaceholderSummary(e.summary)) return true;
    return isVacacionalLiveClassEvent(e, courseId);
  });
}

export function computeCalendarStats(events, now = Date.now(), courseId) {
  const classEvents = courseId
    ? filterCourseScheduledClassEvents(events, courseId)
    : events.filter(isVacacionalClassEvent);
  let sessionsCompleted = 0;
  let sessionsUpcoming = 0;
  let cancelledCount = 0;

  for (const event of events) {
    if (event.status === 'cancelled') cancelledCount += 1;
  }

  for (const event of classEvents) {
    const endMs = eventEndMs(event);
    if (endMs && endMs < now) sessionsCompleted += 1;
    else sessionsUpcoming += 1;
  }

  return {
    eventCount: classEvents.length,
    sessionsCompleted,
    sessionsUpcoming,
    cancelledCount,
  };
}

export function filterEventsByRange(events, startIso, endIso, includeCancelled) {
  const min = new Date(startIso).getTime();
  const max = new Date(endIso).getTime();
  return events.filter((event) => {
    if (!includeCancelled && event.status === 'cancelled') return false;
    const t = eventStartMs(event);
    return t >= min && t <= max;
  });
}
