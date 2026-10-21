import type { TourAnchorId } from '@features/coordinador/lib/tourAnchors';

const DEFAULT_TIMEOUT_MS = 2500;

export function queryTourAnchor(anchor?: string): Element | null {
    if (!anchor || typeof document === 'undefined') return null;
    return document.querySelector(`[data-coord-tour="${anchor}"]`);
}

export function waitForNextPaint(frames = 2): Promise<void> {
    return new Promise((resolve) => {
        let left = frames;
        const tick = () => {
            left -= 1;
            if (left <= 0) resolve();
            else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
}

export async function waitForTourAnchor(
    anchor: TourAnchorId | string,
    timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Element | null> {
    const started = performance.now();
    while (performance.now() - started < timeoutMs) {
        const el = queryTourAnchor(anchor);
        if (el) {
            const r = el.getBoundingClientRect();
            if (r.width >= 1 && r.height >= 1) return el;
        }
        await waitForNextPaint(1);
    }
    return queryTourAnchor(anchor);
}

export async function waitForCustomEvent(eventName: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<void> {
    return new Promise((resolve, reject) => {
        let done = false;
        const timer = window.setTimeout(() => {
            if (done) return;
            done = true;
            window.removeEventListener(eventName, handler);
            reject(new Error(`Timeout waiting for ${eventName}`));
        }, timeoutMs);

        const handler = () => {
            if (done) return;
            done = true;
            window.clearTimeout(timer);
            window.removeEventListener(eventName, handler);
            resolve();
        };

        window.addEventListener(eventName, handler, { once: true });
    });
}

export function isMobileViewport(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 1023px)').matches;
}

export function resolveShellNavAnchor(): TourAnchorId {
    return isMobileViewport() ? 'coord-nav-mobile' : 'coord-nav';
}
