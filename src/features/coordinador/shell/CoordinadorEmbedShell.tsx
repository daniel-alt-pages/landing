'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import CoordinadorHelpBubble from '@features/coordinador/components/CoordinadorHelpBubble';
import CoordinatorVoiceDock from '@features/coordinador/components/CoordinatorVoiceDock';
import CoordinadorMobileNav from '@features/coordinador/components/CoordinadorMobileNav';
import { useCoordEmbed } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-coordinador/context/CoordEmbedProvider';
import { coordNavIdFromTab, coordTabFromNavId } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-coordinador/coord-embed-navigation';
import { warmupCoordinatorCache } from '@/app/landing-profesional/preview-paneles/_data/firestoreMock';
import { DEMO_COORDINADOR_DATA_OPTIONS } from '@/app/landing-profesional/preview-paneles/_data/coordinadorMock';
import { CoordinadorDataProvider, useCoordinadorDataFromContext } from '@features/coordinador/context/CoordinadorDataProvider';
import {
    CoordinadorGuidedTourProvider,
} from '@features/coordinador/context/CoordinadorGuidedTourContext';
import CoordinadorGuidedTour from '@features/coordinador/components/CoordinadorGuidedTour';
import CoordinadorGuidedTourRemoteStart from '@features/coordinador/components/CoordinadorGuidedTourRemoteStart';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import { useCoordinadorPanelLayout } from '@features/coordinador/hooks/useCoordinadorPanelLayout';
import { Wrench, Clock } from 'lucide-react';
import {
  demoCoordinadorPath,
  isDemoCoordinadorRoute,
} from '@/app/demo/_shared/demoRoutePaths';
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

const NAV_ITEMS = [
    { id: 'dashboard', href: '/coordinador', label: 'Dashboard', icon: Icons.dashboard },
    { id: 'pensum', href: '/coordinador/pensum', label: 'Pensum', icon: Icons.resumen },
    { id: 'desempeno', href: '/coordinador/desempeno', label: 'Desempeño', icon: Icons.desempeno },
    { id: 'estudiantes', href: '/coordinador/estudiantes', label: 'Estudiantes', icon: Icons.estudiantes },
    { id: 'respuestas', href: '/coordinador/respuestas', label: 'Respuestas', icon: Icons.heatmap },
    { id: 'analisis', href: '/coordinador/analisis', label: 'Análisis', icon: Icons.analisis },
    { id: 'comparativa', href: '/coordinador/comparativa', label: 'Comparativa', icon: Icons.comparativa },
    { id: 'historico', href: '/coordinador/historico', label: 'Histórico', icon: Icons.historico },
];

// ============================================================
// 🔧 MAINTENANCE MODE GLOBAL — Bloquea TODAS las rutas /coordinador/*
// ============================================================
const MAINTENANCE_MODE = false;

const isProduction = typeof window !== 'undefined' &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1');

// Fecha objetivo: 2 horas desde ahora (22 de abril 2026, ~7:00 PM COT)
const TARGET_DATE = new Date('2026-04-22T24:00:00Z'); // Medianoche COT = 5:00 AM UTC del día siguiente

