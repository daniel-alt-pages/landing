'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    getGuidedTourStepsForPath,
    resolveStepAnchor,
    type GuidedTourStep,
} from '@features/coordinador/lib/coordinatorGuidedTourSteps';
import {
    advanceFullPanelTourPersistence,
    finishFullPanelTourPersistence,
    getAutoPlayPref,
    getFullPanelTourState,
    getLastTourStep,
    isGuidedTourAutoShown,
    isGuidedTourDone,
    markFullPanelRouteDone,
    markGuidedTourAutoShown,
    markGuidedTourDone,
    pathnameForFullPanelRoute,
    resolveFullPanelTourRoutes,
    routeKeyFromPathname,
    saveLastTourStep,
    setAutoPlayPref,
    startFullPanelTourPersistence,
} from '@features/coordinador/lib/coordinatorGuidedTourStorage';
import { COORD_TOUR_ACTION_COMPLETE } from '@features/coordinador/lib/tourBridge';
import { queryTourAnchor, waitForTourAnchor } from '@features/coordinador/lib/tourDomUtils';

type StartTourOpts = {
    fromStepId?: string;
    fullPanel?: boolean;
    resumeLast?: boolean;
};

type CoordinadorGuidedTourContextValue = {
    active: boolean;
    stepIndex: number;
    steps: GuidedTourStep[];
    routeKey: string;
    fullPanelActive: boolean;
    actionPending: boolean;
    autoPlay: boolean;
    toggleAutoPlay: () => void;
    startTour: (opts?: StartTourOpts) => void;
    startFullPanelTour: () => void;
    closeTour: (opts?: { markDone?: boolean }) => void;
    next: () => void;
    prev: () => void;
    goToStepById: (stepId: string) => void;
    completeCurrentAction: () => void;
    isDone: (key?: string) => boolean;
    notifyStepReady: () => void;
    stepReadyNonce: number;
    resetAllTours: () => void;
};

const CoordinadorGuidedTourContext = createContext<CoordinadorGuidedTourContextValue | null>(null);

export function useCoordinadorGuidedTour() {
    const ctx = useContext(CoordinadorGuidedTourContext);
    if (!ctx) {
        throw new Error('useCoordinadorGuidedTour debe usarse dentro de CoordinadorGuidedTourProvider');
    }
    return ctx;
}

export function useCoordinadorGuidedTourOptional() {
    return useContext(CoordinadorGuidedTourContext);
}

function isDemoPath(pathname: string): boolean {
    return pathname.startsWith('/demo/coordinador') || pathname.startsWith('/d/c');
}

async function prepareStep(step: GuidedTourStep | undefined) {
    if (!step?.onBeforeShow) {
        const anchor = step ? resolveStepAnchor(step) : undefined;
        if (anchor) await waitForTourAnchor(anchor, 2500);
        return;
    }
    await step.onBeforeShow();
    const anchor = resolveStepAnchor(step);
    if (anchor) await waitForTourAnchor(anchor, 2500);
}

