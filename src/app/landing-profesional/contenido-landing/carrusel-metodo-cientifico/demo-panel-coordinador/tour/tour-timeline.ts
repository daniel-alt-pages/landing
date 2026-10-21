/**
 * Línea de tiempo del tour autoclic del coordinador.
 *
 * Cada fase dura 9.5s. Ciclo total ~70s con un breve `reset` al inicio.
 * El consumidor (`useCoordTabAutoCycle`) lee `elapsed % CYCLE_MS` y resuelve la fase.
 */

import { COORD_TOUR_CATALOG, COORD_TOUR_NARRATIVE_ORDER, type CoordTourPhaseMeta } from './tour-config';

export const COORD_PHASE_HOLD_MS = 9_500;
export const COORD_RESET_MS = 700;
export const COORD_TAIL_MS = 1_200;

export const COORD_TIMELINE: { startMs: number; endMs: number; phase: CoordTourPhaseMeta }[] = (() => {
  const out: { startMs: number; endMs: number; phase: CoordTourPhaseMeta }[] = [];
  let cursor = 0;

  // reset breve para asentar la primera fase
  out.push({ startMs: cursor, endMs: cursor + COORD_RESET_MS, phase: COORD_TOUR_CATALOG.reset });
  cursor += COORD_RESET_MS;

  for (const id of COORD_TOUR_NARRATIVE_ORDER) {
    const phase = COORD_TOUR_CATALOG[id];
    out.push({ startMs: cursor, endMs: cursor + COORD_PHASE_HOLD_MS, phase });
    cursor += COORD_PHASE_HOLD_MS;
  }

  out.push({ startMs: cursor, endMs: cursor + COORD_TAIL_MS, phase: COORD_TOUR_CATALOG.tail });
  cursor += COORD_TAIL_MS;

  return out;
})();

export const SHOWCASE_COORD_PANEL_DEMO_MS = COORD_TIMELINE[COORD_TIMELINE.length - 1].endMs;

export function resolveCoordPhase(elapsedMs: number): CoordTourPhaseMeta {
  const t = ((elapsedMs % SHOWCASE_COORD_PANEL_DEMO_MS) + SHOWCASE_COORD_PANEL_DEMO_MS) % SHOWCASE_COORD_PANEL_DEMO_MS;
  for (const slot of COORD_TIMELINE) {
    if (t >= slot.startMs && t < slot.endMs) return slot.phase;
  }
  return COORD_TIMELINE[0].phase;
}
