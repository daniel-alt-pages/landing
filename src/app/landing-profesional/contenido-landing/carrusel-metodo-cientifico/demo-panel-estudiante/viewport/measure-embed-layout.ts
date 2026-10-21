import { SHOWCASE_DASHBOARD_CLASS } from '../constants/dom-ids';
import {
  SHOWCASE_DASHBOARD_LOGICAL_HEIGHT,
  SHOWCASE_FRAME_HEIGHT,
  SHOWCASE_FRAME_WIDTH,
  SHOWCASE_EMBED_MOBILE_MAX_WIDTH,
  SHOWCASE_EMBED_TABLET_MAX_WIDTH,
  SHOWCASE_VIEWPORT_LOGICAL_HEIGHT,
  SHOWCASE_VIEWPORT_LOGICAL_WIDTH,
  computeShowcaseSplitScale,
  quantizeShowcaseScale,
  resolveEmbedScaleVisibleHeight,
} from './showcaseViewport';

const PAN_BOTTOM_RESERVE_PX = 36;
const PAN_TOP_RESERVE_PX = 20;
/** Reserva extra al medir pan del tour (evita scroll “de más”). */
const TOUR_PAN_BOTTOM_RESERVE_PX = 56;
/** Límite de profundidad del scroll completo (evita pan por debajo del contenido real). */
/** Fracción del scrollTop máximo del tour (1 = fondo del panel). */
export const SHOWCASE_TOUR_SCROLL_END_FRACTION = 0.98;
const MIN_STAGE_PX = 48;

export type ShowcaseEmbedLayout = {
  /** Escala uniforme aplicada al marco 1280px (transform). */
  scale: number;
  scaleX: number;
  scaleY: number;
  stageWidth: number;
  stageHeight: number;
  clipHeight: number;
  clipWidth: number;
  logicalContentHeight: number;
  maxPan: number;
  /** Incrementa en cada remeasure — tour re-sincroniza pan/cursor. */
  version: number;
};

export type ShowcasePanAlign = 'center' | 'top';

function readVisualScale(scaler: HTMLElement) {
  const rect = scaler.getBoundingClientRect();
  const scaleX = scaler.offsetWidth > 0 ? rect.width / scaler.offsetWidth : 1;
  const scaleY = scaler.offsetHeight > 0 ? rect.height / scaler.offsetHeight : scaleX;
  return { scaleX, scaleY, rect };
}

export function measureDashboardLogicalHeight(dashboard: HTMLElement | null): number {
  if (!dashboard) return SHOWCASE_DASHBOARD_LOGICAL_HEIGHT;
  const main = dashboard.querySelector('main');
  const fromDom =
    main instanceof HTMLElement
      ? Math.max(dashboard.offsetHeight, main.offsetTop + main.offsetHeight + 8)
      : dashboard.scrollHeight || dashboard.offsetHeight;
  return Math.max(fromDom, SHOWCASE_DASHBOARD_LOGICAL_HEIGHT, SHOWCASE_FRAME_HEIGHT);
}

/** Alto lógico real del panel activo (sin piso 2480 — evita scroll vacío en Perfil, etc.). */
export function measureShowcaseContentLogicalHeight(contentRoot: HTMLElement): number {
  const dashboard = contentRoot.querySelector<HTMLElement>(`.${SHOWCASE_DASHBOARD_CLASS}`);
  if (!dashboard) return SHOWCASE_FRAME_HEIGHT;
  const main = dashboard.querySelector('main');
  const fromDom =
    main instanceof HTMLElement
      ? Math.max(dashboard.scrollHeight, main.offsetTop + main.scrollHeight + 12)
      : Math.max(dashboard.scrollHeight, dashboard.offsetHeight);
  return Math.max(fromDom, SHOWCASE_FRAME_HEIGHT);
}

/** Escala fit al slot 16:9 (ancho y alto, marco 1280×720). */
export function computeShowcaseFluidFitScale(
  stageWidth: number,
  stageHeight = 0,
): number {
  const w = Math.max(stageWidth, MIN_STAGE_PX);
  const scaleW = w / SHOWCASE_FRAME_WIDTH;
  if (stageHeight < MIN_STAGE_PX) return Math.min(1, scaleW);
  const h = Math.max(stageHeight, MIN_STAGE_PX);
  const scaleH = h / SHOWCASE_VIEWPORT_LOGICAL_HEIGHT;
  return Math.min(1, scaleW, scaleH);
}

/**
 * Altura del sizer para scroll nativo cuando el panel usa `transform: scale(...)`.
 * `transform` no expande `scrollHeight` del stage.
 */
