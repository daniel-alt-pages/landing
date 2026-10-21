'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AnalisisPage from '@/app/estudiante/analisis/page';
import DashboardPage from '@/app/estudiante/dashboard/page';
import EstadisticasPage from '@/app/estudiante/estadisticas/page';
import {
  demoEstudiantePath,
  isDemoEstudianteNavBlocked,
  parseDemoEstudianteNavId,
} from '@/app/demo/_shared/demoRoutePaths';

/** Mismas páginas que `/estudiante/*` (sin copias preview). */
export default function DemoEstudiantePageRouter() {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const navId = parseDemoEstudianteNavId(pathname);
  const blocked = isDemoEstudianteNavBlocked(navId);

  useEffect(() => {
    if (blocked) {
      router.replace(demoEstudiantePath('dashboard'));
    }
  }, [blocked, router]);

  if (blocked) {
    return null;
  }

  switch (navId) {
    case 'estadisticas':
      return <EstadisticasPage />;
    case 'analisis':
      return <AnalisisPage />;
    default:
      return <DashboardPage />;
  }
}
