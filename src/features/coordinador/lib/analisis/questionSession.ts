/** Reglas ICFES Saber 11: asignación pregunta → sesión (S1/S2) por materia. */

export type SesionLabel = 'S1' | 'S2';

export function resolveQuestionSesion(materia: string, numero: number): SesionLabel {
  const m = materia.toLowerCase();
  if (m.includes('matemáticas') || m.includes('matematicas')) return numero <= 25 ? 'S1' : 'S2';
  if (m.includes('lectura')) return 'S1';
  if (m.includes('sociales') || m.includes('ciudadanas')) return numero <= 25 ? 'S2' : 'S1';
  if (m.includes('naturales') || m.includes('ciencias')) return numero >= 92 ? 'S1' : 'S2';
  if (m.includes('inglés') || m.includes('ingles')) return 'S2';
  return 'S1';
}

export function parseSesionNum(sesion: unknown): 1 | 2 | null {
  if (typeof sesion !== 'string') return null;
  const match = sesion.match(/S([12])/i);
  if (!match) return null;
  return Number(match[1]) === 2 ? 2 : 1;
}

export function sesionNumToLabel(num: 1 | 2): SesionLabel {
  return num === 2 ? 'S2' : 'S1';
}
