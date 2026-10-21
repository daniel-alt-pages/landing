'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import CoordinadorClientShell from '@/app/coordinador/CoordinadorClientShell';
import DemoCoordinadorPageRouter from '@/app/demo/coordinador/DemoCoordinadorPageRouter';
import { DemoCoordinadorAccessGate } from '@/app/demo/_shared/DemoCoordinadorAccessGate';
import { unlockDemoCoordinadorFromToken } from '@/app/demo/_shared/demoCoordinadorAccessToken';
import { CoordEmbedProvider } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-coordinador/context/CoordEmbedProvider';
import { DEMO_COORDINADOR_DATA_OPTIONS } from '@features/coordinador/hooks/coordinadorDataOptions';
import { DEMO_INSTITUTION } from '@/app/demo/_shared/demoPrivacy';
import { PREVIEW_ACTIVE_SIM } from '@/app/landing-profesional/preview-paneles/_data/seeds/constants';

/**
 * Ruta opaca: `?token=` AES → sessionStorage → render coordinador sin exponer `/demo/coordinador`.
 */
function bootstrapDemoCoordinatorSession(): void {
  if (typeof window === 'undefined') return;
  const keys = DEMO_COORDINADOR_DATA_OPTIONS.storageKeys!;
  const inst = DEMO_INSTITUTION;
  try {
    sessionStorage.setItem('demo_mode', '1');
    localStorage.setItem(keys.institution, inst);
    localStorage.setItem(keys.selectedInstitution, inst);
    localStorage.setItem(keys.selectedSimulation, PREVIEW_ACTIVE_SIM);
    localStorage.setItem('coordinator_institution', inst);
    localStorage.setItem('coordinator_email', 'demo@seamosgenios.co');
  } catch {
    /* private mode */
  }
}

function AccesoDemoCoordinadorContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token')?.trim() ?? '';
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    bootstrapDemoCoordinatorSession();

    if (!tokenFromUrl) return;

    if (unlockDemoCoordinadorFromToken(tokenFromUrl)) {
      window.history.replaceState(null, '', '/d/c');
      return;
    }

    setTokenError('Enlace expirado o token inválido.');
  }, [tokenFromUrl]);

  if (tokenError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0a0b10] px-4 text-center text-sm text-slate-400">
        {tokenError}
      </div>
    );
  }

  return (
    <DemoCoordinadorAccessGate deferUntilTokenChecked={Boolean(tokenFromUrl)}>
      <CoordEmbedProvider maskDocumentIds>
        <CoordinadorClientShell>
          <DemoCoordinadorPageRouter />
        </CoordinadorClientShell>
      </CoordEmbedProvider>
    </DemoCoordinadorAccessGate>
  );
}

export default function AccesoDemoCoordinadorPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center bg-[#0a0b10] text-sm text-slate-400">Validando acceso…</div>}>
      <AccesoDemoCoordinadorContent />
    </Suspense>
  );
}
