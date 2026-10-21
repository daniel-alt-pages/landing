import { SHOWCASE_COMPACT_MOBILE_ZOOM } from '../constants/showcase-feature-flags';
import { quantizeShowcaseScale } from './showcaseViewport';

/** Por debajo de esto: sin zoom (evita recortes en pantallas muy estrechas). */
const ZOOM_SLOT_MIN_PX = 320;

/** A partir de aquí: zoom máximo (`SHOWCASE_COMPACT_MOBILE_ZOOM`). Solo aplica ≤639px. */
const ZOOM_SLOT_FULL_PX = 400;

/**
 * Zoom responsivo para vertical/móvil.
 * Escala el layout a `width: calc(100% / zoom)` + `transform: scale(zoom)` → ancho visual = 100% del slot.
 */
export function resolveShowcaseMobileZoom(
  slotWidth: number,
  maxZoom = SHOWCASE_COMPACT_MOBILE_ZOOM,
): number {
  if (maxZoom <= 1) return 1;

  const w = slotWidth > 0 ? slotWidth : 360;
  if (w >= ZOOM_SLOT_FULL_PX) return quantizeShowcaseScale(maxZoom);
  if (w <= ZOOM_SLOT_MIN_PX) return 1;

  const t = (w - ZOOM_SLOT_MIN_PX) / (ZOOM_SLOT_FULL_PX - ZOOM_SLOT_MIN_PX);
  return quantizeShowcaseScale(1 + (maxZoom - 1) * t);
}