export function syncShowcaseNativeScrollSizer(
  stage: HTMLElement,
  sizer: HTMLElement,
  contentRoot: HTMLElement,
  options?: { nativeWidth?: boolean; contentZoom?: number },
): number {
  const logicalH = measureShowcaseContentLogicalHeight(contentRoot);
  if (options?.nativeWidth) {
    const zoom = Math.max(1, options.contentZoom ?? 1);
    const visualH = Math.max(Math.ceil(logicalH * zoom), stage.clientHeight);
    sizer.style.height = `${visualH}px`;
    return zoom;
  }
  const scale = computeShowcaseFluidFitScale(stage.clientWidth, stage.clientHeight);
  const visualH = Math.max(Math.ceil(logicalH * scale), stage.clientHeight);
  sizer.style.height = `${visualH}px`;
  return scale;
}

export type ShowcaseScaleMode =
  | 'viewport-16x9'
  | 'fill-width'
  | 'fill-stage'
  | 'fit'
  | 'contain-stage';

function measureStageBox(stage: HTMLElement) {
  const rect = stage.getBoundingClientRect();
  const width = Math.max(rect.width, stage.clientWidth, stage.offsetWidth, 0);
  const height = Math.max(rect.height, stage.clientHeight, stage.offsetHeight, 0);
  return { width, height };
}

/**
 * `viewport-16x9`: encaja viewport lógico 1280×720 en el stage (contenedor 16:9).
 * `fill-width`: solo ancho (más zoom en stage bajo).
 * `fit`: carrusel legacy.
 */
export function computeShowcaseScaleForStage(
  stageWidth: number,
  stageHeight: number,
  mode: ShowcaseScaleMode = 'viewport-16x9',
  logicalContentHeight = SHOWCASE_DASHBOARD_LOGICAL_HEIGHT,
): number {
  const w = Math.max(stageWidth, MIN_STAGE_PX);
  const h = Math.max(stageHeight, MIN_STAGE_PX);
  const scaleByWidth = w / SHOWCASE_VIEWPORT_LOGICAL_WIDTH;

  if (mode === 'viewport-16x9') {
    /**
     * Banda visible alta → escala menor → más contenido + pan del tour.
     * Móvil/tablet: `resolveEmbedScaleVisibleHeight` (no % de logicalContentHeight — regresión de zoom).
     */
    const visibleBand = Math.max(
      SHOWCASE_VIEWPORT_LOGICAL_HEIGHT,
      resolveEmbedScaleVisibleHeight(w),
    );
    const scaleByHeight = h / visibleBand;
    return quantizeShowcaseScale(Math.min(scaleByWidth, scaleByHeight));
  }

  if (mode === 'fill-width' || mode === 'fill-stage') return scaleByWidth;

  if (mode === 'contain-stage') {
    const scaleByVisibleBand = h / SHOWCASE_VIEWPORT_LOGICAL_HEIGHT;
    return Math.min(scaleByWidth, scaleByVisibleBand);
  }

  const scaleByHeight = (h / SHOWCASE_FRAME_HEIGHT) * 1.05;
  const floor = Math.max(0.18, scaleByWidth * 0.7);
  return Math.max(floor, Math.min(scaleByWidth, scaleByHeight));
}

export function computeShowcaseMaxPanFromLayout(
  stageHeight: number,
  logicalH: number,
  scale: number,
): number {
  if (stageHeight <= 0 || scale <= 0.02) return 0;
  const visualH = logicalH * scale;
  const excess = visualH - stageHeight - PAN_BOTTOM_RESERVE_PX;
  if (excess <= 8) return 0;
  return -Math.ceil(excess);
}

/**
 * Pan máximo desde geometría real del slot (stage 16:9 vs alto visual del pan).
 * Más fiable que logicalH × scale cuando el panel tiene mucho contenido.
 */
/** Alto visual del contenido escalado (no el wrapper pan con min-height). */
function measureShowcaseContentVisualHeight(contentRoot: HTMLElement): number {
  const dashboard = contentRoot.querySelector<HTMLElement>(`.${SHOWCASE_DASHBOARD_CLASS}`);
  const measured = dashboard ?? contentRoot;
  const rectH = measured.getBoundingClientRect().height;
  if (rectH > 48) return rectH;
  return Math.max(contentRoot.getBoundingClientRect().height, measured.offsetHeight, 0);
}

export function measureShowcaseMaxPanFromDom(
  stage: HTMLElement,
  pan: HTMLElement | null,
  reserveBottom = 28,
  /** Scaler o dashboard; si falta, cae al pan (legacy carrusel). */
  contentRoot?: HTMLElement | null,
): number {
  const stageH = stage.clientHeight;
  if (stageH <= 0) return 0;

  const root = contentRoot ?? pan;
  if (!root) return 0;

  const contentH = measureShowcaseContentVisualHeight(root);
  const excess = contentH - stageH - reserveBottom;
  if (excess <= 6) return 0;
  return -Math.ceil(excess);
}

