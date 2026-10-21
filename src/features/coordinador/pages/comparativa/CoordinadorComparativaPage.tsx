'use client';

import { useCoordinadorData } from '@features/coordinador/hooks/useCoordinadorData';
import { CoordinadorComparativaView } from '@features/coordinador/pages/comparativa/CoordinadorComparativaView';

export default function CoordinadorComparativaPage() {
  return <CoordinadorComparativaView useCoordinadorData={useCoordinadorData} />;
}
