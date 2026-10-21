'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  DEMO_ESTUDIANTE_BASE,
  demoEstudiantePath,
  isDemoEstudianteNavAllowed,
  isDemoEstudianteRoute,
  parseDemoEstudianteNavId,
} from '@/app/demo/_shared/demoRoutePaths';
import { isRecordingsClasesRoute } from '@features/recordings/lib/recordingsAccess';
import { useStudentClasesNavVisible } from '@features/estudiante/hooks/useStudentClasesNavVisible';
import { useStudentCursoNavVisible } from '@features/curso/hooks/useStudentCursoNavVisible';
import { coursePathForSession } from '@features/curso/lib/courseRoutePaths';
import { navigateClient } from '@/shared/lib/hardNavigate';
import {
  studentMobileNavTheme,
  studentMobileNavThemeVars,
} from '@features/estudiante/lib/studentMobileNavTheme';

function normalizeStudentRoutePath(pathname: string | null): string {
  const fromRouter = (pathname ?? '').replace(/\/+$/, '');
  if (fromRouter) return fromRouter;
  if (typeof window === 'undefined') return '';
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

/* Estilo y dimensiones alineados con LandingMobileBottomNav (cotiz-lnb-*, tema dark) */

export const STUDENT_MOBILE_NAV_ITEMS = [
    {
        id: 'dashboard', subpath: '/dashboard', label: 'Inicio',
        icon: (a: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth={a ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                {a ? (
                    <path d="M12.97 2.59a1.5 1.5 0 0 0-1.94 0l-7.5 6.363A1.5 1.5 0 0 0 3 10.097V19.5A1.5 1.5 0 0 0 4.5 21h4.75a.75.75 0 0 0 .75-.75v-4.5a2 2 0 0 1 4 0v4.5c0 .414.336.75.75.75h4.75a1.5 1.5 0 0 0 1.5-1.5v-9.403a1.5 1.5 0 0 0-.53-1.144l-7.5-6.363Z" />
                ) : (
                    <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>
                )}
            </svg>
        ),
    },
    {
        id: 'estadisticas', subpath: '/estadisticas', label: 'Métricas',
        icon: (a: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={a ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" /><path d="m7 16 4-8 4 4 6-8" />
            </svg>
        ),
    },
    {
        id: 'analisis', subpath: '/analisis', label: 'Análisis',
        icon: (a: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth={a ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                {a ? (
                    <>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="currentColor" stroke="none" />
                        <path d="M14 2v6h6" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                        <line x1="9" y1="13" x2="15" y2="13" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
                        <line x1="9" y1="17" x2="13" y2="17" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
                    </>
                ) : (
                    <>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="9" y1="13" x2="15" y2="13" />
                        <line x1="9" y1="17" x2="13" y2="17" />
                    </>
                )}
            </svg>
        ),
    },
    {
        id: 'clases', subpath: '/clases', label: 'Clases',
        icon: (a: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth={a ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                {a ? (
                    <>
                        <rect x="2" y="5" width="20" height="14" rx="2.5" fill="currentColor" stroke="none" />
                        <path d="m10 9.5 5 3-5 3V9.5Z" fill="rgba(255,255,255,0.92)" stroke="none" />
                    </>
                ) : (
                    <>
                        <rect x="2" y="5" width="20" height="14" rx="2.5" />
                        <polygon points="10 9.5 15 12.5 10 15.5 10 9.5" />
                    </>
                )}
            </svg>
        ),
    },
    {
        id: 'curso', subpath: '/curso', label: 'Mi Curso',
        icon: (a: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth={a ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                {a ? (
                    <>
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" fill="currentColor" stroke="none" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="currentColor" stroke="none" />
                        <path d="M8 7h8M8 11h8" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" />
                    </>
                ) : (
                    <>
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        <line x1="8" y1="7" x2="16" y2="7" />
                        <line x1="8" y1="11" x2="16" y2="11" />
                    </>
                )}
            </svg>
        ),
    },
    {
        id: 'ranking', subpath: '/ranking', label: 'Ranking',
        icon: (a: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth={a ? 0.5 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
        ),
    },
    {
        id: 'perfil', subpath: '/perfil', label: 'Perfil',
        icon: (a: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth={a ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                {a ? (
                    <><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 1 0-16 0" /></>
                ) : (
                    <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>
                )}
            </svg>
        ),
    },
];

const LNB_TABLE_STYLE = {
    display: 'table',
    tableLayout: 'fixed',
    width: '100%',
    height: 58,
    borderCollapse: 'separate',
    borderSpacing: 0,
} as const;

const LNB_CELL_BASE = {
    padding: 0,
    margin: 0,
    verticalAlign: 'middle',
    textAlign: 'center',
} as const;

function navCellStyle(itemCount: number): React.CSSProperties {
    const pct = `${100 / Math.max(itemCount, 1)}%`;
    return { ...LNB_CELL_BASE, width: pct, maxWidth: pct };
}

const CSS = `
    .stn-bar {
        position: fixed;
        left: 0;
        right: 0;
        bottom: var(--recordings-area-nav-lift, 0px);
        z-index: 55;
        padding: 0 clamp(0.75rem, 3vw, 1.25rem) calc(0.625rem + env(safe-area-inset-bottom, 0px));
        pointer-events: none;
        background: linear-gradient(to top, var(--stn-bar-bg, #fff) 0%, var(--stn-bar-bg, #fff) 78%, transparent 100%);
    }
    .stn-bar.showcase-mobile-nav--embed {
        position: absolute;
        left: 50%;
        right: auto;
        bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
        width: min(calc(100% - 1.5rem), 32rem);
        transform: translateX(-50%);
        z-index: 90;
        padding: 0;
        pointer-events: none;
        background: transparent;
    }
    .stn-shell {
        position: relative;
        width: 100%;
        max-width: none;
        margin: 0;
        pointer-events: auto;
    }
    .stn-inner {
        display: table;
        table-layout: fixed;
        width: 100%;
        height: 58px;
        margin: 0;
        padding: 0 4px;
        border-collapse: separate;
        border-spacing: 0;
        border-radius: 1.25rem;
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        background: var(--stn-shell-bg, rgba(7, 17, 31, 0.62));
        border: 1px solid var(--stn-shell-border, rgba(255, 255, 255, 0.1));
        box-shadow: var(--stn-shell-shadow, 0 10px 32px rgba(0, 0, 0, 0.22));
        transition:
            background 0.35s ease,
            border-color 0.35s ease,
            box-shadow 0.35s ease;
    }
    .stn-cell {
        padding: 0;
        margin: 0;
        vertical-align: middle;
        text-align: center;
    }
    .stn-pill {
        position: absolute;
        top: 6px;
        bottom: 6px;
        left: 0;
        width: 0;
        border-radius: 14px;
        pointer-events: none;
        background: var(--stn-pill-bg, rgba(103, 232, 249, 0.14));
        border: 1px solid var(--stn-pill-border, rgba(103, 232, 249, 0.28));
        box-shadow: var(--stn-pill-shadow, 0 0 18px rgba(34, 211, 238, 0.12));
        transition:
            left 0.32s cubic-bezier(0.34, 1.4, 0.64, 1),
            width 0.32s cubic-bezier(0.34, 1.4, 0.64, 1),
            background 0.35s ease,
            border-color 0.35s ease,
            box-shadow 0.35s ease;
    }
    .stn-btn {
        position: relative;
        z-index: 1;
        display: block;
        width: 100%;
        height: 58px;
        margin: 0;
        padding: 6px 2px 4px;
        border: none;
        background: transparent;
        box-sizing: border-box;
        text-align: center;
        cursor: pointer;
        -webkit-appearance: none;
        appearance: none;
        -webkit-tap-highlight-color: transparent;
        color: var(--stn-inactive, rgba(255, 255, 255, 0.42));
        transition: color 0.25s ease;
    }
    .stn-btn[data-active="true"] {
        color: var(--stn-active, #a5f3fc);
    }
    .stn-icon {
        display: block;
        width: 22px;
        height: 22px;
        margin: 0 auto 2px;
        line-height: 0;
    }
    .stn-icon svg {
        display: block;
        margin: 0 auto;
    }
    .stn-label {
        display: block;
        width: 100%;
        max-width: 100%;
        margin: 0;
        padding: 0 1px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 0.04em;
        line-height: 1.15;
        text-align: center;
        color: inherit;
    }
    @media (min-width: 380px) {
        .stn-label {
            font-size: 10px;
        }
    }
`;

export type StudentMobileNavEmbedConfig = {
    activeIndex: number;
    onNavigate: (navId: string) => void;
    buttonId?: (navId: string) => string | undefined;
    /** Anclada al marco del showcase (no al viewport). */
    anchored?: boolean;
};

type StudentMobileNavProps = {
    embed?: StudentMobileNavEmbedConfig;
};

export default function StudentMobileNav({ embed }: StudentMobileNavProps = {}) {
    const pathname = usePathname();
    const router = useRouter();
    const innerRef = useRef<HTMLTableElement>(null);
    const pillRef = useRef<HTMLDivElement>(null);
    const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const path = normalizeStudentRoutePath(pathname);
    const isDemoEstudiante = isDemoEstudianteRoute(path);
    const isEstudiante =
        path === '/estudiante' ||
        path.startsWith('/estudiante/') ||
        isDemoEstudiante;
    const isDashboardRoot =
        path === DEMO_ESTUDIANTE_BASE ||
        path === `${DEMO_ESTUDIANTE_BASE}/dashboard` ||
        path === '/estudiante' ||
        path === '/estudiante/dashboard';
    const isAllowed = (() => {
        if (isDashboardRoot) return true;
        if (isDemoEstudiante) {
            return isDemoEstudianteNavAllowed(parseDemoEstudianteNavId(path));
        }
        return ['/dashboard', '/estadisticas', '/analisis', '/ranking', '/perfil', '/curso', '/clases'].some(
            (sp) => path.endsWith(sp),
        );
    })();

    const basePath = isDemoEstudiante ? DEMO_ESTUDIANTE_BASE : '/estudiante';
    const { showClasesNav } = useStudentClasesNavVisible();
    const { showCursoNav, courseOnlyShell } = useStudentCursoNavVisible();
    const visibleItems = STUDENT_MOBILE_NAV_ITEMS.filter((item) => {
        if (item.id === 'clases') return showClasesNav;
        if (item.id === 'curso') return showCursoNav;
        if (courseOnlyShell) {
            if (
                item.id === 'dashboard' ||
                item.id === 'estadisticas' ||
                item.id === 'analisis' ||
                item.id === 'ranking'
            ) {
                return false;
            }
        }
        if (isDemoEstudiante) return isDemoEstudianteNavAllowed(item.id);
        return true;
    });
    const cellStyle = useMemo(() => navCellStyle(visibleItems.length), [visibleItems.length]);
    const routerActiveIndex = visibleItems.findIndex((item) => {
        if (isDashboardRoot) return item.id === 'dashboard';
        if (isDemoEstudiante) return parseDemoEstudianteNavId(path) === item.id;
        return path.includes(item.subpath);
    });
    const routerActive = routerActiveIndex === -1 ? 0 : routerActiveIndex;
    const active = embed ? embed.activeIndex : routerActive;

    const navTheme = useMemo(() => {
        if (embed) {
            const item = visibleItems[embed.activeIndex];
            const sectionPath = item
                ? isDemoEstudiante
                    ? demoEstudiantePath(item.id)
                    : `${basePath}${item.subpath}`
                : path;
            return studentMobileNavTheme(sectionPath);
        }
        return studentMobileNavTheme(path);
    }, [basePath, embed, isDemoEstudiante, path, visibleItems]);

    const innerThemeStyle = useMemo(
        () => studentMobileNavThemeVars(navTheme) as React.CSSProperties,
        [navTheme],
    );

    useEffect(() => {
        if (!isEstudiante || !isAllowed || typeof window === 'undefined') return;
        try {
            localStorage.setItem('student_last_panel', path);
        } catch {
            /* ignore */
        }
    }, [isAllowed, isEstudiante, path]);

    const syncPill = useCallback(() => {
        const inner = innerRef.current;
        const pillEl = pillRef.current;
        if (!inner || !pillEl) return;
        const btn = btnRefs.current[active];
        if (!btn) {
            pillEl.style.left = '0px';
            pillEl.style.width = '0px';
            return;
        }
        const ir = inner.getBoundingClientRect();
        const br = btn.getBoundingClientRect();
        pillEl.style.left = `${br.left - ir.left}px`;
        pillEl.style.width = `${br.width}px`;
    }, [active]);

    useLayoutEffect(() => {
        syncPill();
    }, [syncPill]);

    useEffect(() => {
        const inner = innerRef.current;
        if (!inner || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(() => syncPill());
        ro.observe(inner);
        window.addEventListener('resize', syncPill);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', syncPill);
        };
    }, [syncPill]);

    if (!embed) {
        if (!isEstudiante) return null;
        if (/\/estudiante\/(?:[^/]+\/)?curso(?:\/|$)/.test(path)) return null;
        if (isRecordingsClasesRoute(path)) return null;
        if (!isAllowed) return null;
    }

    const barClass = embed
        ? `stn-bar showcase-mobile-nav--embed${embed.anchored ? '' : ''}`
        : 'stn-bar lg:hidden';

    return (
        <>
            <style>{CSS}</style>
            <nav
                className={barClass}
                role="navigation"
                aria-label="Navegación principal"
                data-stn-section={navTheme.section}
            >
                <div className="stn-shell">
                    <div ref={pillRef} className="stn-pill" aria-hidden />
                    <table
                        className="stn-inner"
                        ref={innerRef}
                        style={{ ...LNB_TABLE_STYLE, ...innerThemeStyle }}
                        role="presentation"
                    >
                        <tbody>
                            <tr>
                                {visibleItems.map((item, idx) => {
                                    const isActive = active === idx;
                                    const domId = embed?.buttonId?.(item.id);
                                    return (
                                        <td key={item.id} className="stn-cell" style={cellStyle}>
                                            <button
                                                type="button"
                                                id={domId}
                                                ref={(el) => {
                                                    btnRefs.current[idx] = el;
                                                }}
                                                className="stn-btn"
                                                data-active={isActive}
                                                onClick={() => {
                                                    if (embed) {
                                                        embed.onNavigate(item.id);
                                                        return;
                                                    }
                                                    if (isDemoEstudiante) {
                                                        router.push(demoEstudiantePath(item.id));
                                                        return;
                                                    }
                                                    if (item.id === 'curso') {
                                                        navigateClient(coursePathForSession(), (href) => router.push(href));
                                                        return;
                                                    }
                                                    router.push(basePath + item.subpath);
                                                }}
                                                aria-label={item.label}
                                                aria-current={isActive ? 'page' : undefined}
                                            >
                                                <span className="stn-icon">
                                                    {item.icon(isActive)}
                                                </span>
                                                <span className="stn-label">{item.label}</span>
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </nav>
        </>
    );
}
