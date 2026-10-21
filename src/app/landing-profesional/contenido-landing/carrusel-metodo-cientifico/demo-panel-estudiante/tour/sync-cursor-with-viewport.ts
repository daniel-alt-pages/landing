import { measureShowcaseScrollToTarget } from '../viewport/measure-embed-layout';
import type { ShowcaseTourFrame } from '../types/showcase.types';
import {
  getTourClickPoint,
  getTourReadingCursor,
  isShowcaseNavTarget,
  isTargetVisibleInViewport,
  panYToScrollTop,
  scrollTopToRevealTarget,
} from './coordinates';
const VIEWPORT_PAD = 10;

function clampCursorToViewport(
  viewportEl: HTMLElement,
  x: number,
  y: number,
): { x: number; y: number } {
  const w = Math.max(viewportEl.clientWidth, 48);
  const h = Math.max(viewportEl.clientHeight, 48);
  return {
    x: Math.max(VIEWPORT_PAD, Math.min(w - VIEWPORT_PAD, x)),
    y: Math.max(VIEWPORT_PAD, Math.min(h - VIEWPORT_PAD, y)),
  };
}

/** Aplica scroll del frame y recalcula puntero solo sobre lo visible en el panel. */
export function syncTourFrameToViewport(
  frame: ShowcaseTourFrame,
  viewportEl: HTMLElement | null,
  rootEl: HTMLElement | null,
  scrollTop: number,
): { frame: ShowcaseTourFrame; scrollTop: number } {
  if (!viewportEl) return { frame, scrollTop };

  const targetId = frame.highlightId ?? frame.domClickTargetId;
  const approachingClick =
    frame.cursor.state === 'hover' ||
    frame.cursor.state === 'click' ||
    Boolean(frame.domClickTargetId);
  const mustReveal = Boolean(frame.domClickTargetId) || approachingClick;

  let nextScrollTop = scrollTop;

  if (mustReveal && targetId && rootEl) {
    nextScrollTop = scrollTopToRevealTarget(viewportEl, rootEl, targetId, nextScrollTop);
  }

  if (!targetId) {
    const clamped = clampCursorToViewport(viewportEl, frame.cursor.x, frame.cursor.y);
    return {
      scrollTop: nextScrollTop,
      frame: {
        ...frame,
        cursor: { ...frame.cursor, x: clamped.x, y: clamped.y },
      },
    };
  }

  const navTarget = isShowcaseNavTarget(targetId);
  const visible =
    navTarget || isTargetVisibleInViewport(viewportEl, rootEl, targetId);

  if (!visible && !mustReveal && !navTarget) {
    const progress =
      viewportEl.scrollHeight > viewportEl.clientHeight
        ? nextScrollTop / Math.max(1, viewportEl.scrollHeight - viewportEl.clientHeight)
        : 0;
    const read = getTourReadingCursor(viewportEl, progress);
    return {
      scrollTop: nextScrollTop,
      frame: {
        ...frame,
        highlightId: null,
        cursor: { ...frame.cursor, x: read.x, y: read.y },
      },
    };
  }

  const raw = getTourClickPoint(viewportEl, targetId, { x: 0, y: 0 }, rootEl);
  const clamped = clampCursorToViewport(viewportEl, raw.x, raw.y);

  return {
    scrollTop: nextScrollTop,
    frame: {
      ...frame,
      highlightId: visible || mustReveal || navTarget ? targetId : null,
      cursor: { ...frame.cursor, x: clamped.x, y: clamped.y },
    },
  };
}

export { panYToScrollTop };
