/**
 * Snapshot embebido (mismo shape que el dashboard real del estudiante).
 * Fuente: public/data/simulations/SG11-19/estudiantes/1043146435.json
 */
import studentSnapshot from '../../../../../../../public/data/simulations/SG11-19/estudiantes/1043146435.json';

import { SHOWCASE_DEFAULT_SIM } from '../constants/dom-ids';

const puntajes = studentSnapshot.puntajes as Record<
  string,
  { puntaje: number; correctas: number; total_preguntas: number }
>;

export const SHOWCASE_EMBEDDED = {
  simulacroActual: SHOWCASE_DEFAULT_SIM,
  simulacros: ['SG11-08', 'SG11-09', 'SG11-10', 'SG11-19'],
  estudiante: {
    ...studentSnapshot,
    informacion_personal: studentSnapshot.informacion_personal,
    puntajes,
    puntaje_global: studentSnapshot.puntaje_global as number,
    secciones_completadas: studentSnapshot.secciones_completadas ?? ['S1', 'S2'],
    respuestas_detalladas: studentSnapshot.respuestas_detalladas,
  },
  promedios: {
    global: 318,
    materias: {} as Record<string, { porcentaje: number }>,
  },
  groupStats: {
    total: 191,
    promedio: 318,
    mediana: 310,
    min: 198,
    max: 492,
    p10: 245,
    p25: 278,
    p75: 352,
    p90: 385,
    desviacion: 48,
    promediosPorMateria: {
      'lectura crítica': 72,
      matemáticas: 68,
      'sociales y ciudadanas': 70,
      'ciencias naturales': 65,
      inglés: 71,
    } as Record<string, number>,
  },
  rankingInfo: {
    puesto: 16,
    total: 191,
    avgGlobal: 318,
    top5: [
      {
        informacion_personal: {
          nombres: 'María',
          apellidos: 'Gutiérrez',
          numero_identificacion: '1114241878',
          institucion: 'PREICFES SEAMOSGENIOS',
        },
        puntaje_global: 492,
      },
      {
        informacion_personal: {
          nombres: 'José',
          apellidos: 'López',
          numero_identificacion: '1043160238',
          institucion: 'PREICFES SEAMOSGENIOS',
        },
        puntaje_global: 485,
      },
    ],
  },
  subjectTops: [
    {
      materia: 'lectura crítica',
      label: 'L. Crítica',
      color: '#10b981',
      icon: 'book',
      top1Nombre: 'Ana G.',
      top1Puntaje: 100,
      miPuesto: 8,
      miPuntaje: puntajes['lectura crítica']?.puntaje ?? 100,
      total: 191,
    },
    {
      materia: 'matemáticas',
      label: 'Matemáticas',
      color: '#3b82f6',
      icon: 'calculator',
      top1Nombre: 'Carlos L.',
      top1Puntaje: 100,
      miPuesto: 5,
      miPuntaje: puntajes.matemáticas?.puntaje ?? 100,
      total: 191,
    },
    {
      materia: 'sociales y ciudadanas',
      label: 'Sociales',
      color: '#f59e0b',
      icon: 'globe',
      top1Nombre: 'Laura H.',
      top1Puntaje: 100,
      miPuesto: 6,
      miPuntaje: puntajes['sociales y ciudadanas']?.puntaje ?? 100,
      total: 191,
    },
    {
      materia: 'ciencias naturales',
      label: 'Ciencias',
      color: '#8b5cf6',
      icon: 'beaker',
      top1Nombre: 'Pedro M.',
      top1Puntaje: 95,
      miPuesto: 22,
      miPuntaje: puntajes['ciencias naturales']?.puntaje ?? 80,
      total: 191,
    },
    {
      materia: 'inglés',
      label: 'Inglés',
      color: '#ec4899',
      icon: 'chat',
      top1Nombre: 'Sofía R.',
      top1Puntaje: 92,
      miPuesto: 19,
      miPuntaje: puntajes.inglés?.puntaje ?? 77,
      total: 191,
    },
  ],
} as const;

export type ShowcaseEmbeddedDashboard = typeof SHOWCASE_EMBEDDED;
