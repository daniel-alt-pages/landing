'use client';

import { useCoordinadorData } from '@/app/landing-profesional/preview-paneles/_data/coordinadorMock';
import { CoordinadorDesempenoView } from '@features/coordinador/pages/desempeno/CoordinadorDesempenoView';

/** Showcase: resumen curricular → misma UI que desempeño (mock). */
export default function PreviewCoordinadorResumen() {
  return <CoordinadorDesempenoView useCoordinadorData={useCoordinadorData} embedDemo />;
}
