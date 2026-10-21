'use client';

import { useCoordinadorData } from '../_data/coordinadorMock';
import { CoordinadorDesempenoView } from '@features/coordinador/pages/desempeno/CoordinadorDesempenoView';

export default function PreviewCoordinadorDesempeno() {
    return <CoordinadorDesempenoView useCoordinadorData={useCoordinadorData} embedDemo />;
}
