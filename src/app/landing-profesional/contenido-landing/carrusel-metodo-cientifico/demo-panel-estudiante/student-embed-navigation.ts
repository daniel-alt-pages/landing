import type { ShowcaseDashboardTab } from './types/showcase.types';

/** IDs de `StudentMobileNav` → pestaña del embed demo. */
export const STUDENT_NAV_ID_TO_TAB: Record<string, ShowcaseDashboardTab> = {
  dashboard: 'dashboard',
  estadisticas: 'metricas',
  analisis: 'respuestas',
  ranking: 'ranking',
  perfil: 'perfil',
};

export const STUDENT_TAB_TO_NAV_ID: Record<ShowcaseDashboardTab, string> = {
  dashboard: 'dashboard',
  metricas: 'estadisticas',
  respuestas: 'analisis',
  ranking: 'ranking',
  perfil: 'perfil',
};

export function studentTabFromNavId(navId: string): ShowcaseDashboardTab {
  return STUDENT_NAV_ID_TO_TAB[navId] ?? 'dashboard';
}

export function studentNavIdFromTab(tab: ShowcaseDashboardTab): string {
  return STUDENT_TAB_TO_NAV_ID[tab] ?? 'dashboard';
}
