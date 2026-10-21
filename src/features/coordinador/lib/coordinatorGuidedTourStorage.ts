import { parseDemoCoordinadorTab } from '@/app/demo/_shared/demoRoutePaths';
import { filterCoordinatorNavIds, readSelectedSimulationFromStorage } from '@features/coordinador/lib/coordinatorNavPolicy';
import { simulationSupportsPensumFullInsights } from '@features/coordinador/lib/simulationEligibility';

const STORAGE_KEY = 'coord_guided_tour_v2';

export const COORD_TOUR_MODULE_LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    pensum: 'Pensum',
    desempeno: 'Desempeño',
    estudiantes: 'Estudiantes',
    respuestas: 'Respuestas',
    analisis: 'Análisis',
    comparativa: 'Comparativa',
    historico: 'Histórico',
};

export const FULL_PANEL_TOUR_ROUTES = [
    'dashboard',
    'desempeno',
    'pensum',
    'estudiantes',
    'respuestas',
    'analisis',
    'comparativa',
    'historico',
] as const;

export type FullPanelRouteKey = (typeof FULL_PANEL_TOUR_ROUTES)[number];

type DoneMap = Record<string, boolean>;
type StepMap = Record<string, string>;

type TourPersistence = {
    autoShown: DoneMap;
    dismissed: DoneMap;
    completed: DoneMap;
    lastStepByRoute: StepMap;
    fullPanel?: {
        active: boolean;
        routeIndex: number;
        completedRoutes: DoneMap;
    };
};

function emptyPersistence(): TourPersistence {
    return { autoShown: {}, dismissed: {}, completed: {}, lastStepByRoute: {} };
}

function readPersistence(): TourPersistence {
    if (typeof window === 'undefined') return emptyPersistence();
    try {
        const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('coord_guided_tour_v1');
        if (!raw) return emptyPersistence();
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== 'object') return emptyPersistence();

        const rec = parsed as Record<string, unknown>;

        if ('autoShown' in rec || 'dismissed' in rec) {
            const autoShown =
                rec.autoShown && typeof rec.autoShown === 'object' ? (rec.autoShown as DoneMap) : {};
            const dismissed =
                rec.dismissed && typeof rec.dismissed === 'object' ? (rec.dismissed as DoneMap) : {};
            const completed =
                rec.completed && typeof rec.completed === 'object' ? (rec.completed as DoneMap) : {};
            const lastStepByRoute =
                rec.lastStepByRoute && typeof rec.lastStepByRoute === 'object'
                    ? (rec.lastStepByRoute as StepMap)
                    : {};
            const fullPanel =
                rec.fullPanel && typeof rec.fullPanel === 'object'
                    ? (rec.fullPanel as TourPersistence['fullPanel'])
                    : undefined;
            return { autoShown, dismissed, completed, lastStepByRoute, fullPanel };
        }

        const legacy = parsed as DoneMap;
        return { autoShown: { ...legacy }, dismissed: { ...legacy }, completed: { ...legacy }, lastStepByRoute: {} };
    } catch {
        return emptyPersistence();
    }
}

function writePersistence(state: TourPersistence) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        /* ignore quota */
    }
}

export function routeKeyFromPathname(pathname: string): string {
    const p = pathname.split('?')[0].replace(/\/$/, '') || '/coordinador';

    if (p === '/coordinador' || p === '/demo/coordinador' || p === '/d/c') return 'dashboard';

    if (p.startsWith('/d/c/')) {
        const tab = parseDemoCoordinadorTab(p);
        return tab === 'resumen' ? 'dashboard' : tab;
    }

    const demoMatch = p.match(/^\/demo\/coordinador\/([^/]+)/);
    if (demoMatch?.[1]) {
        const segment = demoMatch[1];
        return segment === 'resumen' ? 'dashboard' : segment;
    }

    const prodMatch = p.match(/^\/coordinador\/([^/]+)/);
    return prodMatch?.[1] ?? 'unknown';
}

