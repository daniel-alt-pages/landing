'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  clearPanelRecoveryForPath,
  hasPanelRecoveryAttempted,
  isPanelLikelyStuck,
  markPanelRecoveryAttempted,
} from '@shared/lib/panelStuckRecovery';

const SOFT_RECOVERY_MS = 4_500;
const HARD_RECOVERY_MS = 8_000;

type PanelRouteRecoveryProps = {
  children: ReactNode;
  /** Prefijo de ruta para recovery (ej. /estudiante, /coordinador). */
  fallbackPath?: string;
};

/**
 * Watchdog SPA: router.refresh() y luego reload único si la ruta queda en loading.
 */
export default function PanelRouteRecovery({
  children,
  fallbackPath = '/',
}: PanelRouteRecoveryProps) {
  const pathname = usePathname() ?? fallbackPath;
  const router = useRouter();
  const mountedAtRef = useRef(Date.now());

  useEffect(() => {
    mountedAtRef.current = Date.now();
    clearPanelRecoveryForPath(pathname);
  }, [pathname]);

  useEffect(() => {
    let softTimer: number | undefined;
    let hardTimer: number | undefined;
    let cancelled = false;

    const runCheck = (mode: 'soft' | 'hard') => {
      if (cancelled) return;
      if (Date.now() - mountedAtRef.current < SOFT_RECOVERY_MS - 500) return;
      if (!isPanelLikelyStuck()) return;
      if (hasPanelRecoveryAttempted(pathname)) return;

      if (mode === 'soft') {
        router.refresh();
        return;
      }

      markPanelRecoveryAttempted(pathname);
      window.location.reload();
    };

    softTimer = window.setTimeout(() => runCheck('soft'), SOFT_RECOVERY_MS);
    hardTimer = window.setTimeout(() => runCheck('hard'), HARD_RECOVERY_MS);

    return () => {
      cancelled = true;
      if (softTimer) window.clearTimeout(softTimer);
      if (hardTimer) window.clearTimeout(hardTimer);
    };
  }, [pathname, router]);

  return (
    <div data-sg-panel-root className="contents">
      {children}
    </div>
  );
}
