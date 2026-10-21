'use client';

import { useEffect } from 'react';
import { useCoordinadorGuidedTour } from '@features/coordinador/context/CoordinadorGuidedTourContext';
import { COORD_GUIDED_TOUR_START_EVENT } from '@features/coordinador/lib/coordinatorGuidedTourEvents';

/** Escucha `coord:start-guided-tour` (p. ej. barra chrome de `/demo/coordinador`). */
export default function CoordinadorGuidedTourRemoteStart() {
    const { startTour } = useCoordinadorGuidedTour();

    useEffect(() => {
        const handler = () => startTour();
        window.addEventListener(COORD_GUIDED_TOUR_START_EVENT, handler);
        return () => window.removeEventListener(COORD_GUIDED_TOUR_START_EVENT, handler);
    }, [startTour]);

    return null;
}
