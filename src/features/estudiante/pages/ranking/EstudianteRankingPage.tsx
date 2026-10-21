'use client';

import { useEstudianteSession } from '@features/estudiante/hooks/useEstudianteSession';
import EstudianteRankingView from './EstudianteRankingView';

export default function EstudianteRankingPage() {
  useEstudianteSession();
  return <EstudianteRankingView />;
}
