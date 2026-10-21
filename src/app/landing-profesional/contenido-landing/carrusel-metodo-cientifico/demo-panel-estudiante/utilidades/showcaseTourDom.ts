import type { ShowcaseCursor } from '../types/showcase.types';

const PAN_EPS = 0.5;
const SCROLL_EPS = 0.5;
const CURSOR_EPS = 0.75;

export function applyShowcaseStageScroll(stage: HTMLElement | null, scrollTop: number) {
  if (!stage) return;
  const top = Math.max(0, Math.round(scrollTop));
  if (Math.abs(stage.scrollTop - top) <= SCROLL_EPS) return;
  stage.scrollTop = top;
  stage.dataset.showcaseScrollTop = String(top);
}

/** @deprecated Pan transform — solo carrusel legacy escalado. */
export function applyShowcasePanTransform(el: HTMLElement | null, panY: number) {
  if (!el) return;
  const y = Math.round(panY);
  el.style.willChange = 'transform';
  el.style.transition = 'none';
  el.style.transform = `translate3d(0, ${y}px, 0)`;
  el.style.webkitTransform = `translate3d(0, ${y}px, 0)`;
  el.dataset.showcasePanY = String(y);
}

export function applyShowcaseCursorTransform(el: HTMLElement | null, cursor: ShowcaseCursor) {
  if (!el) return;
  if (cursor.state === 'hidden') {
    el.style.display = 'none';
    return;
  }
  el.style.display = 'block';
  el.style.willChange = 'transform';
  el.style.transition =
    cursor.state === 'click'
      ? 'transform 70ms cubic-bezier(0.22, 1, 0.36, 1)'
      : 'transform 140ms cubic-bezier(0.22, 1, 0.36, 1)';
  el.style.transform = `translate3d(${cursor.x}px, ${cursor.y}px, 0)`;
  el.dataset.cursorState = cursor.state;
  const svg = el.querySelector('svg');
  if (svg instanceof SVGElement) {
    svg.style.transform = cursor.state === 'click' ? 'translateY(1px)' : '';
  }
}

export function panChanged(prev: number, next: number) {
  return Math.abs(prev - next) > PAN_EPS;
}

export function scrollTopChanged(prev: number, next: number) {
  return Math.abs(prev - next) > SCROLL_EPS;
}

export function cursorChanged(a: ShowcaseCursor, b: ShowcaseCursor) {
  return (
    a.state !== b.state ||
    Math.abs(a.x - b.x) > CURSOR_EPS ||
    Math.abs(a.y - b.y) > CURSOR_EPS
  );
}
