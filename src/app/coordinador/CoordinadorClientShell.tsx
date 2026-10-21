'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import CoordinadorHelpBubble from '@features/coordinador/components/CoordinadorHelpBubble';
import CoordinatorVoiceDock from '@features/coordinador/components/CoordinatorVoiceDock';
import CoordinadorGuidedTour from '@features/coordinador/components/CoordinadorGuidedTour';
import CoordinadorGuidedTourRemoteStart from '@features/coordinador/components/CoordinadorGuidedTourRemoteStart';
import {
    CoordinadorGuidedTourProvider,
} from '@features/coordinador/context/CoordinadorGuidedTourContext';
import { CoordinadorDataProvider } from '@features/coordinador/context/CoordinadorDataProvider';
import CoordinadorMobileNav from '@features/coordinador/components/CoordinadorMobileNav';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import { auth, isRealAuthUser, waitForAuth } from '@features/auth/lib/firebase';
import {
    getCoordinatorInstitution,
    getCoordinatorScopeDisplayLabel,
    isAdmin,
    isCoordinator,
    isGlobalCoordinatorScope,
    parseCoordinatorScope,
    resolveCoordinatorSelectedInstitution,
} from '@features/auth/lib/admin-auth';
import { checkBypassToken } from '@/lib/coordinatorBypass';
import { clearDevRuntimeCaches, warmupCoordinatorCache } from '@features/simulacro/lib/firestoreService';
import { clearDataCaches } from '@/lib/storageCleanup';
import SgBrandedLoadingExperience from '@/components/SgBrandedLoadingExperience';
import { clearCachesIfBuildIdChanged } from '@/lib/buildIdCache';
import { ensureCoordinadorPanelCacheEpoch } from '@features/coordinador/lib/coordinadorPanelCache';
import PanelRouteRecovery from '@shared/components/PanelRouteRecovery';
import { PremiumCoordinatorMain } from '@shared/components/premium';
import { navigateClient } from '@/shared/lib/hardNavigate';
import DemoExitControl from '@/app/demo/_shared/DemoExitControl';
import InstallPrompt from '@/components/InstallPrompt';
import { PremiumMaintenanceScreen } from '@shared/components/premium';
import {
  DEMO_COORDINADOR_HOME,
  exitDemoCoordinadorSession,
} from '@/app/demo/_shared/demoExit';
import { useDemoBackGuard } from '@/app/demo/_shared/useDemoBackGuard';
import {
    getCoordinatorInstitutionFromClaims,
    warnIfMissingSecurityClaims,
} from '@features/auth/lib/token-claims';
import {
    COORDINATOR_SIMULATION_EVENT,
    filterCoordinatorNavIds,
    readSelectedSimulationFromStorage,
    shouldShowPensumNav,
    type CoordinatorNavItemId,
} from '@features/coordinador/lib/coordinatorNavPolicy';
import {
    DEMO_COORDINADOR_BASE,
    demoCoordinadorPath,
    isDemoCoordinadorRoute,
} from '@/app/demo/_shared/demoRoutePaths';
import { coordTabFromNavId } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-coordinador/coord-embed-navigation';
import { warmupCoordinatorCache as warmupCoordinatorMockCache } from '@/app/landing-profesional/preview-paneles/_data/firestoreMock';
import { DEMO_COORDINADOR_DATA_OPTIONS } from '@features/coordinador/hooks/coordinadorDataOptions';
import { resolveDemoDataSource } from '@/lib/demoDataSource';
import { ChevronLeft } from 'lucide-react';
import { useCoordinatorSidebarState } from '@features/coordinador/hooks/useCoordinatorSidebarState';
import SgBrandLogo from '@/components/brand/SgBrandLogo';
import SgFloatingTipLayer from '@shared/components/ui/SgFloatingTipLayer';

/* ═══════════════════════════════════════
   SVG Icons — Professional, no emojis
   ═══════════════════════════════════════ */
const Icons = {
    dashboard: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="4" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="11" width="7" height="10" rx="1.5" />
        </svg>
    ),
    estudiantes: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    respuestas: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    ),
    analisis: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 21H4.6c-.56 0-.84 0-1.05-.11a1 1 0 0 1-.44-.44C3 20.24 3 19.96 3 19.4V3" />
            <path d="m7 14 4-4 4 4 6-6" /><path d="M18 8h3v3" />
        </svg>
    ),
    comparativa: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0-6h18" />
        </svg>
    ),
    historico: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 6-8" />
        </svg>
    ),
    desempeno: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
        </svg>
    ),
    detalle: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" />
        </svg>
    ),
    heatmap: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    ),
    resumen: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" /><line x1="9" y1="9" x2="11" y2="9" />
        </svg>
    ),
    logout: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
};

