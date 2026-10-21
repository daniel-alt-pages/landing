'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Pause, Play, Square } from 'lucide-react';
import { useCoordinadorGuidedTour } from '@features/coordinador/context/CoordinadorGuidedTourContext';
import type { GuidedTourStep, TourTooltipPosition } from '@features/coordinador/lib/coordinatorGuidedTourSteps';
import { resolveStepAnchor } from '@features/coordinador/lib/coordinatorGuidedTourSteps';
import { waitForTourAnchor } from '@features/coordinador/lib/tourDomUtils';
import { COORD_TOUR_MODULE_LABELS } from '@features/coordinador/lib/coordinatorGuidedTourStorage';
import { stepToSpeechText } from '@features/coordinador/lib/coordinatorPageGuides';
import { useCoordinatorVoiceGuide } from '@features/coordinador/hooks/useCoordinatorVoiceGuide';

const PADDING = 6;
const GAP = 16;
const TOOLTIP_RESERVE_PX = 180;
const VIEWPORT_EDGE_PX = 16;
const MAX_SPOTLIGHT_VH_RATIO = 0.5;
const MAX_SECTION_SPOTLIGHT_VH_RATIO = 0.62;
const MAX_SPOTLIGHT_PX = 420;
const MAX_SECTION_SPOTLIGHT_PX = 560;
const TALL_ANCHOR_VH_RATIO = 0.5;
const MIN_SPOTLIGHT_W = 160;
const MIN_SPOTLIGHT_H = 72;
const MAX_ANCHOR_PARENT_WALK = 5;

type Rect = { top: number; left: number; width: number; height: number };
type ViewBounds = { top: number; bottom: number; height: number; width: number };

function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function findScrollableParent(el: Element): HTMLElement | null {
    let node = el.parentElement;
    while (node && node !== document.documentElement) {
        const style = getComputedStyle(node);
        const oy = style.overflowY;
        if (
            (oy === 'auto' || oy === 'scroll' || oy === 'overlay') &&
            node.scrollHeight > node.clientHeight + 1
        ) {
            return node;
        }
        node = node.parentElement;
    }
    return null;
}

function getVisibilityBounds(el: Element): { top: number; bottom: number; height: number } {
    const scrollParent = findScrollableParent(el);
    if (scrollParent) {
        const r = scrollParent.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: r.height };
    }
    return { top: 0, bottom: window.innerHeight, height: window.innerHeight };
}

function getViewBounds(el: Element | null): ViewBounds {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 400;
    if (el) {
        const b = getVisibilityBounds(el);
        return { top: b.top, bottom: b.bottom, height: b.height, width: vw };
    }
    const vh = typeof window !== 'undefined' ? window.innerHeight : 700;
    return { top: 0, bottom: vh, height: vh, width: vw };
}

function clipRectToView(rect: Rect, bounds: ViewBounds): Rect {
    const top = Math.max(rect.top, bounds.top);
    const bottom = Math.min(rect.top + rect.height, bounds.bottom);
    const height = Math.max(0, bottom - top);
    return { ...rect, top, height: height > 0 ? height : rect.height };
}

function clamp(value: number, min: number, max: number): number {
    if (max < min) return min;
    return Math.max(min, Math.min(value, max));
}

function padSpotlightRect(rect: Rect, bounds: ViewBounds, sectionAnchor: boolean): Rect {
    const viewportW = Math.max(1, bounds.width - VIEWPORT_EDGE_PX * 2);
    const viewportH = Math.max(1, bounds.height - VIEWPORT_EDGE_PX * 2);
    const maxH = Math.min(
        bounds.height * (sectionAnchor ? MAX_SECTION_SPOTLIGHT_VH_RATIO : MAX_SPOTLIGHT_VH_RATIO),
        sectionAnchor ? MAX_SECTION_SPOTLIGHT_PX : MAX_SPOTLIGHT_PX,
    );

    const width = clamp(
        Math.max(rect.width + PADDING * 2, Math.min(MIN_SPOTLIGHT_W, viewportW)),
        1,
        viewportW,
    );
    const height = clamp(
        Math.max(rect.height + PADDING * 2, Math.min(MIN_SPOTLIGHT_H, viewportH)),
        1,
        Math.max(1, Math.min(maxH, viewportH)),
    );
    const left = clamp(rect.left - (width - rect.width) / 2, VIEWPORT_EDGE_PX, bounds.width - width - VIEWPORT_EDGE_PX);
    const top = clamp(rect.top - PADDING, bounds.top + VIEWPORT_EDGE_PX, bounds.bottom - height - VIEWPORT_EDGE_PX);

    return { top, left, width, height };
}