export type ShowcaseTourPanExtent = {
  maxPan: number;
  /** Pan final del scroll completo (ancla inferior visible). */
  scrollEndPan: number;
};

/** Máximo scrollTop del stage (modo página normal). */
export function measureShowcaseMaxScroll(
  stage: HTMLElement,
  reserveBottom = TOUR_PAN_BOTTOM_RESERVE_PX,
): number {
  const max = stage.scrollHeight - stage.clientHeight - reserveBottom;
  if (max <= 6) return 0;
  return Math.ceil(max);
}

/** scrollTop para alinear un target dentro del viewport del stage. */
export function measureShowcaseScrollToTarget(
  stage: HTMLElement,
  root: HTMLElement,
  targetId: string,
  alignY = 0.72,
  align: ShowcasePanAlign = 'top',
): number {
  const maxScroll = measureShowcaseMaxScroll(stage);
  if (maxScroll === 0) return 0;

  const el =
    root.querySelector<HTMLElement>(`#${CSS.escape(targetId)}`) ??
    document.getElementById(targetId);
  if (!el) return 0;

  const targetLine =
    PAN_TOP_RESERVE_PX +
    (stage.clientHeight - PAN_TOP_RESERVE_PX - PAN_BOTTOM_RESERVE_PX) * alignY;

  const stageRect = stage.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const anchorInContent =
    elRect.top - stageRect.top + stage.scrollTop + (align === 'top' ? 0 : elRect.height / 2);

  const scrollTop = Math.round(anchorInContent - targetLine);
  return Math.max(0, Math.min(maxScroll, scrollTop));
}

function clampTourScrollEndFromNative(maxScroll: number, scrollEnd: number): number {
  if (maxScroll === 0) return 0;
  const depthCap = Math.ceil(maxScroll * SHOWCASE_TOUR_SCROLL_END_FRACTION);
  const target = Math.max(0, scrollEnd);
  return Math.min(maxScroll, depthCap, target);
}

/**
 * Extensión del tour en modo scroll nativo.
 * `maxPan` / `scrollEndPan` siguen en convención negativa (= -scrollTop) para `compute-tour-frame`.
 */
export function measureShowcaseTourPanExtent(
  stage: HTMLElement,
  _pan: HTMLElement | null,
  root: HTMLElement,
  bottomTargetId: string | null,
  _currentPanY = 0,
): ShowcaseTourPanExtent {
  const maxScroll = measureShowcaseMaxScroll(stage, TOUR_PAN_BOTTOM_RESERVE_PX);
  const maxPan = maxScroll === 0 ? 0 : -maxScroll;
  if (maxScroll === 0) return { maxPan: 0, scrollEndPan: 0 };

  if (!bottomTargetId) {
    return { maxPan, scrollEndPan: 0 };
  }

  const scrollEnd = measureShowcaseScrollToTarget(stage, root, bottomTargetId, 0.72, 'top');
  const capped = clampTourScrollEndFromNative(maxScroll, scrollEnd);
  const scrollEndPan = capped === 0 ? 0 : -capped;

  return { maxPan, scrollEndPan };
}

export function measureShowcaseMaxPan(
  stage: HTMLElement,
  scaler: HTMLElement,
  logicalH: number,
  layoutScale?: number,
): number {
  const vpH = stage.clientHeight;
  if (vpH <= 0) return 0;

  let scaleY = layoutScale ?? 0;
  if (scaleY <= 0.02) {
    const visual = readVisualScale(scaler);
    scaleY = visual.scaleY > 0.02 ? visual.scaleY : 0;
  }
  const fromLayout =
    scaleY > 0.02 ? computeShowcaseMaxPanFromLayout(vpH, logicalH, scaleY) : 0;
  if (fromLayout !== 0) return fromLayout;

  if (scaleY <= 0.02) return 0;
  const visualH = logicalH * scaleY;
  const excess = visualH - vpH - PAN_BOTTOM_RESERVE_PX;
  if (excess <= 8) return 0;
  return -Math.ceil(excess);
}

