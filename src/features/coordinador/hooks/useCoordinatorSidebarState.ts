'use client';

import { useCallback, useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react';

const STORAGE_COLLAPSED = 'coord_sidebar_collapsed';
const STORAGE_WIDTH = 'coord_sidebar_width';

export const COORD_SIDEBAR_WIDTH_EXPANDED = 248;
export const COORD_SIDEBAR_WIDTH_COLLAPSED = 72;
export const COORD_SIDEBAR_WIDTH_MIN = 200;
export const COORD_SIDEBAR_WIDTH_MAX = 380;

function clampSidebarWidth(width: number): number {
    return Math.min(COORD_SIDEBAR_WIDTH_MAX, Math.max(COORD_SIDEBAR_WIDTH_MIN, width));
}

function readStoredWidth(): number {
    if (typeof window === 'undefined') return COORD_SIDEBAR_WIDTH_EXPANDED;
    try {
        const raw = localStorage.getItem(STORAGE_WIDTH);
        if (!raw) return COORD_SIDEBAR_WIDTH_EXPANDED;
        const parsed = Number.parseInt(raw, 10);
        if (Number.isNaN(parsed)) return COORD_SIDEBAR_WIDTH_EXPANDED;
        return clampSidebarWidth(parsed);
    } catch {
        return COORD_SIDEBAR_WIDTH_EXPANDED;
    }
}

export function useCoordinatorSidebarState() {
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        try {
            return localStorage.getItem(STORAGE_COLLAPSED) === '1';
        } catch {
            return false;
        }
    });
    const [expandedWidthPx, setExpandedWidthPx] = useState(readStoredWidth);
    const [isResizing, setIsResizing] = useState(false);

    const widthPx = collapsed ? COORD_SIDEBAR_WIDTH_COLLAPSED : expandedWidthPx;

    useEffect(() => {
        document.documentElement.style.setProperty('--coord-sidebar-width', `${widthPx}px`);
        document.documentElement.dataset.coordSidebarCollapsed = collapsed ? 'true' : 'false';
        window.dispatchEvent(new CustomEvent('coord-sidebar-layout-change'));
        return () => {
            document.documentElement.style.removeProperty('--coord-sidebar-width');
            delete document.documentElement.dataset.coordSidebarCollapsed;
        };
    }, [collapsed, widthPx]);

    const persistWidth = useCallback((nextWidth: number) => {
        const clamped = clampSidebarWidth(nextWidth);
        setExpandedWidthPx(clamped);
        try {
            localStorage.setItem(STORAGE_WIDTH, String(clamped));
        } catch {
            /* ignore */
        }
    }, []);

    const toggle = useCallback(() => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(STORAGE_COLLAPSED, next ? '1' : '0');
            } catch {
                /* ignore */
            }
            return next;
        });
    }, []);

    const startResize = useCallback(
        (event: ReactPointerEvent<HTMLElement>) => {
            if (collapsed) return;
            event.preventDefault();
            event.stopPropagation();

            const startX = event.clientX;
            const startWidth = expandedWidthPx;
            setIsResizing(true);

            const onMove = (moveEvent: PointerEvent) => {
                persistWidth(startWidth + (moveEvent.clientX - startX));
            };

            const onUp = () => {
                setIsResizing(false);
                document.removeEventListener('pointermove', onMove);
                document.removeEventListener('pointerup', onUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };

            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);
        },
        [collapsed, expandedWidthPx, persistWidth],
    );

    return { collapsed, toggle, widthPx, isResizing, startResize };
}
