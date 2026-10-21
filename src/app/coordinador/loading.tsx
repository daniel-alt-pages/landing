'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import SgBrandedLoadingExperience from '@/components/SgBrandedLoadingExperience';
import {
  hasPanelRecoveryAttempted,
  markPanelRecoveryAttempted,
} from '@shared/lib/panelStuckRecovery';

/** Boundary Next en navegación cliente — recovery automático si el chunk no resuelve. */
export default function CoordinadorLoading() {
  const pathname = usePathname() ?? '/coordinador';
  const router = useRouter();

  useEffect(() => {
    const soft = window.setTimeout(() => {
      router.refresh();
    }, 4_000);

    const hard = window.setTimeout(() => {
      if (hasPanelRecoveryAttempted(pathname)) return;
      markPanelRecoveryAttempted(pathname);
      window.location.reload();
    }, 8_000);

    return () => {
      window.clearTimeout(soft);
      window.clearTimeout(hard);
    };
  }, [pathname, router]);

  return (
    <div data-sg-route-loading="true" aria-busy="true">
      <SgBrandedLoadingExperience variant="fullscreen" personalize={false} message="Cargando panel de coordinación" />
    </div>
  );
}
