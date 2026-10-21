'use client';

import { useCoordinadorData } from '@/app/landing-profesional/preview-paneles/_data/coordinadorMock';
import { CoordinadorAnalisisView } from '@features/coordinador/pages/analisis/CoordinadorAnalisisView';

/** Demo landing: misma UI que `/coordinador/analisis`, datos mock. */
export default function PreviewCoordinadorAnalisis() {
  return <CoordinadorAnalisisView useCoordinadorData={useCoordinadorData} embedDemo />;
}