function isTallAnchor(rect: DOMRect, bounds: { height: number }): boolean {
    return rect.height > bounds.height * TALL_ANCHOR_VH_RATIO;
}

function anchorNeedsScroll(el: Element, position: TourTooltipPosition): boolean {
    const rect = el.getBoundingClientRect();
    const bounds = getVisibilityBounds(el);

    if (rect.top < bounds.top + VIEWPORT_EDGE_PX) return true;
    if (rect.bottom > bounds.bottom - VIEWPORT_EDGE_PX) return true;

    if (isTallAnchor(rect, bounds)) {
        const targetTop = bounds.top + TOOLTIP_RESERVE_PX + VIEWPORT_EDGE_PX;
        return Math.abs(rect.top - targetTop) > 8;
    }

    if (rect.height > bounds.height - VIEWPORT_EDGE_PX * 2) return false;

    const roomAbove = rect.top - bounds.top;
    const roomBelow = bounds.bottom - rect.bottom;

    if (position === 'top' && roomAbove < TOOLTIP_RESERVE_PX) return true;
    if (position === 'bottom' && roomBelow < TOOLTIP_RESERVE_PX) return true;
    if (roomAbove < TOOLTIP_RESERVE_PX && roomBelow < TOOLTIP_RESERVE_PX) return true;

    return false;
}

function scrollAnchorInContainer(el: Element, position: TourTooltipPosition, behavior: ScrollBehavior) {
    const scrollParent = findScrollableParent(el);
    const rect = el.getBoundingClientRect();
    const bounds = getVisibilityBounds(el);

    if (isTallAnchor(rect, bounds)) {
        const targetTop = bounds.top + TOOLTIP_RESERVE_PX + VIEWPORT_EDGE_PX;
        const delta = rect.top - targetTop;
        if (Math.abs(delta) > 2) {
            if (scrollParent) scrollParent.scrollBy({ top: delta, behavior });
            else window.scrollBy({ top: delta, behavior });
        }
        return;
    }

    if (scrollParent) {
        const elCenter = rect.top + rect.height / 2;
        let targetCenter = bounds.top + bounds.height / 2;

        if (position === 'top') {
            targetCenter = bounds.top + TOOLTIP_RESERVE_PX + rect.height / 2 + GAP;
        } else if (position === 'bottom') {
            targetCenter = bounds.bottom - TOOLTIP_RESERVE_PX - rect.height / 2 - GAP;
        }

        targetCenter = Math.max(
            bounds.top + rect.height / 2 + VIEWPORT_EDGE_PX,
            Math.min(bounds.bottom - rect.height / 2 - VIEWPORT_EDGE_PX, targetCenter)
        );

        const delta = elCenter - targetCenter;
        if (Math.abs(delta) > 1) {
            scrollParent.scrollBy({ top: delta, behavior });
            return;
        }
    }

    el.scrollIntoView({ behavior, block: 'center', inline: 'nearest' });
}

