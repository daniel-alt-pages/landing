'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { demoCoordinadorPath, parseDemoCoordinadorTab } from '@/app/demo/_shared/demoRoutePaths';
import { unlockDemoCoordinadorFromToken } from '@/app/demo/_shared/demoCoordinadorAccessToken';
import { usePathname } from 'next/navigation';

/** Procesa `?token=` antes del gate AES (layout). */
export function DemoCoordinadorTokenBootstrap({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token')?.trim();
    if (!token) {
      setReady(true);
      return;
    }
    const tab = parseDemoCoordinadorTab(pathname ?? '');
    if (unlockDemoCoordinadorFromToken(token)) {
      router.replace(demoCoordinadorPath(tab));
    }
    setReady(true);
  }, [searchParams, router, pathname]);

  if (!ready) {
    return (
      <div
        className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0a0b10]"
        aria-busy="true"
      >
        <p className="text-sm text-white/45">Validando enlace…</p>
      </div>
    );
  }

  return <>{children}</>;
}
