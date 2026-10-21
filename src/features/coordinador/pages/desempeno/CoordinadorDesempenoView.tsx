'use client';

import { useMemo } from 'react';
import { useCoordinadorData as useCoordinadorDataHook } from '@features/coordinador/hooks/useCoordinadorData';
import CoordinadorContextHeader from '@features/coordinador/components/CoordinadorContextHeader';
import DesempenoSection from '@features/coordinador/components/DesempenoSection';
import { buildExecutiveSummary } from '@features/coordinador/lib/executiveModel';
import { LoadingState, ErrorState } from '@features/coordinador/components/ui';
import { simulationSupportsPensumFullInsights } from '@features/coordinador/lib/simulationEligibility';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import { useCoordinadorPanelLayout } from '@features/coordinador/hooks/useCoordinadorPanelLayout';

export type UseCoordinadorDataFn = typeof useCoordinadorDataHook;

export function CoordinadorDesempenoView({
    useCoordinadorData = useCoordinadorDataHook,
    embedDemo = false,
}: {
    useCoordinadorData?: UseCoordinadorDataFn;
    embedDemo?: boolean;
}) {
    const layout = useCoordinadorPanelLayout(embedDemo);
    const data = useCoordinadorData();

    const pseudoPensum = useMemo(
        () => !simulationSupportsPensumFullInsights(data.currentSimulation),
        [data.currentSimulation],
    );

    const executiveSummary = useMemo(
        () =>
            buildExecutiveSummary({
                inst: data.myInstitution ?? null,
                simulationId: data.currentSimulation,
                questionAnalysis: data.questionAnalysis,
                alertas: data.alertas,
            }),
        [data.myInstitution, data.currentSimulation, data.questionAnalysis, data.alertas],
    );

    if (data.loading) return <LoadingState message="Cargando desempeño…" fullScreen />;
    if (data.error) return <ErrorState message="No fue posible cargar desempeño" detail={data.error} />;

    const inst = data.myInstitution;
    if (!inst) {
        return (
            <ErrorState
                message="Sin datos para tu institución"
                detail="No se encontraron resultados en el simulacro actual."
            />
        );
    }

    return (
        <div
            data-coordinator-theme
            className={`${layout.desempenoRootClass ?? ''} min-h-screen ${layout.pagePaddingClass} space-y-6 max-w-[1600px] mx-auto min-w-0 overflow-x-hidden`.trim()}
            style={{ background: 'var(--coord-page)' }}
        >
            <div data-coord-tour={TourAnchors.desempenoHeader}>
                <CoordinadorContextHeader
                    title="Desempeño"
                    subtitle="Análisis ejecutivo: niveles globales, fortalezas/brechas por área, recomendaciones y Dashboard ICFES."
                    institutionName={inst.name}
                    simulationId={data.currentSimulation}
                    availableSimulations={data.availableSimulations}
                    availableInstitutions={data.availableInstitutions}
                    currentInstitution={data.currentInstitution}
                    onChangeSimulation={data.setSimulation}
                    onChangeInstitution={data.setInstitution}
                    availableCursos={data.availableCursos}
                    currentCurso={data.currentCurso}
                    onChangeCurso={data.setCurso}
                />
            </div>

            <DesempenoSection
                inst={inst}
                pseudoPensum={pseudoPensum}
                executiveSummary={executiveSummary}
                questionAnalysis={data.questionAnalysis}
                simulationId={data.currentSimulation}
            />
        </div>
    );
}
