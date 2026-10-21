'use client';
import { useCoordinadorData as useCoordinadorDataHook } from '@features/coordinador/hooks/useCoordinadorData';
import { useCoordinadorPanelLayout } from '@features/coordinador/hooks/useCoordinadorPanelLayout';
import CoordinadorContextHeader from '@features/coordinador/components/CoordinadorContextHeader';
import { useState, useEffect, useMemo } from 'react';
import {
    getAllStudents as getAllStudentsLive,
    getCoordinatorSummary as getCoordinatorSummaryLive,
} from '@features/simulacro/lib/firestoreService';
import { MATERIAS, type SimSnapshot } from '@features/coordinador/pages/historico/lib/snapshotHelpers';
import { useHistoricoSnapshots } from '@features/coordinador/pages/historico/hooks/useHistoricoSnapshots';

export type UseCoordinadorDataFn = typeof useCoordinadorDataHook;

export type CoordinadorHistoricoFirestore = {
    getCoordinatorSummary: typeof getCoordinatorSummaryLive;
    getAllStudents: typeof getAllStudentsLive;
};
import {
    CoordCard,
    SectionHeader,
    KpiTile,
    EmptyState,
    LoadingState,
    ErrorState,
    TabBar,
} from '@features/coordinador/components/ui';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import { AlertTriangle, Check, Target } from 'lucide-react';

// ═══════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════

function MiniSparkline({ values, color, height = 32 }: { values: number[]; color: string; height?: number }) {
    if (values.length < 2) return null;
    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    const range = max - min || 1;
    const w = 100;
    const points = values.map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = height - ((v - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
    }).join(' ');
    const areaPoints = `0,${height} ${points} ${w},${height}`;
    return (
        <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} className="overflow-visible">
            <defs>
                <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={areaPoints} fill={`url(#spark-${color.replace('#', '')})`} />
            <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {/* Last dot */}
            {values.length > 0 && (() => {
                const lastX = w;
                const lastY = height - ((values[values.length - 1] - min) / range) * (height - 4) - 2;
                return <circle cx={lastX} cy={lastY} r="3" fill={color} stroke="#111" strokeWidth="1.5" />;
            })()}
        </svg>
    );
}

