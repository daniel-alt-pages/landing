'use client';

import { HelpCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCoordinadorGuidedTourOptional } from '@features/coordinador/context/CoordinadorGuidedTourContext';
import { stepExistsOnPath } from '@features/coordinador/lib/coordinatorGuidedTourSteps';

export default function CoordinadorTourSectionHint({
    stepId,
    label = 'Ver ayuda de esta sección',
}: {
    stepId: string;
    label?: string;
}) {
    const pathname = usePathname();
    const tour = useCoordinadorGuidedTourOptional();

    if (!tour || !stepExistsOnPath(pathname, stepId)) return null;

    return (
        <button
            type="button"
            className="coord-tour-hint-btn"
            onClick={() => tour.goToStepById(stepId)}
            aria-label={label}
            title={label}
        >
            <HelpCircle className="w-3.5 h-3.5" aria-hidden />
        </button>
    );
}
