'use client';

import { Suspense } from 'react';
import { useCoordinadorData } from '@features/coordinador/hooks/useCoordinadorData';
import { CoordinadorDashboardView } from '@features/coordinador/pages/dashboard/CoordinadorDashboardView';
import CoordinadorLoading from '@/app/coordinador/loading';

export default function CoordinadorDashboardPage() {
  return (
    <Suspense fallback={<CoordinadorLoading />}>
      <CoordinadorDashboardView useCoordinadorData={useCoordinadorData} />
    </Suspense>
  );
}
