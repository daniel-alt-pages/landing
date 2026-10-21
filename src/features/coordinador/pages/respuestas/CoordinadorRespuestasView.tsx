'use client';

import { useCoordinadorData as useCoordinadorDataHook } from '@features/coordinador/hooks/useCoordinadorData';
import { useMemo, useState, useCallback, useRef } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { LoadingState, ErrorState } from '@features/coordinador/components/ui';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import { useCoordinadorPanelLayout } from '@features/coordinador/hooks/useCoordinadorPanelLayout';
import { MATERIAS, formatAreaDisplayName } from '@features/coordinador/lib/analisis/materias';
import { icfesAreaRgba } from '@features/coordinador/lib/icfesAreaColors';
import CoordinadorContextHeader from '@features/coordinador/components/CoordinadorContextHeader';
import CoordinatorPerformanceAreaNav, {
    usePerformanceAreaSelection,
} from '@features/coordinador/components/CoordinatorPerformanceAreaNav';
import SimulacroClavesGrid from '@features/coordinador/components/claves/SimulacroClavesGrid';
import { useSimulacroClaves } from '@features/coordinador/hooks/useSimulacroClaves';

export type UseCoordinadorDataFn = typeof useCoordinadorDataHook;

export function CoordinadorRespuestasView({
    useCoordinadorData,
    embedDemo = false,
}: {
    useCoordinadorData: UseCoordinadorDataFn;
    embedDemo?: boolean;
}) {
    const layout = useCoordinadorPanelLayout(embedDemo);
    const {
        currentSimulation,
        currentInstitution,
        availableSimulations,
        availableInstitutions,
        availableCursos,
        currentCurso,
        setSimulation,
        setInstitution,
        setCurso,
        loading: coordLoading,
        error: coordError,
    } = useCoordinadorData();

    const areaNavItems = useMemo(
        () => MATERIAS.map((m) => ({ key: m.key, label: formatAreaDisplayName(m.key) })),
        [],
    );
    const { activeKey: selectedMateria, setActiveKey: setSelectedMateria } =
        usePerformanceAreaSelection(areaNavItems);

    const { stats, loading: clavesLoading, error: clavesError } = useSimulacroClaves(
        currentSimulation,
    );

    const institutionLabel =
        (currentInstitution || '').trim() ||
        availableInstitutions.find((i) => i !== 'TODAS') ||
        'Institución';

    const [exporting, setExporting] = useState(false);

    const handleExport = useCallback(async () => {
        if (!stats || !currentSimulation || exporting) return;
        setExporting(true);
        try {
            const { generateClavesExcel } = await import(
                '@features/coordinador/lib/coordinatorExcelClaves'
            );
            await generateClavesExcel({
                stats,
                simulationId: currentSimulation,
                institutionName: institutionLabel,
            });
        } catch (err) {
            console.error('[Claves] Error exportando Excel:', err);
            alert('No se pudo generar el archivo Excel. Revisa la consola para más detalle.');
        } finally {
            setExporting(false);
        }
    }, [stats, currentSimulation, exporting, institutionLabel]);

    const materia = MATERIAS.find((m) => m.key === selectedMateria) || MATERIAS[0];
    const clavesZoneRef = useRef<HTMLDivElement>(null);

    if (!currentSimulation && coordLoading) {
        return <LoadingState message="Preparando simulacro…" fullScreen />;
    }

    if (coordError && !currentSimulation) {
        return (
            <ErrorState
                message="No fue posible cargar el simulacro"
                detail={coordError}
            />
        );
    }

    if (!currentSimulation) {
        return (
            <ErrorState
                message="Sin simulacro seleccionado"
                detail="Elige un simulacro en el selector superior."
            />
        );
    }

    return (
        <div
            data-coordinator-theme
            className={`${layout.respuestasRootClass ?? ''} min-h-screen ${layout.pagePaddingClass} space-y-5 max-w-[1600px] w-full mx-auto min-w-0 overflow-x-hidden`.trim()}
            style={{ background: 'var(--coord-page)' }}
        >
            <div data-coord-tour={TourAnchors.respuestasHeader}>
                <CoordinadorContextHeader
                    title="Claves del simulacro"
                    subtitle="Respuestas correctas oficiales por área y sesión ICFES"
                    institutionName={institutionLabel}
                    simulationId={currentSimulation}
                    availableSimulations={availableSimulations}
                    availableInstitutions={availableInstitutions}
                    currentInstitution={currentInstitution}
                    onChangeSimulation={setSimulation}
                    onChangeInstitution={setInstitution}
                    availableCursos={availableCursos}
                    currentCurso={currentCurso}
                    onChangeCurso={setCurso}
                    onExport={stats && !clavesLoading && !clavesError ? handleExport : undefined}
                    exporting={exporting}
                />
            </div>

            <div ref={clavesZoneRef} className="space-y-5 min-w-0">
                <div
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--coord-border)] bg-[var(--coord-surface-muted)]/80 px-4 py-3 backdrop-blur-md"
                    data-coord-tour={TourAnchors.respuestasControls}
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                            style={{
                                borderColor: icfesAreaRgba(materia.key, 0.32),
                                background: icfesAreaRgba(materia.key, 0.12),
                                color: materia.color,
                            }}
                        >
                            <KeyRound className="h-3.5 w-3.5" aria-hidden />
                            Claves oficiales
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/55">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/80" aria-hidden />
                            Sin datos de estudiantes
                        </span>
                    </div>
                    <p className="text-[11px] font-medium text-white/40">
                        {formatAreaDisplayName(materia.key)} · {currentSimulation}
                    </p>
                </div>

                <div className="min-w-0" data-coord-tour={TourAnchors.respuestasContent}>
                    {clavesLoading ? (
                        <LoadingState message="Cargando claves oficiales…" />
                    ) : clavesError || !stats ? (
                        <ErrorState message="Claves no disponibles" detail={clavesError || undefined} />
                    ) : (
                        <SimulacroClavesGrid
                            stats={stats}
                            materiaKey={selectedMateria}
                            accentColor={materia.color}
                            simulationId={currentSimulation}
                        />
                    )}
                </div>
            </div>

            <CoordinatorPerformanceAreaNav
                items={areaNavItems}
                activeKey={selectedMateria}
                onSelect={setSelectedMateria}
                layout="floating"
                floatingZoneRef={clavesZoneRef}
                label="Seleccionar área ICFES"
            />
        </div>
    );
}
