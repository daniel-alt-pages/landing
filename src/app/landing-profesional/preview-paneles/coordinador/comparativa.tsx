'use client';

import { useCoordinadorData } from '@/app/landing-profesional/preview-paneles/_data/coordinadorMock';
import { CoordinadorComparativaView } from '@features/coordinador/pages/comparativa/CoordinadorComparativaView';

/** Demo landing: misma UI que `/coordinador/comparativa`, datos mock. */
export default function PreviewCoordinadorComparativa() {
  return <CoordinadorComparativaView useCoordinadorData={useCoordinadorData} embedDemo />;
}