function ProgressBar({ value, max, color, label }: { value: number; max: number; color: string; label?: string }) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="flex items-center gap-2">
            {label && <span className="text-xs text-white/40 w-16 truncate">{label}</span>}
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 1)}%`, background: color }} />
            </div>
            <span className="text-xs font-bold text-white/50 w-8 text-right">{value > 0 ? value.toFixed(0) : '—'}</span>
        </div>
    );
}

// ═══════════════════════════════════════
// Main view (prod + demo landing)
// ═══════════════════════════════════════

export function CoordinadorHistoricoView({
    useCoordinadorData = useCoordinadorDataHook,
    embedDemo = false,
    firestore = {
        getCoordinatorSummary: getCoordinatorSummaryLive,
        getAllStudents: getAllStudentsLive,
    },
}: {
    useCoordinadorData?: UseCoordinadorDataFn;
    embedDemo?: boolean;
    firestore?: CoordinadorHistoricoFirestore;
}) {
    const layout = useCoordinadorPanelLayout(embedDemo);
    const data = useCoordinadorData();
    const inst = data.myInstitution;
    const {
        historicalData,
        loadingHistory,
        loadHistoricalSnapshots,
        mergeCurrentInstitutionSnapshot,
    } = useHistoricoSnapshots(firestore);
    const [selectedMetric, setSelectedMetric] = useState<'avg' | 'median' | 'max' | 'min' | 'tasaAprobacion'>('avg');
    const [selectedSims, setSelectedSims] = useState<Set<string>>(new Set());
    const [simsInitialized, setSimsInitialized] = useState(false);

    useEffect(() => {
        if (!data.currentInstitution || data.availableSimulations.length === 0) return;
        void loadHistoricalSnapshots(data.currentInstitution, data.availableSimulations);
    }, [data.currentInstitution, data.availableSimulations, loadHistoricalSnapshots]);

    useEffect(() => {
        if (!inst || !data.currentSimulation) return;
        mergeCurrentInstitutionSnapshot(data.currentSimulation, inst);
    }, [inst, data.currentSimulation, mergeCurrentInstitutionSnapshot]);

    const allLoadedSimIds = useMemo(
        () => data.availableSimulations.filter((s) => historicalData[s]),
        [data.availableSimulations, historicalData],
    );

    useEffect(() => {
        setSimsInitialized(false);
        setSelectedSims(new Set());
    }, [data.currentInstitution, data.currentSimulation]);

    useEffect(() => {
        if (!simsInitialized && allLoadedSimIds.length > 0) {
            setSelectedSims(new Set(allLoadedSimIds));
            setSimsInitialized(true);
        }
    }, [allLoadedSimIds, simsInitialized]);

    // Filtered by selection
    const simIds = useMemo(() =>
        allLoadedSimIds.filter(s => selectedSims.has(s)),
        [allLoadedSimIds, selectedSims]
    );

    const toggleSim = (simId: string) => {
        setSelectedSims(prev => {
            const next = new Set(prev);
            if (next.has(simId)) next.delete(simId);
            else next.add(simId);
            return next;
        });
    };

    // Computed analytics
    const analytics = useMemo(() => {
        if (simIds.length < 2) return null;
        const first = historicalData[simIds[0]];
        const last = historicalData[simIds[simIds.length - 1]];
        if (!first || !last) return null;

        // Best improving subject
        let bestSubject = { key: '', label: '', delta: -Infinity, color: '' };
        let worstSubject = { key: '', label: '', delta: Infinity, color: '' };
        MATERIAS.forEach(m => {
            const d = (last.subjectAvgs[m.key] || 0) - (first.subjectAvgs[m.key] || 0);
            if (d > bestSubject.delta) bestSubject = { key: m.key, label: m.label, delta: d, color: m.color };
            if (d < worstSubject.delta) worstSubject = { key: m.key, label: m.label, delta: d, color: m.color };
        });

        // Consistency: coefficient of variation across sims
        const avgs = simIds.map(s => historicalData[s]?.avg || 0).filter(v => v > 0);
        const avgOfAvgs = avgs.reduce((a, b) => a + b, 0) / avgs.length;
        const cvVariation = Math.sqrt(avgs.reduce((sum, v) => sum + (v - avgOfAvgs) ** 2, 0) / avgs.length) / avgOfAvgs * 100;

        return {
            globalDelta: last.avg - first.avg,
            approvalDelta: last.tasaAprobacion - first.tasaAprobacion,
            countDelta: last.count - first.count,
            bestSubject, worstSubject,
            consistency: cvVariation,
            avgOfAvgs: Math.round(avgOfAvgs),
        };
    }, [simIds, historicalData]);

    if (data.loading) {
        return <LoadingState message="Cargando histórico de simulacros…" />;
    }

    if (data.error || !inst) {
        return (
            <ErrorState
                message="No fue posible cargar el histórico"
                detail={data.error || 'Sin datos disponibles para tu institución.'}
            />
        );
    }

    const maxPossible = 500;
    const metricLabels: Record<string, string> = { avg: 'Promedio', median: 'Mediana', max: 'Máximo', min: 'Mínimo', tasaAprobacion: '% Aprobación' };

    return (
        <div
            data-coordinator-theme
            className={`${layout.historicoRootClass ?? ''} ${layout.pagePaddingClass} max-w-7xl mx-auto space-y-6 min-w-0`.trim()}
        >
            <CoordinadorContextHeader
                title="Histórico"
                subtitle={`${inst.students.length} estudiantes · tendencias por simulacro`}
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

            {/* ═══ Header ═══ */}
            <div
                className="flex flex-col md:flex-row md:items-end justify-between gap-4"
                data-coord-tour={TourAnchors.historicoHeader}
            >
                <div>
                    <p className="text-xs font-bold tracking-[3px] uppercase mb-2" style={{ color: 'rgba(139,92,246,0.6)' }}>
                        Tendencias Históricas
                    </p>
                    <h1 className="text-2xl font-black coord-text-head">Evolución por Simulacro</h1>
                    <p className="text-sm coord-text-muted mt-0.5">{inst.name} · {simIds.length} simulacros cargados</p>
                </div>
                {simIds.length > 1 && analytics && (
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${analytics.globalDelta >= 0 ? 'bg-green-500/10 text-green-400 border border-green-500/15' : 'bg-red-500/10 text-red-400 border border-red-500/15'}`}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                {analytics.globalDelta >= 0
                                    ? <path d="M3 12L8 4l5 8" />
                                    : <path d="M3 4L8 12l5-8" />
                                }
                            </svg>
                            {analytics.globalDelta >= 0 ? '+' : ''}{analytics.globalDelta} pts total
                        </div>
                    </div>
                )}
            </div>

            {loadingHistory && (
                <div
                    className="flex items-center gap-3 p-4 rounded-xl"
                    style={{
                        background: 'var(--coord-accent-soft)',
                        border: '1px solid rgba(139,92,246,0.2)',
                    }}
                    role="status"
                    aria-live="polite"
                >
                    <div className="coord-spinner" style={{ width: 18, height: 18 }} />
                    <span className="text-xs" style={{ color: 'var(--coord-accent)' }}>
                        Cargando datos de simulacros anteriores…
                    </span>
                </div>
            )}

            {/* ═══ Simulation Selector Checkboxes ═══ */}
            {allLoadedSimIds.length > 1 && (
                <div
                    className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4"
                    data-coord-tour={TourAnchors.historicoControls}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 12l2 2 4-4" />
                            </svg>
                            <span className="text-xs font-bold text-white/80">Selecciona los simulacros a comparar</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSelectedSims(new Set(allLoadedSimIds))}
                                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all border border-purple-500/15">
                                <span className="inline-flex items-center gap-1.5">
                                    <Check className="w-3 h-3" aria-hidden />
                                    Todos
                                </span>
                            </button>
                            <button
                                onClick={() => setSelectedSims(new Set())}
                                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/[0.04] text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all border border-white/[0.06]">
                                Limpiar
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {allLoadedSimIds.map((simId, idx) => {
                            const snap = historicalData[simId];
                            const isSelected = selectedSims.has(simId);
                            const isCurrent = simId === data.currentSimulation;
                            return (
                                <button
                                    key={simId}
                                    onClick={() => toggleSim(simId)}
                                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 border text-left group ${isSelected
                                        ? 'bg-purple-500/10 border-purple-500/25 hover:bg-purple-500/15'
                                        : 'bg-white/[0.01] border-white/[0.05] hover:border-white/[0.12] opacity-50 hover:opacity-80'
                                        }`}>
                                    {/* Checkbox */}
                                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${isSelected
                                        ? 'bg-purple-500 border-purple-400'
                                        : 'bg-white/[0.04] border border-white/[0.15]'
                                        }`}>
                                        {isSelected && (
                                            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 8l3 3 7-7" />
                                            </svg>
                                        )}
                                    </div>
                                    {/* Label */}
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-xs font-bold ${isSelected ? 'text-white/90' : 'text-white/40'}`}>
                                                {simId}
                                            </span>
                                            {isCurrent && (
                                                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                                                    ACTUAL
                                                </span>
                                            )}
                                        </div>
                                        {snap && (
                                            <span className="text-[11px] text-white/25 group-hover:text-white/35 transition-colors">
                                                {snap.count} est. · Prom: {snap.avg} · Aprob: {snap.tasaAprobacion}%
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    {/* Selection summary */}
                    <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                        <span className="text-xs text-white/25">
                            {selectedSims.size} de {allLoadedSimIds.length} simulacros seleccionados
                        </span>
                        {selectedSims.size < 2 && (
                            <span className="text-xs text-amber-400/60 font-medium inline-flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                Selecciona al menos 2 para ver comparativas
                            </span>
                        )}
                    </div>
                </div>
            )}

            {simIds.length <= 1 ? (
                <EmptyState
                    icon={
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 17l6-6 4 4 8-8" />
                            <path d="M17 7h4v4" />
                        </svg>
                    }
                    title="Selecciona al menos 2 simulacros"
                    body={`Las tendencias históricas se mostrarán cuando elijas más de uno. Simulacro actual: ${data.currentSimulation || '—'}.`}
                />
            ) : (
                <>
                    {/* ═══ KPI Summary Cards ═══ */}
                    {analytics && (
                        <div
                            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
                            data-coord-tour={TourAnchors.historicoKpis}
                        >
                            <KpiTile
                                label="Promedio Global"
                                value={analytics.avgOfAvgs}
                                sub={`de ${maxPossible} posibles`}
                                tone="accent"
                                right={
                                    analytics.globalDelta !== 0 && (
                                        <span
                                            className="coord-pill"
                                            data-tone={analytics.globalDelta > 0 ? 'success' : 'danger'}
                                        >
                                            {analytics.globalDelta > 0 ? '↑' : '↓'} {Math.abs(analytics.globalDelta)} pts
                                        </span>
                                    )
                                }
                            />
                            <KpiTile
                                label="Tasa de Aprobación"
                                value={`${historicalData[simIds[simIds.length - 1]]?.tasaAprobacion || 0}%`}
                                sub="último simulacro"
                                tone="success"
                                right={
                                    analytics.approvalDelta !== 0 && (
                                        <span
                                            className="coord-pill"
                                            data-tone={analytics.approvalDelta > 0 ? 'success' : 'danger'}
                                        >
                                            {analytics.approvalDelta > 0 ? '↑' : '↓'} {Math.abs(analytics.approvalDelta)} pp
                                        </span>
                                    )
                                }
                            />
                            <KpiTile
                                label="Mejor Mejora"
                                value={analytics.bestSubject.label}
                                sub={`+${analytics.bestSubject.delta.toFixed(1)} pts promedio`}
                                tone="info"
                            />
                            <KpiTile
                                label="Consistencia"
                                value={
                                    analytics.consistency < 5
                                        ? 'Alta'
                                        : analytics.consistency < 10
                                            ? 'Media'
                                            : 'Baja'
                                }
                                sub={`CV: ${analytics.consistency.toFixed(1)}%`}
                                tone="warning"
                            />
                        </div>
                    )}

                    {/* ═══ LINE + AREA — Score Evolution ═══ */}
                    <div
                        className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden"
                        data-coord-tour={TourAnchors.historicoChartEvolution}
                    >
                        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #8b5cf6, #8b5cf640)' }} />
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-500/10 border border-purple-500/20">
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#a78bfa" strokeWidth="1.5">
                                            <rect x="2" y="8" width="3" height="6" rx="0.5" /><rect x="7" y="5" width="3" height="9" rx="0.5" /><rect x="12" y="2" width="3" height="12" rx="0.5" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Evolución del Puntaje</h3>
                                        <p className="text-xs text-white/30">{metricLabels[selectedMetric]} por simulacro</p>
                                    </div>
                                </div>
                                {/* Metric selector */}
                                <TabBar
                                    value={selectedMetric}
                                    onChange={(v) => setSelectedMetric(v)}
                                    size="sm"
                                    ariaLabel="Métrica a graficar"
                                    options={(['avg', 'median', 'max', 'min', 'tasaAprobacion'] as const).map((m) => ({
                                        value: m,
                                        label: metricLabels[m],
                                    }))}
                                />
                            </div>
                            <div className="flex items-end gap-3" style={{ height: '200px' }}>
                                {simIds.map((simId, idx) => {
                                    const snap = historicalData[simId];
                                    if (!snap) return null;
                                    const val = selectedMetric === 'tasaAprobacion' ? snap[selectedMetric] : snap[selectedMetric];
                                    const maxVal = selectedMetric === 'tasaAprobacion' ? 100 : maxPossible;
                                    const heightPct = (val / maxVal) * 100;
                                    const prev = idx > 0 ? historicalData[simIds[idx - 1]]?.[selectedMetric] || 0 : 0;
                                    const delta = idx > 0 ? val - prev : 0;
                                    const isCurrent = simId === data.currentSimulation;
                                    return (
                                        <div key={simId} className="flex-1 flex flex-col items-center gap-1 group">
                                            {/* Delta badge */}
                                            {idx > 0 && delta !== 0 && (
                                                <span className={`text-xs font-black px-2 py-0.5 rounded-full transition-opacity ${delta > 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                                                    {delta > 0 ? '↑' : '↓'}{selectedMetric === 'tasaAprobacion' ? `${Math.abs(delta)}pp` : Math.abs(delta).toFixed(0)}
                                                </span>
                                            )}
                                            {/* Bar */}
                                            <div className="w-full flex-1 flex items-end">
                                                <div
                                                    className="w-full rounded-t-xl transition-all duration-700 group-hover:brightness-125 relative"
                                                    style={{
                                                        height: `${Math.max(heightPct, 3)}%`,
                                                        background: isCurrent
                                                            ? 'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%)'
                                                            : `linear-gradient(180deg, rgba(139,92,246,${0.2 + (idx / simIds.length) * 0.3}) 0%, rgba(109,40,217,0.15) 100%)`,
                                                        boxShadow: isCurrent ? '0 0 25px rgba(139,92,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
                                                        border: isCurrent ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.05)',
                                                    }}
                                                >
                                                    {isCurrent && (
                                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                                                    )}
                                                </div>
                                            </div>
                                            {/* Score */}
                                            <p className={`text-xs font-black mt-1 ${isCurrent ? 'text-purple-300' : 'text-white'}`}>
                                                {selectedMetric === 'tasaAprobacion' ? `${val}%` : val}
                                            </p>
                                            {/* Label */}
                                            <p className={`text-[11px] font-bold ${isCurrent ? 'text-purple-400' : 'text-white/30'}`}>
                                                {simId}
                                            </p>
                                            <p className="text-[11px] text-white/20">{snap.count} est.</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ═══ Subject Trends with Sparklines ═══ */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden" data-coord-tour={TourAnchors.historicoChartSubjects}>
                        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #60a5fa, #60a5fa40)' }} />
                        <div className="p-6">
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-500/10 border border-blue-500/20">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#60a5fa" strokeWidth="1.5">
                                        <path d="M2 12L6 6l3 4 5-7" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Tendencia por Competencia</h3>
                                    <p className="text-xs text-white/30">Evolución de promedios por materia con mini gráfico</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                {MATERIAS.map(m => {
                                    const values = simIds.map(s => historicalData[s]?.subjectAvgs[m.key] || 0);
                                    const first = values.find(v => v > 0) || 0;
                                    const last = values[values.length - 1] || 0;
                                    const delta = last - first;
                                    const maxVal = Math.max(...values.filter(v => v > 0), 1);

                                    return (
                                        <div key={m.key} className="flex items-center gap-4 py-3 px-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                                            {/* Subject indicator */}
                                            <div className="flex items-center gap-2 w-28 flex-shrink-0">
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                                                <span className="text-xs font-bold" style={{ color: m.color }}>{m.label}</span>
                                            </div>
                                            {/* Values across sims */}
                                            <div className="flex-1 flex items-center gap-2">
                                                {simIds.map((s, idx) => {
                                                    const v = historicalData[s]?.subjectAvgs[m.key] || 0;
                                                    const prevVal = idx > 0 ? (historicalData[simIds[idx - 1]]?.subjectAvgs[m.key] || 0) : 0;
                                                    const d = idx > 0 && prevVal > 0 ? v - prevVal : 0;
                                                    const isCurrent = s === data.currentSimulation;
                                                    return (
                                                        <div key={s} className="flex-1 text-center">
                                                            <span className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-white/60'}`}>
                                                                {v > 0 ? v.toFixed(0) : '—'}
                                                            </span>
                                                            {d !== 0 && (
                                                                <span className={`text-[11px] font-bold ml-0.5 ${d > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                    {d > 0 ? '+' : ''}{d.toFixed(0)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {/* Sparkline */}
                                            <div className="w-24 flex-shrink-0">
                                                <MiniSparkline values={values.filter(v => v > 0)} color={m.color} height={28} />
                                            </div>
                                            {/* Total delta */}
                                            <div className="w-16 flex-shrink-0 text-right">
                                                {first > 0 && last > 0 ? (
                                                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg inline-block ${delta > 0 ? 'bg-green-500/10 text-green-400' : delta < 0 ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-white/30'}`}>
                                                        {delta > 0 ? '↑' : delta < 0 ? '↓' : '='}{Math.abs(delta).toFixed(0)}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-white/20">—</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Column labels */}
                            <div className="flex items-center gap-4 mt-2 pl-3">
                                <div className="w-28 flex-shrink-0" />
                                <div className="flex-1 flex items-center gap-2">
                                    {simIds.map(s => (
                                        <div key={s} className="flex-1 text-center">
                                            <span className={`text-[11px] font-bold ${s === data.currentSimulation ? 'text-purple-400' : 'text-white/20'}`}>
                                                {s}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="w-24 flex-shrink-0" />
                                <div className="w-16 flex-shrink-0 text-right">
                                    <span className="text-[11px] text-white/20 font-bold">Δ Total</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══ Distribution Evolution ═══ */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden" data-coord-tour={TourAnchors.historicoChartLevels}>
                        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #34d399, #34d39940)' }} />
                        <div className="p-6">
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#34d399" strokeWidth="1.5">
                                        <rect x="1" y="10" width="3" height="4" rx="0.5" /><rect x="5" y="6" width="3" height="8" rx="0.5" />
                                        <rect x="9" y="3" width="3" height="11" rx="0.5" /><rect x="13" y="7" width="3" height="7" rx="0.5" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Evolución de Niveles de Desempeño</h3>
                                    <p className="text-xs text-white/30">Distribución de estudiantes por categoría en cada simulacro</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {([
                                    { key: 'superior', label: 'Superior', color: '#34d399', range: '≥ 400' },
                                    { key: 'alto', label: 'Alto', color: '#60a5fa', range: '325-399' },
                                    { key: 'medio', label: 'Medio', color: '#fbbf24', range: '250-324' },
                                    { key: 'bajo', label: 'Bajo', color: '#ef4444', range: '< 250' },
                                ] as const).map(nivel => {
                                    const values = simIds.map(s => {
                                        const d = historicalData[s];
                                        if (!d) return 0;
                                        return Math.round((d.niveles[nivel.key] / d.count) * 100);
                                    });
                                    const last = values[values.length - 1] || 0;
                                    const first = values[0] || 0;
                                    const delta = last - first;
                                    return (
                                        <div key={nivel.key} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ background: nivel.color }} />
                                                    <span className="text-xs font-bold" style={{ color: nivel.color }}>{nivel.label}</span>
                                                </div>
                                                <span className="text-[11px] text-white/20 font-mono">{nivel.range}</span>
                                            </div>
                                            <p className="text-2xl font-black text-white mb-1">{last}%</p>
                                            {delta !== 0 && (
                                                <p className={`text-xs font-bold ${delta > 0 && nivel.key !== 'bajo' ? 'text-green-400' : delta < 0 && nivel.key === 'bajo' ? 'text-green-400' : delta > 0 && nivel.key === 'bajo' ? 'text-red-400' : 'text-red-400'}`}>
                                                    {delta > 0 ? '↑' : '↓'} {Math.abs(delta)}pp vs primer simulacro
                                                </p>
                                            )}
                                            <div className="mt-3">
                                                <MiniSparkline values={values} color={nivel.color} height={24} />
                                            </div>
                                            {/* Per-sim values */}
                                            <div className="flex items-center gap-1 mt-2">
                                                {simIds.map((s, i) => (
                                                    <div key={s} className="flex-1 text-center">
                                                        <span className={`text-[11px] font-bold ${s === data.currentSimulation ? 'text-white/60' : 'text-white/25'}`}>
                                                            {values[i]}%
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ═══ Subject Strength Comparison (last vs first sim) ═══ */}
                    {analytics && simIds.length >= 2 && (
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                            <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #fbbf24, #fbbf2440)' }} />
                            <div className="p-6">
                                <div className="flex items-center gap-2.5 mb-5">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-yellow-500/10 border border-yellow-500/20">
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fbbf24" strokeWidth="1.5">
                                            <path d="M8 1l2 4 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1z" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Comparación por Materia: Primer vs Último Simulacro</h3>
                                        <p className="text-xs text-white/30">Progreso visual por competencia</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {MATERIAS.map(m => {
                                        const firstVal = historicalData[simIds[0]]?.subjectAvgs[m.key] || 0;
                                        const lastVal = historicalData[simIds[simIds.length - 1]]?.subjectAvgs[m.key] || 0;
                                        const delta = lastVal - firstVal;
                                        const maxBar = 100;
                                        return (
                                            <div key={m.key} className="flex items-center gap-4">
                                                <div className="w-24 flex-shrink-0 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                                                    <span className="text-[11px] font-bold" style={{ color: m.color }}>{m.label}</span>
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    {/* First sim bar */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] text-white/20 w-12 text-right font-mono">{simIds[0]}</span>
                                                        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                            <div className="h-full rounded-full" style={{ width: `${(firstVal / maxBar) * 100}%`, background: `${m.color}50` }} />
                                                        </div>
                                                        <span className="text-xs font-bold text-white/40 w-8">{firstVal > 0 ? firstVal.toFixed(0) : '—'}</span>
                                                    </div>
                                                    {/* Last sim bar */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] text-purple-400 w-12 text-right font-mono">{simIds[simIds.length - 1]}</span>
                                                        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                            <div className="h-full rounded-full" style={{ width: `${(lastVal / maxBar) * 100}%`, background: m.color }} />
                                                        </div>
                                                        <span className="text-xs font-bold text-white/70 w-8">{lastVal > 0 ? lastVal.toFixed(0) : '—'}</span>
                                                    </div>
                                                </div>
                                                {/* Delta */}
                                                <div className="w-16 flex-shrink-0 text-right">
                                                    {firstVal > 0 && lastVal > 0 ? (
                                                        <span className={`text-xs font-black px-2 py-0.5 rounded-lg inline-block ${delta > 0 ? 'bg-green-500/10 text-green-400' : delta < 0 ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-white/30'}`}>
                                                            {delta > 0 ? '+' : ''}{delta.toFixed(0)}
                                                        </span>
                                                    ) : <span className="text-xs text-white/20">—</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ KPI Comparison Table ═══ */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #f472b6, #f472b640)' }} />
                        <div className="p-6">
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-pink-500/10 border border-pink-500/20">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#f472b6" strokeWidth="1.5">
                                        <rect x="2" y="2" width="12" height="12" rx="2" /><path d="M2 6h12M6 2v12" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Tabla Comparativa de KPIs</h3>
                                    <p className="text-xs text-white/30">Indicadores clave por simulacro en una vista consolidada</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="coord-table">
                                    <thead>
                                        <tr>
                                            <th>Simulacro</th>
                                            <th style={{ textAlign: 'center' }}>N</th>
                                            <th style={{ textAlign: 'center' }}>Prom.</th>
                                            <th style={{ textAlign: 'center' }}>Med.</th>
                                            <th style={{ textAlign: 'center' }}>σ</th>
                                            <th style={{ textAlign: 'center' }}>Máx</th>
                                            <th style={{ textAlign: 'center' }}>Mín</th>
                                            <th style={{ textAlign: 'center' }}>Aprob.</th>
                                            <th style={{ textAlign: 'center', color: 'var(--coord-level-superior)' }}>Sup.</th>
                                            <th style={{ textAlign: 'center', color: 'var(--coord-level-alto)' }}>Alto</th>
                                            <th style={{ textAlign: 'center', color: 'var(--coord-level-medio)' }}>Med.</th>
                                            <th style={{ textAlign: 'center', color: 'var(--coord-level-bajo)' }}>Bajo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {simIds.map((simId, idx) => {
                                            const snap = historicalData[simId];
                                            if (!snap) return null;
                                            const isCurrent = simId === data.currentSimulation;
                                            const prevData = idx > 0 ? historicalData[simIds[idx - 1]] : null;
                                            const avgDelta = prevData ? snap.avg - prevData.avg : 0;
                                            return (
                                                <tr key={simId} data-current={isCurrent || undefined}>
                                                    <td>
                                                        <div className="flex items-center gap-2">
                                                            {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" aria-hidden />}
                                                            <span
                                                                className="font-bold"
                                                                style={{
                                                                    color: isCurrent
                                                                        ? 'var(--coord-accent)'
                                                                        : 'var(--coord-text-secondary)',
                                                                }}
                                                            >
                                                                {simId}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }} className="coord-text-muted">{snap.count}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className="font-bold coord-text-head">{snap.avg}</span>
                                                        {avgDelta !== 0 && (
                                                            <span
                                                                className="text-[11px] font-bold ml-1"
                                                                style={{
                                                                    color: avgDelta > 0 ? 'var(--coord-success)' : 'var(--coord-danger)',
                                                                }}
                                                            >
                                                                {avgDelta > 0 ? '+' : ''}{avgDelta}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }} className="coord-text-body">{snap.median}</td>
                                                    <td style={{ textAlign: 'center' }} className="coord-text-muted">{snap.stdDev}</td>
                                                    <td style={{ textAlign: 'center', color: 'var(--coord-success)' }}>{snap.max}</td>
                                                    <td style={{ textAlign: 'center', color: 'var(--coord-danger)' }}>{snap.min}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span
                                                            className="coord-pill"
                                                            data-tone={
                                                                snap.tasaAprobacion >= 70
                                                                    ? 'success'
                                                                    : snap.tasaAprobacion >= 50
                                                                        ? 'info'
                                                                        : 'danger'
                                                            }
                                                        >
                                                            {snap.tasaAprobacion}%
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'center', color: 'var(--coord-level-superior)' }} className="font-bold">{snap.niveles.superior}</td>
                                                    <td style={{ textAlign: 'center', color: 'var(--coord-level-alto)' }} className="font-bold">{snap.niveles.alto}</td>
                                                    <td style={{ textAlign: 'center', color: 'var(--coord-level-medio)' }} className="font-bold">{snap.niveles.medio}</td>
                                                    <td style={{ textAlign: 'center', color: 'var(--coord-level-bajo)' }} className="font-bold">{snap.niveles.bajo}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* ═══ Insights & Recommendations ═══ */}
                    {analytics && (
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                            <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #8b5cf6, #8b5cf640)' }} />
                            <div className="p-6">
                                <div className="flex items-center gap-2.5 mb-5">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-500/10 border border-purple-500/20">
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#a78bfa" strokeWidth="1.5">
                                            <circle cx="8" cy="6" r="4" /><path d="M5.5 10v2.5a2.5 2.5 0 005 0V10" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Insights Automáticos</h3>
                                        <p className="text-xs text-white/30">Análisis generado a partir de los datos históricos</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Trend insight */}
                                    <div className={`p-4 rounded-xl border ${analytics.globalDelta >= 0 ? 'bg-green-500/[0.04] border-green-500/10' : 'bg-red-500/[0.04] border-red-500/10'}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-sm ${analytics.globalDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {analytics.globalDelta >= 0 ? '+' : '-'}
                                            </span>
                                            <span className="text-xs font-bold text-white">Tendencia General</span>
                                        </div>
                                        <p className="text-[11px] text-white/50 leading-relaxed">
                                            {analytics.globalDelta >= 0
                                                ? `El promedio global ha mejorado ${analytics.globalDelta} puntos entre el primer y último simulacro. La tendencia es positiva.`
                                                : `El promedio global ha disminuido ${Math.abs(analytics.globalDelta)} puntos. Se recomienda revisar las estrategias de preparación.`
                                            }
                                        </p>
                                    </div>
                                    {/* Best subject */}
                                    <div className="p-4 rounded-xl border bg-blue-500/[0.04] border-blue-500/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm">&#9733;</span>
                                            <span className="text-xs font-bold text-white">Mayor Mejora</span>
                                        </div>
                                        <p className="text-[11px] text-white/50 leading-relaxed">
                                            <span className="font-bold" style={{ color: analytics.bestSubject.color }}>{analytics.bestSubject.label}</span> es la competencia con mayor mejora
                                            (+{analytics.bestSubject.delta.toFixed(1)} pts). Es una fortaleza que se puede capitalizar.
                                        </p>
                                    </div>
                                    {/* Worst subject */}
                                    <div className="p-4 rounded-xl border bg-orange-500/[0.04] border-orange-500/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm">&#9888;</span>
                                            <span className="text-xs font-bold text-white">Área de Oportunidad</span>
                                        </div>
                                        <p className="text-[11px] text-white/50 leading-relaxed">
                                            <span className="font-bold" style={{ color: analytics.worstSubject.color }}>{analytics.worstSubject.label}</span> es la competencia con
                                            {analytics.worstSubject.delta < 0 ? ` mayor retroceso (${analytics.worstSubject.delta.toFixed(1)} pts)` : ` menor mejora (+${analytics.worstSubject.delta.toFixed(1)} pts)`}.
                                            Requiere atención prioritaria.
                                        </p>
                                    </div>
                                    {/* Consistency */}
                                    <div className="p-4 rounded-xl border bg-purple-500/[0.04] border-purple-500/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="w-4 h-4 text-purple-300" aria-hidden />
                                            <span className="text-xs font-bold text-white">Consistencia</span>
                                        </div>
                                        <p className="text-[11px] text-white/50 leading-relaxed">
                                            {analytics.consistency < 5
                                                ? 'Los resultados son muy consistentes entre simulacros, lo que indica estabilidad en la preparación.'
                                                : analytics.consistency < 10
                                                    ? 'Los resultados muestran variabilidad moderada. Hay simulacros con rendimiento significativamente diferente.'
                                                    : 'Alta variabilidad entre simulacros. Los resultados fluctúan considerablemente, sugiriendo inconsistencia en la preparación.'
                                            }
                                            <span className="text-white/30"> (CV: {analytics.consistency.toFixed(1)}%)</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
