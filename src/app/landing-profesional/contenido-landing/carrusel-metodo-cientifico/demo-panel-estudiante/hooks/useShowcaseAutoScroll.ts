'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { isDocumentHidden } from '@/app/landing-profesional/contenido-landing/utilidades/landingAnimationTier';
import { showcaseDomIds } from '../constants/dom-ids';
import type { ShowcaseDashboardTab } from '../types/showcase.types';
import { useShowcaseEmbed } from '../context/ShowcaseEmbedProvider';
import {
  applyShowcaseTourDispatches,
  computeShowcaseTourFrame,
} from '../tour/compute-tour-frame';
import { fireTourTargetClick } from '../tour/tour-interaction';
import { measureShowcaseTourPanExtent } from '../tour/measure';
import { syncShowcaseNativeScrollSizer } from '../viewport/measure-embed-layout';
import { SHOWCASE_TOUR_CURSOR_HOME } from '../tour/tour-config';
import { getShowcaseTourCycleMs, SHOWCASE_TOUR_CYCLE_MS } from '../tour/tour-timeline';
import type { ShowcaseTourSectionMeta } from '../tour/tour-config';
import type { ShowcaseCursor } from '../types/showcase.types';
import { panYToScrollTop } from '../tour/coordinates';
import { syncTourFrameToViewport } from '../tour/sync-cursor-with-viewport';
import {
  applyShowcaseCursorTransform,
  applyShowcaseStageScroll,
  cursorChanged,
  scrollTopChanged,
} from '../utilidades/showcaseTourDom';
import {
  getShowcaseTourFrameIntervalMs,
  smoothScrollTopToward,
} from '../utilidades/showcaseTourScroll';

export { SHOWCASE_TOUR_CYCLE_MS as SHOWCASE_SCROLL_CYCLE_MS };

const defaultCursor: ShowcaseCursor = { ...SHOWCASE_TOUR_CURSOR_HOME, state: 'hidden' };
/** Suavizado puntero en scroll; hover/click van al target sin lag. */
const CURSOR_SMOOTH_IDLE = 0.22;

const BOOT_MAX_FRAMES = 24;
const REMEASURE_FRAMES_AFTER_NAV = 8;

const SCROLL_BOTTOM_BY_TAB: Record<ShowcaseDashboardTab, string> = {
  dashboard: showcaseDomIds.sectionClaves,
  ranking: showcaseDomIds.sectionRankingTop,
  perfil: showcaseDomIds.sectionPerfilSocial,
  metricas: showcaseDomIds.sectionMetricasArea,
  respuestas: showcaseDomIds.sectionHeatmap,
};

function smoothCursorToward(prev: ShowcaseCursor, target: ShowcaseCursor): ShowcaseCursor {
  if (target.state === 'hidden') return target;
  if (prev.state === 'hidden') return target;
  if (target.state === 'hover' || target.state === 'click') return target;
  return {
    x: prev.x + (target.x - prev.x) * CURSOR_SMOOTH_IDLE,
    y: prev.y + (target.y - prev.y) * CURSOR_SMOOTH_IDLE,
    state: target.state,
  };
}

