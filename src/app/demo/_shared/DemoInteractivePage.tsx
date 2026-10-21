'use client';

import { useCallback, useEffect } from 'react';
import { GraduationCap, Users, X } from 'lucide-react';
import { MethodShowcase3DActiveContext } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/carrusel-3d/MethodShowcase3DCarousel';
import { StudentPanelBrowseDemo } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante';
import { CoordPanelBrowseDemo } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-coordinador';
import type { CoordTab } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-coordinador/tour/tour-config';
import { DemoCoordRouteSync } from './DemoCoordRouteSync';
import { DemoStudentRouteSync } from './DemoStudentRouteSync';
import { consumeDemoReturnHref, navigateAwayFromDemo } from './demoReturnNavigation';
import { requestCoordinadorGuidedTour } from '@features/coordinador/lib/coordinatorGuidedTourEvents';

export type DemoInteractiveRole = 'estudiante' | 'coordinador';

type DemoInteractivePageProps = {
  role: DemoInteractiveRole;
  label: string;
  returnHref?: string;
  studentStoryIndex?: number;
  coordTab?: CoordTab;
  isLightChrome?: boolean;
};

export function DemoInteractivePage({
  role,
  label,
  returnHref = '/login',
  studentStoryIndex = 0,
  coordTab = 'resumen',
  isLightChrome = false,
}: DemoInteractivePageProps) {
  const isStudent = role === 'estudiante';
  const chromeTitle = isStudent ? 'panel.estudiante · demo interactiva' : 'panel.coordinador · demo interactiva';

  const handleClose = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (isStudent) {
      sessionStorage.setItem('was_demo', '1');
    }
    const target = consumeDemoReturnHref(returnHref);
    navigateAwayFromDemo(target);
  }, [isStudent, returnHref]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (document.querySelector('.coord-guided-tour-root')) return;
      handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClose]);

  return (
    <div
      className="cotiz-platform-demo-overlay fixed inset-0 z-[120] flex flex-col"
      role="application"
      aria-label={label}
    >
      <div
        className={`cotiz-platform-demo-overlay__chrome relative z-[200] flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2.5 sm:px-4 ${
          isLightChrome ? 'border-slate-200 bg-white' : 'border-white/10 bg-[#0c1220]'
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
            {isStudent ? (
              <GraduationCap className="h-4 w-4" aria-hidden />
            ) : (
              <Users className="h-4 w-4" aria-hidden />
            )}
          </span>
          <div className="min-w-0">
            <p
              className={`truncate text-sm font-semibold ${isLightChrome ? 'text-slate-900' : 'text-white'}`}
            >
              {label}
            </p>
            <p
              className={`truncate font-mono text-[10px] ${isLightChrome ? 'text-slate-500' : 'text-white/40'}`}
            >
              {chromeTitle}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
        {!isStudent ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              requestCoordinadorGuidedTour();
            }}
            className={`relative z-[210] inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              isLightChrome
                ? 'border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100'
                : 'border-violet-400/30 bg-violet-500/15 text-violet-200 hover:bg-violet-500/25'
            }`}
          >
            Ver guía
          </button>
        ) : null}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleClose();
          }}
          className={`relative z-[210] inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
            isLightChrome
              ? 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
              : 'border-white/15 bg-white/[0.06] text-white hover:bg-white/10'
          }`}
        >
          <X className="h-4 w-4" aria-hidden />
          Cerrar
        </button>
        </div>
      </div>

      <div className="cotiz-platform-demo-overlay__stage relative z-0 min-h-0 flex-1">
        <MethodShowcase3DActiveContext.Provider value={false}>
          {isStudent ? (
            <>
              <DemoStudentRouteSync />
              <StudentPanelBrowseDemo
                interactive
                fillViewport
                platformStoryIndex={studentStoryIndex}
                className="h-full"
              />
            </>
          ) : (
            <>
              <DemoCoordRouteSync />
              <CoordPanelBrowseDemo
                interactive
                fillViewport
                platformCoordTab={coordTab}
                className="h-full"
              />
            </>
          )}
        </MethodShowcase3DActiveContext.Provider>
      </div>
    </div>
  );
}
