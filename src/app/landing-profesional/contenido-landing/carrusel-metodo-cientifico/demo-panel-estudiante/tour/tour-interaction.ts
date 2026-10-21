import { showcaseDomIds } from '../constants/dom-ids';
import type { ShowcaseCursor } from '../types/showcase.types';

/** Duración visual del “press” del puntero. */
export const TOUR_CLICK_VISUAL_MS = 420;

/** Ventana única para disparar un clic (evita doble dispatch). */
export const TOUR_CLICK_PULSE_MS = 120;

/** Hover antes del clic. */
export const TOUR_HOVER_LEAD_MS = 680;

export const TOUR_HOVER_TAIL_MS = 380;

/** Desplazamiento del puntero hacia el target antes del hover. */
export const TOUR_CURSOR_APPROACH_MS = 820;

/** Tras cambiar tab/sim, dejar que el panel monte antes de scroll. */
export const TOUR_POST_NAV_SETTLE_MS = 880;

export const TOUR_NAV_APPROACH_MS = 720;

export function clickApproachStart(clickAt: number) {
  return clickAt - TOUR_HOVER_LEAD_MS - TOUR_CURSOR_APPROACH_MS;
}

export function clickHoverStart(clickAt: number) {
  return clickAt - TOUR_HOVER_LEAD_MS;
}

/** El puntero ya va hacia el target (no leer scroll genérico). */
export function shouldEngageClickTarget(elapsed: number, clickAt: number) {
  return elapsed >= clickApproachStart(clickAt);
}

export const TOUR_MODAL_AFTER_CLICK_MS = 340;

export function onClickPulse(elapsed: number, clickAt: number, pulseMs = TOUR_CLICK_PULSE_MS) {
  return elapsed >= clickAt && elapsed < clickAt + pulseMs;
}

export function isClickBeat(elapsed: number, at: number, duration = TOUR_CLICK_VISUAL_MS) {
  return elapsed >= at && elapsed < at + duration;
}

export function pointerStateNatural(
  elapsed: number,
  clickAt: number,
  fallback: ShowcaseCursor['state'] = 'idle',
): ShowcaseCursor['state'] {
  if (isClickBeat(elapsed, clickAt)) return 'click';
  if (
    elapsed >= clickAt - TOUR_HOVER_LEAD_MS &&
    elapsed < clickAt + TOUR_CLICK_VISUAL_MS + TOUR_HOVER_TAIL_MS
  ) {
    return 'hover';
  }
  return fallback;
}

export function navClickAt(panelStart: number) {
  return panelStart + TOUR_NAV_APPROACH_MS;
}

export function panelLandedAt(panelStart: number) {
  return panelStart + TOUR_NAV_APPROACH_MS + TOUR_POST_NAV_SETTLE_MS;
}

function resolveClickableElement(
  rootEl: HTMLElement | null,
  targetId: string,
): HTMLElement | null {
  const root =
    rootEl?.querySelector<HTMLElement>(`#${CSS.escape(targetId)}`) ??
    document.getElementById(targetId);
  if (!root) return null;

  if (root instanceof HTMLButtonElement) {
    return root.disabled ? null : root;
  }
  if (root instanceof HTMLAnchorElement) {
    return root;
  }

  const innerBtn = root.querySelector<HTMLElement>('button:not([disabled])');
  if (innerBtn) return innerBtn;

  if (targetId === showcaseDomIds.sectionRankingTop) {
    return root.querySelector<HTMLElement>('tbody tr');
  }

  if (targetId.startsWith('showcase-materia-area-')) {
    return root;
  }

  if (targetId === showcaseDomIds.metricasAreaAnalizar) {
    return root;
  }

  if (targetId === showcaseDomIds.navBack) {
    return root;
  }

  if (
    targetId === showcaseDomIds.dashboardVerRanking ||
    targetId === showcaseDomIds.rankingBackDashboard
  ) {
    return root;
  }

  if (targetId === showcaseDomIds.sectionClaves) {
    const btn = root.querySelector<HTMLElement>('button:not([disabled])');
    return btn ?? root;
  }

  if (
    targetId === showcaseDomIds.analisisExpandLogros ||
    targetId === showcaseDomIds.analisisExpandRepasar
  ) {
    return root;
  }

  if (targetId.startsWith('showcase-question-box-')) {
    return root;
  }

  return root;
}

/** Clic sintético en el mismo nodo que usaría el usuario (handlers React incluidos). */
export function fireTourTargetClick(rootEl: HTMLElement | null, targetId: string | null) {
  if (!targetId) return;
  const el = resolveClickableElement(rootEl, targetId);
  if (!el) return;
  el.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true, view: window }),
  );
}
