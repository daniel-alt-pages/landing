/** Normaliza puntaje de área (número plano u objeto con correctas/total). */

export function normalizePuntaje(raw: unknown): {
  puntaje: number;
  correctas: number;
  total_preguntas: number;
} {
  if (typeof raw === 'object' && raw !== null && 'puntaje' in raw) {
    const obj = raw as Record<string, unknown>;
    return {
      puntaje: Number(obj.puntaje) || 0,
      correctas: Number(obj.correctas) || 0,
      total_preguntas: Number(obj.total_preguntas) || 0,
    };
  }
  if (typeof raw === 'number') {
    return { puntaje: raw, correctas: 0, total_preguntas: 0 };
  }
  return { puntaje: 0, correctas: 0, total_preguntas: 0 };
}
