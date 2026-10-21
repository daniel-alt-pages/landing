'use client';

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { areaAccent } from '@features/recordings/lib/recordingsTheme';
import SgAreaIconBottomNav, {
  SG_AREA_ICON_BOTTOM_NAV_HEIGHT,
} from '@shared/components/SgAreaIconBottomNav';
import { MATERIAS, formatAreaDisplayName } from '@features/coordinador/lib/analisis/materias';
import { icfesAreaAccentVars, icfesAreaItemAccentVars } from '@features/coordinador/lib/icfesAreaColors';
import type { Estudiante } from '@shared/types';

export type PerformanceAreaNavItem = {
    key: string;
    label?: string;
    score?: number | null;
};

export function getOrderedMateriaKeys(availableKeys: string[]): string[] {
    const canonOrder = MATERIAS.map((m) => m.key);
    const set = new Set(availableKeys);
    const ordered = canonOrder.filter((k) => set.has(k));
    const extras = availableKeys.filter((k) => !canonOrder.includes(k));
    return [...ordered, ...extras];
}

export function materiasFromPuntajes(
    puntajes?: Estudiante['puntajes'] | null,
): PerformanceAreaNavItem[] {
    if (!puntajes) return [];

    const keys = Object.keys(puntajes).filter(
        (key) => typeof puntajes[key]?.puntaje === 'number' && !Number.isNaN(puntajes[key]?.puntaje),
    );

    return getOrderedMateriaKeys(keys).map((key) => ({
        key,
        label: formatAreaDisplayName(key),
        score: puntajes[key]?.puntaje ?? null,
    }));
}

export function usePerformanceAreaSelection(items: PerformanceAreaNavItem[]) {
    const firstKey = items[0]?.key ?? '';
    const [activeKey, setActiveKey] = useState(firstKey);

    useEffect(() => {
        if (!items.length) return;
        if (!activeKey || !items.some((item) => item.key === activeKey)) {
            setActiveKey(items[0].key);
        }
    }, [items, activeKey]);

    return { activeKey, setActiveKey };
}

/** Padding inferior recomendado cuando el nav va embebido al pie del contenedor. */
export const PERFORMANCE_AREA_NAV_EMBED_PAD = SG_AREA_ICON_BOTTOM_NAV_HEIGHT + 20;

/** Burbuja flotante unificada (Desempeño, Claves, …) — tokens --coord-* del panel. */
const FLOATING_BUBBLE_CSS = `
    @keyframes coord-area-float-in {
        0%   { opacity: 0; transform: translateY(-12px) scale(0.96); }
        70%  { opacity: 1; transform: translateY(2px) scale(1.01); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    .coord-area-float-wrap {
        pointer-events: none;
        position: fixed;
        left: 0;
        right: 0;
        z-index: 48;
        top: max(0.5rem, env(safe-area-inset-top, 0px));
        padding: 0 clamp(0.75rem, 3vw, 1.25rem) 0.35rem;
        transition: opacity 0.32s ease, transform 0.32s cubic-bezier(0.34, 1.4, 0.64, 1);
    }
    @media (min-width: 1024px) {
        .coord-area-float-wrap {
            left: var(--coord-sidebar-width, 260px);
        }
    }
    .coord-area-float-wrap--visible {
        pointer-events: auto;
        animation: coord-area-float-in 0.38s cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
    }
    .coord-area-float-wrap--hidden {
        opacity: 0;
        transform: translateY(-10px);
    }
    .coord-area-float-inner {
        position: relative;
        width: 100%;
        max-width: min(960px, calc(100vw - 2rem));
        margin: 0 auto;
        pointer-events: auto;
        padding: 0.2rem 0 0.45rem;
        background: linear-gradient(
            to bottom,
            color-mix(in srgb, var(--coord-page, #07080d) 98%, transparent) 0%,
            color-mix(in srgb, var(--coord-page, #07080d) 90%, transparent) 72%,
            transparent 100%
        );
    }
    @media (prefers-reduced-motion: reduce) {
        .coord-area-float-wrap--visible {
            animation: none;
        }
    }
`;

type CoordinatorPerformanceAreaNavProps = {
    items: PerformanceAreaNavItem[];
    activeKey: string;
    onSelect: (key: string) => void;
    /**
     * bottom = barra con iconos al pie (modales).
     * floating = burbuja delgada fija solo al hacer scroll (sin bloque en el panel).
     * responsive = alias de floating en páginas completas.
     * header = tira compacta embebida (p. ej. dentro de una tarjeta).
     */
    layout?: 'bottom' | 'floating' | 'responsive' | 'header';
    /** bottom: embed en modal vs fixed viewport */
    anchor?: 'embed' | 'fixed';
    className?: string;
    label?: string;
    /** @deprecated usar layout */
    sticky?: boolean;
    /** @deprecated ignorado — iconos + abreviatura */
    size?: 'default' | 'compact';
    /** Zona visible: la burbuja solo aparece mientras este bloque intersecta el viewport. */
    floatingZoneRef?: RefObject<HTMLElement | null>;
};

function AreaNavFilterShell({
    activeKey,
    children,
    className,
}: {
    activeKey: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={classNames('coord-area-nav-shell', className)}
            style={icfesAreaAccentVars(activeKey)}
        >
            {children}
        </div>
    );
}

