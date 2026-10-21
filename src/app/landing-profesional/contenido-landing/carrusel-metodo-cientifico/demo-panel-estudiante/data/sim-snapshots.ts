/** Métricas por simulacro — fuente única para métricas y tour autoclic. */

export type ShowcasePuntajeMateria = {
  puntaje: number;
  correctas: number;
  total_preguntas: number;
};

export type ShowcaseSimSnapshot = {
  score: number;
  aciertos: number;
  preguntas: number;
  puesto: number;
  total: number;
  percentil: number;
  diffPromedio: number;
  puntajes: Record<string, ShowcasePuntajeMateria>;
  subjectRankings: Record<string, number>;
};

export const SHOWCASE_SNAPSHOT_SG11_19: ShowcaseSimSnapshot = {
  score: 185,
  aciertos: 143,
  preguntas: 254,
  puesto: 16,
  total: 191,
  percentil: 92,
  diffPromedio: -42,
  puntajes: {
    'lectura crítica': { puntaje: 40, correctas: 31, total_preguntas: 41 },
    matemáticas: { puntaje: 40, correctas: 29, total_preguntas: 50 },
    'sociales y ciudadanas': { puntaje: 40, correctas: 30, total_preguntas: 50 },
    'ciencias naturales': { puntaje: 27, correctas: 20, total_preguntas: 58 },
    inglés: { puntaje: 40, correctas: 33, total_preguntas: 55 },
  },
  subjectRankings: {
    'lectura crítica': 8,
    matemáticas: 5,
    'sociales y ciudadanas': 6,
    'ciencias naturales': 22,
    inglés: 19,
  },
};

export const SHOWCASE_SIM_SNAPSHOTS: Record<string, ShowcaseSimSnapshot> = {
  'SG11-08': {
    score: 245,
    aciertos: 120,
    preguntas: 254,
    puesto: 36,
    total: 191,
    percentil: 81,
    diffPromedio: -23,
    puntajes: {
      'lectura crítica': { puntaje: 52, correctas: 18, total_preguntas: 41 },
      matemáticas: { puntaje: 48, correctas: 28, total_preguntas: 50 },
      'sociales y ciudadanas': { puntaje: 50, correctas: 25, total_preguntas: 50 },
      'ciencias naturales': { puntaje: 45, correctas: 27, total_preguntas: 58 },
      inglés: { puntaje: 50, correctas: 22, total_preguntas: 55 },
    },
    subjectRankings: {
      'lectura crítica': 26,
      matemáticas: 34,
      'sociales y ciudadanas': 32,
      'ciencias naturales': 38,
      inglés: 30,
    },
  },
  'SG11-09': {
    score: 295,
    aciertos: 146,
    preguntas: 254,
    puesto: 21,
    total: 191,
    percentil: 89,
    diffPromedio: -7,
    puntajes: {
      'lectura crítica': { puntaje: 62, correctas: 22, total_preguntas: 41 },
      matemáticas: { puntaje: 58, correctas: 34, total_preguntas: 50 },
      'sociales y ciudadanas': { puntaje: 60, correctas: 30, total_preguntas: 50 },
      'ciencias naturales': { puntaje: 55, correctas: 33, total_preguntas: 58 },
      inglés: { puntaje: 60, correctas: 27, total_preguntas: 55 },
    },
    subjectRankings: {
      'lectura crítica': 12,
      matemáticas: 19,
      'sociales y ciudadanas': 17,
      'ciencias naturales': 22,
      inglés: 16,
    },
  },
  'SG11-10': {
    score: 268,
    aciertos: 138,
    preguntas: 254,
    puesto: 28,
    total: 191,
    percentil: 85,
    diffPromedio: -16,
    puntajes: {
      'lectura crítica': { puntaje: 55, correctas: 24, total_preguntas: 41 },
      matemáticas: { puntaje: 52, correctas: 31, total_preguntas: 50 },
      'sociales y ciudadanas': { puntaje: 54, correctas: 28, total_preguntas: 50 },
      'ciencias naturales': { puntaje: 48, correctas: 30, total_preguntas: 58 },
      inglés: { puntaje: 56, correctas: 25, total_preguntas: 55 },
    },
    subjectRankings: {
      'lectura crítica': 18,
      matemáticas: 24,
      'sociales y ciudadanas': 20,
      'ciencias naturales': 28,
      inglés: 22,
    },
  },
  'SG11-19': SHOWCASE_SNAPSHOT_SG11_19,
};

export function getShowcaseSimSnapshot(simId: string): ShowcaseSimSnapshot {
  return SHOWCASE_SIM_SNAPSHOTS[simId] ?? SHOWCASE_SNAPSHOT_SG11_19;
}
