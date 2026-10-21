'use client';

import { usePathname } from 'next/navigation';
import DevToolsBlocker from '@features/auth/components/DevToolsBlocker';
import ReadBudgetBanner from '@/components/ReadBudgetBanner';
import MaintenanceGate from '@/components/MaintenanceGate';
import PresentationFocusBootstrap from '@/components/PresentationFocusBootstrap';
import PresentationFocusLocalReset from '@/components/PresentationFocusLocalReset';

const isProdBuild = process.env.NODE_ENV === 'production';

/** Rutas públicas tipo landing/demo: sin chrome interno de lectura presupuestada. */
const DEMO_PUBLIC_ROUTE_PREFIXES = ['/landing-profesional', '/landing'] as const;

function isDemoPublicRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return DEMO_PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function AppRootChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const demoIsland = isDemoPublicRoute(pathname);

  if (demoIsland) {
    return (
      <>
        {isProdBuild ? <PresentationFocusBootstrap /> : <PresentationFocusLocalReset />}
        <DevToolsBlocker />
        <MaintenanceGate>{children}</MaintenanceGate>
      </>
    );
  }

  return (
    <>
      {isProdBuild ? <PresentationFocusBootstrap /> : <PresentationFocusLocalReset />}
      <DevToolsBlocker />
      <ReadBudgetBanner />
      <MaintenanceGate>{children}</MaintenanceGate>
    </>
  );
}
