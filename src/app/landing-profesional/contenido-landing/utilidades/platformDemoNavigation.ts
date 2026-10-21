import type { CoordTab } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-coordinador/tour/tour-config';

export type PlatformStudentDemoTarget =
  | { action: 'openDashboard' }
  | { action: 'openMetricas' }
  | { action: 'openRanking' }
  | { action: 'openPerfil' }
  | { action: 'openRespuestas'; materia?: string | null };

/** Alinea cada historia de `platformVideoStories` con una vista del panel estudiante. */
export const PLATFORM_STUDENT_STORY_TARGETS: readonly PlatformStudentDemoTarget[] = [
  { action: 'openDashboard' },
  { action: 'openDashboard' },
  { action: 'openDashboard' },
  { action: 'openRanking' },
  { action: 'openPerfil' },
  { action: 'openMetricas' },
  { action: 'openMetricas' },
  { action: 'openRespuestas' },
  { action: 'openRespuestas' },
] as const;

export type PlatformCoordHighlight = {
  eyebrow: string;
  title: string;
  text: string;
  tab: CoordTab;
};

export const PLATFORM_COORD_HIGHLIGHTS: readonly PlatformCoordHighlight[] = [
  {
    eyebrow: 'Coordinación · 01',
    title: 'Panel por curso',
    text: 'Resúmenes, comparativas e histórico por cohorte matriculada.',
    tab: 'resumen',
  },
  {
    eyebrow: 'Coordinación · 02',
    title: 'Lectura institucional',
    text: 'Seguimiento por estudiante, alertas y fortalezas del grado.',
    tab: 'estudiantes',
  },
  {
    eyebrow: 'Coordinación · 03',
    title: 'Decisión con evidencia',
    text: 'Análisis y comparativas para priorizar refuerzos con datos.',
    tab: 'analisis',
  },
] as const;
