/**
 * Constantes de previews — datos reales en `public/data/simulations/`.
 */

export const PREVIEW_ACTIVE_SIM = 'SG11-10';

/** Simulacros demo IETAC con participación útil (ver `coordinator_summary.json`). */
export const PREVIEW_AVAILABLE_SIMS = [
  'SG11-10',
  'SG11-16',
  'SG11-08',
  'SG11-09',
  'SG11-18',
] as const;

export const PREVIEW_INSTITUTION_NAME = 'IETAC';

export const PREVIEW_INSTITUTION_DEPARTAMENTO = 'Atlántico';

export const PREVIEW_INSTITUTION_MUNICIPIO = 'Malambo';

/** Estudiante IETAC presente en SG11-10 / SG11-08 (datos locales). */
export const PREVIEW_STUDENT_ID = '1033373778';

export const PREVIEW_STUDENT_NOMBRES = 'SEBASTIÁN DE JESÚS';

export const PREVIEW_STUDENT_APELLIDOS = 'CRUZ TEJEDA';

/** Cohorte demo acotada (~tamaño IETAC por simulacro). */
export const PREVIEW_GROUP_SIZE = 44;

export const PREVIEW_MATERIAS = [
  { key: 'lectura crítica', label: 'Lectura Crítica', short: 'Lect.', preguntas: 41 },
  { key: 'matemáticas', label: 'Matemáticas', short: 'Mat.', preguntas: 35 },
  { key: 'sociales y ciudadanas', label: 'Sociales y Ciudadanas', short: 'Soc.', preguntas: 35 },
  { key: 'ciencias naturales', label: 'Ciencias Naturales', short: 'Cnat.', preguntas: 35 },
  { key: 'inglés', label: 'Inglés', short: 'Ing.', preguntas: 55 },
] as const;

export const PREVIEW_SESIONES = ['S1', 'S2'] as const;
