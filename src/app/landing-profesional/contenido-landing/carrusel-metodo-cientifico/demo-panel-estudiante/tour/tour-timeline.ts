import { SHOWCASE_DEFAULT_SIM } from '../constants/dom-ids';
import {
  SHOWCASE_COMPACT_TOUR_SCROLL_PACE,
  SHOWCASE_TOUR_SCROLL_PACE,
  SHOWCASE_VERTICAL_TOUR_SCROLL_PACE,
} from '../constants/showcase-feature-flags';
import { TOUR_POST_NAV_SETTLE_MS } from './tour-interaction';

/** Ritmo base del autonavegador (panel estudiante embebido, desktop / escala). */
export const SHOWCASE_TOUR_PANEL_MS = {
  holdTop: 900,
  scrollToTarget: 4_200,
  scrollBackTop: 3_000,
  scrollFull: 5_400,
  scrollMid: 3_600,
  navClick: 920,
  insightClick: 1_150,
  materiaTab: 1_050,
  questionDetail: 1_400,
  interactShort: 2_600,
  dashTail: 500,
  reset: 500,
  tail: 1_600,
} as const;

function scaleMs(ms: number, pace: number) {
  return Math.round(ms * pace);
}

/** Duraciones efectivas; `scrollPace` aplica a tramos de scroll vertical. */
function panelMsForScrollPace(scrollPace: number) {
  const b = SHOWCASE_TOUR_PANEL_MS;
  const holdPace = Math.min(scrollPace, 1.35);
  return {
    holdTop: scaleMs(b.holdTop, holdPace),
    scrollToTarget: scaleMs(b.scrollToTarget, scrollPace),
    scrollBackTop: scaleMs(b.scrollBackTop, scrollPace),
    scrollFull: scaleMs(b.scrollFull, scrollPace),
    scrollMid: scaleMs(b.scrollMid, scrollPace),
    navClick: b.navClick,
    insightClick: scaleMs(b.insightClick, Math.min(scrollPace, 1.2)),
    materiaTab: b.materiaTab,
    questionDetail: b.questionDetail,
    interactShort: b.interactShort,
    dashTail: b.dashTail,
    reset: b.reset,
    tail: b.tail,
  };
}

/**
 * Flujo narrativo (usuario):
 * Inicio → scroll a Ver Claves → subir → Ver Ranking → Ranking (medio → arriba → volver)
 * → Respuestas (nav) → scroll análisis → expandir logros/repasar → pregunta demo
 * → tabs materias → pregunta inglés
 * → atrás análisis → Métricas → scroll → Volver.
 */
