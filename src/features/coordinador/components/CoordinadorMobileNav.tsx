'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
    demoCoordinadorPath,
    isDemoCoordinadorRoute,
} from '@/app/demo/_shared/demoRoutePaths';
import {
    COORDINATOR_SIMULATION_EVENT,
    filterCoordinatorNavIds,
    readSelectedSimulationFromStorage,
    type CoordinatorNavItemId,
} from '@features/coordinador/lib/coordinatorNavPolicy';
import { isRecordingsClasesRoute } from '@features/recordings/lib/recordingsAccess';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';

/* ═══════════════════════════════════════════════════════════════
 *  COORDINATOR TAB BAR — Professional Bottom Navigation
 *
 *  Diseño premium con:
 *  ✦ Pill deslizante con gradiente violet → cyan
 *  ✦ Íconos SVG profesionales (sin emojis)
 *  ✦ Bounce + glow en tab activo
 *  ✦ Transiciones suaves con spring easing
 *  ✦ Safe area para iPhones con notch
 * ═══════════════════════════════════════════════════════════════ */

export const COORD_MOBILE_NAV_ITEMS = [
    {
        id: 'dashboard', href: '/coordinador', label: 'Dashboard',
        icon: (a: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth={a ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                {a ? (
                    <>
                        <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
                        <rect x="14" y="3" width="7" height="4" rx="1.5" fill="currentColor" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
                        <rect x="14" y="11" width="7" height="10" rx="1.5" fill="currentColor" />
                    </>
                ) : (
                    <>
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="4" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                        <rect x="14" y="11" width="7" height="10" rx="1.5" />
                    </>
                )}
            </svg>
        ),
    },
    {
        id: 'pensum', href: '/coordinador/pensum', label: 'Pensum',
        icon: (a: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth={a ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                {a ? (
                    <>
                        <path d="M6 3h9l3 3v15H6z" fill="currentColor" opacity="0.2" stroke="none" />
                        <path d="M15 3v4h4" fill="currentColor" opacity="0.5" stroke="none" />
                        <path d="M8.5 11h7M8.5 14h7M8.5 17h5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    </>
                ) : (
                    <>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="9" y1="13" x2="15" y2="13" />
                        <line x1="9" y1="17" x2="15" y2="17" />
                        <line x1="9" y1="9" x2="11" y2="9" />
                    </>
                )}
            </svg>
        ),
    },
    {
        id: 'desempeno', href: '/coordinador/desempeno', label: 'Desempeño',
        icon: (a: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth={a ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                {a ? (
                    <>
                        <path d="M12 2v4" stroke="none" fill="currentColor" opacity="0.45" />
                        <path d="M7 6h10" stroke="none" fill="currentColor" opacity="0.25" />
                        <path d="M6.5 10.5a6.5 6.5 0 1 0 11 0" stroke="none" fill="currentColor" opacity="0.22" />
                        <path d="M12 10v6" stroke="none" fill="currentColor" opacity="0.6" />
                        <path d="M12 16l3-3" stroke="none" fill="currentColor" opacity="0.6" />
                    </>
                ) : (
                    <>
                        <path d="M12 2v4" />
                        <path d="M7 6h10" />
                        <path d="M6.5 10.5a6.5 6.5 0 1 0 11 0" />
                        <path d="M12 10v6" />
                        <path d="M12 16l3-3" />
                    </>
                )}
            </svg>
        ),
    },
    {
        id: 'estudiantes', href: '/coordinador/estudiantes', label: 'Estudiantes',
        icon: (a: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth={a ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                {a ? (
                    <>
                        <circle cx="9" cy="7" r="4" />
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    </>
                ) : (
                    <>
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </>
                )}
            </svg>
        ),
    },
    {
        id: 'respuestas', href: '/coordinador/respuestas', label: 'Claves',
        icon: (a: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={a ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" fill={a ? 'currentColor' : 'none'} opacity={a ? 0.9 : 1} />
                <rect x="14" y="3" width="7" height="7" rx="1" fill={a ? 'currentColor' : 'none'} opacity={a ? 0.55 : 1} />
                <rect x="3" y="14" width="7" height="7" rx="1" fill={a ? 'currentColor' : 'none'} opacity={a ? 0.35 : 1} />
                <rect x="14" y="14" width="7" height="7" rx="1" fill={a ? 'currentColor' : 'none'} opacity={a ? 0.75 : 1} />
            </svg>
        ),
    },
    {
        id: 'analisis', href: '/coordinador/analisis', label: 'Análisis',
        icon: (a: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={a ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 21H4.6c-.56 0-.84 0-1.05-.11a1 1 0 0 1-.44-.44C3 20.24 3 19.96 3 19.4V3" />
                <path d="m7 14 4-4 4 4 6-6" />
                {a && <path d="M18 8h3v3" />}
            </svg>
        ),
    },
    {
        id: 'comparativa', href: '/coordinador/comparativa', label: 'Comparar',
        icon: (a: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth={a ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                {a ? (
                    <>
                        <rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.9" />
                        <rect x="13" y="3" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.6" />
                        <rect x="3" y="13" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.6" />
                        <rect x="13" y="13" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.9" />
                    </>
                ) : (
                    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0-6h18" />
                )}
            </svg>
        ),
    },
    {
        id: 'historico', href: '/coordinador/historico', label: 'Histórico',
        icon: (a: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={a ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M7 16l4-8 4 4 6-8" />
            </svg>
        ),
    },
];

const CSS = `
    /* ═══ Keyframes ═══ */
    @keyframes ctn-bounce {
        0% { transform: scale(1); }
        30% { transform: scale(1.25); }
        50% { transform: scale(0.9); }
        70% { transform: scale(1.08); }
        100% { transform: scale(1); }
    }
    @keyframes ctn-indicator-in {
        0% { transform: translateX(-50%) scaleX(0); opacity: 0; }
        100% { transform: translateX(-50%) scaleX(1); opacity: 1; }
    }
    @keyframes ctn-label-in {
        0% { opacity: 0; transform: translateY(4px); }
        100% { opacity: 1; transform: translateY(0); }
    }

    /* ═══ Tab Bar ═══ */
    .ctn-bar {
        position: fixed;
        bottom: var(--recordings-area-nav-lift, 0px);
        left: 0;
        right: 0;
        z-index: 50;
        background: linear-gradient(180deg, rgba(7,8,13,0.95) 0%, rgba(7,8,13,0.98) 100%);
        border-top: 1px solid rgba(139,92,246,0.12);
        padding-bottom: env(safe-area-inset-bottom, 0px);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
    }
    .ctn-bar.showcase-mobile-nav--embed {
        position: absolute;
        left: 50%;
        right: auto;
        bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
        width: min(calc(100% - 1.5rem), 32rem);
        transform: translateX(-50%);
        z-index: 90;
        border: 1px solid rgba(139,92,246,0.18);
        border-radius: 1.35rem;
        padding-bottom: 0;
        overflow: hidden;
        box-shadow: 0 18px 48px rgba(0,0,0,0.34);
    }
    .ctn-inner {
        display: flex;
        height: 56px;
        padding: 0 4px;
        max-width: 520px;
        margin: 0 auto;
        position: relative;
        align-items: stretch;
    }
    .ctn-bar.showcase-mobile-nav--embed .ctn-inner {
        height: 54px;
        max-width: none;
    }

    /* ═══ Sliding Pill ═══ */
    .ctn-pill {
        position: absolute;
        top: 7px;
        bottom: 7px;
        border-radius: 12px;
        background: linear-gradient(135deg, rgba(139,92,246,0.14), rgba(6,182,212,0.08));
        border: 1px solid rgba(139,92,246,0.18);
        transition: left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                    width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        pointer-events: none;
        box-shadow: 0 0 16px rgba(139,92,246,0.06);
    }

    /* ═══ Button ═══ */
    .ctn-btn {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0;
        min-height: 56px;
        height: 56px;
        background: transparent;
        border: none;
        outline: none;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        color: rgba(148, 163, 184, 0.35);
        padding: 6px 0 8px;
        position: relative;
        z-index: 1;
        transition: color 0.3s ease;
    }
    .ctn-btn--labeled {
        gap: 2px;
        min-height: 60px;
        height: 60px;
    }
    .ctn-bar.showcase-mobile-nav--embed .ctn-btn {
        min-height: 54px;
        height: 54px;
        touch-action: manipulation;
    }
    .ctn-btn:active {
        transform: scale(0.92);
        transition: transform 0.1s ease;
    }
    .ctn-btn[data-active="true"] {
        color: #c4b5fd;
    }

    /* ═══ Icon ═══ */
    .ctn-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }
    .ctn-btn[data-active="true"] .ctn-icon {
        animation: ctn-bounce 0.5s ease;
        filter: drop-shadow(0 0 6px rgba(139,92,246,0.4));
    }

    /* ═══ Active indicator (integrated under icon) ═══ */
    .ctn-indicator {
        position: absolute;
        left: 50%;
        bottom: 5px;
        width: 14px;
        height: 3px;
        border-radius: 999px;
        background: linear-gradient(90deg, #8B5CF6, #06B6D4);
        transform: translateX(-50%);
        animation: ctn-indicator-in 0.28s ease forwards;
        box-shadow: 0 0 8px rgba(139,92,246,0.45);
    }

    /* ═══ Label (active only) ═══ */
    .ctn-label {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.02em;
        line-height: 1;
        color: #e2d9ff;
        animation: ctn-label-in 0.35s ease;
        white-space: nowrap;
    }

    /* ═══ Tooltip ═══ */
    @keyframes ctn-tip-in {
        0%  { opacity: 0; transform: translateX(-50%) translateY(4px) scale(0.92); }
        100%{ opacity: 1; transform: translateX(-50%) translateY(0)   scale(1);    }
    }
    .ctn-tooltip {
        position: fixed;
        z-index: 9999;
        pointer-events: none;
        background: rgba(15, 16, 24, 0.92);
        border: 1px solid rgba(139,92,246,0.30);
        border-radius: 10px;
        padding: 5px 11px;
        font-size: 12px;
        font-weight: 700;
        color: #e2d9ff;
        white-space: nowrap;
        letter-spacing: 0.01em;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 12px rgba(139,92,246,0.15);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        animation: ctn-tip-in 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards;
        transform-origin: center bottom;
    }
    .ctn-tooltip::after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 50%;
        transform: translateX(-50%);
        width: 8px;
        height: 8px;
        background: rgba(15, 16, 24, 0.92);
        border-right: 1px solid rgba(139,92,246,0.30);
        border-bottom: 1px solid rgba(139,92,246,0.30);
        clip-path: polygon(0 0, 100% 100%, 0 100%);
        transform: translateX(-50%) rotate(-45deg);
    }
`;

/* ─── Tooltip flotante via portal ─── */
function NavTooltip({ label, anchorRect }: { label: string; anchorRect: DOMRect }) {
    const GAP = 10;
    const top = anchorRect.top - GAP;
    const left = anchorRect.left + anchorRect.width / 2;
    return createPortal(
        <div
            className="ctn-tooltip"
            style={{ top, left, transform: 'translateX(-50%) translateY(-100%)' }}
        >
            {label}
        </div>,
        document.body
    );
}

export type CoordinadorMobileNavEmbedConfig = {
    activeNavId: string;
    onNavigate: (navId: string) => void;
    anchored?: boolean;
    /** Simulacro activo (embed demo). Si no se pasa, se lee de localStorage + evento sg-coordinator-simulation. */
    simulationId?: string;
};

type CoordinadorMobileNavProps = {
    embed?: CoordinadorMobileNavEmbedConfig;
};

export default function CoordinadorMobileNav({ embed }: CoordinadorMobileNavProps = {}) {
    const pathname = usePathname();
    const router = useRouter();
    const barRef = useRef<HTMLDivElement>(null);
    const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
    const [tooltip, setTooltip] = useState<{ idx: number; rect: DOMRect } | null>(null);
    const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isDemoCoordinador = isDemoCoordinadorRoute(pathname);
    const isCoordinador = pathname?.startsWith('/coordinador') || isDemoCoordinador;

    const [simulationId, setSimulationId] = useState(embed?.simulationId ?? '');

    useEffect(() => {
        if (embed?.simulationId !== undefined) {
            setSimulationId(embed.simulationId);
            return;
        }
        const readSim = () => {
            if (isDemoCoordinador) {
                setSimulationId(localStorage.getItem('demo_coordinator_selected_simulation') || '');
            } else {
                setSimulationId(readSelectedSimulationFromStorage());
            }
        };
        readSim();
        const onSim = (e: Event) => {
            const detail = (e as CustomEvent<{ simulationId?: string }>).detail;
            if (detail?.simulationId) setSimulationId(detail.simulationId);
            else readSim();
        };
        window.addEventListener(COORDINATOR_SIMULATION_EVENT, onSim);
        return () => window.removeEventListener(COORDINATOR_SIMULATION_EVENT, onSim);
    }, [embed?.simulationId, isDemoCoordinador]);

    const allowedNavIds = useMemo(
        () => new Set(filterCoordinatorNavIds(simulationId)),
        [simulationId],
    );

    const navItems = useMemo(() => {
        const filtered = COORD_MOBILE_NAV_ITEMS.filter(item =>
            allowedNavIds.has(item.id as CoordinatorNavItemId),
        );
        if (!isDemoCoordinador) return filtered;
        return filtered.map((item) => ({
            ...item,
            href: demoCoordinadorPath(
                item.id === 'dashboard' ? 'resumen' : (item.id as Parameters<typeof demoCoordinadorPath>[0]),
            ),
        }));
    }, [isDemoCoordinador, allowedNavIds]);

    const routerActiveIndex = navItems.findIndex(item => {
        if (item.id === 'dashboard') {
            return isDemoCoordinador
                ? pathname === demoCoordinadorPath('resumen')
                : pathname === '/coordinador';
        }
        return pathname?.startsWith(item.href);
    });
    const embedActiveIndex = embed
        ? navItems.findIndex(item => item.id === embed.activeNavId)
        : -1;
    const active =
        embed
            ? (embedActiveIndex === -1 ? 0 : embedActiveIndex)
            : (routerActiveIndex === -1 ? 0 : routerActiveIndex);

    const showActiveLabel = Boolean(embed && navItems.length <= 5);

    const syncPill = useCallback(() => {
        if (!barRef.current) return;
        const buttons = barRef.current.querySelectorAll('.ctn-btn');
        const btn = buttons[active] as HTMLElement | undefined;
        if (btn) {
            const barRect = barRef.current.getBoundingClientRect();
            const btnRect = btn.getBoundingClientRect();
            setPillStyle({ left: btnRect.left - barRect.left, width: btnRect.width });
        }
    }, [active]);

    /* Pill deslizante */
    useEffect(() => {
        syncPill();
        window.addEventListener('resize', syncPill);
        return () => window.removeEventListener('resize', syncPill);
    }, [syncPill]);

    /* Ocultar tooltip al cambiar de ruta */
    useEffect(() => {
        if (!embed) setTooltip(null);
    }, [pathname, embed]);

    const showTip = useCallback((idx: number, el: HTMLElement) => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setTooltip({ idx, rect: el.getBoundingClientRect() });
    }, []);

    const hideTip = useCallback((delay = 0) => {
        hideTimer.current = setTimeout(() => setTooltip(null), delay);
    }, []);

    if (!embed && !isCoordinador) return null;
    if (!embed && isRecordingsClasesRoute(pathname)) return null;

    const barClass = embed ? 'ctn-bar showcase-mobile-nav--embed' : 'ctn-bar lg:hidden';

    return (
        <>
            <style>{CSS}</style>
            <nav className={barClass} role="navigation" aria-label="Navegación coordinador" data-coord-tour={TourAnchors.navMobile}>
                <div className="ctn-inner" ref={barRef}>
                    {/* Pill deslizante */}
                    <div className="ctn-pill" style={{ left: `${pillStyle.left}px`, width: `${pillStyle.width}px` }} />

                    {/* Tabs */}
                    {navItems.map((item, idx) => {
                        const isActive = active === idx;
                        return (
                            <button
                                key={item.id}
                                className={`ctn-btn${showActiveLabel ? ' ctn-btn--labeled' : ''}`}
                                data-active={isActive}
                                onClick={() => {
                                    hideTip();
                                    if (embed) embed.onNavigate(item.id);
                                    else router.push(item.href);
                                }}
                                aria-label={item.label}
                                aria-current={isActive ? 'page' : undefined}
                                onMouseEnter={embed ? undefined : (e => showTip(idx, e.currentTarget))}
                                onMouseLeave={embed ? undefined : () => hideTip(120)}
                                onTouchStart={
                                    embed
                                        ? undefined
                                        : (e) => {
                                              if (touchTimer.current) clearTimeout(touchTimer.current);
                                              const el = e.currentTarget;
                                              touchTimer.current = setTimeout(() => showTip(idx, el), 100);
                                          }
                                }
                                onTouchEnd={embed ? undefined : () => {
                                    if (touchTimer.current) clearTimeout(touchTimer.current);
                                    hideTip(700);
                                }}
                            >
                                <span className="ctn-icon">
                                    {item.icon(isActive)}
                                </span>
                                {isActive && <span className="ctn-indicator" aria-hidden />}
                                {showActiveLabel && isActive && (
                                    <span className="ctn-label">{item.label}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Tooltip flotante */}
            {!embed && tooltip !== null && (
                <NavTooltip label={navItems[tooltip.idx].label} anchorRect={tooltip.rect} />
            )}
        </>
    );
}
