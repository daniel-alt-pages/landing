/** Marco lógico del dashboard (diseño 1280px de ancho). */

export const SHOWCASE_FRAME_WIDTH = 1280;

export const SHOWCASE_FRAME_RATIO = 16 / 9;

export const SHOWCASE_FRAME_HEIGHT = Math.round(SHOWCASE_FRAME_WIDTH / SHOWCASE_FRAME_RATIO);



/** Alto lógico del dashboard con scroll (tour pan en Y). */

export const SHOWCASE_DASHBOARD_LOGICAL_HEIGHT = 2480;



/**

 * Monitor embebido 16:9: el stage es el contenedor físico; el app corre en este viewport lógico.

 * Escala split = min(anchoStage/1280, altoStage/esto) → como pantalla 16:9 normal, sin “zoom” fill-width.

 */

export const SHOWCASE_VIEWPORT_LOGICAL_WIDTH = SHOWCASE_FRAME_WIDTH;

/** Marco 16:9 de referencia (1280×720). */
export const SHOWCASE_VIEWPORT_LOGICAL_HEIGHT = SHOWCASE_FRAME_HEIGHT;

/**
 * Banda vertical visible en desktop (~nav + KPI + bloque principal).
 * Escala = min(ancho/1280, altoStage/resolveEmbedScaleVisibleHeight(ancho)).
 */
export const SHOWCASE_EMBED_SCALE_VISIBLE_HEIGHT = 960;

/** Umbrales (px) para escala adaptativa — alineados a breakpoints landing. */
export const SHOWCASE_EMBED_MOBILE_MAX_WIDTH = 639;
export const SHOWCASE_EMBED_TABLET_MAX_WIDTH = 1023;

/**
 * Alto lógico usado en min(ancho/1280, alto/esto). Misma curva en móvil, tablet y PC.
 *
 * Matriz split (viewport-16x9, stage ≈ ancho × 9/16):
 * | stageW | visibleH | scale (aprox) | clipW |
 * | 320    | 560      | min(0.25, h/560) | 320 |
 * | 390    | 680      | ~0.30–0.35    | ~390 |
 * | 768    | 800      | ~0.48–0.55    | ~768 |
 * | 906    | 960      | ~0.53         | ~678 |
 * | 1280   | 960      | ~0.56–0.75    | ~720+ |
 */
/** Móvil: banda alta (menos zoom). Tablet/PC: marco 16:9 (720) = escala estable por ancho. */
export function resolveEmbedScaleVisibleHeight(stageWidth: number): number {
  const w = Math.max(stageWidth, 0);
  if (w <= 400) return 980;
  if (w <= SHOWCASE_EMBED_MOBILE_MAX_WIDTH) return 1080;
  return SHOWCASE_VIEWPORT_LOGICAL_HEIGHT;
}

/** Evita micro-cambios que disparan ResizeObserver en bucle. */
export function quantizeShowcaseScale(scale: number): number {
  if (scale <= 0.02) return 0;
  return Math.round(scale * 1000) / 1000;
}

/**
 * Escala split solo desde el probe (demo-wrap). No depende del viewport ya escalado.
 */
export function computeShowcaseSplitScale(probeW: number, probeH: number): number {
  const w = Math.max(probeW, 48);
  const h = Math.max(probeH, 48);
  const scaleByWidth = w / SHOWCASE_VIEWPORT_LOGICAL_WIDTH;
  const visibleBand =
    w <= SHOWCASE_EMBED_MOBILE_MAX_WIDTH
      ? Math.max(SHOWCASE_VIEWPORT_LOGICAL_HEIGHT, resolveEmbedScaleVisibleHeight(w))
      : SHOWCASE_VIEWPORT_LOGICAL_HEIGHT;
  return quantizeShowcaseScale(Math.min(scaleByWidth, h / visibleBand));
}



/** @deprecated Usar SHOWCASE_VIEWPORT_LOGICAL_HEIGHT */

export const SHOWCASE_SPLIT_VIEWPORT_LOGICAL_HEIGHT = SHOWCASE_VIEWPORT_LOGICAL_HEIGHT;



/** @deprecated Ya no se aplica inset en viewport-16x9 */

export const SHOWCASE_SPLIT_SCALE_INSET = 1;



export function computeShowcaseScale(stageWidth: number) {

  const w = Math.max(stageWidth, 120);

  return w / SHOWCASE_FRAME_WIDTH;

}



export { computeShowcaseScaleForStage as computeShowcaseScaleSplit } from './measure-embed-layout';