export function buildShowcaseTourTimeline(scrollPace = 1) {
  const P = panelMsForScrollPace(scrollPace);
  let t = P.reset;

  const T_RESET_END = t;
  const T_SELECTOR_END = T_RESET_END;

  const T_DASH_START = t;
  t += P.holdTop;
  const T_DASH_HOLD_TOP_END = t;
  const T_DASH_SCROLL_START = T_DASH_HOLD_TOP_END;
  t += P.scrollToTarget;
  const T_DASH_SCROLL_CLAVES_END = t;
  t += P.scrollBackTop;
  const T_DASH_SCROLL_TOP_END = t;
  const T_DASH_VER_RANKING_CLICK = T_DASH_SCROLL_TOP_END + 520;
  t += P.dashTail;
  const T_DASHBOARD_END = t;

  const T_RANK_START = T_DASHBOARD_END;
  const T_RANK_HOLD_TOP_END = T_RANK_START + P.holdTop;
  const T_RANK_SCROLL_MID_END = T_RANK_HOLD_TOP_END + P.scrollMid;
  const T_RANK_SCROLL_TOP_END = T_RANK_SCROLL_MID_END + P.scrollBackTop;
  const T_RANK_BACK_CLICK = T_RANK_SCROLL_TOP_END + 520;
  t = T_RANK_BACK_CLICK + P.interactShort;
  const T_RANKING_END = t;

  const T_RESP_NAV_CLICK = T_RANKING_END + 480;
  const T_RESP_NAV_END = T_RESP_NAV_CLICK + P.navClick + 200;
  const T_RESP_START = T_RESP_NAV_END;
  const T_RESP_HOLD_TOP_END = T_RESP_START + P.holdTop;
  const T_RESP_SCROLL_END = T_RESP_HOLD_TOP_END + P.scrollFull;
  const T_RESP_SCROLL_TOP_END = T_RESP_SCROLL_END + P.scrollBackTop;
  const T_RESP_LOGROS_CLICK = T_RESP_SCROLL_TOP_END + 700;
  const T_RESP_REPASAR_CLICK = T_RESP_LOGROS_CLICK + P.insightClick;
  const T_RESP_DEMO_QUESTION_CLICK = T_RESP_REPASAR_CLICK + P.insightClick + 500;
  const T_RESP_DEMO_DETAIL_END = T_RESP_DEMO_QUESTION_CLICK + P.questionDetail;
  const T_RESP_MATE_CLICK = T_RESP_DEMO_DETAIL_END + 700;
  const T_RESP_SOC_CLICK = T_RESP_MATE_CLICK + P.materiaTab;
  const T_RESP_CIEN_CLICK = T_RESP_SOC_CLICK + P.materiaTab;
  const T_RESP_ING_CLICK = T_RESP_CIEN_CLICK + P.materiaTab;
  /** Tras Inglés: esperar montaje del heatmap antes del clic en la pregunta demo (#80). */
  const T_RESP_QUESTION_CLICK = T_RESP_ING_CLICK + TOUR_POST_NAV_SETTLE_MS + 650;
  t = T_RESP_QUESTION_CLICK + P.questionDetail;
  const T_RESPUESTAS_END = t;

  const T_ANAL_BACK_CLICK = T_RESPUESTAS_END + 480;
  const T_MET_NAV_CLICK = T_ANAL_BACK_CLICK + P.navClick + 200;
  const T_MET_NAV_END = T_MET_NAV_CLICK + 200;
  const T_METRICAS_START = T_MET_NAV_END;
  const T_MET_HOLD_TOP_END = T_METRICAS_START + P.holdTop;
  const T_MET_SCROLL_END = T_MET_HOLD_TOP_END + P.scrollFull;
  const T_MET_SCROLL_TOP_END = T_MET_SCROLL_END + P.scrollBackTop;
  const T_MET_BACK_CLICK = T_MET_SCROLL_TOP_END + 520;
  t = T_MET_BACK_CLICK + P.interactShort;
  const T_METRICAS_END = t;

  const T_TAIL_CLICK = T_METRICAS_END + 400;
  const T_TAIL_END = T_TAIL_CLICK + P.tail;

  return {
    T_RESET_END,
    T_SELECTOR_END,
    T_DASH_START,
    T_DASH_HOLD_TOP_END,
    T_DASH_SCROLL_START,
    T_DASH_SCROLL_CLAVES_END,
    T_DASH_SCROLL_TOP_END,
    T_DASH_VER_RANKING_CLICK,
    T_DASHBOARD_END,
    T_RANK_START,
    T_RANK_HOLD_TOP_END,
    T_RANK_SCROLL_MID_END,
    T_RANK_SCROLL_TOP_END,
    T_RANK_BACK_CLICK,
    T_RANKING_END,
    T_RESP_NAV_CLICK,
    T_RESP_NAV_END,
    T_RESP_START,
    T_RESP_HOLD_TOP_END,
    T_RESP_SCROLL_END,
    T_RESP_SCROLL_TOP_END,
    T_RESP_LOGROS_CLICK,
    T_RESP_REPASAR_CLICK,
    T_RESP_DEMO_QUESTION_CLICK,
    T_RESP_DEMO_DETAIL_END,
    T_RESP_MATE_CLICK,
    T_RESP_SOC_CLICK,
    T_RESP_CIEN_CLICK,
    T_RESP_ING_CLICK,
    T_RESP_QUESTION_CLICK,
    T_RESPUESTAS_END,
    T_ANAL_BACK_CLICK,
    T_MET_NAV_CLICK,
    T_MET_NAV_END,
    T_METRICAS_START,
    T_MET_HOLD_TOP_END,
    T_MET_SCROLL_END,
    T_MET_SCROLL_TOP_END,
    T_MET_BACK_CLICK,
    T_METRICAS_END,
    T_TAIL_CLICK,
    T_TAIL_END,
    defaultSim: SHOWCASE_DEFAULT_SIM,
    scrollFullMs: P.scrollFull,
    scrollPace,
  };
}

export type ShowcaseTourTimeline = ReturnType<typeof buildShowcaseTourTimeline>;

const timelineCache: { desktop?: ShowcaseTourTimeline; compact?: ShowcaseTourTimeline } = {};

/** Timeline desktop (escala 1280) o compacto (scroll más lento). */
export function getShowcaseTourTimeline(compact = false): ShowcaseTourTimeline {
  const key = compact ? 'compact' : 'desktop';
  if (!timelineCache[key]) {
    timelineCache[key] = buildShowcaseTourTimeline(
      compact
        ? SHOWCASE_TOUR_SCROLL_PACE *
            SHOWCASE_COMPACT_TOUR_SCROLL_PACE *
            SHOWCASE_VERTICAL_TOUR_SCROLL_PACE
        : SHOWCASE_TOUR_SCROLL_PACE,
    );
  }
  return timelineCache[key]!;
}

export function getShowcaseTourCycleMs(compact = false) {
  return getShowcaseTourTimeline(compact).T_TAIL_END + 2_500;
}

/** Ciclo desktop (export legacy). */
export const SHOWCASE_TOUR_CYCLE_MS = getShowcaseTourCycleMs(false);
