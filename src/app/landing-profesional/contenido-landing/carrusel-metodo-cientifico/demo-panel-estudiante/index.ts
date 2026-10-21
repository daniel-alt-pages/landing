/**
 * Módulo: demo panel estudiante (landing / carrusel 3D).
 *
 * Capas:
 * - `data/` — snapshot JSON + métricas por simulacro
 * - `constants/` — materias, DOM ids, marketing, performance
 * - `types/` — tipos compartidos
 * - `context/` — estado UI (sim activo, tab, pregunta, cursor tour)
 * - `hooks/` — React bindings
 * - `tour/` — lógica pura del autoclic (sin React)
 * - `viewport/` — escala 1280px del embed
 * - `components/` — shell + secciones UI
 */

export { StudentPanelBrowseDemo, SHOWCASE_PANEL_DEMO_MS } from './components/StudentPanelBrowseDemo';
export { ShowcaseStudentDashboard } from './components/ShowcaseStudentDashboard';
export { ShowcaseEmbedProvider, useShowcaseEmbed } from './context/ShowcaseEmbedProvider';
export { SHOWCASE_EMBEDDED } from './data/embedded-student';
export {
  SHOWCASE_TOUR_SECTION_CATALOG,
  SHOWCASE_TOUR_SCROLL_MS,
} from './tour/tour-config';
export {
  getShowcaseTourCycleMs,
  SHOWCASE_TOUR_CYCLE_MS,
  SHOWCASE_TOUR_PANEL_MS,
} from './tour/tour-timeline';
export {
  SHOWCASE_COMPACT_NATIVE_RESPONSIVE,
  SHOWCASE_COMPACT_MOBILE_ZOOM,
  SHOWCASE_COMPACT_TABLET_ZOOM,
  SHOWCASE_COMPACT_TOUR_SCROLL_PACE,
  SHOWCASE_VERTICAL_TOUR_SCROLL_PACE,
  SHOWCASE_MOBILE_COMPACT_LAYOUT_ENABLED,
  SHOWCASE_TOUR_SCROLL_PACE,
} from './constants/showcase-feature-flags';