export function measureShowcasePanToTarget(
  stage: HTMLElement,
  scaler: HTMLElement,
  targetId: string,
  alignY = 0.44,
  align: ShowcasePanAlign = 'top',
  currentPanY = 0,
  maxPan?: number,
): number {
  const panCap = maxPan ?? measureShowcaseMaxPan(stage, scaler, SHOWCASE_DASHBOARD_LOGICAL_HEIGHT);
  if (panCap === 0) return 0;

  const el =
    scaler.querySelector<HTMLElement>(`#${CSS.escape(targetId)}`) ??
    document.getElementById(targetId);
  if (!el) return 0;

  const stageRect = stage.getBoundingClientRect();
  const targetInStage =
    PAN_TOP_RESERVE_PX +
    (stage.clientHeight - PAN_TOP_RESERVE_PX - PAN_BOTTOM_RESERVE_PX) * alignY;

  const elRect = el.getBoundingClientRect();
  const anchorInStage =
    (align === 'top' ? elRect.top : elRect.top + elRect.height / 2) - stageRect.top;
  const panY = Math.round(targetInStage - anchorInStage + currentPanY);

  return Math.max(panCap, Math.min(0, panY));
}

let layoutVersion = 0;

/** Slot 16:9 del demo-wrap (escala desde ancho disponible, no desde el stage ya reducido). */
export function resolveShowcaseSplitProbeSize(probe: HTMLElement) {
  const probeW = Math.max(
    probe.getBoundingClientRect().width,
    probe.clientWidth,
    probe.offsetWidth,
    MIN_STAGE_PX,
  );
  const probeH = probeW * (SHOWCASE_VIEWPORT_LOGICAL_HEIGHT / SHOWCASE_VIEWPORT_LOGICAL_WIDTH);
  return { width: probeW, height: probeH };
}

/** Ventana visible 16:9 post-scale (1280×720 × scale). */
export function computeScaledViewport16x9(scale: number) {
  const s = Math.max(scale, 0.02);
  return {
    width: Math.round(SHOWCASE_VIEWPORT_LOGICAL_WIDTH * s),
    height: Math.round(SHOWCASE_VIEWPORT_LOGICAL_HEIGHT * s),
  };
}

/**
 * Split landing: escala desde probe full-width; viewport/stage = 16:9 exacto al scale
 * (sin letterboxing). El clip alto permite pan del tour.
 */
export function measureShowcaseEmbedLayoutSplit(
  stage: HTMLElement,
  scaler: HTMLElement,
  dashboard: HTMLElement | null,
  probe: HTMLElement,
): ShowcaseEmbedLayout {
  const { width: probeW, height: probeH } = resolveShowcaseSplitProbeSize(probe);
  const logicalContentHeight = measureDashboardLogicalHeight(dashboard);
  const scale = computeShowcaseSplitScale(probeW, probeH);
  const { width: viewportWidth, height: viewportHeight } = computeScaledViewport16x9(scale);
  const scaledContentH = logicalContentHeight * scale;
  const clipWidth = viewportWidth;
  const clipHeight = Math.max(scaledContentH, viewportHeight);
  const maxPan = computeShowcaseMaxPanFromLayout(viewportHeight, logicalContentHeight, scale);

  layoutVersion += 1;

  return {
    scale,
    scaleX: scale,
    scaleY: scale,
    stageWidth: viewportWidth,
    stageHeight: viewportHeight,
    clipHeight,
    clipWidth,
    logicalContentHeight,
    maxPan,
    version: layoutVersion,
  };
}

/** Mide stage + scaler según el contenedor actual (responsive). */
export function measureShowcaseEmbedLayout(
  stage: HTMLElement,
  scaler: HTMLElement,
  dashboard: HTMLElement | null,
  scaleMode: ShowcaseScaleMode = 'viewport-16x9',
): ShowcaseEmbedLayout {
  const { width: stageWidth, height: stageHeight } = measureStageBox(stage);
  const logicalContentHeight = measureDashboardLogicalHeight(dashboard);
  const scale = computeShowcaseScaleForStage(
    stageWidth,
    stageHeight,
    scaleMode,
    logicalContentHeight,
  );
  const scaleX = scale;
  const scaleY = scale;
  const scaledContentH = logicalContentHeight * scale;
  const scaledContentW = SHOWCASE_FRAME_WIDTH * scale;
  /**
   * Clip = tamaño visual post-scale (1280×scale), acotado al stage.
   * Regresión: no usar stageWidth como único ancho del clip sin esta escala — el scaler sigue 1280px lógicos.
   */
  const clipWidth = scaledContentW;
  const clipHeight = Math.max(scaledContentH, stageHeight > 0 ? stageHeight : scaledContentH);
  const maxPan = computeShowcaseMaxPanFromLayout(stageHeight, logicalContentHeight, scale);

  layoutVersion += 1;

  return {
    scale,
    scaleX,
    scaleY,
    stageWidth,
    stageHeight,
    clipHeight,
    clipWidth,
    logicalContentHeight,
    maxPan,
    version: layoutVersion,
  };
}
