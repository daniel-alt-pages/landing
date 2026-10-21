/** Colección transversal: talleres, refuerzos y clases fuera del eje ICFES. */
export const CLASES_EXTRA_AREA_KEY = 'clases extra';
export const CLASES_EXTRA_AREA_LABEL = 'Adicional';
export const CLASES_EXTRA_AREA_SHORT = 'ADI';

/** Inducción plataforma — no es área ICFES ni «Adicional» genérico. */
export const PLATAFORMA_AREA_KEY = 'plataforma';
export const PLATAFORMA_AREA_LABEL = 'Plataforma';
export const PLATAFORMA_AREA_SHORT = 'PLT';

/** Las 5 áreas del eje ICFES (filtros de grabaciones). */
export const ICFES_RECORDING_AREA_KEYS = [
  'lectura crítica',
  'matemáticas',
  'sociales y ciudadanas',
  'ciencias naturales',
  'inglés',
] as const;

export function isClasesExtraAreaKey(areaKey: string): boolean {
  return areaKey.trim().toLowerCase() === CLASES_EXTRA_AREA_KEY;
}

export function isPlataformaAreaKey(areaKey: string): boolean {
  return areaKey.trim().toLowerCase() === PLATAFORMA_AREA_KEY;
}

export function inferPlataformaFromTitle(title: string): boolean {
  return /plataforma\s*(de\s*simulacros|web)/i.test(title);
}

export function inferClasesExtraFromTitle(title: string): boolean {
  if (inferPlataformaFromTitle(title)) return false;
  return /clases?\s*extra|taller|refuerzo|workshop|sesi[oó]n\s*extra|charla/i.test(title);
}