export function CoordinadorGuidedTourProvider({
    children,
    autoStart = false,
}: {
    children: React.ReactNode;
    autoStart?: boolean;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const routeKey = routeKeyFromPathname(pathname);
    const rawSteps = useMemo(() => getGuidedTourStepsForPath(pathname), [pathname]);

    const [active, setActive] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [stepReadyNonce, setStepReadyNonce] = useState(0);
    const [fullPanelActive, setFullPanelActive] = useState(false);
    const [actionPending, setActionPending] = useState(false);
    const [autoPlay, setAutoPlay] = useState(true);
    const autoStartedRef = useRef<string | null>(null);
    const navigatingFullPanelRef = useRef(false);
    const advancingActionRef = useRef(false);

    const steps = rawSteps;

    const notifyStepReady = useCallback(() => {
        setStepReadyNonce((n) => n + 1);
    }, []);

    useEffect(() => {
        setAutoPlay(getAutoPlayPref());
    }, []);

    const toggleAutoPlay = useCallback(() => {
        setAutoPlay((prev) => {
            const next = !prev;
            setAutoPlayPref(next);
            return next;
        });
    }, []);

    useEffect(() => {
        advancingActionRef.current = false;
    }, [stepIndex]);

    const closeTour = useCallback(
        (opts?: { markDone?: boolean }) => {
            setActive(false);
            setStepIndex(0);
            setActionPending(false);
            if (fullPanelActive) {
                finishFullPanelTourPersistence();
                setFullPanelActive(false);
            }
            if (opts?.markDone === true) {
                markGuidedTourDone(routeKey);
            }
        },
        [routeKey, fullPanelActive],
    );

    const syncActionPending = useCallback((index: number) => {
        const step = steps[index];
        setActionPending(step?.mode === 'action' && step.advanceOn !== 'next');
    }, [steps]);

    const goToIndex = useCallback(
        async (index: number) => {
            if (index < 0 || index >= steps.length) return;
            const step = steps[index];
            if (step?.skipIfAnchorMissing) {
                const anchor = resolveStepAnchor(step);
                if (anchor && !queryTourAnchor(anchor)) {
                    if (index + 1 < steps.length) {
                        await goToIndex(index + 1);
                        return;
                    }
                }
            }
            setStepIndex(index);
            saveLastTourStep(routeKey, step.id);
            syncActionPending(index);
            await prepareStep(step);
            notifyStepReady();
        },
        [steps, routeKey, syncActionPending, notifyStepReady],
    );

    const startTour = useCallback(
        (opts?: StartTourOpts) => {
            if (!steps.length) return;
            let idx = 0;
            if (opts?.fromStepId) {
                const found = steps.findIndex((s) => s.id === opts.fromStepId);
                if (found >= 0) idx = found;
            } else if (opts?.resumeLast) {
                const last = getLastTourStep(routeKey);
                if (last) {
                    const found = steps.findIndex((s) => s.id === last);
                    if (found >= 0) idx = found;
                }
            }
            if (opts?.fullPanel) {
                startFullPanelTourPersistence();
                setFullPanelActive(true);
            } else {
                setFullPanelActive(false);
            }
            setActive(true);
            void goToIndex(idx);
        },
        [steps, routeKey, goToIndex],
    );

    const startFullPanelTour = useCallback(() => {
        const demo = isDemoPath(pathname);
        const routes = resolveFullPanelTourRoutes();
        const first = routes[0] ?? 'dashboard';
        const targetPath = pathnameForFullPanelRoute(first, demo);
        startFullPanelTourPersistence();
        setFullPanelActive(true);
        if (routeKeyFromPathname(pathname) !== first) {
            navigatingFullPanelRef.current = true;
            router.push(targetPath);
            return;
        }
        startTour({ fullPanel: true });
    }, [pathname, router, startTour]);

    const maybeAdvanceFullPanel = useCallback(() => {
        if (!fullPanelActive) return;
        markFullPanelRouteDone(routeKey);
        const demo = isDemoPath(pathname);
        const routes = resolveFullPanelTourRoutes();
        const currentIdx = routes.indexOf(routeKey as (typeof routes)[number]);
        const nextIdx = currentIdx + 1;
        if (nextIdx >= routes.length) {
            finishFullPanelTourPersistence();
            setFullPanelActive(false);
            return;
        }
        advanceFullPanelTourPersistence(nextIdx);
        navigatingFullPanelRef.current = true;
        router.push(pathnameForFullPanelRoute(routes[nextIdx], demo));
    }, [fullPanelActive, routeKey, pathname, router]);

    const next = useCallback(() => {
        const step = steps[stepIndex];
        if (step?.mode === 'action' && actionPending && step.advanceOn !== 'next') {
            if (step.onAutoAction) void step.onAutoAction();
            return;
        }

        if (stepIndex >= steps.length - 1) {
            closeTour({ markDone: true });
            maybeAdvanceFullPanel();
            return;
        }
        void goToIndex(stepIndex + 1);
    }, [stepIndex, steps, actionPending, goToIndex, closeTour, maybeAdvanceFullPanel]);

    const prev = useCallback(() => {
        if (stepIndex <= 0) return;
        void goToIndex(stepIndex - 1);
    }, [stepIndex, goToIndex]);

    const goToStepById = useCallback(
        (stepId: string) => {
            const found = steps.findIndex((s) => s.id === stepId);
            if (found < 0) return;
            setActive(true);
            void goToIndex(found);
        },
        [steps, goToIndex],
    );

    const completeCurrentAction = useCallback(() => {
        setActionPending(false);
    }, []);

    const isDone = useCallback((key?: string) => isGuidedTourDone(key ?? routeKey), [routeKey]);

    const resetAllTours = useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('coord_guided_tour_v2');
            localStorage.removeItem('coord_guided_tour_v1');
        }
        setFullPanelActive(false);
    }, []);

    useEffect(() => {
        if (!navigatingFullPanelRef.current) {
            setActive(false);
            setStepIndex(0);
            setActionPending(false);
        }
        autoStartedRef.current = null;
    }, [pathname]);

    useEffect(() => {
        const fp = getFullPanelTourState();
        if (fp.active) setFullPanelActive(true);

        if (navigatingFullPanelRef.current) {
            navigatingFullPanelRef.current = false;
            const t = window.setTimeout(() => startTour({ fullPanel: true }), 500);
            return () => window.clearTimeout(t);
        }

        if (!autoStart || !steps.length) return;
        if (isGuidedTourAutoShown(routeKey) || isGuidedTourDone(routeKey)) return;
        if (autoStartedRef.current === routeKey) return;
        autoStartedRef.current = routeKey;

        const t = window.setTimeout(() => {
            if (fp.active) startTour({ fullPanel: true, resumeLast: true });
            else startTour({ resumeLast: true });
        }, 600);

        return () => window.clearTimeout(t);
    }, [autoStart, routeKey, steps.length, startTour]);

    useEffect(() => {
        if (!active || !autoPlay) return;
        const step = steps[stepIndex];
        if (!step) return;

        const isActionWait = step.mode === 'action' && actionPending && step.advanceOn !== 'next';
        const delay = isActionWait
            ? (step.autoActionDelayMs ?? 1200)
            : (step.autoAdvanceMs ?? 2600);

        const timer = window.setTimeout(() => {
            next();
        }, delay);

        return () => window.clearTimeout(timer);
    }, [active, autoPlay, stepIndex, steps, actionPending, next, stepReadyNonce]);

    useEffect(() => {
        if (!active) return;

        const onActionEvent = () => {
            const step = steps[stepIndex];
            if (step?.mode === 'action' && stepIndex < steps.length - 1) {
                if (advancingActionRef.current) return;
                advancingActionRef.current = true;
                setActionPending(false);
                void goToIndex(stepIndex + 1);
                return;
            }
            completeCurrentAction();
        };

        const step = steps[stepIndex];
        const events = [COORD_TOUR_ACTION_COMPLETE];
        if (step?.eventName) events.push(step.eventName);
        const uniqueEvents = [...new Set(events)];

        uniqueEvents.forEach((ev) => window.addEventListener(ev, onActionEvent));
        return () => uniqueEvents.forEach((ev) => window.removeEventListener(ev, onActionEvent));
    }, [active, stepIndex, steps, completeCurrentAction, goToIndex]);

    const value = useMemo(
        () => ({
            active,
            stepIndex,
            steps,
            routeKey,
            fullPanelActive,
            actionPending,
            autoPlay,
            toggleAutoPlay,
            startTour,
            startFullPanelTour,
            closeTour,
            next,
            prev,
            goToStepById,
            completeCurrentAction,
            isDone,
            notifyStepReady,
            stepReadyNonce,
            resetAllTours,
        }),
        [
            active,
            stepIndex,
            steps,
            routeKey,
            fullPanelActive,
            actionPending,
            autoPlay,
            toggleAutoPlay,
            startTour,
            startFullPanelTour,
            closeTour,
            next,
            prev,
            goToStepById,
            completeCurrentAction,
            isDone,
            notifyStepReady,
            stepReadyNonce,
            resetAllTours,
        ],
    );

    return (
        <CoordinadorGuidedTourContext.Provider value={value}>
            {children}
        </CoordinadorGuidedTourContext.Provider>
    );
}
