'use client';

import { useCoordinadorData } from '@/app/landing-profesional/preview-paneles/_data/coordinadorMock';
import { CoordinadorEstudiantesView } from '@features/coordinador/pages/estudiantes/CoordinadorEstudiantesView';

/** Demo landing: misma UI que `/coordinador/estudiantes`, datos mock. */
export default function PreviewCoordinadorEstudiantes() {
  return <CoordinadorEstudiantesView useCoordinadorData={useCoordinadorData} embedDemo />;
}
