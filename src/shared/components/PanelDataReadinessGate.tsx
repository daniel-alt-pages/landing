'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  arePanelsLockedForUsers,
  isPanelUploadRoute,
  PANEL_UPLOAD_ROUTE,
  savePanelReturnPath,
} from '@/lib/panelDataReadiness';

type Props = {
  children: ReactNode;
  /** Rutas demo no aplican bloqueo estático de paneles. */
  skip?: boolean;
};

export default function PanelDataReadinessGate({ children, skip = false }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (skip) {
      return;
    }

    if (isPanelUploadRoute(pathname)) {
      return;
    }

    if (!arePanelsLockedForUsers(skip)) {
      return;
    }

    const search = window.location.search;
    const returnPath = search ? `${pathname}${search}` : pathname;
    savePanelReturnPath(returnPath);
    window.location.replace(PANEL_UPLOAD_ROUTE);
  }, [skip, pathname]);

  return <>{children}</>;
}
