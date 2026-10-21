'use client';

import { useCallback, useMemo, useState } from 'react';
import type { CoordinadorData } from '@features/coordinador/hooks/coordinadorTypes';
import { buildExecutiveSummary } from '@features/coordinador/lib/executiveModel';
import { generateCoordinatorExcel } from '@features/coordinador/lib/coordinatorExcel';
import { isLocalDevHost } from '@shared/lib/isLocalDev';

export function useCoordinatorExcelExport(data: CoordinadorData | null | undefined) {
    const [loading, setLoading] = useState(false);

    const summary = useMemo(() => {
        if (!data?.myInstitution) return null;
        return buildExecutiveSummary({
            inst: data.myInstitution,
            simulationId: data.currentSimulation,
            questionAnalysis: data.questionAnalysis,
            alertas: data.alertas,
        });
    }, [data]);

    const canExport = isLocalDevHost() && !!data?.myInstitution && !!summary;

    const exportExcel = useCallback(async () => {
        if (!canExport || !data?.myInstitution || !summary) return;
        setLoading(true);
        try {
            await generateCoordinatorExcel({
                summary,
                inst: data.myInstitution,
                ranking: data.ranking,
                allInstitutions: data.allInstitutions,
                alertas: data.alertas,
                questionAnalysis: data.questionAnalysis,
                simulationId: data.currentSimulation,
            });
        } finally {
            setLoading(false);
        }
    }, [canExport, data, summary]);

    return { exportExcel, loading, canExport };
}
