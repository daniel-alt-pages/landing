'use client';

import { useCoordinadorData } from '@features/coordinador/hooks/useCoordinadorData';
import { CoordinadorDesempenoView } from '@features/coordinador/pages/desempeno/CoordinadorDesempenoView';

export default function CoordinadorDesempenoPage() {
    return <CoordinadorDesempenoView useCoordinadorData={useCoordinadorData} />;
}
