import { SHOWCASE_DEFAULT_SIM, SHOWCASE_TOUR_DEMO, showcaseDomIds } from '../constants/dom-ids';
import type {
  ShowcaseCursor,
  ShowcaseDashboardTab,
  ShowcaseModal,
  ShowcaseStudentScreen,
  ShowcaseTourComputeContext,
  ShowcaseTourDispatch,
  ShowcaseTourFrame,
  ShowcaseTourRuntimeState,
} from '../types/showcase.types';
import { applyShowcaseCursorWobble } from './cursor-motion';
import {
  easePointerMove,
  getTourClickPoint,
  getTourReadingCursor,
  isShowcaseNavTarget,
  isTargetVisibleInViewport,
  lerpPoint,
} from './coordinates';
import { resolveShowcaseTourPhase } from './resolve-tour-phase';
import { SHOWCASE_TOUR_CURSOR_HOME } from './tour-config';
import {
  clickApproachStart,
  clickHoverStart,
  onClickPulse,
  panelLandedAt,
  pointerStateNatural,
  shouldEngageClickTarget,
  TOUR_HOVER_LEAD_MS,
  TOUR_POST_NAV_SETTLE_MS,
} from './tour-interaction';
import { measureShowcaseScrollToTarget } from './measure';
import { easeInOutSine } from './easing';
import { getShowcaseTourTimeline } from './tour-timeline';

const MATERIA_TABS = [
  'matemáticas',
  'sociales y ciudadanas',
  'ciencias naturales',
  'inglés',
] as const;

const INGLES_QUESTION_ID = '80';
const DEMO_ANALISIS_QUESTION_ID = SHOWCASE_TOUR_DEMO.questionId;

function easeScroll(t: number) {
  return easeInOutSine(Math.min(1, Math.max(0, t)));
}

function clampPan(pan: number, maxPan: number) {
  if (maxPan === 0) return Math.min(0, pan);
  return Math.max(maxPan, Math.min(0, pan));
}

function panLerp(elapsed: number, tStart: number, tEnd: number, from: number, to: number) {
  if (tEnd <= tStart) return to;
  const p = Math.min(1, Math.max(0, (elapsed - tStart) / (tEnd - tStart)));
  return from + (to - from) * easeScroll(p);
}

/** Scroll hasta un ancla concreta (p. ej. banner Ver Claves en Inicio). */
function panelScrollToTarget(
  elapsed: number,
  scrollStart: number,
  scrollEnd: number,
  targetPan: number,
  maxPan: number,
): number {
  const endPan =
    targetPan === 0 && maxPan < 0 ? 0 : clampPan(targetPan, maxPan);
  if (elapsed < scrollStart) return 0;
  if (elapsed >= scrollEnd) return endPan;
  return panLerp(elapsed, scrollStart, scrollEnd, 0, endPan);
}

/** Scroll hasta el fondo real del panel (`maxPan`), no hasta un ancla intermedia. */
function panelScrollToBottom(
  elapsed: number,
  scrollStart: number,
  scrollEnd: number,
  maxPan: number,
): number {
  if (maxPan >= 0) return 0;
  if (elapsed < scrollStart) return 0;
  if (elapsed >= scrollEnd) return maxPan;
  return panLerp(elapsed, scrollStart, scrollEnd, 0, maxPan);
}

function panToTarget(
  ctx: ShowcaseTourComputeContext,
  targetId: string,
  alignY = 0.36,
  align: 'center' | 'top' = 'top',
  fallbackPan = 0,
) {
  if (!ctx.viewportEl || !ctx.rootEl) return fallbackPan;
  const scrollTop = measureShowcaseScrollToTarget(
    ctx.viewportEl,
    ctx.rootEl,
    targetId,
    alignY,
    align,
  );
  return scrollTop > 0 ? -scrollTop : fallbackPan;
}

function tourCursor(
  ctx: ShowcaseTourComputeContext,
  x: number,
  y: number,
  state: ShowcaseTourFrame['cursor']['state'],
) {
  const w = applyShowcaseCursorWobble(x, y, ctx.elapsed, state);
  return { x: w.x, y: w.y, state };
}

