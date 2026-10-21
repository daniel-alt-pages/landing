import { SHOWCASE_TOUR_DEMO, showcaseDomIds } from '../constants/dom-ids';
import type { ShowcaseDashboardTab } from '../types/showcase.types';

export const SHOWCASE_INITIAL_PATH = '/estudiante/dashboard';

export type ShowcaseNavEntry = {
  path: string;
  materia: string | null;
};

export type ParsedShowcaseStudentPath = ShowcaseNavEntry & {
  tab: ShowcaseDashboardTab;
};

/** Misma semántica que rutas reales del panel estudiante (`/estudiante/...`). */
export function parseShowcaseStudentPath(rawPath: string): ParsedShowcaseStudentPath {
  const trimmed = rawPath.trim();
  const [pathname, query = ''] = trimmed.split('?');
  const params = new URLSearchParams(query);
  let materia = params.get('materia');
  if (materia) materia = decodeURIComponent(materia).toLowerCase();

  let tab: ShowcaseDashboardTab = 'dashboard';
  if (pathname.includes('/estadisticas')) tab = 'metricas';
  else if (pathname.includes('/analisis')) tab = 'respuestas';
  else if (pathname.includes('/ranking')) tab = 'ranking';
  else if (pathname.includes('/perfil')) tab = 'perfil';

  return {
    path: pathname || SHOWCASE_INITIAL_PATH,
    materia,
    tab,
  };
}

/** Un paso del tour: orientación → hover → clic DOM → efecto real. */
export type ShowcaseTourClickStep = {
  step: number;
  domId: string;
  action: string;
  routeOrEffect: string;
  tab: ShowcaseDashboardTab | 'dashboard+sim';
};

const mk = showcaseDomIds.materiaTab(SHOWCASE_TOUR_DEMO.materiaKey);

/**
 * Secuencia canónica del autonavegador (panel estudiante embebido).
 */
export const SHOWCASE_TOUR_CLICK_STEPS: readonly ShowcaseTourClickStep[] = [
  { step: 1, domId: showcaseDomIds.sectionClaves, action: 'Scroll a Ver Claves', routeOrEffect: 'Inicio', tab: 'dashboard' },
  { step: 2, domId: showcaseDomIds.dashboardVerRanking, action: 'Ver Ranking →', routeOrEffect: '/estudiante/ranking', tab: 'ranking' },
  { step: 3, domId: showcaseDomIds.sectionRankingTop, action: 'Scroll mitad ranking', routeOrEffect: 'Ranking', tab: 'ranking' },
  { step: 4, domId: showcaseDomIds.rankingBackDashboard, action: 'Volver al Dashboard', routeOrEffect: '/estudiante/dashboard', tab: 'dashboard' },
  { step: 5, domId: showcaseDomIds.navRespuestas, action: 'Pestaña Respuestas', routeOrEffect: '/estudiante/analisis', tab: 'respuestas' },
  { step: 6, domId: showcaseDomIds.sectionHeatmap, action: 'Scroll análisis completo', routeOrEffect: 'Análisis', tab: 'respuestas' },
  { step: 7, domId: mk, action: 'Tab Matemáticas', routeOrEffect: 'materia=matemáticas', tab: 'respuestas' },
  { step: 8, domId: showcaseDomIds.materiaTab('sociales y ciudadanas'), action: 'Tab Sociales', routeOrEffect: 'materia=sociales', tab: 'respuestas' },
  { step: 9, domId: showcaseDomIds.materiaTab('ciencias naturales'), action: 'Tab Ciencias', routeOrEffect: 'materia=ciencias', tab: 'respuestas' },
  { step: 10, domId: showcaseDomIds.materiaTab('inglés'), action: 'Tab Inglés', routeOrEffect: 'materia=inglés', tab: 'respuestas' },
  { step: 11, domId: showcaseDomIds.questionBox('80'), action: 'Pregunta inglés', routeOrEffect: 'Modal pregunta #80', tab: 'respuestas' },
  { step: 12, domId: showcaseDomIds.navBack, action: 'Atrás análisis', routeOrEffect: 'goBack → dashboard', tab: 'dashboard' },
  { step: 13, domId: showcaseDomIds.navMetricas, action: 'Pestaña Métricas', routeOrEffect: '/estudiante/estadisticas', tab: 'metricas' },
  { step: 14, domId: showcaseDomIds.sectionMetricasArea, action: 'Scroll métricas', routeOrEffect: 'Métricas', tab: 'metricas' },
  { step: 15, domId: showcaseDomIds.navBack, action: 'Volver', routeOrEffect: 'goBack → dashboard', tab: 'dashboard' },
  { step: 16, domId: showcaseDomIds.navDashboard, action: 'Cierre ciclo', routeOrEffect: '/estudiante/dashboard', tab: 'dashboard' },
] as const;

/** @deprecated Usar SHOWCASE_TOUR_CLICK_STEPS */
export const SHOWCASE_NAV_CLICK_MAP = SHOWCASE_TOUR_CLICK_STEPS.map((s) => ({
  domId: s.domId,
  action: s.action,
  route: s.routeOrEffect,
}));
