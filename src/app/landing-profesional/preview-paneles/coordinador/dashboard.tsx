'use client';

import { useCoordinadorData } from '@/app/landing-profesional/preview-paneles/_data/coordinadorMock';
import { CoordinadorDashboardView } from '@features/coordinador/pages/dashboard/CoordinadorDashboardView';

/** Demo landing: misma UI que `/coordinador`, datos mock. */
export default function PreviewCoordinadorDashboard() {
  return <CoordinadorDashboardView useCoordinadorData={useCoordinadorData} embedDemo />;
}
