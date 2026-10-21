'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useCoordinadorData as useCoordinadorDataHook, type SubjectStat, type QuestionStat, type AlertaEstudiante } from '@features/coordinador/hooks/useCoordinadorData';
import { useUrlQueryState } from '@shared/hooks/useUrlQueryState';

export type UseCoordinadorDataFn = typeof useCoordinadorDataHook;
import { NATIONAL_STATS, estimatePercentile, AREA_MAP } from '@features/benchmark/lib/nationalData';
import { Estudiante } from '@shared/types';
import CoordinatorStudentProfileModal from '@features/coordinador/components/cohort/CoordinatorStudentProfileModal';
import InstitutionInsights from '@features/coordinador/components/InstitutionInsights';
import CoordinadorContextHeader from '@features/coordinador/components/CoordinadorContextHeader';
import MetricHelp from '@features/coordinador/components/MetricHelp';
import CoordinadorStatsGroups from '@features/coordinador/components/CoordinadorStatsGroups';
import CoordinadorDashboardAmbient from '@features/coordinador/components/dashboard/CoordinadorDashboardAmbient';
import CoordinadorDashboardHero from '@features/coordinador/components/dashboard/CoordinadorDashboardHero';
import CoordinadorDashboardApproval from '@features/coordinador/components/dashboard/CoordinadorDashboardApproval';
import CoordinadorCriticalQuestionsPanel from '@features/coordinador/components/dashboard/CoordinadorCriticalQuestionsPanel';
import CoordinadorSubjectStrip from '@features/coordinador/components/dashboard/CoordinadorSubjectStrip';
import CoordinadorCompetenciasCharts from '@features/coordinador/components/dashboard/CoordinadorCompetenciasCharts';
import SectionHeader from '@features/coordinador/components/ui/SectionHeader';
import CoordinadorTourSectionHint from '@features/coordinador/components/CoordinadorTourSectionHint';
import CoordinadorDistributionLine from '@features/coordinador/components/CoordinadorDistributionLine';
import { buildExecutiveSummary } from '@features/coordinador/lib/executiveModel';
import { resolvePreviousSimulationId } from '@features/coordinador/lib/coordinadorDataHelpers';
import { institutionsMatch } from '@shared/lib/institucionesAcondicionamiento';
import { LoadingState, ErrorState } from '@features/coordinador/components/ui';
import PercentilValue from '@features/coordinador/components/ui/PercentilValue';
import BenchmarkContextPanel from '@features/coordinador/components/benchmark/BenchmarkContextPanel';
import {
    humanPercentileHeadline,
    humanPercentileShort,
    percentileColor,
} from '@features/benchmark/lib/benchmarkContextHelpers';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import { registerDashboardTabSetter } from '@features/coordinador/lib/dashboardTourBridge';
import type { IndicadoresPsicometricosCiclo } from '@features/coordinador/lib/macroReferencias';
import { useCoordinadorPanelLayout } from '@features/coordinador/hooks/useCoordinadorPanelLayout';
import RecordingsPromoCard from '@features/recordings/components/RecordingsPromoCard';
import RecordingsPrecacheBootstrap from '@features/recordings/components/RecordingsPrecacheBootstrap';
import { displayDocumentId } from '@features/coordinador/lib/demoPrivacy';
import {
    CoordinatorStudentListTable,
    StudentLevelFilterPills,
} from '@features/coordinador/components/CoordinatorStudentListTable';
import {
    matchesStudentSearch,
    getStudentPerformanceLevel,
    getStudentSubjectScore,
    studentDepartamento,
    studentDocumentId,
    studentFullName,
    studentInstitucion,
} from '@shared/lib/studentDisplay';
import { SG_AREA_HEX_BY_SUBJECT, SG_DASHBOARD_AREA_ORDER, sgAreaHexList } from '@shared/lib/sgAreaColors';
import { aprobadosDisplay, cohortTotal } from '@features/coordinador/lib/globalScoreStats';
import { useCoordEmbed } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-coordinador/context/CoordEmbedProvider';
import {
    LayoutDashboard, Trophy, AlertTriangle, Bell, BarChart3,
    Users, TrendingUp, Target, Award, ChevronDown, Search,
    Shield, AlertCircle, Info, ArrowUp, ArrowDown, Minus,
    Star, Zap, Activity, Hash, CheckCircle2
} from 'lucide-react';

// === DESIGN TOKENS (Stitch: Seamos Genios Analytics) ===
const T = {
    surface: 'bg-[#111827]',
    surfaceEl: 'bg-[#1b1b23]',
    border: 'border-white/[0.08]',
    card: 'rounded-xl border border-white/[0.08] bg-[#111827]/90 backdrop-blur-md',
    cardHover: 'hover:border-indigo-400/25 transition-all duration-300',
};

