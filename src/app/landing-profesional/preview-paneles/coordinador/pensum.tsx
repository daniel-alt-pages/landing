'use client';

import { useCoordinadorData } from '../_data/coordinadorMock';
import { PensumView } from '@features/coordinador/pages/pensum/PensumPage';

export default function PreviewCoordinadorPensum() {
    return <PensumView useCoordinadorData={useCoordinadorData} embedDemo />;
}
