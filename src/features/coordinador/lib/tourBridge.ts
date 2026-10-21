import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import { switchDashboardTab } from '@features/coordinador/lib/dashboardTourBridge';

export const COORD_TOUR_ACTION_COMPLETE = 'coord-tour:action-complete';
export const COORD_TOUR_OPEN_ANALISIS_DRAWER = 'open-analisis-drawer';

export function notifyTourActionComplete(detail?: { stepId?: string }) {
    window.dispatchEvent(new CustomEvent(COORD_TOUR_ACTION_COMPLETE, { detail }));
}

export function openAnalisisDrawer(tab: 'questions' | 'heatmap' = 'questions') {
    window.dispatchEvent(new CustomEvent(COORD_TOUR_OPEN_ANALISIS_DRAWER, { detail: { tab } }));
}

export async function tourSwitchDashboardTab(tabId: string) {
    switchDashboardTab(tabId);
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

/** Resuelve ancla de nav según viewport (desktop sidebar vs mobile bottom nav). */
export function shellNavAnchorForViewport(): string {
    if (typeof window === 'undefined') return TourAnchors.navSidebar;
    return window.matchMedia('(max-width: 1023px)').matches
        ? TourAnchors.navMobile
        : TourAnchors.navSidebar;
}