function frameBase(
  ctx: ShowcaseTourComputeContext,
  partial: Omit<ShowcaseTourFrame, 'tourPhase'>,
): ShowcaseTourFrame {
  return {
    ...partial,
    tourPhase: resolveShowcaseTourPhase(ctx.elapsed, ctx.compactTour ?? false),
  };
}

type TargetFrameOpts = {
  engageTarget?: boolean;
  scrollProgress?: number;
  /** Punto de partida del movimiento hacia el clic. */
  originId?: string;
  originFallback?: { x: number; y: number };
};

function canFireDomClick(
  ctx: ShowcaseTourComputeContext,
  elapsed: number,
  clickAt: number,
  targetId: string,
): boolean {
  if (!onClickPulse(elapsed, clickAt)) return false;
  const vp = ctx.viewportEl;
  if (!vp) return false;
  if (isShowcaseNavTarget(targetId)) return true;
  if (!ctx.rootEl) return false;
  return isTargetVisibleInViewport(vp, ctx.rootEl, targetId, 6);
}

function resolveTourPointer(
  ctx: ShowcaseTourComputeContext,
  targetId: string,
  fallback: { x: number; y: number },
  elapsed: number,
  clickAt: number,
  engage: boolean,
  opts?: TargetFrameOpts,
): { x: number; y: number; state: ShowcaseCursor['state']; highlightId: string | null } {
  const vp = ctx.viewportEl;
  const dest = getTourClickPoint(vp, targetId, fallback, ctx.rootEl);

  if (!engage) {
    if (vp && opts?.scrollProgress !== undefined) {
      const read = getTourReadingCursor(vp, opts.scrollProgress);
      return { ...read, state: 'idle', highlightId: null };
    }
    return {
      x: dest.x,
      y: dest.y,
      state: pointerStateNatural(elapsed, clickAt, 'idle'),
      highlightId: targetId,
    };
  }

  const approachAt = clickApproachStart(clickAt);
  const hoverAt = clickHoverStart(clickAt);
  const state = pointerStateNatural(elapsed, clickAt, 'idle');

  if (elapsed < approachAt) {
    return { x: dest.x, y: dest.y, state, highlightId: targetId };
  }

  const origin = opts?.originId
    ? getTourClickPoint(vp, opts.originId, opts.originFallback ?? fallback, ctx.rootEl)
    : vp
      ? getTourReadingCursor(vp, 0.22)
      : dest;

  if (elapsed < hoverAt) {
    const p = easePointerMove(
      (elapsed - approachAt) / Math.max(1, hoverAt - approachAt),
    );
    const moved = lerpPoint(origin, dest, p);
    return { ...moved, state: 'idle', highlightId: targetId };
  }

  return { x: dest.x, y: dest.y, state, highlightId: targetId };
}

function targetFrame(
  ctx: ShowcaseTourComputeContext,
  panY: number,
  targetId: string,
  fallback: { x: number; y: number },
  dispatches: ShowcaseTourDispatch[] = [],
  elapsed: number,
  clickAt: number,
  pointerFallback: ShowcaseTourFrame['cursor']['state'] = 'idle',
  opts?: TargetFrameOpts,
): ShowcaseTourFrame {
  const engage = opts?.engageTarget ?? true;
  const pointer = resolveTourPointer(ctx, targetId, fallback, elapsed, clickAt, engage, opts);
  const fireClick = canFireDomClick(ctx, elapsed, clickAt, targetId);
  const navDispatches = fireClick ? dispatchesForNavTarget(targetId, ctx.runtime) : [];

  return frameBase(ctx, {
    panY,
    cursor: tourCursor(ctx, pointer.x, pointer.y, pointer.state ?? pointerFallback),
    highlightId: pointer.highlightId,
    domClickTargetId: fireClick ? targetId : null,
    dispatches: [...dispatches, ...navDispatches],
  });
}

function scrollProgressBetween(elapsed: number, start: number, end: number) {
  if (end <= start) return 0;
  return Math.min(1, Math.max(0, (elapsed - start) / (end - start)));
}

