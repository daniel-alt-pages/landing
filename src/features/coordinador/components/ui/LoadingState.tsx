'use client';

import { useSlowLoadHint } from '@shared/hooks/useSlowLoadHint';
import SlowLoadHint from '@shared/components/SlowLoadHint';
import SgBrandedLoadingExperience from '@/components/SgBrandedLoadingExperience';

/**
 * Estado de carga unificado para el panel coordinador.
 * Pantalla limpia: logo SG + barra, sin skeleton ni halos duplicados.
 */
export default function LoadingState({
    message = 'Cargando…',
    fullScreen = false,
    slowAfterMs = 12_000,
    onRetry,
}: {
    message?: string;
    fullScreen?: boolean;
    slowAfterMs?: number;
    onRetry?: () => void;
}) {
    const slow = useSlowLoadHint(true, slowAfterMs);

    return (
        <div
            className={[
                'coord-loading-panel flex flex-col items-center justify-center px-4 py-8',
                fullScreen ? 'min-h-screen' : 'min-h-[min(72vh,860px)] rounded-[1.75rem]',
            ].join(' ')}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <SgBrandedLoadingExperience
                variant="embedded"
                message={message}
                personalize={false}
                showPercent={false}
                logoTone="clean"
                className="sg-branded-loading--transparent min-h-0 py-0"
            />
            <SlowLoadHint visible={slow} onRetry={onRetry} className="mt-3" />
        </div>
    );
}
