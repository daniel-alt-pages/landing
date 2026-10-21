import type { CoordTab } from './tour/tour-config';

/** IDs del shell coordinador (sidebar) → pestaña del embed demo. */
export const COORD_NAV_ID_TO_TAB: Record<string, CoordTab> = {
  dashboard: 'resumen',
  pensum: 'pensum',
  desempeno: 'desempeno',
  estudiantes: 'estudiantes',
  respuestas: 'respuestas',
  analisis: 'analisis',
  comparativa: 'comparativa',
  historico: 'historico',
};

export const COORD_TAB_TO_NAV_ID: Record<CoordTab, string> = {
  resumen: 'dashboard',
  pensum: 'pensum',
  desempeno: 'desempeno',
  estudiantes: 'estudiantes',
  respuestas: 'respuestas',
  analisis: 'analisis',
  comparativa: 'comparativa',
  historico: 'historico',
};

export function coordTabFromNavId(navId: string): CoordTab {
  return COORD_NAV_ID_TO_TAB[navId] ?? 'resumen';
}

export function coordNavIdFromTab(tab: CoordTab): string {
  return COORD_TAB_TO_NAV_ID[tab] ?? 'dashboard';
}
