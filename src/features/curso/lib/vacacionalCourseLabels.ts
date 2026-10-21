/** Etiqueta pública del intensivo vacacional (institución / curso en UI). */
export const VACACIONAL_COURSE_DISPLAY_LABEL = 'SEAMOSGENIOS';

/** Nombre del curso en tarjetas de contexto del ranking vacacional. */
export const RANKING_VACACIONAL_COURSE_NAME = VACACIONAL_COURSE_DISPLAY_LABEL;

/** Normaliza etiquetas legacy del roster/Firestore a la marca actual. */
export function displayVacacionalInstitution(raw?: string | null): string {
  const value = (raw || '').trim();
  if (!value) return VACACIONAL_COURSE_DISPLAY_LABEL;
  const norm = value.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  if (/^preicfes sg26$/i.test(norm)) return VACACIONAL_COURSE_DISPLAY_LABEL;
  return value;
}

export function normalizeVacacionalInstitution(raw?: string | null): string | undefined {
  const value = (raw || '').trim();
  if (!value) return undefined;
  return displayVacacionalInstitution(value);
}