export function isGuidedTourAutoShown(routeKey: string): boolean {
    return Boolean(readPersistence().autoShown[routeKey]);
}

export function markGuidedTourAutoShown(routeKey: string) {
    const state = readPersistence();
    state.autoShown[routeKey] = true;
    writePersistence(state);
}

export function isGuidedTourDone(routeKey: string): boolean {
    return Boolean(readPersistence().dismissed[routeKey]);
}

export function isGuidedTourCompleted(routeKey: string): boolean {
    return Boolean(readPersistence().completed[routeKey]);
}

export function markGuidedTourDone(routeKey: string) {
    const state = readPersistence();
    state.dismissed[routeKey] = true;
    state.completed[routeKey] = true;
    state.autoShown[routeKey] = true;
    writePersistence(state);
}

export function saveLastTourStep(routeKey: string, stepId: string) {
    const state = readPersistence();
    state.lastStepByRoute[routeKey] = stepId;
    writePersistence(state);
}

export function getLastTourStep(routeKey: string): string | undefined {
    return readPersistence().lastStepByRoute[routeKey];
}

export function resetGuidedTour(routeKey?: string) {
    if (typeof window === 'undefined') return;
    if (!routeKey) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('coord_guided_tour_v1');
        return;
    }
    const state = readPersistence();
    delete state.autoShown[routeKey];
    delete state.dismissed[routeKey];
    delete state.completed[routeKey];
    delete state.lastStepByRoute[routeKey];
    writePersistence(state);
}

export function getFullPanelTourState() {
    return readPersistence().fullPanel ?? { active: false, routeIndex: 0, completedRoutes: {} };
}

export function startFullPanelTourPersistence() {
    const state = readPersistence();
    state.fullPanel = { active: true, routeIndex: 0, completedRoutes: {} };
    writePersistence(state);
}

export function advanceFullPanelTourPersistence(nextRouteIndex: number) {
    const state = readPersistence();
    const prev = state.fullPanel ?? { active: true, routeIndex: 0, completedRoutes: {} };
    state.fullPanel = { ...prev, active: true, routeIndex: nextRouteIndex };
    writePersistence(state);
}

export function markFullPanelRouteDone(routeKey: string) {
    const state = readPersistence();
    const fp = state.fullPanel ?? { active: true, routeIndex: 0, completedRoutes: {} };
    fp.completedRoutes[routeKey] = true;
    state.fullPanel = fp;
    writePersistence(state);
}

export function finishFullPanelTourPersistence() {
    const state = readPersistence();
    state.fullPanel = { active: false, routeIndex: 0, completedRoutes: state.fullPanel?.completedRoutes ?? {} };
    writePersistence(state);
}

export function resolveFullPanelTourRoutes(simulationId?: string): FullPanelRouteKey[] {
    const sim = simulationId || (typeof window !== 'undefined' ? readSelectedSimulationFromStorage() : '');
    const allowed = new Set(filterCoordinatorNavIds(sim));
    return FULL_PANEL_TOUR_ROUTES.filter((key) => {
        if (key === 'pensum') return allowed.has('pensum') && simulationSupportsPensumFullInsights(sim);
        return allowed.has(key);
    });
}

export function pathnameForFullPanelRoute(routeKey: FullPanelRouteKey, demoMode = false): string {
    if (routeKey === 'dashboard') return demoMode ? '/demo/coordinador' : '/coordinador';
    return demoMode ? `/demo/coordinador/${routeKey}` : `/coordinador/${routeKey}`;
}

const AUTOPLAY_PREF_KEY = 'coord_tour_autoplay';

export function getAutoPlayPref(): boolean {
    if (typeof window === 'undefined') return true;
    try {
        const raw = localStorage.getItem(AUTOPLAY_PREF_KEY);
        if (raw === null) return true;
        return raw === 'true';
    } catch {
        return true;
    }
}

export function setAutoPlayPref(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(AUTOPLAY_PREF_KEY, enabled ? 'true' : 'false');
    } catch {
        /* ponytail: ignore quota errors */
    }
}
