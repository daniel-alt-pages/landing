'use client';

import { useEstudianteSession } from '@features/estudiante/hooks/useEstudianteSession';
import EstudianteEstadisticasView from './EstudianteEstadisticasView';

export default function EstudianteEstadisticasPage() {
  useEstudianteSession();
  return <EstudianteEstadisticasView />;
}
