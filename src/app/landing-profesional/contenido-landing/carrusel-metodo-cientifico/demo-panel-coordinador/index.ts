/**
 * Demo autoclic del panel coordinador.
 *
 * Cicla por las 7 sub-rutas (`/preview-paneles/coordinador/*`) sin login y
 * sin tocar Firestore. Misma capa visual que el panel real.
 */

export { CoordPanelBrowseDemo } from './components/CoordPanelBrowseDemo';
export { ShowcaseCoordinadorShell } from './shell/ShowcaseCoordinadorShell';
export { CoordEmbedProvider, useCoordEmbed } from './context/CoordEmbedProvider';
export {
  COORD_TOUR_CATALOG,
  COORD_TOUR_NARRATIVE_ORDER,
  type CoordTab,
  type CoordTourPhaseMeta,
  type CoordTourPhaseKind,
} from './tour/tour-config';
export {
  SHOWCASE_COORD_PANEL_DEMO_MS,
  COORD_TIMELINE,
  resolveCoordPhase,
} from './tour/tour-timeline';