function dispatchesForNavTarget(
  targetId: string,
  runtime: ShowcaseTourRuntimeState,
): ShowcaseTourDispatch[] {
  const ids = showcaseDomIds;
  if (targetId === ids.navDashboard && runtime.activeTab !== 'dashboard') {
    return [{ type: 'setTab', tab: 'dashboard' }];
  }
  if (targetId === ids.navMetricas && runtime.activeTab !== 'metricas') {
    return [{ type: 'setTab', tab: 'metricas' }];
  }
  if (targetId === ids.navRespuestas && runtime.activeTab !== 'respuestas') {
    return [{ type: 'setTab', tab: 'respuestas' }];
  }
  if (targetId === ids.navRanking && runtime.activeTab !== 'ranking') {
    return [{ type: 'setTab', tab: 'ranking' }];
  }
  if (targetId === ids.dashboardVerRanking && runtime.activeTab !== 'ranking') {
    return [{ type: 'setTab', tab: 'ranking' }];
  }
  if (targetId === ids.rankingBackDashboard && runtime.activeTab !== 'dashboard') {
    return [{ type: 'setTab', tab: 'dashboard' }];
  }
  return [];
}

export function computeShowcaseTourFrame(ctx: ShowcaseTourComputeContext): ShowcaseTourFrame {
  const { elapsed, runtime, scrollEndPan, maxPan } = ctx;
  const T = getShowcaseTourTimeline(ctx.compactTour ?? false);
  const ids = showcaseDomIds;

  if (elapsed < T.T_RESET_END) {
    return frameBase(ctx, {
      panY: 0,
      cursor: tourCursor(ctx, SHOWCASE_TOUR_CURSOR_HOME.x, SHOWCASE_TOUR_CURSOR_HOME.y, 'hidden'),
      highlightId: null,
      domClickTargetId: null,
      dispatches: [
        ...(runtime.activeScreen !== 'panel'
          ? [{ type: 'setScreen' as const, screen: 'panel' as const }]
          : []),
        ...(runtime.activeSim !== SHOWCASE_DEFAULT_SIM
          ? [{ type: 'setSim' as const, simId: SHOWCASE_DEFAULT_SIM }]
          : []),
        ...(runtime.activeTab !== 'dashboard'
          ? [{ type: 'setTab' as const, tab: 'dashboard' as const }]
          : []),
        ...(runtime.selectedQuestionId !== null
          ? [{ type: 'setQuestion' as const, questionId: null }]
          : []),
        ...(runtime.activeModal !== null
          ? [{ type: 'setModal' as const, modal: null }]
          : []),
        { type: 'resetAnalisisAccordions' as const },
      ],
    });
  }

  /* —— 1–2: Inicio: scroll a Ver Claves, subir, clic Ver Ranking —— */
  if (elapsed < T.T_DASHBOARD_END) {
    const clavesPan = scrollEndPan;
    let panY = 0;
    if (elapsed >= T.T_DASH_SCROLL_START) {
      if (elapsed < T.T_DASH_SCROLL_CLAVES_END) {
        panY = panLerp(elapsed, T.T_DASH_SCROLL_START, T.T_DASH_SCROLL_CLAVES_END, 0, clavesPan);
      } else if (elapsed < T.T_DASH_SCROLL_TOP_END) {
        panY = panLerp(elapsed, T.T_DASH_SCROLL_CLAVES_END, T.T_DASH_SCROLL_TOP_END, clavesPan, 0);
      }
    }

    let target: string = ids.sectionScore;
    let fallback = { x: 420, y: 200 };
    let clickAt = T.T_DASH_VER_RANKING_CLICK + 9_999;

    if (elapsed >= T.T_DASH_SCROLL_CLAVES_END - 400 && elapsed < T.T_DASH_SCROLL_TOP_END) {
      target = ids.sectionClaves;
      fallback = { x: 520, y: 480 };
    }
    if (shouldEngageClickTarget(elapsed, T.T_DASH_VER_RANKING_CLICK)) {
      target = ids.dashboardVerRanking;
      fallback = { x: 720, y: 360 };
      clickAt = T.T_DASH_VER_RANKING_CLICK;
    }

    const dashScrollP = scrollProgressBetween(
      elapsed,
      T.T_DASH_SCROLL_START,
      T.T_DASH_SCROLL_CLAVES_END,
    );
    const rankingApproach = shouldEngageClickTarget(elapsed, T.T_DASH_VER_RANKING_CLICK);
    const engage =
      rankingApproach ||
      (elapsed >= T.T_DASH_SCROLL_START && elapsed < T.T_DASH_SCROLL_CLAVES_END + 400);

    return targetFrame(ctx, panY, target, fallback, [], elapsed, clickAt, 'idle', {
      engageTarget: engage,
      scrollProgress: engage ? undefined : dashScrollP,
      originId: rankingApproach ? ids.sectionClaves : ids.sectionScore,
      originFallback: rankingApproach ? { x: 520, y: 480 } : { x: 420, y: 200 },
    });
  }

  /* —— 3–4: Ranking: scroll al fondo, subir, Volver al Dashboard —— */
  if (elapsed < T.T_RANKING_END) {
    const landed = panelLandedAt(T.T_RANK_START);
    let panY = 0;
    if (runtime.activeTab === 'ranking') {
      if (elapsed < T.T_RANK_SCROLL_MID_END) {
        panY = panelScrollToBottom(elapsed, landed, T.T_RANK_SCROLL_MID_END, maxPan);
      } else if (elapsed < T.T_RANK_SCROLL_TOP_END) {
        panY = panLerp(elapsed, T.T_RANK_SCROLL_MID_END, T.T_RANK_SCROLL_TOP_END, maxPan, 0);
      }
    }

    let target: string = ids.sectionRankingKpi;
    let fallback = { x: 540, y: 300 };
    let clickAt = T.T_RANK_BACK_CLICK;

    if (shouldEngageClickTarget(elapsed, T.T_RANK_BACK_CLICK)) {
      target = ids.rankingBackDashboard;
      fallback = { x: 900, y: 72 };
    }

    const rankScrollP = scrollProgressBetween(elapsed, landed, T.T_RANK_SCROLL_MID_END);
    const engage = shouldEngageClickTarget(elapsed, T.T_RANK_BACK_CLICK);

    return targetFrame(ctx, panY, target, fallback, [], elapsed, clickAt, 'idle', {
      engageTarget: engage,
      scrollProgress: engage ? undefined : rankScrollP,
      originId: ids.sectionRankingKpi,
      originFallback: { x: 540, y: 300 },
    });
  }

  /* —— 5: Inicio → Respuestas (nav header) —— */
  if (elapsed < T.T_RESP_NAV_END) {
    return targetFrame(
      ctx,
      0,
      ids.navRespuestas,
      { x: 1010, y: 42 },
      [],
      elapsed,
      T.T_RESP_NAV_CLICK,
      'idle',
      {
        engageTarget: true,
        originId: ids.rankingBackDashboard,
        originFallback: { x: 900, y: 72 },
      },
    );
  }

  /* —— 6–7: Análisis: scroll completo, subir, tabs materias, pregunta inglés —— */
  if (elapsed < T.T_RESPUESTAS_END) {
    const onPanel = runtime.activeTab === 'respuestas';
    const landed = panelLandedAt(T.T_RESP_START);

    let panY = 0;
    if (onPanel) {
      if (elapsed < T.T_RESP_SCROLL_END) {
        panY = panelScrollToBottom(elapsed, landed, T.T_RESP_SCROLL_END, maxPan);
      } else if (elapsed < T.T_RESP_SCROLL_TOP_END) {
        panY = panLerp(elapsed, T.T_RESP_SCROLL_END, T.T_RESP_SCROLL_TOP_END, maxPan, 0);
      }
    }

    if (onPanel && elapsed >= T.T_RESP_SCROLL_TOP_END && elapsed < T.T_RESP_DEMO_DETAIL_END) {
      panY = panToTarget(ctx, ids.sectionAnalisisInsights, 0.18, 'top', 0);
    }

    const respScrollP = scrollProgressBetween(elapsed, landed, T.T_RESP_SCROLL_END);

    if (elapsed < T.T_RESP_REPASAR_CLICK) {
      return targetFrame(
        ctx,
        panY,
        ids.analisisExpandLogros,
        { x: 520, y: 430 },
        onClickPulse(elapsed, T.T_RESP_LOGROS_CLICK)
          ? [{ type: 'setAnalisisLogrosOpen' as const, open: true }]
          : [],
        elapsed,
        T.T_RESP_LOGROS_CLICK,
        'idle',
        {
          engageTarget: shouldEngageClickTarget(elapsed, T.T_RESP_LOGROS_CLICK),
          scrollProgress: shouldEngageClickTarget(elapsed, T.T_RESP_LOGROS_CLICK) ? undefined : respScrollP,
          originId: ids.sectionRespuestasKpi,
          originFallback: { x: 570, y: 280 },
        },
      );
    }

    if (elapsed < T.T_RESP_DEMO_QUESTION_CLICK) {
      return targetFrame(
        ctx,
        panY,
        ids.analisisExpandRepasar,
        { x: 520, y: 520 },
        onClickPulse(elapsed, T.T_RESP_REPASAR_CLICK)
          ? [
              { type: 'setAnalisisLogrosOpen' as const, open: false },
              { type: 'setAnalisisRepasarOpen' as const, open: true },
            ]
          : [],
        elapsed,
        T.T_RESP_REPASAR_CLICK,
        'idle',
        {
          engageTarget: shouldEngageClickTarget(elapsed, T.T_RESP_REPASAR_CLICK),
          scrollProgress: shouldEngageClickTarget(elapsed, T.T_RESP_REPASAR_CLICK) ? undefined : respScrollP,
          originId: ids.analisisExpandLogros,
          originFallback: { x: 520, y: 430 },
        },
      );
    }

    if (elapsed < T.T_RESP_DEMO_DETAIL_END) {
      const targetId = showcaseDomIds.questionBox(DEMO_ANALISIS_QUESTION_ID);
      const detailStart = T.T_RESP_DEMO_QUESTION_CLICK + 220;
      if (onPanel && elapsed >= T.T_RESP_REPASAR_CLICK + TOUR_POST_NAV_SETTLE_MS) {
        const questionPan = panToTarget(ctx, targetId, 0.48, 'center', panY);
        panY =
          elapsed < T.T_RESP_DEMO_QUESTION_CLICK
            ? panLerp(
                elapsed,
                T.T_RESP_REPASAR_CLICK + TOUR_POST_NAV_SETTLE_MS,
                T.T_RESP_DEMO_QUESTION_CLICK,
                panY,
                questionPan,
              )
            : questionPan;
      }
      return targetFrame(
        ctx,
        panY,
        targetId,
        { x: 520, y: 520 },
        onClickPulse(elapsed, T.T_RESP_DEMO_QUESTION_CLICK)
          ? [
              { type: 'setAnalisisLogrosOpen' as const, open: false },
              { type: 'setAnalisisRepasarOpen' as const, open: false },
              { type: 'setQuestion' as const, questionId: DEMO_ANALISIS_QUESTION_ID },
            ]
          : elapsed >= detailStart && runtime.selectedQuestionId !== null
            ? [{ type: 'setQuestion' as const, questionId: null }]
            : [],
        elapsed,
        T.T_RESP_DEMO_QUESTION_CLICK,
        'idle',
        {
          engageTarget: shouldEngageClickTarget(elapsed, T.T_RESP_DEMO_QUESTION_CLICK),
          scrollProgress: shouldEngageClickTarget(elapsed, T.T_RESP_DEMO_QUESTION_CLICK) ? undefined : respScrollP,
          originId: ids.analisisExpandRepasar,
          originFallback: { x: 520, y: 520 },
        },
      );
    }

    const tabClicks = [
      { at: T.T_RESP_MATE_CLICK, key: MATERIA_TABS[0] },
      { at: T.T_RESP_SOC_CLICK, key: MATERIA_TABS[1] },
      { at: T.T_RESP_CIEN_CLICK, key: MATERIA_TABS[2] },
      { at: T.T_RESP_ING_CLICK, key: MATERIA_TABS[3] },
    ];

    let target: string = ids.sectionRespuestasKpi;
    let fallback = { x: 570, y: 280 };
    let clickAt = T.T_RESP_QUESTION_CLICK;

    let originId: string = ids.sectionRespuestasKpi;
    let originFallback = { x: 570, y: 280 };

    for (let i = tabClicks.length - 1; i >= 0; i--) {
      const { at, key } = tabClicks[i];
      if (shouldEngageClickTarget(elapsed, at)) {
        if (i > 0) {
          originId = showcaseDomIds.materiaTab(tabClicks[i - 1].key);
          originFallback = { x: 480 + (i - 1) * 130, y: 96 };
        }
        target = showcaseDomIds.materiaTab(key);
        fallback = { x: 480 + i * 130, y: 96 };
        clickAt = at;
        break;
      }
    }

    if (shouldEngageClickTarget(elapsed, T.T_RESP_QUESTION_CLICK)) {
      originId = showcaseDomIds.materiaTab(MATERIA_TABS[3]);
      originFallback = { x: 480 + 3 * 130, y: 96 };
      target = showcaseDomIds.questionBox(INGLES_QUESTION_ID);
      fallback = { x: 520, y: 520 };
      clickAt = T.T_RESP_QUESTION_CLICK;
    }

    const questionTargetId = showcaseDomIds.questionBox(INGLES_QUESTION_ID);
    const inglesSettledAt = T.T_RESP_ING_CLICK + TOUR_POST_NAV_SETTLE_MS;
    if (
      onPanel &&
      elapsed >= inglesSettledAt &&
      elapsed < T.T_RESP_QUESTION_CLICK + 200 &&
      ctx.viewportEl &&
      ctx.rootEl
    ) {
      const scrollTop = measureShowcaseScrollToTarget(
        ctx.viewportEl,
        ctx.rootEl,
        questionTargetId,
        0.42,
        'center',
      );
      const targetPan = scrollTop > 0 ? -scrollTop : panY;
      if (elapsed < T.T_RESP_QUESTION_CLICK) {
        panY = panLerp(elapsed, inglesSettledAt, T.T_RESP_QUESTION_CLICK, panY, targetPan);
      } else {
        panY = targetPan;
      }
    }

    const tourDispatches: ShowcaseTourDispatch[] = [];
    for (const { at, key } of tabClicks) {
      if (onClickPulse(elapsed, at)) {
        tourDispatches.push({ type: 'resetAnalisisAccordions' });
        tourDispatches.push({ type: 'openRespuestas', materia: key });
      }
    }
    if (onClickPulse(elapsed, T.T_RESP_ING_CLICK)) {
      tourDispatches.push({ type: 'openRespuestas', materia: 'inglés' });
    }
    if (onClickPulse(elapsed, T.T_RESP_QUESTION_CLICK)) {
      tourDispatches.push({ type: 'setQuestion', questionId: INGLES_QUESTION_ID });
    }

    const engageTabs = shouldEngageClickTarget(elapsed, clickAt);

    return targetFrame(ctx, panY, target, fallback, tourDispatches, elapsed, clickAt, 'idle', {
      engageTarget: engageTabs,
      scrollProgress: engageTabs ? undefined : respScrollP,
      originId,
      originFallback,
    });
  }

  /* —— 8: Atrás análisis → Métricas —— */
  if (elapsed < T.T_MET_NAV_END) {
    if (elapsed < T.T_MET_NAV_CLICK - 200) {
      return targetFrame(
        ctx,
        0,
        ids.navBack,
        { x: 1180, y: 36 },
        onClickPulse(elapsed, T.T_ANAL_BACK_CLICK) && runtime.selectedQuestionId !== null
          ? [{ type: 'setQuestion' as const, questionId: null }]
          : [],
        elapsed,
        T.T_ANAL_BACK_CLICK,
        'idle',
        {
          engageTarget: true,
          originId: showcaseDomIds.questionBox(INGLES_QUESTION_ID),
          originFallback: { x: 520, y: 520 },
        },
      );
    }
    return targetFrame(
      ctx,
      0,
      ids.navMetricas,
      { x: 1010, y: 42 },
      [],
      elapsed,
      T.T_MET_NAV_CLICK,
      'idle',
      {
        engageTarget: true,
        originId: ids.navBack,
        originFallback: { x: 1180, y: 36 },
      },
    );
  }

  /* —— 9: Métricas: scroll completo, subir, Volver —— */
  if (elapsed < T.T_METRICAS_END) {
    const landed = panelLandedAt(T.T_METRICAS_START);
    let panY = 0;
    if (runtime.activeTab === 'metricas') {
      if (elapsed < T.T_MET_SCROLL_END) {
        panY = panelScrollToBottom(elapsed, landed, T.T_MET_SCROLL_END, maxPan);
      } else if (elapsed < T.T_MET_SCROLL_TOP_END) {
        panY = panLerp(elapsed, T.T_MET_SCROLL_END, T.T_MET_SCROLL_TOP_END, maxPan, 0);
      }
    }

    let target: string = ids.sectionMetricasHero;
    let fallback = { x: 500, y: 260 };
    let clickAt = T.T_MET_BACK_CLICK;

    if (shouldEngageClickTarget(elapsed, T.T_MET_BACK_CLICK)) {
      target = ids.navBack;
      fallback = { x: 1180, y: 72 };
    }

    const metScrollP = scrollProgressBetween(elapsed, landed, T.T_MET_SCROLL_END);
    const engage = shouldEngageClickTarget(elapsed, T.T_MET_BACK_CLICK);

    return targetFrame(ctx, panY, target, fallback, [], elapsed, clickAt, 'idle', {
      engageTarget: engage,
      scrollProgress: engage ? undefined : metScrollP,
      originId: ids.sectionMetricasHero,
      originFallback: { x: 500, y: 260 },
    });
  }

  return targetFrame(
    ctx,
    0,
    ids.navDashboard,
    { x: 750, y: 42 },
    onClickPulse(elapsed, T.T_TAIL_CLICK)
      ? [
          ...(runtime.selectedQuestionId !== null
            ? [{ type: 'setQuestion' as const, questionId: null }]
            : []),
          ...(runtime.activeModal !== null
            ? [{ type: 'setModal' as const, modal: null }]
            : []),
        ]
      : [],
    elapsed,
    T.T_TAIL_CLICK,
    'idle',
    {
      engageTarget: true,
      originId: ids.navBack,
      originFallback: { x: 1180, y: 72 },
    },
  );
}