const NAV_ITEM_DEFS: Record<
    CoordinatorNavItemId,
    { href: string; label: string; icon: ReactNode }
> = {
    dashboard: { href: '/coordinador', label: 'Dashboard', icon: Icons.dashboard },
    desempeno: { href: '/coordinador/desempeno', label: 'Desempeño', icon: Icons.desempeno },
    pensum: { href: '/coordinador/pensum', label: 'Pensum', icon: Icons.resumen },
    estudiantes: { href: '/coordinador/estudiantes', label: 'Estudiantes', icon: Icons.estudiantes },
    respuestas: { href: '/coordinador/respuestas', label: 'Claves', icon: Icons.respuestas },
    analisis: { href: '/coordinador/analisis', label: 'Análisis', icon: Icons.analisis },
    comparativa: { href: '/coordinador/comparativa', label: 'Comparativa', icon: Icons.comparativa },
    historico: { href: '/coordinador/historico', label: 'Histórico', icon: Icons.historico },
};

function buildNavItems(simulationId: string, demoMode: boolean) {
    return filterCoordinatorNavIds(simulationId).map((id) => ({
        id,
        ...NAV_ITEM_DEFS[id],
        href: demoMode ? demoCoordinadorPath(coordTabFromNavId(id)) : NAV_ITEM_DEFS[id].href,
    }));
}

function readSimulationForShell(pathname: string | null): string {
    if (isDemoCoordinadorRoute(pathname)) {
        if (typeof window === 'undefined') return '';
        return localStorage.getItem('demo_coordinator_selected_simulation') || '';
    }
    return readSelectedSimulationFromStorage();
}

function isCoordinatorNavActive(
    pathname: string | null,
    item: { id: CoordinatorNavItemId; href: string },
    demoMode: boolean,
) {
    const currentPath = pathname || '';
    if (item.id === 'dashboard') {
        return demoMode
            ? currentPath === DEMO_COORDINADOR_BASE
            : currentPath === '/coordinador';
    }
    return currentPath === item.href || currentPath.startsWith(`${item.href}/`);
}

// ============================================================
// 🔧 MAINTENANCE MODE GLOBAL — Bloquea TODAS las rutas /coordinador/*
// ============================================================
const MAINTENANCE_MODE = false;

const isProduction = typeof window !== 'undefined' &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1');

// Fecha objetivo: 2 horas desde ahora (22 de abril 2026, ~7:00 PM COT)
const TARGET_DATE = new Date('2026-04-22T24:00:00Z'); // Medianoche COT = 5:00 AM UTC del día siguiente


function CoordinatorLoadingScreen({ slow = false }: { slow?: boolean }) {
    return (
        <div data-sg-route-loading="true" className="relative min-h-screen" style={{ background: '#07080d' }}>
            <SgBrandedLoadingExperience
                variant="fullscreen"
                personalize={false}
                message="Verificando acceso al panel"
                showPercent={false}
            />
            {slow ? (
                <div className="sg-slow-load-hint absolute inset-x-0 bottom-[18vh] flex justify-center">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/15"
                    >
                        Recargar
                    </button>
                </div>
            ) : null}
        </div>
    );
}

