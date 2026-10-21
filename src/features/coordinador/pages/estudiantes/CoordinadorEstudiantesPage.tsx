'use client';

import { useCoordinadorData } from '@features/coordinador/hooks/useCoordinadorData';
import { CoordinadorEstudiantesView } from '@features/coordinador/pages/estudiantes/CoordinadorEstudiantesView';

export default function CoordinadorEstudiantesPage() {
  return <CoordinadorEstudiantesView useCoordinadorData={useCoordinadorData} />;
}
