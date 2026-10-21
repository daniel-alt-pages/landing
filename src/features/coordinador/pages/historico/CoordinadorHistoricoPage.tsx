'use client';

import { useCoordinadorData } from '@features/coordinador/hooks/useCoordinadorData';
import { CoordinadorHistoricoView } from '@features/coordinador/pages/historico/CoordinadorHistoricoView';

export default function CoordinadorHistoricoPage() {
  return <CoordinadorHistoricoView useCoordinadorData={useCoordinadorData} />;
}
