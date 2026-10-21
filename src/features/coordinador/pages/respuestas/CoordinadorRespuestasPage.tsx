'use client';

import { useCoordinadorData } from '@features/coordinador/hooks/useCoordinadorData';
import { CoordinadorRespuestasView } from '@features/coordinador/pages/respuestas/CoordinadorRespuestasView';

export default function CoordinadorRespuestasPage() {
    return <CoordinadorRespuestasView useCoordinadorData={useCoordinadorData} />;
}
