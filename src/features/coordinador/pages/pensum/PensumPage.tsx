'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCoordinadorData as useCoordinadorDataHook } from '@features/coordinador/hooks/useCoordinadorData';
import { useCoordinadorPanelLayout } from '@features/coordinador/hooks/useCoordinadorPanelLayout';
import CoordinadorContextHeader from '@features/coordinador/components/CoordinadorContextHeader';
import PensumPanel from '@features/coordinador/pages/pensum/components/PensumPanel';
import { buildExecutiveSummary } from '@features/coordinador/lib/executiveModel';
import {
    SIM_ID_PENSUM_DETALLADO_OK,
    simulationSupportsPensumFullInsights,
} from '@features/coordinador/lib/simulationEligibility';
import { resolvePreviousSimulationId } from '@features/coordinador/lib/coordinadorDataHelpers';
import { LoadingState, ErrorState, EmptyState } from '@features/coordinador/components/ui';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import type { IndicadoresPsicometricosCiclo } from '@features/coordinador/lib/macroReferencias';

export type UseCoordinadorDataFn = typeof useCoordinadorDataHook;

export function PensumView({
    useCoordinadorData = useCoordinadorDataHook,
    embedDemo = false,
}: {
    useCoordinadorData?: UseCoordinadorDataFn;
    embedDemo?: boolean;
} = {}) {
    const layout = useCoordinadorPanelLayout(embedDemo);
    const router = useRouter();
    const data = useCoordinadorData();
    const [exporting, setExporting] = useState(false);
    const [indicadoresCicloPorArea, setIndicadoresCicloPorArea] = useState<
        Record<string, IndicadoresPsicometricosCiclo | undefined>
    >({});

    const pensumDetallado = simulationSupportsPensumFullInsights(data.currentSimulation);

    useEffect(() => {
        if (!data.loading && data.currentSimulation && !pensumDetallado) {
            router.replace('/coordinador/desempeno');
        }
    }, [data.loading, data.currentSimulation, pensumDetallado, router]);

    const normalizeStr = (s: string) =>
        String(s || '')
            .toUpperCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

    const institutionKey = useMemo(() => {
        const selected = (data.currentInstitution || '').trim();
        if (selected && selected.toUpperCase() !== 'TODAS' && selected !== '*') return selected;
        const base = (typeof window !== 'undefined' ? localStorage.getItem('coordinator_institution') : '') || '';
        return base && base.toUpperCase() !== 'TODAS' && base !== '*' ? base : '';
    }, [data.currentInstitution]);

    useEffect(() => {
        if (!pensumDetallado || !data.myInstitution || !data.currentSimulation) return;

        const prevSim = resolvePreviousSimulationId(
            data.currentSimulation,
            data.availableSimulations || [],
        );
        if (!prevSim) {
            setIndicadoresCicloPorArea({});
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const { getRanking, getSimulationEstadisticas } = await import('@features/simulacro/lib/firestoreService');
                const [rankingPrev, statsPrev, statsCurr] = await Promise.all([
                    getRanking(prevSim),
                    getSimulationEstadisticas(prevSim),
                    getSimulationEstadisticas(data.currentSimulation),
                ]);
                if (cancelled) return;

                const filterByInst = (rows: any[]) => {
                    const instNorm = normalizeStr(institutionKey);
                    if (!instNorm) return rows;
                    const filtered = rows.filter(r => {
                        const ri = normalizeStr(r?.institucion || '');
                        return ri === instNorm || ri.includes(instNorm) || instNorm.includes(ri);
                    });
                    return filtered.length > 0 ? filtered : rows;
                };

                const pctBelow40FromRanking = (rows: any[], areaKey: string): number | null => {
                    const filtered = filterByInst(rows);
                    const scores: number[] = filtered
                        .map(r => {
                            const puntajes = r?.puntajes || {};
                            const raw =
                                puntajes?.[areaKey] ??
                                (() => {
                                    const target = normalizeStr(areaKey);
                                    const k = Object.keys(puntajes).find(pk => normalizeStr(pk) === target);
                                    return k ? puntajes[k] : undefined;
                                })();
                            const v =
                                typeof raw === 'object' && raw !== null ? Number(raw.puntaje) || 0 : Number(raw) || 0;
                            return v;
                        })
                        .filter(v => v > 0);
                    if (scores.length === 0) return null;
                    const below = scores.filter(v => v < 40).length;
                    return (below / scores.length) * 100;
                };

                const pctBelow40Current = (areaKey: string): number | null => {
                    const scores: number[] = (data.myInstitution?.students || [])
                        .map(s => Number((s as any)?.puntajes?.[areaKey]?.puntaje) || 0)
                        .filter(v => v > 0);
                    if (scores.length === 0) return null;
                    const below = scores.filter(v => v < 40).length;
                    return (below / scores.length) * 100;
                };

                const errorPctFromStats = (stats: any | null, materia: string, num: number): number | null => {
                    if (!stats?.materias) return null;
                    const target = normalizeStr(materia);
                    const materiaKey = Object.keys(stats.materias).find(k => normalizeStr(k) === target) ?? materia;
                    if (!stats.materias[materiaKey]) return null;
                    const preguntas = stats.materias[materiaKey];
                    const key = Object.keys(preguntas).find(k => Number(preguntas[k]?.numero) === num);
                    const p = key ? preguntas[key] : null;
                    const total = Number(p?.total_respuestas) || 0;
                    const acierto = Number(p?.porcentaje_acierto) || 0;
                    if (total <= 0) return null;
                    return 100 - acierto;
                };

                const AREAS_CICLO = [
                    { areaKey: 'matemáticas', materia: 'matemáticas' },
                    { areaKey: 'lectura crítica', materia: 'lectura crítica' },
                    { areaKey: 'sociales y ciudadanas', materia: 'sociales y ciudadanas' },
                    { areaKey: 'ciencias naturales', materia: 'ciencias naturales' },
                    { areaKey: 'inglés', materia: 'inglés' },
                ] as const;

                const getQuestionStatsForMateria = (m: string) => {
                    const qa = data.questionAnalysis || {};
                    const target = normalizeStr(m);
                    const key = Object.keys(qa).find(k => normalizeStr(k) === target);
                    return (key ? qa[key] : []) || [];
                };

                const next: Record<string, IndicadoresPsicometricosCiclo> = {};
                AREAS_CICLO.forEach(({ areaKey, materia }) => {
                    const currentQs = getQuestionStatsForMateria(materia);
                    const topItems = [...currentQs]
                        .filter(q => (q?.total || 0) > 0)
                        .sort((a, b) => (b?.rate || 0) - (a?.rate || 0))
                        .slice(0, 5)
                        .map(q => Number(q.num) || 0)
                        .filter(Boolean);

                    next[areaKey] = {
                        inicioSimId: prevSim,
                        cierreSimId: data.currentSimulation,
                        pctBajo40Inicio: pctBelow40FromRanking(rankingPrev, areaKey),
                        pctBajo40Cierre: pctBelow40Current(areaKey),
                        itemsPrioritarios: topItems.map(num => ({
                            num,
                            errorInicioPct: errorPctFromStats(statsPrev, materia, num),
                            errorCierrePct: errorPctFromStats(statsCurr, materia, num),
                        })),
                        pctGruposConRefuerzo: null,
                    };
                });

                setIndicadoresCicloPorArea(next);
            } catch {
                if (!cancelled) setIndicadoresCicloPorArea({});
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [
        pensumDetallado,
        data.myInstitution,
        data.currentSimulation,
        data.availableSimulations,
        data.questionAnalysis,
        institutionKey,
    ]);

    const executiveSummary = useMemo(() => {
        if (!data.myInstitution || !pensumDetallado) return null;
        return buildExecutiveSummary({
            inst: data.myInstitution,
            simulationId: data.currentSimulation,
            questionAnalysis: data.questionAnalysis,
            alertas: data.alertas,
            indicadoresCicloPorArea,
        });
    }, [
        data.myInstitution,
        data.currentSimulation,
        data.questionAnalysis,
        data.alertas,
        pensumDetallado,
        indicadoresCicloPorArea,
    ]);

    const hasQuestionData = useMemo(
        () => Object.values(data.questionAnalysis || {}).some(qs => qs.some(q => (q.total || 0) > 0)),
        [data.questionAnalysis]
    );

    const handleExport = async () => {
        if (!data.myInstitution || !executiveSummary || !pensumDetallado || exporting) return;
        setExporting(true);
        try {
            const { generateCoordinatorExcel } = await import(
                '@features/coordinador/lib/coordinatorExcel'
            );
            await generateCoordinatorExcel({
                summary: executiveSummary,
                inst: data.myInstitution,
                ranking: data.ranking,
                allInstitutions: data.allInstitutions,
                alertas: data.alertas,
                questionAnalysis: data.questionAnalysis,
                simulationId: data.currentSimulation,
            });
        } catch (err) {
            console.error('[Pensum] Error exportando Excel:', err);
            alert('No se pudo generar el reporte. Revisa la consola para mas detalle.');
        } finally {
            setExporting(false);
        }
    };

    if (data.loading) {
        return <LoadingState message="Cargando pensum institucional…" fullScreen />;
    }

    if (data.error) {
        return <ErrorState message="No se pudo cargar el pensum" detail={data.error} />;
    }

    if (!data.myInstitution) {
        return (
            <ErrorState
                message="Sin datos para tu institución"
                detail="No se encontraron resultados para mostrar."
            />
        );
    }

    return (
        <div
            data-coordinator-theme
            className={`${layout.pensumRootClass ?? ''} min-h-screen ${layout.pagePaddingClass} space-y-6 max-w-[1600px] mx-auto min-w-0`.trim()}
            style={{ background: 'var(--coord-page)' }}
        >
            <div data-coord-tour={TourAnchors.resumenHeader}>
                <CoordinadorContextHeader
                    title={
                        pensumDetallado
                            ? 'Pensum de Estudios'
                            : 'Análisis Curricular y Ruta de Nivelación (Basado en ICFES)'
                    }
                    subtitle={
                        pensumDetallado
                            ? 'Ruta de estudio institucional según análisis del simulacro SG11-17 (temarios, ítems e indicadores). Para otros simulacros esta vista está desactivada hasta completar datos.'
                            : 'Sin metadata curricular: el sistema usa el cruce ICFES (niveles de desempeño vs marco de referencia) para inferir brechas hacia niveles superiores y convertirlas en una ruta de nivelación sugerida.'
                    }
                    institutionName={data.myInstitution.name}
                    simulationId={data.currentSimulation}
                    availableSimulations={data.availableSimulations}
                    availableInstitutions={data.availableInstitutions}
                    currentInstitution={data.currentInstitution}
                    onChangeSimulation={data.setSimulation}
                    onChangeInstitution={data.setInstitution}
                    availableCursos={data.availableCursos}
                    currentCurso={data.currentCurso}
                    onChangeCurso={data.setCurso}
                    onExport={pensumDetallado ? handleExport : undefined}
                    exporting={exporting}
                />
            </div>

            {!pensumDetallado ? (
                <div data-coord-tour={TourAnchors.resumenKpis}>
                    <EmptyState
                        title={`El simulacro ${data.currentSimulation} no tiene temario`}
                        body={`El análisis curricular detallado (temas, subtemas e indicadores) solo está disponible para ${SIM_ID_PENSUM_DETALLADO_OK}. Para este simulacro no se cargaron los datos de temario. Selecciona ${SIM_ID_PENSUM_DETALLADO_OK} en el selector de arriba para ver el Pensum completo.`}
                    />
                </div>
            ) : executiveSummary ? (
                <PensumPanel summary={executiveSummary} hasQuestionData={hasQuestionData} />
            ) : (
                <div data-coord-tour={TourAnchors.resumenKpis}>
                    <EmptyState
                        title="No hay datos suficientes"
                        body="No se puede armar el pensum con la institución/simulacro actual. Verifica filtros o carga para SG11-17."
                    />
                </div>
            )}
        </div>
    );
}

export default function PensumPage() {
    return <PensumView useCoordinadorData={useCoordinadorDataHook} />;
}
