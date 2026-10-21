'use client';

import { useMemo } from 'react';
import { useCoordinadorData as useCoordinadorDataHook } from '@features/coordinador/hooks/useCoordinadorData';
import { useCoordinadorPanelLayout } from '@features/coordinador/hooks/useCoordinadorPanelLayout';
import { useScoringShadow } from '@features/coordinador/hooks/useScoringShadow';
import CoordinadorContextHeader from '@features/coordinador/components/CoordinadorContextHeader';
import CoordinadorScoringPreviewTab from '@features/coordinador/components/dashboard/CoordinadorScoringPreviewTab';
import { ErrorState, LoadingState } from '@features/coordinador/components/ui';
import { isLocalDevHost } from '@shared/lib/isLocalDev';

export type UseCoordinadorDataFn = typeof useCoordinadorDataHook;

export function CoordinadorScoringV2View({
    useCoordinadorData = useCoordinadorDataHook,
    embedDemo = false,
}: {
    useCoordinadorData?: UseCoordinadorDataFn;
    embedDemo?: boolean;
}) {
    const layout = useCoordinadorPanelLayout(embedDemo);
    const data = useCoordinadorData();
    const localDev = isLocalDevHost();

    const institutionKey = useMemo(() => {
        const selected = (data.currentInstitution || '').trim();
        if (selected && selected.toUpperCase() !== 'TODAS' && selected !== '*') return selected;
        const base =
            (typeof window !== 'undefined' ? localStorage.getItem('coordinator_institution') : '') || '';
        return base && base.toUpperCase() !== 'TODAS' && base !== '*' ? base : '';
    }, [data.currentInstitution]);

    const simId = data.currentSimulation || 'SG11-20';
    const scoringShadow = useScoringShadow(simId, data.currentInstitution || institutionKey);
    const inst = data.myInstitution;

    if (data.loading) return <LoadingState message="Cargando comparativa TRI…" fullScreen />;
    if (data.error) {
        return <ErrorState message="No fue posible cargar el panel" detail={data.error} />;
    }
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
            className={`min-h-screen ${layout.pagePaddingClass} space-y-6 max-w-[1600px] mx-auto min-w-0 overflow-x-hidden`.trim()}
            style={{ background: 'var(--coord-page)' }}
        >
            <CoordinadorContextHeader
                title="Comparativa TRI"
                subtitle="Lógica nueva oficial vs acercamiento TRI sombra — auditoría local, sin publicar puntajes TRI"
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

            {!localDev && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-100/90 text-sm">
                    Esta vista solo está habilitada en desarrollo local (
                    <code className="text-amber-200">localhost:3010</code>
                    ). Si usas túnel Cloudflare o producción, abre la app en localhost para ver la
                    comparativa TRI.
                </div>
            )}

            {localDev && scoringShadow.loading && !scoringShadow.available && (
                <LoadingState message="Cargando comparativa TRI…" />
            )}

            {localDev && !scoringShadow.loading && !scoringShadow.available && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-100/90 text-sm space-y-2">
                    <p>No se encontró el archivo sombra para {simId}.</p>
                    <p className="text-white/60">
                        Regenera el pipeline y copia el JSON a{' '}
                        <code className="text-white/80">
                            public/data/simulations/{simId}/scoring_shadow.json
                        </code>
                        :
                    </p>
                    <pre className="text-xs text-white/70 overflow-x-auto">
                        {`python scripts/pipeline/ejecutar_fases_scoring.py --sim ${simId}`}
                    </pre>
                </div>
            )}

            {localDev && scoringShadow.available && (
                <CoordinadorScoringPreviewTab
                    rows={scoringShadow.rows}
                    payload={scoringShadow.payload}
                />
            )}
        </div>
    );
}
