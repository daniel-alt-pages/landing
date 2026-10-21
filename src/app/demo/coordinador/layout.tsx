'use client';

import { Suspense, useEffect, type ReactNode } from 'react';
import CoordinadorClientShell from '@/app/coordinador/CoordinadorClientShell';
import { DemoCoordinadorAccessGate } from '@/app/demo/_shared/DemoCoordinadorAccessGate';
import { DemoCoordinadorTokenBootstrap } from './DemoCoordinadorTokenBootstrap';
import { DEMO_COORDINADOR_DATA_OPTIONS } from '@features/coordinador/hooks/coordinadorDataOptions';
import { CoordEmbedProvider } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-coordinador/context/CoordEmbedProvider';
import { DEMO_INSTITUTION } from '@/app/demo/_shared/demoPrivacy';
import { PREVIEW_ACTIVE_SIM } from '@/app/landing-profesional/preview-paneles/_data/seeds/constants';

function bootstrapDemoCoordinatorSession(): void {
  if (typeof window === 'undefined') return;
  const keys = DEMO_COORDINADOR_DATA_OPTIONS.storageKeys!;
  const inst = DEMO_INSTITUTION;
  try {
    sessionStorage.setItem('demo_mode', '1');
    localStorage.setItem(keys.institution, inst);
    localStorage.setItem(keys.selectedInstitution, inst);
    if (!localStorage.getItem(keys.selectedSimulation)) {
      localStorage.setItem(keys.selectedSimulation, PREVIEW_ACTIVE_SIM);
    }
    if (!localStorage.getItem('coordinator_email')) {
      localStorage.setItem('coordinator_email', 'demo@seamosgenios.co');
    }
    localStorage.setItem('coordinator_institution', inst);
  } catch {
    /* private mode */
  }
}

function DemoCoordinadorLayoutInner({ children }: { children: ReactNode }) {
  useEffect(() => {
    bootstrapDemoCoordinatorSession();
  }, []);

  return (
    <DemoCoordinadorTokenBootstrap>
      <DemoCoordinadorAccessGate>
        <CoordEmbedProvider maskDocumentIds>
          <CoordinadorClientShell>{children}</CoordinadorClientShell>
        </CoordEmbedProvider>
      </DemoCoordinadorAccessGate>
    </DemoCoordinadorTokenBootstrap>
  );
}

export default function DemoCoordinadorLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0a0b10]"
          aria-busy="true"
        >
          <p className="text-sm text-white/45">Cargando demo…</p>
        </div>
      }
    >
      <DemoCoordinadorLayoutInner>{children}</DemoCoordinadorLayoutInner>
    </Suspense>
  );
}