function useCountdown(targetDate: Date) {
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    useEffect(() => {
        const tick = () => {
            const diff = Math.max(0, targetDate.getTime() - Date.now());
            setTimeLeft({
                hours: Math.floor(diff / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000),
            });
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);
    return timeLeft;
}

function MaintenanceScreen() {
    const timeLeft = useCountdown(TARGET_DATE);
    const pad = (n: number) => String(n).padStart(2, '0');
    const boxes = [
        { value: pad(timeLeft.hours), label: 'Horas' },
        { value: pad(timeLeft.minutes), label: 'Min' },
        { value: pad(timeLeft.seconds), label: 'Seg' },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0a2e 0%, #1a1a4e 50%, #0a0a2e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
            <div style={{
                maxWidth: '420px',
                width: '100%',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '48px 32px',
                backdropFilter: 'blur(20px)',
            }}>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                    <Wrench size={64} color="rgba(255,255,255,0.85)" strokeWidth={1.5} aria-hidden />
                </div>
                <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>
                    Mantenimiento en Curso
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: 1.6 }}>
                    Estamos realizando mejoras en la plataforma.
                    Vuelve pronto.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '24px' }}>
                    {boxes.map((box, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '16px',
                                background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.15))',
                                border: '1px solid rgba(139,92,246,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '1px',
                                boxShadow: '0 4px 20px rgba(139,92,246,0.15)',
                            }}>
                                {box.value}
                            </div>
                            <p style={{ marginTop: '6px', fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                                {box.label}
                            </p>
                        </div>
                    ))}
                </div>
                <div style={{
                    marginTop: '28px',
                    padding: '12px 20px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    borderRadius: '12px',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                }}>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Clock size={14} aria-hidden />
                        Tiempo estimado de restauración
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function CoordinadorEmbedShell({ children }: { children: React.ReactNode }) {
    return (
        <CoordinadorDataProvider options={DEMO_COORDINADOR_DATA_OPTIONS}>
            <CoordinadorEmbedShellContent>{children}</CoordinadorEmbedShellContent>
        </CoordinadorDataProvider>
    );
}

function CoordinadorEmbedShellContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { embedDemo, activeTab, setActiveTab } = useCoordEmbed();
    const layout = useCoordinadorPanelLayout(embedDemo);
    const { currentInstitution, loading } = useCoordinadorDataFromContext();

    useEffect(() => {
        warmupCoordinatorCache().catch(() => {});
    }, []);

    if (loading && !currentInstitution) return null;

    const displayInstitution =
        currentInstitution === '*' ? 'TODAS' : currentInstitution || 'TODAS';
    const activeId = embedDemo
        ? coordNavIdFromTab(activeTab)
        : NAV_ITEMS.find(item => {
              if (item.id === 'dashboard') return pathname === '/coordinador';
              return pathname.startsWith(item.href);
          })?.id || 'dashboard';

    const goToNav = (navId: string) => {
        if (embedDemo) {
            const tab = coordTabFromNavId(navId);
            setActiveTab(tab);
            if (isDemoCoordinadorRoute(pathname)) {
                router.replace(demoCoordinadorPath(tab));
            }
            return;
        }
        const item = NAV_ITEMS.find((n) => n.id === navId);
        if (item) router.push(item.href);
    };

    return (
        <CoordinadorGuidedTourProvider autoStart={false}>
        <div
            data-coordinator-theme
            data-coordinador-embed={embedDemo ? 'true' : undefined}
            data-cotiz-demo-coord-shell={embedDemo ? '' : undefined}
            data-showcase-compact-layout={layout.compactLayout ? 'on' : undefined}
            className={layout.compactLayout ? 'showcase-compact-layout' : undefined}
            style={{
                ...layout.shellStyle,
                fontFamily: "var(--coord-font-sans, 'Inter', sans-serif)",
                background: 'var(--coord-page, #0a0e1a)',
                minHeight: embedDemo ? 'min-content' : '100vh',
            }}
        >

            {/* Sidebar */}
            {/* Sidebar — desktop only */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full flex flex-col ${embedDemo ? (layout.compactLayout ? 'hidden' : 'flex') : 'hidden lg:flex'}`}
                style={{
                    width: layout.sidebarWidthPx,
                    background: 'linear-gradient(180deg, #0c0d14 0%, #07080d 100%)',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                {/* Brand */}
                <div className="shrink-0 px-5 pt-7 pb-5">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
                                boxShadow: '0 4px 15px rgba(139,92,246,0.3)',
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                <path d="M6 12v5c3 3 10 3 12 0v-5" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-white tracking-tight">Coordinador</p>
                            <p className="text-xs font-medium text-white/35 leading-tight tracking-wide uppercase">{displayInstitution}</p>
                        </div>
                    </div>
                    <div className="mt-4 h-px" style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.3), rgba(6,182,212,0.2), transparent)' }} />
                </div>

                {/* Navigation */}
                <nav
                    data-coord-tour={TourAnchors.navSidebar}
                    className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 space-y-0.5 pb-2"
                >
                    <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest px-3 pb-2">Navegación</p>
                    {NAV_ITEMS.map(item => {
                        const isActive = item.id === activeId;
                        return (
                            <div key={item.id}>
                                <button
                                    type="button"
                                    onClick={() => goToNav(item.id)}
                                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-r-xl transition-all duration-200 text-left cursor-pointer group border-l-4 border-transparent ${
                                        isActive ? 'coord-nav-stitch-active' : 'text-white/45 hover:bg-white/[0.03] hover:text-white/75'
                                    }`}
                                >
                                    <span className={`transition-colors duration-200 ${isActive ? 'text-violet-400' : 'text-white/30 group-hover:text-white/60'}`}>
                                        {item.icon}
                                    </span>
                                    <span className="text-[13px] font-semibold">{item.label}</span>
                                    {isActive && (
                                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" style={{ boxShadow: '0 0 6px rgba(139,92,246,0.6)' }} />
                                    )}
                                </button>
                                {/* Sub-tools for Análisis */}
                                {item.id === 'analisis' && isActive && (
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
                {!embedDemo ? (
                    <div
                        className="shrink-0 px-4 py-4"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <div
                            className="h-px mb-3"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.removeItem('coordinator_email');
                                localStorage.removeItem('demo_coordinator_institution');
                                localStorage.removeItem('demo_coordinator_selected_institution');
                                localStorage.removeItem('demo_coordinator_selected_simulation');
                                localStorage.removeItem('coordinator_selected_simulation');
                                router.replace('/login');
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group"
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
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                            </svg>
                            <span className="text-sm font-bold">Cerrar Sesión</span>
                        </button>
                    </div>
                ) : null}
            </aside>

            {/* Main Content */}
            <main
                className={`min-h-screen ${layout.mainMarginClass}`}
                style={{ background: 'var(--coord-page, #07080d)' }}
            >
                {children}
            </main>

            {!embedDemo ? <CoordinadorMobileNav /> : null}

            {!embedDemo ? <CoordinadorHelpBubble /> : null}
            {!embedDemo ? <CoordinatorVoiceDock /> : null}

            <CoordinadorGuidedTour />
            <CoordinadorGuidedTourRemoteStart />
            <SgFloatingTipLayer />
        </div>
        </CoordinadorGuidedTourProvider>
    );
}
