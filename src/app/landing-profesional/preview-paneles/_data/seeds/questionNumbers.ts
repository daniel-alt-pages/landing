/**
 * Números globales de pregunta (libreta ICFES) por materia en previews.
 * Deben alinearse con `resolveQuestionSesion` en questionSession.ts.
 */

function range(start: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => start + i);
}

/** Orden estable por materia → lista de `numero` global por ítem. */
export const PREVIEW_QUESTION_NUMBERS: Record<string, readonly number[]> = {
  /** 35 ítems: 1–25 S1, 26–35 S2 */
  'matemáticas': range(1, 35),
  /** 41 ítems: todos S1 */
  'lectura crítica': range(26, 41),
  /** 35 ítems: 1–18 S2 (≤25), 67–83 S1 (>25) */
  'sociales y ciudadanas': [...range(1, 18), ...range(67, 17)],
  /** 35 ítems: 51–67 S2 (<92), 92–109 S1 (≥92) */
  'ciencias naturales': [...range(51, 17), ...range(92, 18)],
  /** 55 ítems: todos S2 */
  'inglés': range(80, 55),
};

export function getPreviewQuestionNumbers(materiaKey: string): readonly number[] {
  return PREVIEW_QUESTION_NUMBERS[materiaKey] ?? range(1, 35);
}
