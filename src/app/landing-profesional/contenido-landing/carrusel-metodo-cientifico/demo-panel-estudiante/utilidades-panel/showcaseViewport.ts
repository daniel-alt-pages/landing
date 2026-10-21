/** Marco lógico del dashboard (diseño 1280px de ancho). */
export const SHOWCASE_FRAME_WIDTH = 1280;
export const SHOWCASE_FRAME_RATIO = 16 / 9;
export const SHOWCASE_FRAME_HEIGHT = Math.round(SHOWCASE_FRAME_WIDTH / SHOWCASE_FRAME_RATIO);

/** Escala para que el panel llene el ancho útil del stage (sin cap artificial). */
export function computeShowcaseScale(stageWidth: number) {
  const w = Math.max(stageWidth, 120);
  return w / SHOWCASE_FRAME_WIDTH;
}

export function clampShowcasePanY(
  panY: number,
  viewportHeight: number,
  contentHeight: number,
  scale: number,
) {
  if (scale <= 0) return 0;
  const maxPan = 0;
  const minPan = Math.min(0, viewportHeight / scale - contentHeight);
  return Math.max(minPan, Math.min(maxPan, panY));
}

export function computePanYToCenter(
  viewport: HTMLElement,
  target: HTMLElement,
  scale: number,
  currentPanY: number,
  contentHeight: number,
) {
  const vp = viewport.getBoundingClientRect();
  const tr = target.getBoundingClientRect();
  const targetCy = tr.top + tr.height / 2 - vp.top;
  const vpCy = vp.height / 2;
  const next = currentPanY + (vpCy - targetCy) / scale;
  return clampShowcasePanY(next, vp.height, contentHeight, scale);
}
