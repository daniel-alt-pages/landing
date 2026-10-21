'use client';

import { useEstudianteSession } from '@features/estudiante/hooks/useEstudianteSession';
import EstudiantePerfilView from './EstudiantePerfilView';

export default function EstudiantePerfilPage() {
  useEstudianteSession();
  return <EstudiantePerfilView />;
}