export function useShowcaseAutoScroll({
  isActive,
  stageRef,
  scrollSizerRef,
  contentRef,
  cursorRef,
  compactTour = false,
}: {
  isActive: boolean;
  stageRef: RefObject<HTMLElement | null>;
  scrollSizerRef: RefObject<HTMLElement | null>;
  contentRef: RefObject<HTMLElement | null>;
  cursorRef: RefObject<HTMLElement | null>;
  /** Layout compacto móvil: timeline con scroll más lento. */
  compactTour?: boolean;
}) {
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [tourPhase, setTourPhase] = useState<ShowcaseTourSectionMeta | null>(null);

  const embed = useShowcaseEmbed();
  const embedRef = useRef(embed);
  embedRef.current = embed;

  const scrollTopRef = useRef(0);
  const cursorRefState = useRef<ShowcaseCursor>(defaultCursor);
  const highlightRef = useRef<string | null>(null);
  const tourPhaseIdRef = useRef<string | null>(null);
  const compactTourRef = useRef(compactTour);
  compactTourRef.current = compactTour;

  const scrollStateRef = useRef({
    maxPan: 0,
    scrollEndPan: 0,
    lastStageW: 0,
    lastTab: '',
    lastScreen: '',
    remeasureFramesLeft: 0,
  });
  const lastDomClickBeatRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isActive) {
      scrollTopRef.current = 0;
      applyShowcaseStageScroll(stageRef.current, 0);
      cursorRefState.current = defaultCursor;
      applyShowcaseCursorTransform(cursorRef.current, defaultCursor);
      highlightRef.current = null;
      setHighlightId(null);
      tourPhaseIdRef.current = null;
      setTourPhase(null);
      return undefined;
    }

    const frameIntervalMs = getShowcaseTourFrameIntervalMs();
    let raf = 0;
    let start: number | null = null;
    let bootFrames = 0;
    let lastScreen = embedRef.current.activeScreen;
    let lastTab = embedRef.current.activeTab;
    let lastSim = embedRef.current.activeSim;
    let lastTickAt = 0;

    const syncScrollExtent = (force = false) => {
      const stage = stageRef.current;
      const root = contentRef.current;
      const sizer = scrollSizerRef.current;
      if (!stage || !root) return false;

      const stageW = stage.getBoundingClientRect().width;
      if (stageW < 48) return false;

      const tab = embedRef.current.activeTab;
      const screen = embedRef.current.activeScreen;
      const state = scrollStateRef.current;
      const widthChanged = Math.abs(stageW - state.lastStageW) > 2;
      const tabChanged = tab !== state.lastTab;
      const screenChanged = screen !== state.lastScreen;
      const shouldMeasure = force || widthChanged || tabChanged || screenChanged;
      if (!shouldMeasure) return false;

      if (sizer) {
        const slot = stage.closest('[data-showcase-compact-native="on"]');
        const nativeWidth = slot !== null;
        const zoomAttr = slot?.getAttribute('data-showcase-compact-zoom');
        const contentZoom = zoomAttr ? Math.max(1, Number.parseFloat(zoomAttr) || 1) : 1;
        syncShowcaseNativeScrollSizer(stage, sizer, root, {
          nativeWidth,
          contentZoom: nativeWidth ? contentZoom : undefined,
        });
      }

      const bottomId = SCROLL_BOTTOM_BY_TAB[tab] ?? null;
      const { maxPan, scrollEndPan } = measureShowcaseTourPanExtent(stage, null, root, bottomId);

      state.maxPan = maxPan;
      state.scrollEndPan = scrollEndPan;
      state.lastStageW = stageW;
      state.lastTab = tab;
      state.lastScreen = screen;

      if (tabChanged || screenChanged) {
        scrollTopRef.current = 0;
        applyShowcaseStageScroll(stage, 0);
      }

      return true;
    };

    const scheduleRemeasure = () => {
      scrollStateRef.current.remeasureFramesLeft = REMEASURE_FRAMES_AFTER_NAV;
    };

    const commitFrame = (
      rawFrame: ReturnType<typeof computeShowcaseTourFrame>,
      deltaMs: number,
    ) => {
      const targetScrollTop = panYToScrollTop(rawFrame.panY);
      let workingScrollTop = smoothScrollTopToward(
        scrollTopRef.current,
        targetScrollTop,
        deltaMs,
      );

      const synced = syncTourFrameToViewport(
        rawFrame,
        stageRef.current,
        contentRef.current,
        workingScrollTop,
      );
      if (synced.scrollTop !== workingScrollTop) {
        workingScrollTop = smoothScrollTopToward(
          scrollTopRef.current,
          synced.scrollTop,
          deltaMs,
        );
      }

      if (scrollTopChanged(scrollTopRef.current, workingScrollTop)) {
        scrollTopRef.current = workingScrollTop;
        applyShowcaseStageScroll(stageRef.current, workingScrollTop);
      }

      const frame = synced.frame;
      const smoothed = smoothCursorToward(cursorRefState.current, frame.cursor);
      if (cursorChanged(cursorRefState.current, smoothed)) {
        cursorRefState.current = smoothed;
        applyShowcaseCursorTransform(cursorRef.current, smoothed);
      }

      if (highlightRef.current !== frame.highlightId) {
        highlightRef.current = frame.highlightId;
        setHighlightId(frame.highlightId);
      }

      const phaseId = frame.tourPhase?.id ?? null;
      if (tourPhaseIdRef.current !== phaseId) {
        tourPhaseIdRef.current = phaseId;
        setTourPhase(frame.tourPhase);
      }
    };

    const tick = (now: number) => {
      if (isDocumentHidden()) {
        raf = requestAnimationFrame(tick);
        return;
      }

      if (lastTickAt > 0 && now - lastTickAt < frameIntervalMs) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const deltaMs = lastTickAt > 0 ? now - lastTickAt : frameIntervalMs;
      lastTickAt = now;
      const scrollState = scrollStateRef.current;

      if (start === null) {
        start = now;
        syncScrollExtent(true);
      }

      if (scrollState.remeasureFramesLeft > 0) {
        scrollState.remeasureFramesLeft -= 1;
        syncScrollExtent(true);
      }

      const tourCycleMs = getShowcaseTourCycleMs(compactTourRef.current);
      const elapsed = (now - start) % tourCycleMs;
      const viewportEl = stageRef.current;
      const rootEl = contentRef.current;
      const e = embedRef.current;

      if (e.activeScreen !== lastScreen || e.activeTab !== lastTab || e.activeSim !== lastSim) {
        lastScreen = e.activeScreen;
        lastTab = e.activeTab;
        lastSim = e.activeSim;
        scheduleRemeasure();
      }

      syncScrollExtent(false);

      const frame = computeShowcaseTourFrame({
        elapsed,
        viewportEl,
        rootEl,
        maxPan: scrollState.maxPan,
        scrollEndPan: scrollState.scrollEndPan,
        compactTour: compactTourRef.current,
        runtime: {
          activeScreen: e.activeScreen,
          activeSim: e.activeSim,
          activeTab: e.activeTab,
          selectedQuestionId: e.selectedQuestionId,
          activeModal: e.activeModal,
        },
      });

      if (frame.dispatches.length > 0) {
        applyShowcaseTourDispatches(frame.dispatches, {
          selectSim: e.selectSim,
          setActiveScreen: e.setActiveScreen,
          openDashboard: e.openDashboard,
          openMetricas: e.openMetricas,
          openRespuestas: e.openRespuestas,
          openRanking: e.openRanking,
          openPerfil: e.openPerfil,
          toggleAnalisisLogros: e.toggleAnalisisLogros,
          toggleAnalisisRepasar: e.toggleAnalisisRepasar,
          setAnalisisLogrosOpen: e.setAnalisisLogrosOpen,
          setAnalisisRepasarOpen: e.setAnalisisRepasarOpen,
          resetAnalisisAccordions: e.resetAnalisisAccordions,
          setSelectedQuestionId: e.setSelectedQuestionId,
          setActiveModal: e.setActiveModal,
        });
      }

      if (frame.domClickTargetId && frame.cursor.state === 'click') {
        const beatKey = frame.domClickTargetId;
        if (lastDomClickBeatRef.current !== beatKey) {
          lastDomClickBeatRef.current = beatKey;
          const questionDispatch = frame.dispatches.some(
            (d) => d.type === 'setQuestion' && d.questionId,
          );
          const controlledDispatch = frame.dispatches.some(
            (d) =>
              d.type === 'openRespuestas' ||
              d.type === 'toggleAnalisisLogros' ||
              d.type === 'toggleAnalisisRepasar' ||
              d.type === 'setAnalisisLogrosOpen' ||
              d.type === 'setAnalisisRepasarOpen',
          );
          if (!questionDispatch && !controlledDispatch) {
            fireTourTargetClick(rootEl, frame.domClickTargetId);
          }
        }
      } else if (frame.cursor.state !== 'click') {
        lastDomClickBeatRef.current = null;
      }

      if (
        frame.dispatches.some(
          (d) =>
            d.type === 'setScreen' ||
            d.type === 'setTab' ||
            d.type === 'openRespuestas' ||
            d.type === 'toggleAnalisisLogros' ||
            d.type === 'toggleAnalisisRepasar' ||
            d.type === 'setAnalisisLogrosOpen' ||
            d.type === 'setAnalisisRepasarOpen' ||
            d.type === 'resetAnalisisAccordions' ||
            d.type === 'setQuestion' ||
            d.type === 'setModal',
        )
      ) {
        scheduleRemeasure();
      }

      commitFrame(frame, deltaMs);

      raf = requestAnimationFrame(tick);
    };

    const boot = () => {
      bootFrames += 1;
      const stage = stageRef.current;
      const ready = stage && stage.getBoundingClientRect().width >= 48;
      if (!ready && bootFrames < BOOT_MAX_FRAMES) {
        raf = requestAnimationFrame(boot);
        return;
      }
      syncScrollExtent(true);
      raf = requestAnimationFrame(tick);
    };

    boot();

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [isActive, compactTour, contentRef, scrollSizerRef, stageRef, cursorRef]);

  return { highlightId, tourPhase };
}