/** Tira compacta embebida en tarjetas (Claves, etc.). */
function AreaIconHeaderStrip({
    items,
    activeKey,
    onSelect,
    className,
    label,
}: {
    items: PerformanceAreaNavItem[];
    activeKey: string;
    onSelect: (key: string) => void;
    className?: string;
    label?: string;
}) {
    const activeRef = useRef<HTMLButtonElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = scrollRef.current;
        const btn = activeRef.current;
        if (!root || !btn) return;
        root.scrollTo({
            left: btn.offsetLeft - root.clientWidth / 2 + btn.offsetWidth / 2,
            behavior: 'smooth',
        });
    }, [activeKey]);

    return (
        <AreaNavFilterShell activeKey={activeKey} className={classNames('shrink-0', className)}>
            <div className="coord-area-nav-body px-1 py-1" role="region" aria-label={label}>
                <div
                    ref={scrollRef}
                    role="tablist"
                    aria-label="Seleccionar área"
                    className="flex justify-start gap-1 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:justify-center"
                >
                    {items.map((item) => {
                        const accent = areaAccent(item.key);
                        const Icon = accent.icon;
                        const isActive = item.key === activeKey;
                        const aria = item.label ?? formatAreaDisplayName(item.key);

                        return (
                            <button
                                key={item.key}
                                ref={isActive ? activeRef : undefined}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                aria-label={aria}
                                data-active={isActive ? 'true' : 'false'}
                                onClick={() => onSelect(item.key)}
                                className="sg-aibn-btn flex min-h-[36px] min-w-[2.75rem] shrink-0 flex-col items-center justify-center px-2 py-1"
                                style={icfesAreaItemAccentVars(item.key)}
                            >
                                <Icon
                                    size={16}
                                    strokeWidth={isActive ? 2.25 : 1.5}
                                    className="sg-aibn-icon"
                                    aria-hidden
                                />
                                <span className="sg-aibn-label mt-0.5 text-[8px] uppercase tracking-wide">
                                    {accent.short}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </AreaNavFilterShell>
    );
}

/**
 * Burbuja flotante: visible solo mientras `floatingZoneRef` intersecta el viewport.
 */
function AreaFloatingBubbleNav({
    items,
    activeKey,
    onSelect,
    label = 'Área ICFES',
    floatingZoneRef,
}: {
    items: PerformanceAreaNavItem[];
    activeKey: string;
    onSelect: (key: string) => void;
    label?: string;
    floatingZoneRef?: RefObject<HTMLElement | null>;
}) {
    const [pinned, setPinned] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        const el = floatingZoneRef?.current;
        if (!el) {
            setPinned(false);
            return;
        }

        const update = (entry: IntersectionObserverEntry) => {
            setPinned(entry.isIntersecting && entry.intersectionRatio > 0);
        };

        const obs = new IntersectionObserver(
            ([entry]) => update(entry),
            { root: null, threshold: [0, 0.01, 0.05, 0.1] },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [floatingZoneRef]);

    const bubble = (
        <>
            <style>{FLOATING_BUBBLE_CSS}</style>
            <div
                className={classNames(
                    'coord-area-float-wrap',
                    pinned ? 'coord-area-float-wrap--visible' : 'coord-area-float-wrap--hidden',
                )}
                role="region"
                aria-label={label}
                aria-hidden={!pinned}
            >
                <div className="coord-area-float-inner">
                    <AreaNavFilterShell activeKey={activeKey}>
                        <SgAreaIconBottomNav
                            items={items}
                            activeKey={activeKey}
                            onSelect={onSelect}
                            variant="dark"
                            position="inline"
                            filterStyle
                            ariaLabel={label}
                        />
                    </AreaNavFilterShell>
                </div>
            </div>
        </>
    );

    return mounted ? createPortal(bubble, document.body) : null;
}

export default function CoordinatorPerformanceAreaNav({
    items,
    activeKey,
    onSelect,
    layout,
    anchor = 'embed',
    className,
    label = 'Área ICFES',
    sticky = false,
    floatingZoneRef,
}: CoordinatorPerformanceAreaNavProps) {
    if (items.length === 0) return null;

    const resolvedLayout = layout ?? (sticky ? 'header' : 'bottom');

    if (resolvedLayout === 'bottom') {
        return (
            <AreaNavFilterShell activeKey={activeKey} className={className}>
                <SgAreaIconBottomNav
                    items={items}
                    activeKey={activeKey}
                    onSelect={onSelect}
                    variant="dark"
                    position={anchor}
                    filterStyle
                    publishLift={anchor === 'fixed'}
                    ariaLabel={label}
                />
            </AreaNavFilterShell>
        );
    }

    if (resolvedLayout === 'floating' || resolvedLayout === 'responsive') {
        return (
            <AreaFloatingBubbleNav
                items={items}
                activeKey={activeKey}
                onSelect={onSelect}
                label={label}
                floatingZoneRef={floatingZoneRef}
            />
        );
    }

    return (
        <AreaIconHeaderStrip
            items={items}
            activeKey={activeKey}
            onSelect={onSelect}
            className={classNames('shrink-0', className)}
            label={label}
        />
    );
}
