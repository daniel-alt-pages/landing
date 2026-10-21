'use client';

/** Utilidades para sincronizar estado de UI con query params (memoria al refrescar). */

export type QueryPatch = Record<string, string | null | undefined>;

export function readQueryParam(key: string): string {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get(key)?.trim() ?? '';
}

export function buildQueryString(base: URLSearchParams, patch: QueryPatch): string {
    const next = new URLSearchParams(base.toString());
    Object.entries(patch).forEach(([key, value]) => {
        const v = value?.trim();
        if (!v) next.delete(key);
        else next.set(key, v);
    });
    const qs = next.toString();
    return qs ? `?${qs}` : '';
}

export function replaceQueryParams(pathname: string, patch: QueryPatch): void {
    if (typeof window === 'undefined') return;
    const base = new URLSearchParams(window.location.search);
    const qs = buildQueryString(base, patch);
    const href = `${pathname}${qs}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', href);
}
