import type { CourseCalendarEventDto } from './courseCalendarTypes';

/** Serie recurrente ICS (`# A #`) — no mostrar en calendario. */
export function isVacacionalIcsRecurringGarbageSummary(summary: string): boolean {
  return String(summary || '').toUpperCase().includes('(# A #)');
}

/** Slots reales “por definir” (viernes: CLASE #** / POR DEFINIR). */
export function isVacacionalDisplayPlaceholderSummary(summary: string): boolean {
  const s = String(summary || '').toUpperCase();
  if (isVacacionalIcsRecurringGarbageSummary(summary)) return false;
  return /CLASE\s*#\s*\*\*/i.test(s) || /POR\s+DEFINIR/i.test(s);
}

/** Sociales → Competencias Ciudadanas; Lectura → Lectura Crítica (vocabulario ICFES). */
export function normalizeVacacionalEventSummary(summary: string): string {
  if (!summary) return summary;
  let s = summary;
  s = s.replace(/AREA\s*\(\s*LECTURA\s*\)/gi, 'AREA (LECTURA CRÍTICA)');
  s = s.replace(/AREA\s*\(\s*SOCIALES\s*\)/gi, 'AREA (COMPETENCIAS CIUDADANAS)');
  return s;
}

export function normalizeVacacionalCalendarEvent(
  event: CourseCalendarEventDto,
): CourseCalendarEventDto {
  const summary = normalizeVacacionalEventSummary(event.summary);
  if (summary === event.summary) return event;
  return { ...event, summary };
}

export function normalizeVacacionalCalendarEvents(
  events: CourseCalendarEventDto[],
): CourseCalendarEventDto[] {
  return events.map(normalizeVacacionalCalendarEvent);
}
