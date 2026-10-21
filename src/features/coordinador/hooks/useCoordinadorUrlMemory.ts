'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { replaceQueryParams } from '@shared/lib/urlQueryState';

type Params = {
    currentSimulation: string;
    currentInstitution: string;
    setSimulation: (sim: string) => void;
    setInstitution: (inst: string) => void;
    /** Demo embebido: no tocar URL del host. */
    disabled?: boolean;
};

/**
 * Sincroniza simulacro e institución con ?sim= & ?inst= en todas las rutas /coordinador/*.
 */
export function useCoordinadorUrlMemory({
    currentSimulation,
    currentInstitution,
    setSimulation,
    setInstitution,
    disabled = false,
}: Params) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const appliedFromUrl = useRef(false);

    // Hidratar filtros desde URL (una vez por montaje)
    useEffect(() => {
        if (disabled || appliedFromUrl.current) return;
        appliedFromUrl.current = true;

        const sim = searchParams.get('sim')?.trim();
        const inst = searchParams.get('inst')?.trim();

        if (sim && sim !== currentSimulation) setSimulation(sim);
        if (inst && inst !== currentInstitution) setInstitution(inst);
    }, [
        disabled,
        searchParams,
        currentSimulation,
        currentInstitution,
        setSimulation,
        setInstitution,
    ]);

    // Escribir filtros en URL cuando cambian desde la UI
    useEffect(() => {
        if (disabled || !pathname?.startsWith('/coordinador')) return;
        replaceQueryParams(pathname, {
            sim: currentSimulation || null,
            inst: currentInstitution || null,
        });
    }, [disabled, pathname, currentSimulation, currentInstitution]);
}