function waitForScrollSettle(el: Element, timeoutMs = 700): Promise<void> {
    return new Promise(resolve => {
        let lastTop = el.getBoundingClientRect().top;
        let stableFrames = 0;
        const started = performance.now();

        const tick = () => {
            const top = el.getBoundingClientRect().top;
            if (Math.abs(top - lastTop) < 0.75) stableFrames += 1;
            else {
                stableFrames = 0;
                lastTop = top;
            }

            if (stableFrames >= 4 || performance.now() - started > timeoutMs) {
                resolve();
                return;
            }
            requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    });
}

async function scrollAnchorIntoView(el: Element, position: TourTooltipPosition): Promise<void> {
    if (!anchorNeedsScroll(el, position)) return;

    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
    scrollAnchorInContainer(el, position, behavior);

    if (behavior === 'smooth') {
        await waitForScrollSettle(el);
    } else {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    }
}

function queryAnchor(anchor?: string): Element | null {
    if (!anchor || typeof document === 'undefined') return null;
    return document.querySelector(`[data-coord-tour="${anchor}"]`);
}

/** Anclas `data-coord-tour`: siempre el nodo exacto (nunca subir al layout padre). */
function resolveMeasurableElement(el: Element | null): Element | null {
    if (!el) return null;

    if (el.hasAttribute('data-coord-tour')) {
        return el;
    }

    let node: Element | null = el;
    let walks = 0;

    while (node && walks < MAX_ANCHOR_PARENT_WALK) {
        const r = node.getBoundingClientRect();
        const wideEnough = r.width >= MIN_SPOTLIGHT_W;
        const tallEnough = r.height >= MIN_SPOTLIGHT_H;

        if (wideEnough && tallEnough) return node;

        const parent: Element | null = node.parentElement;
        if (!parent) break;

        if (node.hasAttribute('data-coord-tour')) return node;

        node = parent;
        walks += 1;
    }

    return el;
}

function measureAnchor(el: Element | null): Rect | null {
    const target = resolveMeasurableElement(el);
    if (!target) return null;
    const r = target.getBoundingClientRect();
    if (r.width < 1 && r.height < 1) return null;

    const isSectionAnchor = target.hasAttribute('data-coord-tour');
    const bounds = getViewBounds(target);
    const rect = clipRectToView(
        { top: r.top, left: r.left, width: r.width, height: r.height },
        bounds,
    );

    return padSpotlightRect(rect, bounds, isSectionAnchor);
}

function rectsEqual(a: Rect | null, b: Rect | null): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

function stepCaptionSubtitle(step: GuidedTourStep): string {
    const parts = [step.description];
    if (step.tip) parts.push(step.tip);
    return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export default function CoordinadorGuidedTour() {
    const {
        active,
        stepIndex,
        steps,
        routeKey,
        closeTour,
        next,
        prev,
        stepReadyNonce,
        actionPending,
        fullPanelActive,
        autoPlay,
        toggleAutoPlay,
    } = useCoordinadorGuidedTour();

    const [anchorRect, setAnchorRect] = useState<Rect | null>(null);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const {
        startSpeaking,
        stopSpeaking,
        warmUp,
        isPlaying,
        isPaused,
        canPause,
        currentLine,
        spokenInLine,
        lineIndex,
        lineCount,
        togglePause,
    } = useCoordinatorVoiceGuide();

    const step: GuidedTourStep | undefined = steps[stepIndex];
    const stepId = step?.id;
    const total = steps.length;
    const isFirst = stepIndex <= 0;
    const isLast = stepIndex >= total - 1;

    const remeasure = useCallback(() => {
        const current = steps[stepIndex];
        if (!current) return;
        const anchorId = resolveStepAnchor(current);
        const el = current.highlight !== false && anchorId ? queryAnchor(anchorId) : null;
        const rect = current.position === 'center' || !anchorId ? null : measureAnchor(el);
        setAnchorRect(prev => (rectsEqual(prev, rect) ? prev : rect));
    }, [steps, stepIndex]);

    useEffect(() => {
        if (!active) {
            stopSpeaking();
            setVoiceEnabled(false);
        }
    }, [active, stopSpeaking]);

    useEffect(() => {
        if (!active || typeof document === 'undefined') return;
        document.documentElement.classList.add('coord-guided-tour-scroll-lock');
        return () => {
            document.documentElement.classList.remove('coord-guided-tour-scroll-lock');
        };
    }, [active]);

    useEffect(() => {
        if (!active || !voiceEnabled || !step) return;
        startSpeaking(stepToSpeechText(step));
    }, [active, voiceEnabled, stepId, step, startSpeaking]);

    useLayoutEffect(() => {
        if (!active || !stepId) return;

        let cancelled = false;

        const layoutStep = async () => {
            const current = steps[stepIndex];
            if (!current) return;

            const anchorId = resolveStepAnchor(current);

            if (current.highlight !== false && anchorId && current.position !== 'center') {
                const el = await waitForTourAnchor(anchorId, 1200);
                if (cancelled) return;
                if (el) {
                    await scrollAnchorIntoView(el, current.position);
                }
            }

            if (cancelled) return;
            remeasure();
            requestAnimationFrame(() => {
                if (!cancelled) remeasure();
            });
        };

        void layoutStep();

        return () => {
            cancelled = true;
        };
    }, [active, stepId, stepReadyNonce, remeasure, steps, stepIndex]);

    useEffect(() => {
        if (!active) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopImmediatePropagation();
                closeTour({ markDone: false });
                return;
            }
            if (e.key === 'ArrowRight' && !autoPlay) next();
            if (e.key === 'ArrowLeft' && !autoPlay) prev();
        };

        let scrollTimer: ReturnType<typeof setTimeout>;
        const onScroll = () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(remeasure, 100);
        };

        window.addEventListener('keydown', onKey, true);
        window.addEventListener('resize', remeasure);
        window.addEventListener('scroll', onScroll, true);

        return () => {
            window.removeEventListener('keydown', onKey, true);
            window.removeEventListener('resize', remeasure);
            window.removeEventListener('scroll', onScroll, true);
            clearTimeout(scrollTimer);
        };
    }, [active, closeTour, next, prev, remeasure, autoPlay]);

    const activeAnchorRef = useRef<Element | null>(null);

    useLayoutEffect(() => {
        const clearActiveAnchor = () => {
            if (activeAnchorRef.current) {
                activeAnchorRef.current.removeAttribute('data-coord-tour-active');
                activeAnchorRef.current.classList.remove('coord-guided-tour-target--interactive');
                activeAnchorRef.current = null;
            }
        };

        if (!active || !stepId) {
            clearActiveAnchor();
            return;
        }

        const current = steps[stepIndex];
        const anchorId = current ? resolveStepAnchor(current) : undefined;
        const el =
            current?.highlight !== false && anchorId ? queryAnchor(anchorId) : null;
        const measurable = el ? resolveMeasurableElement(el) : null;

        if (activeAnchorRef.current && activeAnchorRef.current !== measurable) {
            activeAnchorRef.current.removeAttribute('data-coord-tour-active');
            activeAnchorRef.current.classList.remove('coord-guided-tour-target--interactive');
            activeAnchorRef.current = null;
        }

        if (measurable) {
            measurable.setAttribute('data-coord-tour-active', '');
            if (current?.allowTargetInteraction) {
                measurable.classList.add('coord-guided-tour-target--interactive');
            } else {
                measurable.classList.remove('coord-guided-tour-target--interactive');
            }
            activeAnchorRef.current = measurable;
        }

        return clearActiveAnchor;
    }, [active, stepId, stepReadyNonce, steps, stepIndex]);

    if (!active || !step || typeof document === 'undefined') return null;

    const showSpotlight = step.highlight !== false && anchorRect;
    const moduleLabel = COORD_TOUR_MODULE_LABELS[routeKey] ?? 'Panel coordinador';
    const progressPct = total > 0 ? Math.round(((stepIndex + 1) / total) * 100) : 0;
    const spotlightRx =
        showSpotlight && anchorRect
            ? anchorRect.height < 88
                ? anchorRect.height / 2
                : 14
            : 14;

    const allowTargetInteraction = Boolean(step.allowTargetInteraction && showSpotlight && anchorRect);
    const actionCanAutoRun = Boolean(step.onAutoAction);
    const nextDisabled = step.mode === 'action' && actionPending && step.advanceOn !== 'next' && !actionCanAutoRun;
    const staticSubtitle = stepCaptionSubtitle(step);
    const showVoiceKaraoke = voiceEnabled && isPlaying && Boolean(currentLine);
    const karaokeSpoken = showVoiceKaraoke ? currentLine!.slice(0, spokenInLine) : '';
    const karaokePending = showVoiceKaraoke ? currentLine!.slice(spokenInLine) : '';

    return createPortal(
        <div
            className="coord-guided-tour-root"
            role="region"
            aria-labelledby="coord-guided-tour-title"
        >
            <div className="coord-guided-tour-live" aria-live="polite" aria-atomic="true">
                {step.title} — paso {stepIndex + 1} de {total}
                {fullPanelActive ? ' · recorrido completo' : ''}
            </div>
            <svg
                className={`coord-guided-tour-overlay${allowTargetInteraction ? ' coord-guided-tour-overlay--interactive' : ''}`}
                aria-hidden
            >
                <defs>
                    <mask id="coord-guided-tour-hole-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {showSpotlight && anchorRect ? (
                            <rect
                                x={anchorRect.left}
                                y={anchorRect.top}
                                width={anchorRect.width}
                                height={anchorRect.height}
                                rx={spotlightRx}
                                fill="black"
                            />
                        ) : null}
                    </mask>
                </defs>
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(8, 15, 30, 0.62)"
                    mask="url(#coord-guided-tour-hole-mask)"
                />
            </svg>

            {allowTargetInteraction && anchorRect ? (
                <>
                    <div
                        className="coord-guided-tour-click-blocker"
                        style={{ top: 0, left: 0, right: 0, height: Math.max(0, anchorRect.top) }}
                        aria-hidden
                    />
                    <div
                        className="coord-guided-tour-click-blocker"
                        style={{
                            top: anchorRect.top,
                            left: 0,
                            width: Math.max(0, anchorRect.left),
                            height: Math.max(0, anchorRect.height),
                        }}
                        aria-hidden
                    />
                    <div
                        className="coord-guided-tour-click-blocker"
                        style={{
                            top: anchorRect.top,
                            left: anchorRect.left + anchorRect.width,
                            right: 0,
                            height: Math.max(0, anchorRect.height),
                        }}
                        aria-hidden
                    />
                    <div
                        className="coord-guided-tour-click-blocker"
                        style={{
                            top: anchorRect.top + anchorRect.height,
                            left: 0,
                            right: 0,
                            bottom: 0,
                        }}
                        aria-hidden
                    />
                </>
            ) : null}

            {showSpotlight && anchorRect && (
                <div
                    className={`coord-guided-tour-spotlight${
                        anchorRect.height < 88 ? ' coord-guided-tour-spotlight--compact' : ''
                    }${allowTargetInteraction ? ' coord-guided-tour-spotlight--interactive' : ''}`}
                    style={{
                        top: anchorRect.top,
                        left: anchorRect.left,
                        width: anchorRect.width,
                        height: anchorRect.height,
                    }}
                    aria-hidden
                />
            )}

            <div className={`coord-guided-tour-caption${step.mode === 'action' ? ' coord-guided-tour-caption--action' : ''}`}>
                <div className="coord-guided-tour-progress" aria-hidden>
                    <div
                        className="coord-guided-tour-progress__fill"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>

                <div className="coord-guided-tour-caption__main">
                    <div className="coord-guided-tour-caption__copy">
                        <div className="coord-guided-tour-caption__head">
                            <div className="coord-guided-tour-tooltip__meta">
                                <span className="coord-guided-tour-tooltip__module">
                                    {fullPanelActive ? 'Tutorial completo' : moduleLabel}
                                </span>
                                <span className="coord-guided-tour-tooltip__step">
                                    <span className="coord-guided-tour-step-full">
                                        Paso {stepIndex + 1} de {total}
                                        {autoPlay ? ' · automático' : ' · manual'}
                                    </span>
                                    <span className="coord-guided-tour-step-compact" aria-hidden>
                                        {stepIndex + 1}/{total}
                                    </span>
                                </span>
                            </div>
                            <button
                                type="button"
                                className="coord-guided-tour-caption__close"
                                onClick={() => closeTour({ markDone: false })}
                                aria-label="Salir del tutorial"
                            >
                                <X className="w-4 h-4" aria-hidden />
                            </button>
                        </div>

                        <h2 id="coord-guided-tour-title" className="coord-guided-tour-tooltip__title">
                            {step.title}
                        </h2>

                        {step.actionLabel && step.mode === 'action' ? (
                            <p className="coord-guided-tour-tooltip__action">{step.actionLabel}</p>
                        ) : null}

                        <div
                            className={`coord-guided-tour-caption__subtitle${showVoiceKaraoke ? ' coord-guided-tour-caption__subtitle--voice' : ''}`}
                            role="doc-subtitle"
                        >
                            {showVoiceKaraoke ? (
                                <>
                                    <div className="coord-guided-tour-caption__voice-meta">
                                        <span className="coord-guided-tour-caption__voice-dot" aria-hidden />
                                        <span>{isPaused ? 'Pausado' : 'Narrando'}</span>
                                        {lineCount > 1 ? (
                                            <span className="coord-guided-tour-caption__voice-counter">
                                                {lineIndex + 1}/{lineCount}
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="coord-guided-tour-caption__subtitle-text">
                                        <span className="coord-guided-tour-caption__spoken">{karaokeSpoken}</span>
                                        <span className="coord-guided-tour-caption__pending">{karaokePending}</span>
                                    </p>
                                    <div className="coord-guided-tour-caption__voice-actions">
                                        {canPause ? (
                                            <button
                                                type="button"
                                                className="coord-guided-tour-caption__voice-btn"
                                                onClick={togglePause}
                                                title={isPaused ? 'Reanudar narración' : 'Pausar narración'}
                                                aria-label={isPaused ? 'Reanudar narración' : 'Pausar narración'}
                                            >
                                                {isPaused ? (
                                                    <Play className="w-3 h-3" fill="currentColor" aria-hidden />
                                                ) : (
                                                    <Pause className="w-3 h-3" fill="currentColor" aria-hidden />
                                                )}
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            className="coord-guided-tour-caption__voice-btn coord-guided-tour-caption__voice-btn--stop"
                                            onClick={stopSpeaking}
                                            title="Detener narración"
                                            aria-label="Detener narración"
                                        >
                                            <Square className="w-3 h-3" fill="currentColor" aria-hidden />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <p className="coord-guided-tour-caption__subtitle-text">{staticSubtitle}</p>
                            )}
                        </div>
                    </div>

                    <div className="coord-guided-tour-caption__footer">
                        <div className="coord-guided-tour-caption__footer-primary">
                            {step.mode !== 'action' ? (
                                <div className="coord-guided-tour-caption__toggles">
                                    <button
                                        type="button"
                                        className={`coord-guided-tour-voice${voiceEnabled ? ' coord-guided-tour-voice--on' : ''}`}
                                        onClick={() => {
                                            warmUp();
                                            if (voiceEnabled) stopSpeaking();
                                            setVoiceEnabled((v) => !v);
                                        }}
                                        aria-pressed={voiceEnabled}
                                        title={
                                            voiceEnabled
                                                ? 'Desactivar narración del tour'
                                                : 'Activar narración de voz (opcional)'
                                        }
                                    >
                                        {voiceEnabled ? (
                                            <Volume2 className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                        ) : (
                                            <VolumeX className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                        )}
                                        <span className="coord-guided-tour-caption__toggle-label">
                                            {voiceEnabled ? 'Voz activa' : 'Voz'}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`coord-guided-tour-autoplay${autoPlay ? ' coord-guided-tour-autoplay--on' : ''}`}
                                        onClick={toggleAutoPlay}
                                        aria-pressed={autoPlay}
                                        title={autoPlay ? 'Pausar avance automático' : 'Reanudar avance automático'}
                                    >
                                        {autoPlay ? (
                                            <Pause className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                        ) : (
                                            <Play className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                        )}
                                        <span className="coord-guided-tour-caption__toggle-label">
                                            {autoPlay ? 'Auto · pausa' : 'Auto'}
                                        </span>
                                    </button>
                                </div>
                            ) : (
                                <span className="coord-guided-tour-caption__footer-spacer" aria-hidden />
                            )}

                            <div className="coord-guided-tour-tooltip__nav">
                                <button
                                    type="button"
                                    className="coord-guided-tour-link"
                                    disabled={isFirst}
                                    onClick={prev}
                                    aria-label="Paso anterior"
                                >
                                    <ChevronLeft className="w-4 h-4" aria-hidden />
                                    <span className="coord-guided-tour-nav-label">Anterior</span>
                                </button>
                                <button
                                    type="button"
                                    className="coord-guided-tour-link coord-guided-tour-link--primary"
                                    disabled={nextDisabled}
                                    onClick={next}
                                    aria-label={isLast ? 'Finalizar tutorial' : 'Siguiente paso'}
                                >
                                    <span className="coord-guided-tour-nav-label">
                                        {isLast ? 'Finalizar' : nextDisabled ? 'Esperando…' : 'Siguiente'}
                                    </span>
                                    {!isLast && !nextDisabled && <ChevronRight className="w-4 h-4" aria-hidden />}
                                </button>
                            </div>
                        </div>

                        <div className="coord-guided-tour-caption__footer-secondary">
                            <button
                                type="button"
                                className="coord-guided-tour-exit coord-guided-tour-exit--footer"
                                onClick={() => closeTour({ markDone: false })}
                            >
                                <X className="w-3 h-3 shrink-0" aria-hidden />
                                Salir
                            </button>
                            {step.mode !== 'action' ? (
                                <>
                                    <span className="coord-guided-tour-caption__footer-sep" aria-hidden>
                                        ·
                                    </span>
                                    <button
                                        type="button"
                                        className="coord-guided-tour-skip"
                                        onClick={() => closeTour({ markDone: true })}
                                    >
                                        <span className="coord-guided-tour-skip-full">No volver a mostrar</span>
                                        <span className="coord-guided-tour-skip-compact" aria-hidden>
                                            No mostrar
                                        </span>
                                    </button>
                                </>
                            ) : null}
                            <span className="coord-guided-tour-kbd-hint">
                                {autoPlay ? 'Esc salir' : '← → navegar · Esc salir'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
