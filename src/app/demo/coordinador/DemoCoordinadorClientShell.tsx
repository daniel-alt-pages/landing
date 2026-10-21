'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import CoordinadorHelpBubble from '@features/coordinador/components/CoordinadorHelpBubble';
import CoordinatorVoiceDock from '@features/coordinador/components/CoordinatorVoiceDock';
import CoordinadorGuidedTour from '@features/coordinador/components/CoordinadorGuidedTour';
import CoordinadorGuidedTourRemoteStart from '@features/coordinador/components/CoordinadorGuidedTourRemoteStart';
import {
  CoordinadorGuidedTourProvider,
} from '@features/coordinador/context/CoordinadorGuidedTourContext';
import {
  CoordinadorDataProvider,
  useCoordinadorDataFromContext,
} from '@features/coordinador/context/CoordinadorDataProvider';
import CoordinadorMobileNav from '@features/coordinador/components/CoordinadorMobileNav';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import { warmupCoordinatorCache } from '@/app/landing-profesional/preview-paneles/_data/firestoreMock';
import { DEMO_COORDINADOR_DATA_OPTIONS } from '@features/coordinador/hooks/coordinadorDataOptions';
import {
  filterCoordinatorNavIds,
  type CoordinatorNavItemId,
} from '@features/coordinador/lib/coordinatorNavPolicy';
import {
  demoCoordinadorPath,
  parseDemoCoordinadorTab,
} from '@/app/demo/_shared/demoRoutePaths';
import { coordNavIdFromTab, coordTabFromNavId } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-coordinador/coord-embed-navigation';
import SgFloatingTipLayer from '@shared/components/ui/SgFloatingTipLayer';

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
      <path d="M12 2v4" /><path d="M7 6h10" />
      <path d="M6.5 10.5a6.5 6.5 0 1 0 11 0" /><path d="M12 10v6" /><path d="M12 16l3-3" />
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
};

const NAV_LABELS: Record<CoordinatorNavItemId, { label: string; icon: ReactNode }> = {
  dashboard: { label: 'Dashboard', icon: Icons.dashboard },
  desempeno: { label: 'Desempeño', icon: Icons.desempeno },
  pensum: { label: 'Pensum', icon: Icons.resumen },
  estudiantes: { label: 'Estudiantes', icon: Icons.estudiantes },
  respuestas: { label: 'Respuestas', icon: Icons.respuestas },
  analisis: { label: 'Análisis', icon: Icons.analisis },
  comparativa: { label: 'Comparativa', icon: Icons.comparativa },
  historico: { label: 'Histórico', icon: Icons.historico },
};

function buildNavItems(simulationId: string) {
  return filterCoordinatorNavIds(simulationId).map((id) => ({
    id,
    href: demoCoordinadorPath(coordTabFromNavId(id)),
    ...NAV_LABELS[id],
  }));
}

function DemoCoordinadorShellContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentInstitution, currentSimulation, loading } = useCoordinadorDataFromContext();

  useEffect(() => {
    warmupCoordinatorCache().catch(() => {});
  }, []);

  const displayInstitution =
    currentInstitution === '*' ? 'TODAS' : currentInstitution || 'TODAS';
  const navItems = buildNavItems(currentSimulation);
  const activeTab = parseDemoCoordinadorTab(pathname ?? '');
  const activeId = coordNavIdFromTab(activeTab);

  const goToNav = (navId: string) => {
    router.push(demoCoordinadorPath(coordTabFromNavId(navId)));
  };

  if (loading && !currentInstitution) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07080d' }}>
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: 'rgba(139,92,246,0.35)', borderTopColor: '#8B5CF6' }}
          />
          <p className="text-white/60 mt-4 text-sm">Cargando demo…</p>
        </div>
      </div>
    );
  }

  return (
    <CoordinadorGuidedTourProvider autoStart={false}>
      <div
        data-coordinator-theme
        data-demo-coordinator-shell
        style={{
          fontFamily: "var(--coord-font-sans, 'Inter', sans-serif)",
          background: 'var(--coord-page, #07080d)',
          minHeight: '100vh',
        }}
      >
        <aside
          data-coord-tour={TourAnchors.navSidebar}
          className="fixed top-0 left-0 h-full z-50 hidden lg:flex lg:flex-col"
          style={{
            width: '260px',
            background: 'linear-gradient(180deg, #0c0d14 0%, #07080d 100%)',
            borderRight: '1px solid rgba(255,255,255,0.05)',
          }}
        >
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

          <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 space-y-0.5 pb-2">
            <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest px-3 pb-2">Navegación</p>
            {navItems.map((item) => {
              const isActive = item.id === activeId;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => goToNav(item.id)}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-left cursor-pointer group"
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.08))'
                        : 'transparent',
                      color: isActive ? '#e2d9ff' : 'rgba(255,255,255,0.45)',
                      border: isActive ? '1px solid rgba(139,92,246,0.2)' : '1px solid transparent',
                      boxShadow: isActive ? '0 2px 12px rgba(139,92,246,0.1)' : 'none',
                    }}
                  >
                    <span className={`transition-colors duration-200 ${isActive ? 'text-violet-400' : 'text-white/30 group-hover:text-white/60'}`}>
                      {item.icon}
                    </span>
                    <span className="text-[13px] font-semibold flex-1">{item.label}</span>
                    {isActive ? (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" style={{ boxShadow: '0 0 6px rgba(139,92,246,0.6)' }} />
                    ) : null}
                  </button>
                  {item.id === 'analisis' && isActive ? (
                    <div className="ml-7 mt-1 space-y-0.5 pb-1.5 border-l border-white/5 pl-3">
                      <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('open-analisis-drawer', { detail: { tab: 'questions' } }))}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200 text-left cursor-pointer"
                        style={{ color: 'rgba(255,255,255,0.35)' }}
                      >
                        {Icons.detalle}
                        <span className="text-[11px] font-medium">Detalle Preguntas</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('open-analisis-drawer', { detail: { tab: 'heatmap' } }))}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200 text-left cursor-pointer"
                        style={{ color: 'rgba(255,255,255,0.35)' }}
                      >
                        {Icons.heatmap}
                        <span className="text-[11px] font-medium">Mapa Respuestas</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div
            className="shrink-0 px-4 py-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <button
              type="button"
              onClick={() => router.replace('/login')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.15)',
                color: 'rgba(248,113,113,0.8)',
              }}
            >
              <span className="text-sm font-bold">Salir de demo</span>
            </button>
          </div>
        </aside>

        <main
          className="lg:ml-[260px] min-h-screen pb-20 lg:pb-0"
          style={{ background: 'var(--coord-page, #07080d)' }}
        >
          {children}
        </main>

        <CoordinadorMobileNav
          embed={{
            activeNavId: activeId,
            onNavigate: goToNav,
            simulationId: currentSimulation,
          }}
        />
        <CoordinadorHelpBubble />
        <CoordinatorVoiceDock />
        <CoordinadorGuidedTour />
        <CoordinadorGuidedTourRemoteStart />
        <SgFloatingTipLayer />
      </div>
    </CoordinadorGuidedTourProvider>
  );
}

export default function DemoCoordinadorClientShell({ children }: { children: React.ReactNode }) {
  return (
    <CoordinadorDataProvider options={DEMO_COORDINADOR_DATA_OPTIONS}>
      <DemoCoordinadorShellContent>{children}</DemoCoordinadorShellContent>
    </CoordinadorDataProvider>
  );
}
