'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Evita que «atrás» del navegador saque del demo (p. ej. a /login con token).
 * Solo la salida explícita con «Salir de demo» cierra la sesión demo.
 */
export function useDemoBackGuard(
  enabled: boolean,
  homePath: string,
  isInsideDemo: (pathname: string | null) => boolean,
): void {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const onPopState = () => {
      window.setTimeout(() => {
        const path = window.location.pathname;
        if (!isInsideDemo(path)) {
          router.replace(homePath);
        }
      }, 0);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [enabled, homePath, isInsideDemo, router, pathname]);
}