// === LEVEL CLASSIFIER ===
const clasificarNivel = (p: number) => {
    if (p >= 400) return { nivel: 'Superior', color: '#10b981', badge: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20' };
    if (p >= 325) return { nivel: 'Alto', color: '#3b82f6', badge: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20' };
    if (p >= 250) return { nivel: 'Medio', color: '#f59e0b', badge: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20' };
    return { nivel: 'Bajo', color: '#ef4444', badge: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/20' };
};

// === NAV TABS ===
const TABS = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Inicio', Icon: LayoutDashboard },
    { id: 'ranking', label: 'Ranking', shortLabel: 'Ranking', Icon: Trophy },
    { id: 'analisis', label: 'Preguntas Críticas', shortLabel: 'Ítems', Icon: AlertTriangle },
    { id: 'alertas', label: 'Alertas', shortLabel: 'Alertas', Icon: Bell },
    { id: 'benchmark', label: 'Benchmark', shortLabel: 'Bench.', Icon: BarChart3 },
] as const;

function DashboardTabContext({
    tab,
    avgScore,
    approvalPct,
    studentCount,
    alertCount,
}: {
    tab: string;
    avgScore: number;
    approvalPct: number;
    studentCount: number;
    alertCount: number;
}) {
    const items: { k: string; v: string; accent?: string }[] = (() => {
        switch (tab) {
            case 'ranking':
                return [
                    { k: 'Cohorte', v: `${studentCount} est.` },
                    { k: 'Promedio', v: `${Math.round(avgScore)} pts` },
                ];
            case 'analisis':
                return [
                    { k: 'Enfoque', v: 'Ítems críticos' },
                    { k: 'Cohorte', v: `${studentCount} est.` },
                ];
            case 'alertas':
                return [
                    { k: 'Alertas', v: String(alertCount), accent: alertCount > 0 ? '#f87171' : undefined },
                    { k: 'Cohorte', v: `${studentCount} est.` },
                ];
            case 'benchmark':
                return [
                    { k: 'Referencia', v: 'Nacional SG' },
                    { k: 'Promedio', v: `${Math.round(avgScore)} pts` },
                ];
            default:
                return [
                    { k: 'Promedio', v: `${Math.round(avgScore)} / 500` },
                    { k: 'Aprobación', v: `${approvalPct.toFixed(0)}%` },
                    { k: 'Cohorte', v: `${studentCount} est.` },
                ];
        }
    })();

    return (
        <div className="coord-tab-context" aria-label="Resumen de la vista activa">
            {items.map((item, i) => (
                <React.Fragment key={item.k}>
                    {i > 0 && <span className="coord-tab-context__sep" aria-hidden />}
                    <span className="coord-tab-context__item">
                        <span className="coord-tab-context__key">{item.k}</span>
                        <span
                            className="coord-tab-context__val"
                            style={item.accent ? { color: item.accent } : undefined}
                        >
                            {item.v}
                        </span>
                    </span>
                </React.Fragment>
            ))}
        </div>
    );
}

// === MAIN VIEW ===
export function CoordinadorDashboardView({
    useCoordinadorData,
    embedDemo = false,
}: {
    useCoordinadorData: UseCoordinadorDataFn;
    embedDemo?: boolean;
}) {
    const layout = useCoordinadorPanelLayout(embedDemo);
    const { maskDocumentIds } = useCoordEmbed();
    const data = useCoordinadorData();
    const urlPersist = !embedDemo;
    const [tab, setTabRaw] = useUrlQueryState('tab', 'dashboard', { persist: urlPersist });
    const setTab = useCallback(
        (next: string) => {
            if (TABS.some((x) => x.id === next)) setTabRaw(next);
        },
        [setTabRaw],
    );
    useEffect(() => registerDashboardTabSetter(setTab), [setTab]);
    const [studentId, setStudentId] = useUrlQueryState('student', '', { persist: urlPersist });
    const [selectedEstudiante, setSelectedEstudiante] = useState<Estudiante | null>(null);

    const openStudentModal = useCallback((est: Estudiante) => {
        setSelectedEstudiante(est);
        setStudentId(est.informacion_personal?.numero_identificacion || '');
    }, [setStudentId]);

    const closeStudentModal = useCallback(() => {
        setSelectedEstudiante(null);
        setStudentId('');
    }, [setStudentId]);

    const [exporting, setExporting] = useState(false);
    const [indicadoresCicloPorArea, setIndicadoresCicloPorArea] = useState<Record<string, IndicadoresPsicometricosCiclo | undefined>>({});

    const normalizeStr = (s: string) =>
        String(s || '')
            .toUpperCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

    const institutionKey = useMemo(() => {
        // Usa la institución seleccionada si existe; si no, la base del login.
        const selected = (data.currentInstitution || '').trim();
        if (selected && selected.toUpperCase() !== 'TODAS' && selected !== '*') return selected;
        const base = (typeof window !== 'undefined' ? localStorage.getItem('coordinator_institution') : '') || '';
        return base && base.toUpperCase() !== 'TODAS' && base !== '*' ? base : '';
    }, [data.currentInstitution]);

    const executiveSummary = useMemo(() => {
        if (!data.myInstitution) return null;
        return buildExecutiveSummary({
            inst: data.myInstitution,
            simulationId: data.currentSimulation,
            questionAnalysis: data.questionAnalysis,
            alertas: data.alertas,
            indicadoresCicloPorArea,
        });
    }, [data.myInstitution, data.currentSimulation, data.questionAnalysis, data.alertas, indicadoresCicloPorArea]);

    // ── Indicadores institucionales (psicométricos) pre/post (inicio vs cierre de ciclo) ──
    React.useEffect(() => {
        if (!data.myInstitution || !data.currentSimulation) return;
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
                    if (!institutionKey) return rows;
                    const filtered = rows.filter((r) =>
                        institutionsMatch(r?.institucion || '', institutionKey),
                    );
                    // Fallback: si el match por institución falla (nombres inconsistentes), no dejar set vacío.
                    return filtered.length > 0 ? filtered : rows;
                };

                const pctBelow40FromRanking = (rows: any[], areaKey: string): number | null => {
                    const filtered = filterByInst(rows);
                    const scores: number[] = filtered
                        .map(r => {
                            const puntajes = r?.puntajes || {};
                            const raw =
                                puntajes?.[areaKey] ??
                                // Fallback sin tildes (inglés → ingles)
                                puntajes?.[String(areaKey).replace('í', 'i').replace('á', 'a').replace('é', 'e').replace('ó', 'o').replace('ú', 'u')] ??
                                // Fallback por normalización completa
                                (() => {
                                    const target = normalizeStr(areaKey);
                                    const k = Object.keys(puntajes).find(pk => normalizeStr(pk) === target);
                                    return k ? puntajes[k] : undefined;
                                })();
                            const v = typeof raw === 'object' && raw !== null ? Number(raw.puntaje) || 0 : Number(raw) || 0;
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

                const buildCycle = (areaKey: string, materia: string): IndicadoresPsicometricosCiclo => {
                    const currentQs = getQuestionStatsForMateria(materia);
                    const topItems = [...currentQs]
                        .filter(q => (q?.total || 0) > 0)
                        .sort((a, b) => (b?.rate || 0) - (a?.rate || 0))
                        .slice(0, 5)
                        .map(q => Number(q.num) || 0)
                        .filter(Boolean);

                    const itemsPrioritarios = topItems.map(num => ({
                        num,
                        errorInicioPct: errorPctFromStats(statsPrev, materia, num),
                        errorCierrePct: errorPctFromStats(statsCurr, materia, num),
                    }));

                    return {
                        inicioSimId: prevSim,
                        cierreSimId: data.currentSimulation,
                        pctBajo40Inicio: pctBelow40FromRanking(rankingPrev, areaKey),
                        pctBajo40Cierre: pctBelow40Current(areaKey),
                        itemsPrioritarios,
                        pctGruposConRefuerzo: null,
                    };
                };

                const next: Record<string, IndicadoresPsicometricosCiclo> = {};
                AREAS_CICLO.forEach(({ areaKey, materia }) => {
                    next[areaKey] = buildCycle(areaKey, materia);
                });

                setIndicadoresCicloPorArea(next);
            } catch {
                if (!cancelled) setIndicadoresCicloPorArea({});
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [data.myInstitution, data.currentSimulation, data.availableSimulations, data.questionAnalysis, institutionKey]);

    const handleExport = async () => {
        if (!data.myInstitution || !executiveSummary || exporting) return;
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
            console.error('[Coordinador] Error exportando Excel:', err);
            alert('No se pudo generar el reporte. Revisa la consola para más detalle.');
        } finally {
            setExporting(false);
        }
    };

    // Precargar ranking y estadísticas en cache antes del primer render de datos
    React.useEffect(() => {
        import('@features/simulacro/lib/firestoreService')
            .then(({ warmupCoordinatorCache }) => warmupCoordinatorCache())
            .catch(() => { /* no crítico */ });
    }, []);

    // Restaurar modal de estudiante desde ?student= al refrescar
    useEffect(() => {
        if (!studentId || data.loading) return;
        const pool = data.ranking.length > 0 ? data.ranking : (data.myInstitution?.students || []);
        const found = pool.find(
            (s) => String(s.informacion_personal?.numero_identificacion || '') === studentId,
        );
        if (found) setSelectedEstudiante(found);
    }, [studentId, data.loading, data.ranking, data.myInstitution?.students]);

    if (data.loading) return <LoadingState message="Cargando datos institucionales…" />;
    if (data.error) return <ErrorState message="No fue posible cargar el panel" detail={data.error} />;

    const inst = data.myInstitution;
    if (!inst) {
        return (
            <ErrorState
                message="Sin datos para tu institución"
                detail="No se encontraron resultados en el simulacro actual."
            />
        );
    }

    const totalAlertas = data.alertas.critico.length + data.alertas.alto.length + data.alertas.moderado.length + data.alertas.monitoreo.length;
    const cohortCount =
        inst.students.length > 0
            ? inst.students.length
            : Math.max(0, ...inst.subjectStats.map((s) => s.countStudents || 0));

    return (
        <div
            data-coordinator-theme
            className={`${layout.dashboardRootClass ?? ''} ${layout.pagePaddingClass} space-y-5 max-w-[1600px] mx-auto min-w-0`.trim()}
        >
            {/* Header unificado con branding SG, selectores y export */}
            <CoordinadorContextHeader
                title="Reporte Institucional"
                subtitle={`${cohortCount} estudiantes`}
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
                onExport={handleExport}
                exporting={exporting}
            />

            {!embedDemo ? (
                <RecordingsPrecacheBootstrap simulationId={data.currentSimulation} />
            ) : null}

            {/* Tabs + contexto — fila completa responsiva */}
            <div className="coord-tab-bar">
                <div className="coord-tab-pills overflow-x-auto scrollbar-none">
                    <div data-coord-tour={TourAnchors.dashboardTabs} className="coord-tab-pills-track" role="tablist">
                        {TABS.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                role="tab"
                                aria-selected={tab === t.id}
                                onClick={() => setTab(t.id)}
                                className={`coord-tab-pill ${tab === t.id ? 'coord-tab-pill-active' : ''}`}
                            >
                                <t.Icon className="coord-tab-pill__icon" aria-hidden />
                                <span className="coord-tab-pill__label coord-tab-pill__label--full">{t.label}</span>
                                <span className="coord-tab-pill__label coord-tab-pill__label--short">{t.shortLabel}</span>
                                {t.id === 'alertas' && totalAlertas > 0 && (
                                    <span className="coord-tab-pill-badge">{totalAlertas}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
                <DashboardTabContext
                    tab={tab}
                    avgScore={inst.avg}
                    approvalPct={inst.tasaAprobacion}
                    studentCount={inst.students.length}
                    alertCount={totalAlertas}
                />
            </div>

            {tab === 'dashboard' && (
                <DashboardTab
                    inst={inst}
                    onStudentClick={openStudentModal}
                    simulationId={data.currentSimulation}
                    showRecordings={!embedDemo}
                    executiveSummary={executiveSummary}
                />
            )}
            {tab === 'ranking' && (
                <RankingTab ranking={data.ranking} onStudentClick={openStudentModal} maskDocumentIds={maskDocumentIds} />
            )}
            {tab === 'analisis' && (
                <CoordinadorCriticalQuestionsPanel
                    questionAnalysis={data.questionAnalysis}
                    students={inst.students}
                    onStudentClick={openStudentModal}
                    urlMemory={urlPersist}
                />
            )}
            {tab === 'alertas' && (
                <AlertasTab alertas={data.alertas} students={inst.students} onStudentClick={openStudentModal} maskDocumentIds={maskDocumentIds} />
            )}
            {tab === 'benchmark' && (
                <BenchmarkTab inst={inst} allInstitutions={data.allInstitutions} />
            )}

            {selectedEstudiante && (
                <CoordinatorStudentProfileModal
                    student={selectedEstudiante}
                    onClose={closeStudentModal}
                    institutionAvg={Object.fromEntries(inst.subjectStats.map(s => [s.key, s.avg]))}
                    allStudents={inst.students}
                    questionAnalysis={data.questionAnalysis}
                    currentSimulation={data.currentSimulation}
                    availableSimulations={data.availableSimulations}
                    maskDocumentIds={maskDocumentIds}
                    embedDemo={embedDemo}
                />
            )}
        </div>
    );
}

// =
// TAB 1: DASHBOARD
// =
function DashboardTab({
    inst,
    onStudentClick,
    simulationId,
    showRecordings = false,
    executiveSummary,
}: {
    inst: NonNullable<ReturnType<typeof useCoordinadorDataHook>['myInstitution']>;
    onStudentClick: (e: Estudiante) => void;
    simulationId: string;
    showRecordings?: boolean;
    executiveSummary: ReturnType<typeof buildExecutiveSummary> | null;
}) {
    const { maskDocumentIds } = useCoordEmbed();
    // Compute best/worst subjects
    const sortedSubjects = [...inst.subjectStats].sort((a, b) => b.avg - a.avg);
    const bestSubject = sortedSubjects[0];
    const worstSubject = sortedSubjects[sortedSubjects.length - 1];

    const aprobados = aprobadosDisplay(inst.tasaAprobacion, cohortTotal(inst.students));
    const evaluados = cohortTotal(inst.students);

    return (
        <CoordinadorDashboardAmbient>
            <div className="space-y-8 pb-4">
            {/* Stitch bento: hero + aprobación */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 coord-stagger-in items-stretch">
                <div className="min-h-0">
                    <CoordinadorDashboardHero inst={inst} />
                </div>
                <div className="min-h-0">
                    <CoordinadorDashboardApproval
                        value={inst.tasaAprobacion}
                        approvedCount={aprobados}
                        evaluatedCount={evaluados}
                    />
                </div>
            </div>

            {showRecordings ? (
                <RecordingsPromoCard
                    simulationId={simulationId}
                    href="/coordinador/clases"
                    variant="dark"
                    audience="coordinador"
                />
            ) : null}

            <section
                className="relative overflow-hidden rounded-[1.75rem] border border-cyan-300/15 bg-[#030712]/95 p-4 md:p-5 coord-stagger-in shadow-[0_28px_90px_rgba(8,47,73,0.38)]"
                style={{
                    background:
                        'radial-gradient(circle at 12% 0%, rgba(34,211,238,0.22), transparent 34%), radial-gradient(circle at 88% 18%, rgba(99,102,241,0.2), transparent 30%), linear-gradient(135deg, rgba(3,7,18,0.98), rgba(15,23,42,0.92))',
                }}
            >
                <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
                <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 left-10 h-28 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="relative">
                    <SectionHeader
                        title="Estadística descriptiva del grupo"
                        description="Lectura avanzada del grupo: volumen evaluado, percentiles y dispersión del puntaje global en escala 0–500."
                        accent="#22d3ee"
                        tourId={TourAnchors.dashboardKpisIntro}
                        right={<CoordinadorTourSectionHint stepId="d-kpis-intro" />}
                    />
                    <CoordinadorStatsGroups inst={inst} />
                </div>
            </section>

            {executiveSummary ? (
                <div className="coord-stagger-in">
                    <InstitutionInsights summary={executiveSummary} />
                </div>
            ) : (
                <div
                    className="coord-stagger-in rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"
                    data-coord-tour={TourAnchors.dashboardInsights}
                >
                    <p className="text-[10px] font-bold uppercase tracking-[3px] text-white/40 mb-1">
                        Insights ejecutivos
                    </p>
                    <p className="text-sm text-white/50">
                        Disponible cuando el simulacro tenga datos suficientes para el resumen automático.
                    </p>
                </div>
            )}

            <section
                data-coord-tour={TourAnchors.dashboardRadarChart}
                className={`${T.card} p-6 coord-stagger-in`}
            >
                <div className="space-y-5">
                    <CoordinadorCompetenciasCharts
                        inst={inst}
                        simulationId={simulationId}
                        onStudentClick={onStudentClick}
                    />
                    <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
                        <span className="text-emerald-400">
                            ● Mejor área: <span className="text-white font-bold">{bestSubject?.name}</span>
                            <span className="text-white/50"> ({bestSubject?.avg})</span>
                        </span>
                        <span className="text-rose-400">
                            ● Área a reforzar: <span className="text-white font-bold">{worstSubject?.name}</span>
                            <span className="text-white/50"> ({worstSubject?.avg})</span>
                        </span>
                    </div>
                </div>
            </section>

            <CoordinadorDistributionLine inst={inst} />

            <CoordinadorSubjectStrip subjects={inst.subjectStats} />

            <section className="coord-stagger-in">
                <SectionHeader
                    title="Seguimiento por estudiante"
                    description="Ranking interno y casos bajo el umbral de aprobación (300 pts). Clic en fila para ver detalle."
                    accent="#f59e0b"
                    right={<CoordinadorTourSectionHint stepId="d-followup-top" />}
                />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" data-coord-tour={TourAnchors.dashboardFollowupRow}>
                <div data-coord-tour={TourAnchors.dashboardFollowupTop} className={`${T.card} p-6`}>
                    <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-400" aria-hidden /> Top 5 estudiantes
                    </h3>
                    <div className="space-y-0 divide-y divide-white/[0.06]">
                        {inst.top5.map((e, i) => {
                            const materias = [...SG_DASHBOARD_AREA_ORDER];
                            const labels = ['MAT', 'LEC', 'SOC', 'CIEN', 'ING'];
                            const colors = sgAreaHexList(SG_DASHBOARD_AREA_ORDER);
                            return (
                                <div key={i} onClick={() => onStudentClick(e)} className="py-3 first:pt-0 hover:bg-white/[0.04] rounded-lg px-2 -mx-2 transition-all duration-200 group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 shadow-lg shadow-amber-500/20' : i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800' : i === 2 ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-amber-100' : 'bg-white/10 text-white/70'}`}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white text-sm font-semibold truncate">{studentFullName(e, { uppercase: true })}</div>
                                            <p className="text-[10px] text-white/35 truncate mt-0.5" title={`${studentDocumentId(e)} · ${studentDepartamento(e)} · ${studentInstitucion(e)}`}>
                                                {displayDocumentId(studentDocumentId(e), maskDocumentIds)}
                                                {studentDepartamento(e) ? ` · ${studentDepartamento(e)}` : ''}
                                                {studentInstitucion(e) ? ` · ${studentInstitucion(e)}` : ''}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                                                {materias.map((mat, mi) => {
                                                    const p = Number(e.puntajes?.[mat]?.puntaje) || 0;
                                                    return (
                                                        <span key={mat} className="text-[10px] sm:text-[11px] font-bold px-1 sm:px-1.5 py-0.5 rounded" style={{ background: `${colors[mi]}15`, color: colors[mi] }}>
                                                            {labels[mi]} {p}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="text-xl font-black text-indigo-300 shrink-0">{e.puntaje_global}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div data-coord-tour={TourAnchors.dashboardFollowupRisk} className={`${T.card} p-6`}>
                    <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" aria-hidden /> Estudiantes en riesgo (&lt;300)
                    </h3>
                    <div className="space-y-0 divide-y divide-white/[0.06]">
                        {inst.enRiesgo.length === 0 ? (
                            <p className="text-white/60 text-sm py-2 inline-flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden />
                                No hay estudiantes en riesgo
                            </p>
                        ) : inst.enRiesgo.map((e, i) => {
                            // Find weakest subject
                            let weakest = '', weakVal = 100;
                            if (e.puntajes) {
                                Object.entries(e.puntajes).forEach(([area, data]) => {
                                    const p = Number(data.puntaje) || 0;
                                    if (p < weakVal && p > 0) { weakVal = p; weakest = area; }
                                });
                            }
                            return (
                                <div key={i} onClick={() => onStudentClick(e)} className="py-3 first:pt-0 hover:bg-red-500/[0.06] rounded-lg px-2 -mx-2 transition-all duration-200 group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center text-red-400 font-bold text-sm shrink-0">{i + 1}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white text-sm font-semibold truncate">{studentFullName(e, { uppercase: true })}</div>
                                            <p className="text-[10px] text-white/35 truncate mt-0.5" title={`${studentDocumentId(e)} · ${studentDepartamento(e)} · ${studentInstitucion(e)}`}>
                                                {displayDocumentId(studentDocumentId(e), maskDocumentIds)}
                                                {studentDepartamento(e) ? ` · ${studentDepartamento(e)}` : ''}
                                                {studentInstitucion(e) ? ` · ${studentInstitucion(e)}` : ''}
                                            </p>
                                            {weakest && (
                                                <div className="text-red-400/60 text-xs mt-0.5">
                                                    Área débil: <span className="text-red-400 font-bold capitalize">{weakest}</span> ({weakVal})
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xl font-black text-red-400 shrink-0">{e.puntaje_global}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            </section>

            <div className="coord-stagger-in">
            <GapAnalysisPanel students={inst.students} onStudentClick={onStudentClick} />
            </div>
            </div>
        </CoordinadorDashboardAmbient>
    );
}

// =
// GAP ANALYSIS PANEL
// =
function GapAnalysisPanel({ students, onStudentClick }: { students: Estudiante[]; onStudentClick: (e: Estudiante) => void }) {
    const [isOpen, setIsOpen] = useState(false);

    const MATERIAS_GAP = [
        { key: 'matemáticas', label: 'Matemáticas' },
        { key: 'lectura crítica', label: 'Lectura Crítica' },
        { key: 'sociales y ciudadanas', label: 'Sociales' },
        { key: 'ciencias naturales', label: 'Ciencias Nat.' },
        { key: 'inglés', label: 'Inglés' },
    ];

    const gapData = useMemo(() => {
        const results = students.map(s => {
            let strongest = { key: '', label: '', score: 0 };
            let weakest = { key: '', label: '', score: 100 };

            MATERIAS_GAP.forEach(m => {
                const p = Number(s.puntajes?.[m.key]?.puntaje) || 0;
                if (p > strongest.score) strongest = { key: m.key, label: m.label, score: p };
                if (p < weakest.score && p > 0) weakest = { key: m.key, label: m.label, score: p };
            });

            const gap = strongest.score - weakest.score;
            const global = s.puntaje_global || 0;
            const riesgo = gap >= 30 ? 'Crítica' : gap >= 20 ? 'Alta' : gap >= 10 ? 'Moderada' : 'Normal';
            const riesgoColor = gap >= 30 ? '#ef4444' : gap >= 20 ? '#f97316' : gap >= 10 ? '#eab308' : '#10b981';

            return { student: s, strongest, weakest, gap, global, riesgo, riesgoColor };
        }).filter(d => d.gap > 0).sort((a, b) => b.gap - a.gap);

        const gaps = results.map(r => r.gap);
        const avgGap = gaps.length > 0 ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : 0;
        const maxGap = gaps.length > 0 ? Math.max(...gaps) : 0;
        const highGaps = results.filter(r => r.gap > 20).length;

        return { results, avgGap, maxGap, highGaps };
    }, [students]);

    return (
        <div
            data-coord-tour={TourAnchors.dashboardGapAnalysis}
            className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden"
        >
            <button onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors group cursor-pointer">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                            <path d="M2 8h5M9 8h5" /><path d="M7 5v6M9 5v6" />
                        </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white">Análisis de Brechas por Estudiante</h3>
                        <p className="text-xs text-white/40 mt-0.5 truncate leading-relaxed">
                            Brecha promedio: {gapData.avgGap} pts · {gapData.highGaps} brechas altas
                        </p>
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-white/30 transition-transform duration-200 flex-shrink-0 ml-3 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`border-t border-white/5 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-5">
                    {/* Summary KPIs */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-white/[0.02] rounded-xl p-3 text-center border border-white/5">
                            <p className="text-xs text-white/40 uppercase font-bold">Brecha Promedio</p>
                            <p className="text-xl font-black text-violet-400">{gapData.avgGap} pts</p>
                        </div>
                        <div className="bg-white/[0.02] rounded-xl p-3 text-center border border-white/5">
                            <p className="text-xs text-white/40 uppercase font-bold">Brecha Máxima</p>
                            <p className="text-xl font-black text-red-400">{gapData.maxGap} pts</p>
                        </div>
                        <div className="bg-white/[0.02] rounded-xl p-3 text-center border border-white/5">
                            <p className="text-xs text-white/40 uppercase font-bold">Brecha Alta (&gt;20)</p>
                            <p className="text-xl font-black text-orange-400">{gapData.highGaps}</p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto rounded-lg">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 z-10">
                                <tr className="text-left" style={{ background: 'rgba(20, 20, 35, 0.95)' }}>
                                    <th className="py-2.5 px-2.5 text-xs font-bold text-white/40 uppercase tracking-wider border-b border-white/5">#</th>
                                    <th className="py-2.5 px-2.5 text-xs font-bold text-white/40 uppercase tracking-wider border-b border-white/5">Nombre</th>
                                    <th className="py-2.5 px-2.5 text-xs font-bold text-white/40 uppercase tracking-wider border-b border-white/5">ID</th>
                                    <th className="py-2.5 px-2.5 text-xs font-bold text-white/40 uppercase tracking-wider border-b border-white/5 hidden lg:table-cell">Depto</th>
                                    <th className="py-2.5 px-2.5 text-xs font-bold text-white/40 uppercase tracking-wider border-b border-white/5 hidden xl:table-cell">Institución</th>
                                    <th className="py-2.5 px-2.5 text-xs font-bold text-white/40 uppercase tracking-wider border-b border-white/5">Global</th>
                                    <th className="py-2.5 px-2.5 text-xs font-bold text-white/40 uppercase tracking-wider border-b border-white/5">Área Fuerte</th>
                                    <th className="py-2.5 px-2.5 text-xs font-bold text-white/40 uppercase tracking-wider border-b border-white/5">Pts</th>
                                    <th className="py-2.5 px-2.5 text-xs font-bold text-white/40 uppercase tracking-wider border-b border-white/5">Área Débil</th>
                                    <th className="py-2.5 px-2.5 text-xs font-bold text-white/40 uppercase tracking-wider border-b border-white/5">Pts</th>
                                    <th className="py-2.5 px-2.5 text-xs font-bold text-white/40 uppercase tracking-wider border-b border-white/5">Brecha</th>
                                    <th className="py-2.5 px-2.5 text-xs font-bold text-white/40 uppercase tracking-wider border-b border-white/5">Nivel</th>
                                    <th className="py-2.5 px-2.5 text-xs font-bold text-white/40 uppercase tracking-wider border-b border-white/5">Riesgo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gapData.results.map((d, i) => {
                                    const niv = clasificarNivel(d.global);
                                    return (
                                        <tr key={i} onClick={() => onStudentClick(d.student)}
                                            className="border-b border-white/[0.03] hover:bg-white/[0.04] cursor-pointer transition-colors">
                                            <td className="py-2.5 px-2.5 text-white/20 font-mono">{i + 1}</td>
                                            <td className="py-2.5 px-2.5 text-white/70 font-bold truncate max-w-[180px]">{studentFullName(d.student, { uppercase: true })}</td>
                                            <td className="py-2.5 px-2.5 text-white/45 font-mono text-[11px]">{studentDocumentId(d.student) || '—'}</td>
                                            <td className="py-2.5 px-2.5 text-white/45 truncate max-w-[120px] hidden lg:table-cell" title={studentDepartamento(d.student)}>{studentDepartamento(d.student) || '—'}</td>
                                            <td className="py-2.5 px-2.5 text-white/45 truncate max-w-[160px] hidden xl:table-cell" title={studentInstitucion(d.student)}>{studentInstitucion(d.student) || '—'}</td>
                                            <td className="py-2.5 px-2.5 text-white/50 font-bold">{d.global}</td>
                                            <td className="py-2.5 px-2.5 text-emerald-400 font-bold">{d.strongest.label}</td>
                                            <td className="py-2.5 px-2.5 text-emerald-400/70">{d.strongest.score}</td>
                                            <td className="py-2.5 px-2.5 text-red-400 font-bold">{d.weakest.label}</td>
                                            <td className="py-2.5 px-2.5 text-red-400/70">{d.weakest.score}</td>
                                            <td className="py-2.5 px-2.5 font-black" style={{ color: d.riesgoColor }}>{d.gap}</td>
                                            <td className="py-2.5 px-2.5">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${niv.badge}`}>{niv.nivel}</span>
                                            </td>
                                            <td className="py-2.5 px-2.5">
                                                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                                                    style={{ background: `${d.riesgoColor}14`, color: d.riesgoColor }}>
                                                    {d.riesgo}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// =
// TAB 2: RANKING
// =
function RankingTab({
    ranking,
    onStudentClick,
    maskDocumentIds = false,
}: {
    ranking: Estudiante[];
    onStudentClick: (e: Estudiante) => void;
    maskDocumentIds?: boolean;
}) {
    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('all');
    const [sortKey, setSortKey] = useState('global');
    const [sortAsc, setSortAsc] = useState(false);

    const filtered = useMemo(() => {
        let list = ranking.filter((e) => matchesStudentSearch(e, search));

        if (levelFilter !== 'all') {
            list = list.filter((s) => getStudentPerformanceLevel(s.puntaje_global || 0).key === levelFilter);
        }

        list.sort((a, b) => {
            if (sortKey === 'name') {
                const na = studentFullName(a);
                const nb = studentFullName(b);
                return sortAsc ? na.localeCompare(nb) : nb.localeCompare(na);
            }
            let va: number;
            let vb: number;
            if (sortKey === 'global') {
                va = a.puntaje_global || 0;
                vb = b.puntaje_global || 0;
            } else {
                va = getStudentSubjectScore(a, sortKey);
                vb = getStudentSubjectScore(b, sortKey);
            }
            return sortAsc ? va - vb : vb - va;
        });

        return list;
    }, [ranking, search, levelFilter, sortKey, sortAsc]);

    const handleSort = (key: string) => {
        if (sortKey === key) setSortAsc(!sortAsc);
        else {
            setSortKey(key);
            setSortAsc(false);
        }
    };

    return (
        <div className={`${T.card} p-6 animate-fade-in`} data-coordinator-theme>
            <div data-coord-tour={TourAnchors.dashboardRankingSearch} className="flex flex-col gap-3 mb-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-400" />
                            Ranking Completo
                        </h3>
                        <p className="text-xs text-white/45 mt-1">
                            {filtered.length} de {ranking.length} estudiantes
                        </p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar nombre, ID, depto o institución…"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            name="coord-search-nofill"
                            className="coord-input-native w-56 max-w-full"
                            style={{ paddingLeft: '2.25rem' }}
                        />
                    </div>
                </div>
                <StudentLevelFilterPills value={levelFilter} onChange={setLevelFilter} />
            </div>

            <CoordinatorStudentListTable
                students={filtered}
                onRowClick={onStudentClick}
                maskDocumentIds={maskDocumentIds}
                sortKey={sortKey}
                sortAsc={sortAsc}
                onSort={handleSort}
                highlightTopRanks
                tourAnchor={TourAnchors.dashboardRankingTable}
            />
        </div>
    );
}

// =
// TAB 4: ALERTAS
// =
function AlertasTab({
    alertas,
    students,
    onStudentClick,
    maskDocumentIds = false,
}: {
    alertas: { critico: AlertaEstudiante[]; alto: AlertaEstudiante[]; moderado: AlertaEstudiante[]; monitoreo: AlertaEstudiante[] };
    students: Estudiante[];
    onStudentClick: (e: Estudiante) => void;
    maskDocumentIds?: boolean;
}) {
    const all = [...alertas.critico, ...alertas.alto, ...alertas.moderado, ...alertas.monitoreo];
    const summary = [
        { nivel: 'CRÍTICO', desc: '<200 pts', count: alertas.critico.length, color: '#ef4444', bg: 'bg-red-500/[0.08]', border: 'border-red-500/20', Icon: AlertCircle },
        { nivel: 'ALTO', desc: '200-250 pts', count: alertas.alto.length, color: '#f97316', bg: 'bg-orange-500/[0.08]', border: 'border-orange-500/20', Icon: AlertTriangle },
        { nivel: 'MODERADO', desc: 'Área <40', count: alertas.moderado.length, color: '#f59e0b', bg: 'bg-amber-500/[0.08]', border: 'border-amber-500/20', Icon: Info },
        { nivel: 'MONITOREO', desc: '250-300 pts', count: alertas.monitoreo.length, color: '#3b82f6', bg: 'bg-blue-500/[0.08]', border: 'border-blue-500/20', Icon: Activity },
    ];

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-coord-tour={TourAnchors.dashboardAlertasSummary}>
                {summary.map(s => (
                    <div key={s.nivel} className={`${s.bg} border ${s.border} rounded-2xl p-5 relative overflow-hidden`}>
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ background: s.color }} />
                        <div className="flex items-start justify-between mb-2">
                            <s.Icon className="w-5 h-5" style={{ color: s.color }} />
                            <span className="text-3xl font-black" style={{ color: s.color }}>{s.count}</span>
                        </div>
                        <div className="text-white text-sm font-bold">{s.nivel}</div>
                        <div className="text-white/60 text-xs">{s.desc}</div>
                    </div>
                ))}
            </div>

            {/* Alerts Table */}
            {all.length === 0 ? (
                <div className={`${T.card} p-12 text-center`}>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                        <Shield className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Sin alertas activas</h3>
                    <p className="text-white/60 text-sm mt-1">Todos los estudiantes están en niveles aceptables</p>
                </div>
            ) : (
                <div className={`${T.card} p-6 overflow-x-auto`} data-coord-tour={TourAnchors.dashboardAlertasTable}>
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-400" />
                        Detalle de Estudiantes en Riesgo ({all.length})
                    </h3>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-white/60 border-b border-white/[0.08]">
                                <th className="pb-3 px-3 text-left text-xs font-semibold">#</th>
                                <th className="pb-3 px-3 text-left text-xs font-semibold">Nivel</th>
                                <th className="pb-3 px-3 text-left text-xs font-semibold">Documento</th>
                                <th className="pb-3 px-3 text-left text-xs font-semibold">Nombre</th>
                                <th className="pb-3 px-3 text-left text-xs font-semibold hidden lg:table-cell">Depto</th>
                                <th className="pb-3 px-3 text-left text-xs font-semibold hidden xl:table-cell">Institución</th>
                                <th className="pb-3 px-3 text-center text-xs font-semibold">Puntaje</th>
                                <th className="pb-3 px-3 text-left text-xs font-semibold">Área Débil</th>
                                <th className="pb-3 px-3 text-center text-xs font-semibold">Brecha</th>
                                <th className="pb-3 px-3 text-left text-xs font-semibold">Recomendación</th>
                            </tr>
                        </thead>
                        <tbody>
                            {all.map((a, i) => {
                                const nivelColor = a.nivel === 'CRÍTICO' ? 'text-red-400 bg-red-500/10' : a.nivel === 'ALTO' ? 'text-orange-400 bg-orange-500/10' : a.nivel === 'MODERADO' ? 'text-amber-400 bg-amber-500/10' : 'text-blue-400 bg-blue-500/10';
                                const matchedStudent = students.find(s => s.informacion_personal?.numero_identificacion === a.id);
                                return (
                                    <tr key={i} onClick={() => matchedStudent && onStudentClick(matchedStudent)}
                                        className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${matchedStudent ? 'cursor-pointer' : ''} ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                                        <td className="py-2.5 px-3 text-white/60">{i + 1}</td>
                                        <td className="py-2.5 px-3"><span className={`text-xs px-2 py-0.5 rounded-full font-bold ${nivelColor}`}>{a.nivel}</span></td>
                                        <td className="py-2.5 px-3 text-white/70 font-mono text-xs">
                                            {displayDocumentId(a.id, maskDocumentIds)}
                                        </td>
                                        <td className="py-2.5 px-3 text-white font-semibold whitespace-nowrap">{(a.nombre || '').toUpperCase()}</td>
                                        <td className="py-2.5 px-3 text-white/60 text-xs truncate max-w-[120px] hidden lg:table-cell" title={matchedStudent ? studentDepartamento(matchedStudent) : ''}>
                                            {matchedStudent ? (studentDepartamento(matchedStudent) || '—') : '—'}
                                        </td>
                                        <td className="py-2.5 px-3 text-white/60 text-xs truncate max-w-[160px] hidden xl:table-cell" title={matchedStudent ? studentInstitucion(matchedStudent) : ''}>
                                            {matchedStudent ? (studentInstitucion(matchedStudent) || '—') : '—'}
                                        </td>
                                        <td className="py-2.5 px-3 text-center text-red-400 font-bold">{a.global}/500</td>
                                        <td className="py-2.5 px-3 text-white/70 capitalize whitespace-nowrap">{a.areaDebil}</td>
                                        <td className="py-2.5 px-3 text-center font-semibold" style={{ color: a.brecha > 0 ? '#fb923c' : '#10b981' }}>{a.brecha > 0 ? `-${Math.round(a.brecha)}` : `+${Math.abs(Math.round(a.brecha))}`}</td>
                                        <td className="py-2.5 px-3 text-white/60 text-xs min-w-[200px]">{a.recomendacion}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// =
// TAB 5: BENCHMARK NACIONAL
// =
function BenchmarkTab({ inst, allInstitutions }: { inst: NonNullable<ReturnType<typeof useCoordinadorDataHook>['myInstitution']>; allInstitutions: ReturnType<typeof useCoordinadorDataHook>['allInstitutions'] }) {
    const areaMap: Record<string, string> = { 'Matemáticas': 'Matematicas', 'Lectura Crítica': 'Lectura', 'Sociales': 'Sociales', 'Ciencias': 'Ciencias', 'Inglés': 'Ingles' };
    const areaColors: Record<string, string> = SG_AREA_HEX_BY_SUBJECT;

    // Percentil global sobre puntaje total (escala ICFES ~0–500)
    const globalPct = estimatePercentile('Global', inst.avg);
    const globalColor = percentileColor(globalPct);

    // SVG Gauge for main percentile
    const gaugeAngle = (globalPct / 100) * 180;

    return (
        <div className="space-y-5">
            {/* === HERO: vista rápida === */}
            <div data-coord-tour={TourAnchors.dashboardBenchmarkHero} className={`${T.card} p-6 animate-card-reveal`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-5">
                    <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-400 animate-float" />
                            ¿Cómo va tu colegio frente al país?
                        </h3>
                        <p className="text-sm text-white/70 mt-2 max-w-xl leading-relaxed">
                            {humanPercentileHeadline(globalPct)}. Comparado con ~9.880 colegios del ICFES Saber 11° 2025.
                        </p>
                    </div>
                    <a href="https://miltonochoa.com.co/web/index.php/2025/11/01/ranking-de-colegios-por-departamentos-2025-calendario-a/"
                        target="_blank" rel="noopener noreferrer"
                        className="flex shrink-0 items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg px-3 py-2 text-xs text-indigo-300 font-bold transition-colors group">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Fuente oficial ICFES</span>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50 group-hover:opacity-100 transition-opacity">
                            <path d="M3 9L9 3M9 3H4M9 3v5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </a>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div
                        data-coord-tour={TourAnchors.dashboardBenchmarkGauge}
                        className="flex flex-col items-center justify-center animate-scale-in"
                    >
                        <svg viewBox="0 0 200 120" className="w-52 h-auto" aria-hidden>
                            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round" />
                            <path d="M 20 100 A 80 80 0 0 1 55 32" fill="none" stroke="#ef444440" strokeWidth="12" strokeLinecap="round" />
                            <path d="M 55 32 A 80 80 0 0 1 100 20" fill="none" stroke="#f59e0b40" strokeWidth="12" strokeLinecap="round" />
                            <path d="M 100 20 A 80 80 0 0 1 145 32" fill="none" stroke="#6366f140" strokeWidth="12" strokeLinecap="round" />
                            <path d="M 145 32 A 80 80 0 0 1 180 100" fill="none" stroke="#10b98140" strokeWidth="12" strokeLinecap="round" />
                            <path d={`M 20 100 A 80 80 0 ${gaugeAngle > 180 ? 1 : 0} 1 ${100 + 80 * Math.cos(Math.PI - (gaugeAngle * Math.PI / 180))} ${100 - 80 * Math.sin(Math.PI - (gaugeAngle * Math.PI / 180))}`}
                                fill="none" stroke={globalColor} strokeWidth="12" strokeLinecap="round"
                                className="animate-gauge"
                                style={{ filter: `drop-shadow(0 0 8px ${globalColor}60)` }} />
                            {(() => {
                                const angle = Math.PI - (gaugeAngle * Math.PI / 180);
                                const nx = 100 + 60 * Math.cos(angle);
                                const ny = 100 - 60 * Math.sin(angle);
                                return <line x1="100" y1="100" x2={nx} y2={ny} stroke="white" strokeWidth="2" strokeLinecap="round" />;
                            })()}
                            <circle cx="100" cy="100" r="4" fill="white" />
                        </svg>
                        <div className="text-center -mt-2 px-2">
                            <p className="text-4xl font-black tabular-nums animate-number-pop" style={{ color: globalColor }}>
                                {globalPct}%
                            </p>
                            <p className="text-xs font-bold text-white/55 mt-1">de colegios del país quedan detrás</p>
                            <p className="text-sm font-semibold mt-2" style={{ color: globalColor }}>
                                {humanPercentileShort(globalPct)}
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <p className="text-xs text-white/55 mb-3">
                            Puntaje y posición por materia · barra = cuántos colegios superas
                        </p>
                        <div
                            data-coord-tour={TourAnchors.dashboardBenchmarkAreaCards}
                            className="grid grid-cols-2 md:grid-cols-3 gap-3"
                        >
                            {[{ label: 'Global', area: 'Global' as const, val: inst.avg, isGlobal: true },
                            ...inst.subjectStats.map(s => ({ label: s.name, area: (areaMap[s.name] || s.name) as keyof typeof NATIONAL_STATS.areas, val: s.avg, isGlobal: false }))
                            ].map((item, i) => {
                                const pct = item.isGlobal
                                    ? estimatePercentile('Global', item.val)
                                    : estimatePercentile(item.area, item.val);
                                const color = percentileColor(pct);
                                return (
                                    <div key={item.label} className={`bg-white/[0.03] rounded-xl p-3.5 border border-white/[0.06] ${T.cardHover} animate-card-reveal`} style={{ animationDelay: `${i * 80}ms` }}>
                                        <p className="text-xs text-white/70 font-bold mb-1">{item.label}</p>
                                        <p className="text-lg font-black text-white tabular-nums">
                                            {typeof item.val === 'number' ? item.val.toFixed(item.isGlobal ? 0 : 1) : item.val}
                                            <span className="ml-1 text-xs font-medium text-white/40">pts</span>
                                        </p>
                                        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden my-2">
                                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                                        </div>
                                        <p className="text-[11px] font-bold leading-snug" style={{ color }}>
                                            Superas al {pct}% · {humanPercentileShort(pct).toLowerCase()}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div data-coord-tour={TourAnchors.dashboardBenchmarkContext}>
            <BenchmarkContextPanel
                inst={inst}
                variant="full"
                simulacroInstitutionCount={allInstitutions.length}
            />
            </div>

            {/* === HORIZONTAL BAR CHART: I === */}
            <div className={`${T.card} p-6 animate-card-reveal animate-delay-200`} data-coord-tour={TourAnchors.dashboardBenchmarkBars}>
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyan-400" />
                    Rendimiento por Competencia vs Referente Nacional
                </h3>
                <p className="text-xs text-white/60 mb-5 leading-relaxed">
                    Cada competencia se contrasta con el promedio nacional ICFES. La barra superior representa su institución y la inferior el referente. La <strong className="text-white">diferencia</strong> cuantifica la brecha en puntos.
                </p>
                <div className="space-y-4">
                    {inst.subjectStats.map((s, i) => {
                        const natKey = areaMap[s.name] || s.name;
                        const natMean = (NATIONAL_STATS.areas as any)[natKey]?.mean || 50;
                        const delta = s.avg - natMean;
                        const pct = estimatePercentile(natKey as any, s.avg);
                        const maxVal = 100;
                        const barColor = areaColors[s.name] || '#6366f1';
                        const instWidth = Math.min((s.avg / maxVal) * 100, 100);
                        const natWidth = Math.min((natMean / maxVal) * 100, 100);

                        return (
                            <div key={s.name} className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300 hover:bg-white/[0.04] animate-card-reveal" style={{ animationDelay: `${i * 100 + 300}ms` }}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: barColor }} />
                                        <span className="text-sm font-bold text-white">{s.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {delta >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                            Diferencia {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full ${pct >= 75 ? 'bg-emerald-500/15' : pct >= 50 ? 'bg-indigo-500/15' : pct >= 25 ? 'bg-amber-500/15' : 'bg-red-500/15'}`}>
                                            <PercentilValue value={pct} size="xs" style={{ color: pct >= 75 ? '#34d399' : pct >= 50 ? '#818cf8' : pct >= 25 ? '#fbbf24' : '#f87171' }} />
                                        </span>
                                    </div>
                                </div>
                                {/* Institution bar */}
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-[10px] text-white/60 w-16 text-right shrink-0 leading-tight">
                                        {inst.name.length > 12 ? 'Institución' : inst.name.substring(0, 10)}
                                    </span>
                                    <div className="flex-1 h-5 bg-white/[0.04] rounded-md overflow-hidden relative">
                                        <div className="h-full rounded-md flex items-center justify-end pr-2 animate-bar-grow"
                                            style={{ width: `${instWidth}%`, background: `linear-gradient(90deg, ${barColor}30, ${barColor})` }}>
                                            <span className="text-xs font-black text-white drop-shadow">{s.avg}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* National bar */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-white/50 w-14 text-right shrink-0">Nacional</span>
                                    <div className="flex-1 h-5 bg-white/[0.04] rounded-md overflow-hidden relative">
                                        <div className="h-full rounded-md flex items-center justify-end pr-2 animate-bar-grow animate-delay-200"
                                            style={{ width: `${natWidth}%`, background: 'linear-gradient(90deg, rgba(148,163,184,0.1), rgba(148,163,184,0.5))' }}>
                                            <span className="text-xs font-bold text-white/70">{natMean.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* === DISTRIBUTION === */}
            <div className={`${T.card} p-6 animate-card-reveal animate-delay-400`}>
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    Mapa de Posicionamiento en la Distribución Nacional
                </h3>
                <p className="text-xs text-white/60 mb-5 leading-relaxed">
                    Visualización del promedio institucional dentro de la curva de distribución ICFES. Las zonas de color representan cuartiles nacionales. La <strong className="text-white">línea vertical</strong> marca su posición exacta.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {inst.subjectStats.map((s, i) => {
                        const natKey = areaMap[s.name] || s.name;
                        const natStats = (NATIONAL_STATS.areas as any)[natKey];
                        if (!natStats) return null;
                        const barColor = areaColors[s.name] || '#6366f1';

                        const percentiles = [
                            { label: 'Percentil 10', val: natStats.p10 },
                            { label: 'Percentil 25', val: natStats.p25 },
                            { label: 'Percentil 50', val: natStats.p50 },
                            { label: 'Percentil 75', val: natStats.p75 },
                            { label: 'Percentil 90', val: natStats.p90 },
                            { label: 'Percentil 95', val: natStats.p95 },
                        ];
                        const min = natStats.p10 - 5;
                        const max = natStats.p95 + 5;
                        const range = max - min;
                        const instPos = ((s.avg - min) / range) * 100;

                        return (
                            <div key={s.name} className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300 animate-card-reveal" style={{ animationDelay: `${i * 100 + 500}ms` }}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-white">{s.name}</span>
                                    <span className="text-xs font-medium" style={{ color: barColor }}>
                                        Institución: <strong>{s.avg}</strong> · Nacional: {natStats.mean.toFixed(1)}
                                    </span>
                                </div>
                                {/* Distribution bar */}
                                <div className="relative h-8 bg-white/[0.03] rounded-lg overflow-visible mb-2">
                                    {/* Quartile zones */}
                                    <div className="absolute inset-0 flex rounded-lg overflow-hidden">
                                        <div className="h-full bg-red-500/10" style={{ width: `${((natStats.p25 - min) / range) * 100}%` }} />
                                        <div className="h-full bg-amber-500/10" style={{ width: `${((natStats.p50 - natStats.p25) / range) * 100}%` }} />
                                        <div className="h-full bg-indigo-500/10" style={{ width: `${((natStats.p75 - natStats.p50) / range) * 100}%` }} />
                                        <div className="h-full bg-emerald-500/10" style={{ width: `${((max - natStats.p75) / range) * 100}%` }} />
                                    </div>
                                    {/* Institution marker */}
                                    <div className="absolute top-0 bottom-0 w-0.5 z-10"
                                        style={{ left: `${Math.min(Math.max(instPos, 2), 98)}%`, background: barColor, boxShadow: `0 0 8px ${barColor}` }}>
                                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                            <span className="text-xs font-black px-1.5 py-0.5 rounded" style={{ background: `${barColor}30`, color: barColor }}>
                                                {s.avg}
                                            </span>
                                        </div>
                                    </div>
                                    {/* National mean marker */}
                                    <div className="absolute top-0 bottom-0 w-px border-l border-dashed border-white/30"
                                        style={{ left: `${((natStats.mean - min) / range) * 100}%` }} />
                                </div>
                                {/* Labels */}
                                <div className="flex justify-between px-0.5">
                                    {percentiles.map(p => (
                                        <div key={p.label} className="text-center">
                                            <span className="text-xs text-white/50 font-mono block">{p.val}</span>
                                            <span className="text-[8px] text-slate-500 leading-tight block max-w-[3rem] mx-auto">{p.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* === ALL INSTITUTIONS RANKING === */}
            <div className={`${T.card} p-6 overflow-x-auto`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        Ranking de Instituciones del Simulacro
                    </h3>
                    <p className="text-xs text-white/60">
                        Comparación entre las instituciones que participaron en este simulacro
                    </p>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-white/60 border-b border-white/[0.08]">
                            <th className="pb-3 px-3 text-left text-xs font-semibold">#</th>
                            <th className="pb-3 px-3 text-left text-xs font-semibold">Institución</th>
                            <th className="pb-3 px-3 text-center text-xs font-semibold">Estudiantes</th>
                            <th className="pb-3 px-3 text-center text-xs font-semibold">Promedio</th>
                            <th className="pb-3 px-3 text-center text-xs font-semibold">Percentil nacional</th>
                            <th className="pb-3 px-3 text-xs font-semibold">Distribución por Nivel</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allInstitutions.map((x, i) => {
                            const iPct = estimatePercentile('Global', x.avg);
                            return (
                                <tr key={x.name} className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${x.name === inst.name ? 'bg-indigo-500/[0.06] border-l-2 border-l-indigo-500' : i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                                    <td className="py-2.5 px-3 text-white/60 font-bold">{i + 1}</td>
                                    <td className="py-2.5 px-3 text-white font-semibold truncate max-w-[220px]">
                                        {x.name === inst.name && <span className="text-indigo-400 mr-1">●</span>}
                                        {x.name}
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-white/70">{x.students.length}</td>
                                    <td className="py-2.5 px-3 text-center">
                                        <span className={`font-bold px-2.5 py-1 rounded-full text-xs ${x.avg >= 400 ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20' : x.avg >= 325 ? 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20' : x.avg >= 250 ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20' : 'bg-red-500/15 text-red-400 ring-1 ring-red-500/20'}`}>
                                            {x.avg}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                        <span className={`inline-block px-2 py-0.5 rounded-full ${iPct >= 75 ? 'bg-emerald-500/15' : iPct >= 50 ? 'bg-indigo-500/15' : iPct >= 25 ? 'bg-amber-500/15' : 'bg-red-500/15'}`}>
                                            <PercentilValue
                                                value={iPct}
                                                size="xs"
                                                style={{ color: iPct >= 75 ? '#34d399' : iPct >= 50 ? '#818cf8' : iPct >= 25 ? '#fbbf24' : '#f87171' }}
                                            />
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-3">
                                        <div className="flex gap-1.5">
                                            <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-md font-semibold">{x.niveles.superior}</span>
                                            <span className="bg-blue-500/10 text-blue-400 text-xs px-2 py-0.5 rounded-md font-semibold">{x.niveles.alto}</span>
                                            <span className="bg-amber-500/10 text-amber-400 text-xs px-2 py-0.5 rounded-md font-semibold">{x.niveles.medio}</span>
                                            <span className="bg-red-500/10 text-red-400 text-xs px-2 py-0.5 rounded-md font-semibold">{x.niveles.bajo}</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

