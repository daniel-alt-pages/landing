'use client';

import { useCoordinadorData } from '@features/coordinador/hooks/useCoordinadorData';
import { CoordinadorScoringV2View } from '@features/coordinador/pages/scoring-v2/CoordinadorScoringV2View';

export default function CoordinadorScoringV2Page() {
    return <CoordinadorScoringV2View useCoordinadorData={useCoordinadorData} />;
}