export default function CoordinadorClientShell({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const demoMode = isDemoCoordinadorRoute(pathname);
    // ponytail: estado inicial determinístico (loading=true) para que SSR y
    // primer render del cliente coincidan. El acceso real se resuelve en el
    // effect de abajo. Evita hydration mismatch por lectura de localStorage
    // en tiempo de render.
    const [institution, setInstitution] = useState('');
    const [accessLoading, setAccessLoading] = useState(true);
    const [accessSlow, setAccessSlow] = useState(false);
    const [selectedSimulation, setSelectedSimulation] = useState('');
    const {
        collapsed: sidebarCollapsed,
        toggle: toggleSidebar,
        widthPx: sidebarWidthPx,
        isResizing: sidebarResizing,
        startResize: startSidebarResize,
    } = useCoordinatorSidebarState();

    useDemoBackGuard(demoMode, DEMO_COORDINADOR_HOME, isDemoCoordinadorRoute);

    useEffect(() => {
        clearCachesIfBuildIdChanged();
        void ensureCoordinadorPanelCacheEpoch();
    }, []);

    useEffect(() => {
        if (!accessLoading) {
            const reset = window.setTimeout(() => setAccessSlow(false), 0);
            return () => window.clearTimeout(reset);
        }
        const t = window.setTimeout(() => setAccessSlow(true), 10_000);
        return () => window.clearTimeout(t);
    }, [accessLoading]);

    useEffect(() => {
        const readSim = () => setSelectedSimulation(readSimulationForShell(pathname));
        readSim();
        const onSim = (e: Event) => {
            const detail = (e as CustomEvent<{ simulationId?: string }>).detail;
            if (detail?.simulationId) setSelectedSimulation(detail.simulationId);
            else readSim();
        };
        window.addEventListener(COORDINATOR_SIMULATION_EVENT, onSim);
        return () => window.removeEventListener(COORDINATOR_SIMULATION_EVENT, onSim);
    }, [pathname]);

    useEffect(() => {
        if (!selectedSimulation || demoMode) return;
        const onPensum = pathname === '/coordinador/pensum' || pathname?.startsWith('/coordinador/pensum/');
        if (onPensum && !shouldShowPensumNav(selectedSimulation)) {
            router.replace('/coordinador/desempeno');
        }
    }, [selectedSimulation, pathname, demoMode, router]);

    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && !demoMode) {
            clearDataCaches();
            clearDevRuntimeCaches();
        }
    }, [demoMode]);

    useEffect(() => {
        if (MAINTENANCE_MODE && isProduction) {
            const t = window.setTimeout(() => setAccessLoading(false), 0);
            return () => window.clearTimeout(t);
        }

        if (demoMode) {
            const inst =
                localStorage.getItem('demo_coordinator_institution') ||
                localStorage.getItem('coordinator_institution') ||
                DEMO_COORDINADOR_DATA_OPTIONS.bootstrapInstitution ||
                'TODAS';
            const email = localStorage.getItem('coordinator_email') || 'demo@seamosgenios.co';
            const t = window.setTimeout(() => {
                localStorage.setItem('coordinator_institution', inst);
                localStorage.setItem('coordinator_email', email);
                setInstitution(inst);
                setAccessLoading(false);
                window.dispatchEvent(
                    new CustomEvent('sg-coordinator-session', { detail: { institution: inst, email } }),
                );
                if (resolveDemoDataSource() === 'firebase') {
                    warmupCoordinatorCache().catch(() => {});
                } else {
                    warmupCoordinatorMockCache().catch(() => {});
                }
            }, 0);
            return () => window.clearTimeout(t);
        }

        checkBypassToken();

        // Fast-path: sesión previa en localStorage → mostrar panel sin esperar
        // Firebase Auth. applyAccess() más abajo revalida/coincide el estado.
        const lsInstFast = localStorage.getItem('coordinator_institution');
        const lsEmailFast = localStorage.getItem('coordinator_email');
        if (lsInstFast && lsEmailFast) {
            setInstitution(lsInstFast);
            setAccessLoading(false);
        }

        const finishWithInstitution = (inst: string, email: string, user?: User) => {
            localStorage.setItem('coordinator_institution', inst);
            localStorage.setItem('coordinator_email', email);
            localStorage.setItem(
                'coordinator_selected_institution',
                resolveCoordinatorSelectedInstitution(inst),
            );
            setInstitution(inst);
            setAccessLoading(false);
            if (user) void warnIfMissingSecurityClaims(user);
            window.dispatchEvent(
                new CustomEvent('sg-coordinator-session', { detail: { institution: inst, email } })
            );
            warmupCoordinatorCache().catch(() => {});
        };

        const denyAndRedirect = () => {
            localStorage.removeItem('coordinator_institution');
            localStorage.removeItem('coordinator_email');
            setInstitution('');
            setAccessLoading(false);
            navigateClient('/login', (href) => router.replace(href));
        };

        let unsub: (() => void) | undefined;

        const applyAccess = async (user: User | null) => {
            const lsInst = localStorage.getItem('coordinator_institution');
            const lsEmail = localStorage.getItem('coordinator_email');

            if (isRealAuthUser(user) && user.email) {
                const email = user.email.toLowerCase();

                if (isCoordinator(email)) {
                    const mappedInst = getCoordinatorInstitution(email);
                    if (mappedInst) {
                        finishWithInstitution(mappedInst, email, user);
                        return;
                    }
                }

                const claimInst = await getCoordinatorInstitutionFromClaims(user);
                if (claimInst) {
                    finishWithInstitution(claimInst, email, user);
                    return;
                }

                if (isAdmin(email) && lsInst && lsEmail) {
                    finishWithInstitution(lsInst, email, user);
                    return;
                }

                denyAndRedirect();
                return;
            }

            // Fase 1: sin Firebase Auth — legacy (bypass / sesión previa en localStorage)
            if (lsInst && lsEmail) {
                setInstitution(lsInst);
                setAccessLoading(false);
                window.dispatchEvent(
                    new CustomEvent('sg-coordinator-session', {
                        detail: { institution: lsInst, email: lsEmail },
                    })
                );
                warmupCoordinatorCache().catch(() => {});
                return;
            }

            denyAndRedirect();
        };

        void waitForAuth().then(() => {
            unsub = onAuthStateChanged(auth, (u) => {
                void applyAccess(u);
            });
            void applyAccess(auth.currentUser);
        });

        return () => unsub?.();
    }, [router, demoMode]);

    // Bloqueo de mantenimiento — solo en producción
    if (MAINTENANCE_MODE && isProduction) {
        return (
            <PremiumMaintenanceScreen
                title="Mantenimiento en Curso"
                subtitle="Estamos realizando mejoras en la plataforma. Vuelve pronto."
                showCountdown
                targetDate={TARGET_DATE}
            />
        );
    }

    if (accessLoading) {
        return (
            <PanelRouteRecovery fallbackPath="/coordinador">
                <CoordinatorLoadingScreen slow={accessSlow} />
            </PanelRouteRecovery>
        );
    }

    if (!institution) return null;

    const displayInstitution = isGlobalCoordinatorScope(institution)
        ? 'TODAS'
        : getCoordinatorScopeDisplayLabel(institution);
    const navItems = buildNavItems(selectedSimulation, demoMode);
    const activeId = navItems.find(item => isCoordinatorNavActive(pathname, item, demoMode))?.id || 'dashboard';

    return (
        <PanelRouteRecovery fallbackPath="/coordinador">
        <CoordinadorGuidedTourProvider autoStart={false}>
        <CoordinadorDataProvider>
        <div
            data-coordinator-theme
            style={{ fontFamily: "var(--coord-font-sans, 'Inter', sans-serif)", background: 'var(--coord-page, #07080d)', minHeight: '100vh' }}
        >

            {/* Sidebar — desktop only */}
            <aside
                className={`fixed top-0 left-0 z-50 hidden h-full flex-col overflow-hidden lg:flex ${
                    sidebarResizing ? '' : 'transition-[width] duration-300 ease-in-out'
                }`}
                style={{
                    width: sidebarWidthPx,
                    background: 'linear-gradient(180deg, #12162a 0%, #0c0f1c 100%)',
                    borderRight: '1px solid rgba(129,140,248,0.22)',
                    boxShadow: '12px 0 35px rgba(0,0,0,0.2)',
                }}
                data-coord-sidebar-collapsed={sidebarCollapsed ? 'true' : 'false'}
            >
                {/* Brand + toggle */}
                <div className={`shrink-0 pb-5 pt-5 ${sidebarCollapsed ? 'px-2.5' : 'px-3.5'}`}>
                    <div
                        className={`relative rounded-2xl border border-white/[0.14] transition-all duration-300 ${
                            sidebarCollapsed ? 'overflow-visible px-1.5 py-2.5' : 'overflow-hidden px-3.5 py-3.5'
                        }`}
                        style={{
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 14px 28px rgba(0,0,0,0.18)',
                        }}
                    >
                        <span
                            aria-hidden
                            className="pointer-events-none absolute -right-8 -top-10 h-20 w-20 rounded-full blur-2xl"
                            style={{ background: 'rgba(99,102,241,0.24)' }}
                        />
                        {!sidebarCollapsed ? (
                            <button
                                type="button"
                                onClick={toggleSidebar}
                                className="group absolute right-2 top-2 z-[2] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-white/65 transition-all duration-300 hover:-translate-y-0.5 hover:text-white"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(139,92,246,0.22), rgba(6,182,212,0.14))',
                                    borderColor: 'rgba(167,139,250,0.28)',
                                    boxShadow: '0 8px 20px rgba(79,70,229,0.22), inset 0 1px 0 rgba(255,255,255,0.10)',
                                }}
                                aria-label="Plegar menú"
                                data-sg-tip="Plegar menú"
                            >
                                <ChevronLeft className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                            </button>
                        ) : null}
                        <div className={`relative flex ${sidebarCollapsed ? 'flex-col items-center gap-2.5' : 'items-center gap-3 pr-9'}`}>
                            <div
                                className={`coord-sidebar-logo-stage flex shrink-0 items-center justify-center ${
                                    sidebarCollapsed
                                        ? 'overflow-hidden rounded-xl'
                                        : 'h-12 w-12 overflow-hidden rounded-2xl border border-white/[0.16] bg-[rgba(18,22,38,0.92)]'
                                }`}
                                style={
                                    sidebarCollapsed
                                        ? undefined
                                        : {
                                              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
                                          }
                                }
                            >
                                <SgBrandLogo
                                    size="xs"
                                    float={false}
                                    prominentShine
                                    relaxed
                                />
                            </div>
                            {!sidebarCollapsed ? (
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black uppercase leading-snug tracking-[0.18em] text-cyan-200/90">
                                        Seamos Genios
                                    </p>
                                    <p className="mt-0.5 text-[13px] font-bold leading-snug tracking-tight text-white">
                                        Panel Coordinador
                                    </p>
                                    <p
                                        className="mt-1 text-[10px] font-medium uppercase leading-snug tracking-wide text-white/55 line-clamp-2"
                                        title={displayInstitution}
                                    >
                                        {displayInstitution}
                                    </p>
                                </div>
                            ) : null}
                            {sidebarCollapsed ? (
                                <button
                                    type="button"
                                    onClick={toggleSidebar}
                                    className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-white/65 transition-all duration-300 hover:-translate-y-0.5 hover:text-white"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(139,92,246,0.22), rgba(6,182,212,0.14))',
                                        borderColor: 'rgba(167,139,250,0.28)',
                                        boxShadow: '0 8px 20px rgba(79,70,229,0.22), inset 0 1px 0 rgba(255,255,255,0.10)',
                                    }}
                                    aria-label="Desplegar menú"
                                    data-sg-tip="Desplegar menú"
                                >
                                    <ChevronLeft className="h-4 w-4 rotate-180 transition-transform duration-300 group-hover:scale-110" />
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav
                    data-coord-tour={TourAnchors.navSidebar}
                    className={`mx-2 flex-1 min-h-0 overflow-y-auto overscroll-contain rounded-2xl border border-white/[0.1] bg-[rgba(255,255,255,0.06)] py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${
                        sidebarCollapsed ? 'px-1.5' : 'px-2'
                    }`}
                >
                    {!sidebarCollapsed && (
                        <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/40">
                            Navegación
                        </p>
                    )}
                    {navItems.map(item => {
                        const isActive = item.id === activeId;
                        return (
                            <div key={item.id}>
                                <button
                                    onClick={() => {
                                        router.push(item.href);
                                    }}
                                    title={sidebarCollapsed ? item.label : undefined}
                                    className={`group flex w-full cursor-pointer items-center rounded-xl py-2.5 transition-all duration-200 ${
                                        sidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3 text-left'
                                    }`}
                                    style={{
                                        background: isActive
                                            ? 'linear-gradient(135deg, rgba(139,92,246,0.32), rgba(6,182,212,0.10))'
                                            : 'transparent',
                                        color: isActive ? '#ede9fe' : 'rgba(255,255,255,0.62)',
                                        border: isActive ? '1px solid rgba(139,92,246,0.38)' : '1px solid transparent',
                                        boxShadow: isActive ? '0 0 0 1px rgba(139,92,246,0.08), 0 8px 20px rgba(99,102,241,0.16)' : 'none',
                                    }}
                                    onMouseOver={e => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                            e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                                        }
                                    }}
                                    onMouseOut={e => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = 'rgba(255,255,255,0.62)';
                                        }
                                    }}
                                >
                                    <span className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-violet-400' : 'text-white/50 group-hover:text-white/75'}`}>
                                        {item.icon}
                                    </span>
                                    {!sidebarCollapsed && (
                                        <>
                                            <span className="flex-1 text-[13px] font-semibold">{item.label}</span>
                                            {isActive && (
                                                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" style={{ boxShadow: '0 0 6px rgba(139,92,246,0.6)' }} />
                                            )}
                                        </>
                                    )}
                                </button>
                                {/* Sub-tools for Análisis */}
                                {item.id === 'analisis' && isActive && !sidebarCollapsed && (
                                    <div className="ml-7 mt-1 space-y-0.5 pb-1.5 border-l border-white/5 pl-3">
                                        <button
                                            onClick={() => {
                                                window.dispatchEvent(new CustomEvent('open-analisis-drawer', { detail: { tab: 'questions' } }));
                                            }}
                                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200 text-left cursor-pointer"
                                            style={{ color: 'rgba(255,255,255,0.35)' }}
                                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)'; e.currentTarget.style.color = '#c4b5fd'; }}
                                            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
                                        >
                                            {Icons.detalle}
                                            <span className="text-[11px] font-medium">Detalle Preguntas</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                window.dispatchEvent(new CustomEvent('open-analisis-drawer', { detail: { tab: 'heatmap' } }));
                                            }}
                                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200 text-left cursor-pointer"
                                            style={{ color: 'rgba(255,255,255,0.35)' }}
                                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(6,182,212,0.08)'; e.currentTarget.style.color = '#67e8f9'; }}
                                            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
                                        >
                                            {Icons.heatmap}
                                            <span className="text-[11px] font-medium">Mapa Respuestas</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom section */}
                <div
                    className={`shrink-0 py-4 ${sidebarCollapsed ? 'px-2' : 'px-4'}`}
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                >
                    <div
                        className="mb-3 h-px"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }}
                    />
                    <button
                        onClick={() => {
                            if (demoMode) {
                                exitDemoCoordinadorSession(router);
                                return;
                            }
                            localStorage.removeItem('coordinator_email');
                            localStorage.removeItem('coordinator_institution');
                            localStorage.removeItem('coordinator_selected_institution');
                            localStorage.removeItem('coordinator_selected_simulation');
                            router.replace('/login');
                        }}
                        title={sidebarCollapsed ? (demoMode ? 'Salir de demo' : 'Cerrar Sesión') : undefined}
                        className={`flex w-full cursor-pointer items-center rounded-xl transition-all duration-200 group ${
                            sidebarCollapsed ? 'justify-center px-2 py-3' : 'justify-center gap-2 px-4 py-3'
                        }`}
                        style={{
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.15)',
                            color: 'rgba(248,113,113,0.8)',
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                            e.currentTarget.style.color = 'rgba(248,113,113,1)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)';
                            e.currentTarget.style.color = 'rgba(248,113,113,0.8)';
                        }}
                    >
                        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        {!sidebarCollapsed && (
                            <span className="text-sm font-bold">{demoMode ? 'Salir de demo' : 'Cerrar Sesión'}</span>
                        )}
                    </button>
                </div>

                {!sidebarCollapsed ? (
                    <div
                        role="separator"
                        aria-orientation="vertical"
                        aria-label="Redimensionar menú lateral"
                        data-sg-tip="Arrastra para cambiar el ancho del menú"
                        data-sg-tip-pos="right"
                        className="coord-sidebar-resize-handle absolute right-0 top-0 z-[60] hidden h-full w-2 cursor-col-resize lg:block"
                        onPointerDown={startSidebarResize}
                    />
                ) : null}
            </aside>

            {/* Main Content */}
            <main
                className={`min-h-screen pb-20 lg:ml-[var(--coord-sidebar-width,248px)] lg:pb-0 ${
                    sidebarResizing ? '' : 'transition-[margin] duration-300 ease-in-out'
                }`}
                style={{ background: 'var(--coord-page, #07080d)' }}
                data-premium-remake="coordinador-main"
            >
                <PremiumCoordinatorMain>
                    {demoMode ? <DemoExitControl mode="coordinador" /> : null}
                    {children}
                </PremiumCoordinatorMain>
            </main>

            {/* Bottom Tab Bar — mobile only */}
            <CoordinadorMobileNav />

            <CoordinadorHelpBubble />
            <CoordinatorVoiceDock />
            <CoordinadorGuidedTour />
            <CoordinadorGuidedTourRemoteStart />
            {!demoMode ? <InstallPrompt variant="panel" /> : null}
            <SgFloatingTipLayer />
        </div>
        </CoordinadorDataProvider>
        </CoordinadorGuidedTourProvider>
        </PanelRouteRecovery>
    );
}
