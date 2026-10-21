'use client';

import { usePathname } from 'next/navigation';
import CoordinadorDashboardPage from '@/app/coordinador/page';
import AnalisisPage from '@/app/coordinador/analisis/page';
import ComparativaPage from '@/app/coordinador/comparativa/page';
import DesempenoPage from '@/app/coordinador/desempeno/page';
import EstudiantesPage from '@/app/coordinador/estudiantes/page';
import RespuestasPage from '@/app/coordinador/respuestas/page';
import HistoricoPage from '@/app/coordinador/historico/page';
import PensumPage from '@/app/coordinador/pensum/page';
import { parseDemoCoordinadorTab } from '@/app/demo/_shared/demoRoutePaths';

/** Mismas páginas que `/coordinador/*` (sin copias preview). */
export default function DemoCoordinadorPageRouter() {
  const pathname = usePathname() ?? '';
  const tab = parseDemoCoordinadorTab(pathname);

  switch (tab) {
    case 'pensum':
      return <PensumPage />;
    case 'desempeno':
      return <DesempenoPage />;
    case 'estudiantes':
      return <EstudiantesPage />;
    case 'respuestas':
      return <RespuestasPage />;
    case 'analisis':
      return <AnalisisPage />;
    case 'comparativa':
      return <ComparativaPage />;
    case 'historico':
      return <HistoricoPage />;
    default:
      return <CoordinadorDashboardPage />;
  }
}
