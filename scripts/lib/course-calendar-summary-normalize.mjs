/**
 * Basura de serie recurrente ICS (`CLASE #1`, `# A #`) — no es slot real del curso.
 */
export function isVacacionalIcsRecurringGarbageSummary(summary) {
  return String(summary || '').toUpperCase().includes('(# A #)');
}

/** Slots reales “por definir” (p. ej. viernes con CLASE #** / POR DEFINIR). */
export function isVacacionalDisplayPlaceholderSummary(summary) {
  const s = String(summary || '').toUpperCase();
  if (isVacacionalIcsRecurringGarbageSummary(summary)) return false;
  return /CLASE\s*#\s*\*\*/i.test(s) || /POR\s+DEFINIR/i.test(s);
}

/**
 * Normaliza títulos ICS → vocabulario ICFES del panel curso.
 * - AREA (SOCIALES) → AREA (COMPETENCIAS CIUDADANAS)
 * - AREA (LECTURA) → AREA (LECTURA CRÍTICA)
 */
export function normalizeVacacionalEventSummary(summary) {
  if (!summary || typeof summary !== 'string') return summary ?? '';
  let s = summary;
  s = s.replace(/AREA\s*\(\s*LECTURA\s*\)/gi, 'AREA (LECTURA CRÍTICA)');
  s = s.replace(/AREA\s*\(\s*SOCIALES\s*\)/gi, 'AREA (COMPETENCIAS CIUDADANAS)');
  return s;
}

export function normalizeVacacionalCalendarEvent(event) {
  if (!event?.summary) return event;
  const summary = normalizeVacacionalEventSummary(event.summary);
  if (summary === event.summary) return event;
  return { ...event, summary };
}

export function normalizeVacacionalCalendarEvents(events) {
  return events.map(normalizeVacacionalCalendarEvent);
}
