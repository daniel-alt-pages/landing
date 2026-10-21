'use client';

import { useCoordinadorData } from '@/app/landing-profesional/preview-paneles/_data/coordinadorMock';
import {
  getAllStudents,
  getCoordinatorSummary,
} from '@/app/landing-profesional/preview-paneles/_data/firestoreMock';
import { CoordinadorHistoricoView } from '@features/coordinador/pages/historico/CoordinadorHistoricoView';

/** Demo landing: misma UI que `/coordinador/historico`, datos mock. */
export default function PreviewCoordinadorHistorico() {
        return (
    <CoordinadorHistoricoView
      useCoordinadorData={useCoordinadorData}
      embedDemo
      firestore={{ getCoordinatorSummary, getAllStudents }}
    />
    );
}