export function applyShowcaseTourDispatches(
  dispatches: ShowcaseTourDispatch[],
  handlers: {
    setActiveScreen: (screen: ShowcaseStudentScreen) => void;
    selectSim: (simId: string) => void;
    openDashboard: () => void;
    openMetricas: () => void;
    openRespuestas: (materia?: string | null) => void;
    openRanking: () => void;
    openPerfil: () => void;
    toggleAnalisisLogros: () => void;
    toggleAnalisisRepasar: () => void;
    setAnalisisLogrosOpen: (open: boolean) => void;
    setAnalisisRepasarOpen: (open: boolean) => void;
    resetAnalisisAccordions: () => void;
    setSelectedQuestionId: (id: string | null) => void;
    setActiveModal: (modal: ShowcaseModal | null) => void;
  },
) {
  for (const d of dispatches) {
    if (d.type === 'setScreen') handlers.setActiveScreen(d.screen);
    if (d.type === 'setSim') handlers.selectSim(d.simId);
    if (d.type === 'setTab') {
      if (d.tab === 'dashboard') handlers.openDashboard();
      else if (d.tab === 'metricas') handlers.openMetricas();
      else if (d.tab === 'ranking') handlers.openRanking();
      else if (d.tab === 'perfil') handlers.openPerfil();
      else handlers.openRespuestas();
    }
    if (d.type === 'openRespuestas') handlers.openRespuestas(d.materia);
    if (d.type === 'toggleAnalisisLogros') handlers.toggleAnalisisLogros();
    if (d.type === 'toggleAnalisisRepasar') handlers.toggleAnalisisRepasar();
    if (d.type === 'setAnalisisLogrosOpen') handlers.setAnalisisLogrosOpen(d.open);
    if (d.type === 'setAnalisisRepasarOpen') handlers.setAnalisisRepasarOpen(d.open);
    if (d.type === 'resetAnalisisAccordions') handlers.resetAnalisisAccordions();
    if (d.type === 'setQuestion') handlers.setSelectedQuestionId(d.questionId);
    if (d.type === 'setModal') handlers.setActiveModal(d.modal);
  }
}
