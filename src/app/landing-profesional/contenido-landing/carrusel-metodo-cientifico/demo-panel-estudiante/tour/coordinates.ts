import { SHOWCASE_FRAME_WIDTH } from '../viewport/showcaseViewport';
import {
  measureShowcaseMaxScroll,
  measureShowcaseScrollToTarget,
} from '../viewport/measure-embed-layout';

export function lerpPoint(
  origin: { x: number; y: number },
  dest: { x: number; y: number },
  t: number,
) {
  return {
    x: origin.x + (dest.x - origin.x) * t,
    y: origin.y + (dest.y - origin.y) * t,
  };
}

/** ease-out cúbico — movimiento de puntero tipo escritorio. */
export function easePointerMove(t: number) {
  const p = Math.min(1, Math.max(0, t));
  return 1 - (1 - p) ** 3;
}

export function panYToScrollTop(panY: number) {
  return Math.max(0, Math.round(-panY));
}

const NAV_TARGET_PREFIX = 'showcase-nav-';

export function isShowcaseNavTarget(targetId: string) {
  return targetId.startsWith(NAV_TARGET_PREFIX);
}

function isNativeScrollViewport(viewportEl: HTMLElement) {
  return (
    viewportEl.classList.contains('showcase-embed-scroll-viewport') ||
    viewportEl.classList.contains('showcase-embed-scroll-viewport--native-scroll')
  );
}

function getScalerVisualScale(scalerEl: HTMLElement) {
  const rect = scalerEl.getBoundingClientRect();
  const scaleX = scalerEl.offsetWidth > 0 ? rect.width / scalerEl.offsetWidth : 1;
  const scaleY = scalerEl.offsetHeight > 0 ? rect.height / scalerEl.offsetHeight : scaleX;
  return { scaleX, scaleY, rect };
}

function resolveTarget(
  viewportEl: HTMLElement | null,
  rootEl: HTMLElement | null,
  elementId: string,
): HTMLElement | null {
  if (!viewportEl && !rootEl) return null;
  return (
    rootEl?.querySelector<HTMLElement>(`#${CSS.escape(elementId)}`) ??
    viewportEl?.querySelector<HTMLElement>(`#${CSS.escape(elementId)}`) ??
    document.getElementById(elementId)
  );
}

/** Fallback en coords del marco lógico (1280px) → coords locales del scaler legacy. */
export function scaleTourFallback(
  scalerEl: HTMLElement | null,
  fallback: { x: number; y: number },
): { x: number; y: number } {
  if (!scalerEl || scalerEl.offsetWidth <= 0) return fallback;
  const ratio = scalerEl.offsetWidth / SHOWCASE_FRAME_WIDTH;
  return { x: fallback.x * ratio, y: fallback.y * ratio };
}

export function isTargetVisibleInViewport(
  viewportEl: HTMLElement,
  rootEl: HTMLElement | null,
  elementId: string,
  margin = 8,
): boolean {
  const el = resolveTarget(viewportEl, rootEl, elementId);
  if (!el) return false;

  const vp = viewportEl.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return (
    r.bottom > vp.top + margin &&
    r.top < vp.bottom - margin &&
    r.right > vp.left + margin &&
    r.left < vp.right - margin
  );
}

/** scrollTop mínimo para que el target quede en la banda visible del panel. */
export function scrollTopToRevealTarget(
  viewportEl: HTMLElement,
  rootEl: HTMLElement,
  targetId: string,
  currentScrollTop: number,
): number {
  const needed = measureShowcaseScrollToTarget(viewportEl, rootEl, targetId, 0.48, 'top');
  const max = measureShowcaseMaxScroll(viewportEl);
  return Math.max(currentScrollTop, Math.min(max, needed));
}

/** Cursor “leyendo” mientras baja el scroll — dentro del panel, no fuera. */
export function getTourReadingCursor(viewportEl: HTMLElement, scrollProgress: number) {
  const w = Math.max(viewportEl.clientWidth, 48);
  const h = Math.max(viewportEl.clientHeight, 48);
  const p = Math.min(1, Math.max(0, scrollProgress));
  return {
    x: w * 0.52,
    y: h * (0.26 + p * 0.44),
  };
}

/**
 * Centro del target en coords del viewport (stage scroll nativo).
 * Sin fallback fuera de pantalla: si no hay target, centro del panel.
 */
export function getTourPoint(
  viewportEl: HTMLElement | null,
  elementId: string,
  fallback: { x: number; y: number },
  rootEl: HTMLElement | null = viewportEl,
): { x: number; y: number } {
  if (!viewportEl) return fallback;

  const el = resolveTarget(viewportEl, rootEl, elementId);
  if (!el) {
    const w = viewportEl.clientWidth;
    const h = viewportEl.clientHeight;
    return { x: w * 0.5, y: h * 0.35 };
  }

  const viewportRect = viewportEl.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  if (viewportRect.width <= 0 || viewportRect.height <= 0) {
    return scaleTourFallback(viewportEl, fallback);
  }

  if (isNativeScrollViewport(viewportEl)) {
    return {
      x: elRect.left + elRect.width / 2 - viewportRect.left,
      y: elRect.top + elRect.height / 2 - viewportRect.top,
    };
  }

  const { scaleX, scaleY, rect: scalerRect } = getScalerVisualScale(viewportEl);
  return {
    x: (elRect.left + elRect.width / 2 - scalerRect.left) / scaleX,
    y: (elRect.top + elRect.height / 2 - scalerRect.top) / scaleY,
  };
}

/** Punta de flecha ≈ (3, 2) en viewBox 20×20 — alinear clic visual al centro del target. */
export const SHOWCASE_CURSOR_TIP_OFFSET = { x: 3, y: 2 } as const;

export function getTourClickPoint(
  viewportEl: HTMLElement | null,
  elementId: string,
  fallback: { x: number; y: number },
  rootEl: HTMLElement | null = viewportEl,
) {
  const center = getTourPoint(viewportEl, elementId, fallback, rootEl);
  return {
    x: center.x - SHOWCASE_CURSOR_TIP_OFFSET.x,
    y: center.y - SHOWCASE_CURSOR_TIP_OFFSET.y,
  };
}
