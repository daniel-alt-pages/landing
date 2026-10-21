'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { CoordTab } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-coordinador/tour/tour-config';
import { demoCoordinadorPath } from '@/app/demo/_shared/demoRoutePaths';

export default function DemoCoordLegacyTabRedirect({ tab }: { tab: CoordTab }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(demoCoordinadorPath(tab));
  }, [router, tab]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0a0b10] text-sm text-slate-400">
      Redirigiendo…
    </div>
  );
}
