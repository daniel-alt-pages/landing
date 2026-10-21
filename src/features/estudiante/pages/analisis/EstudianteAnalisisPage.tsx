'use client';

import { useEstudianteSession } from '@features/estudiante/hooks/useEstudianteSession';
import EstudianteAnalisisView from './EstudianteAnalisisView';

export default function EstudianteAnalisisPage() {
  useEstudianteSession();
  return <EstudianteAnalisisView />;
}
