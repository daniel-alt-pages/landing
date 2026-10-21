'use client';

import { useEstudianteSession } from '@features/estudiante/hooks/useEstudianteSession';
import EstudianteDashboardView from './EstudianteDashboardView';

export default function EstudianteDashboardPage() {
  useEstudianteSession();
  return <EstudianteDashboardView />;
}
