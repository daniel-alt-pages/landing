/** Número de clase en títulos PREICFES vacacional (ICS / Drive). */
export const VACACIONAL_CLASE_NUM_RE = /clase\s*#\s*(\d+)/i;

export function extractVacacionalClaseNumber(text?: string | null): number | null {
  if (!text) return null;
  const match = text.match(VACACIONAL_CLASE_NUM_RE);
  if (!match) return null;
  const n = Number.parseInt(match[1], 10);
  return Number.isFinite(n) ? n : null;
}

function normalizeTitle(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Empareja grabación ↔ evento ICS sin colapsar todas las clases en el mismo prefijo.
 */
export function vacacionalRecordingTitleMatchesEvent(
  recordingTitle: string,
  eventSummary: string,
): boolean {
  const nr = extractVacacionalClaseNumber(recordingTitle);
  const ne = extractVacacionalClaseNumber(eventSummary);
  if (nr != null && ne != null) return nr === ne;

  const na = normalizeTitle(recordingTitle);
  const nb = normalizeTitle(eventSummary);
  if (!na || !nb) return false;
  if (na === nb) return true;

  // Inducciones / títulos sin CLASE #N: coincidencia larga (no 24 chars genéricos).
  const short = na.length <= nb.length ? na : nb;
  const long = na.length > nb.length ? na : nb;
  const minLen = Math.min(short.length, 48);
  if (minLen < 20) return false;
  return long.includes(short.slice(0, minLen));
}
