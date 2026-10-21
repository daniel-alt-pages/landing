'use client';

import { useEffect, useMemo, useState } from 'react';
import AnimateIn from '@shared/components/animations/AnimateIn';
import AreaComparisonView from './AreaComparisonView';

type MateriaMeta = { key: string; label: string; color: string };

type StudentSimSnapshot = {
    puntaje_global?: number;
    puntajes?: Record<string, { puntaje?: number } | number>;
};

function getSubjectScore(data: StudentSimSnapshot | undefined, materiaKey: string): number {
    if (!data?.puntajes) return 0;
    const p = data.puntajes[materiaKey];
    if (p == null) return 0;
    return typeof p === 'object' ? p.puntaje || 0 : Number(p) || 0;
}

/** Simulacro con puntaje global y las 5 áreas calificadas (> 0). */
export function hasCompleteSimResults(
    data: StudentSimSnapshot | undefined,
    materiaKeys: string[],
): boolean {
    if (!data?.puntaje_global || data.puntaje_global <= 0) return false;
    return materiaKeys.every((key) => getSubjectScore(data, key) > 0);
}

/** Entrada visible en histórico (más permisivo que hasCompleteSimResults). */
function hasHistoricoEntry(
    data: StudentSimSnapshot | undefined,
    materiaKeys: string[],
): boolean {
    if (!data) return false;
    if ((data.puntaje_global ?? 0) > 0) return true;
    return materiaKeys.some((key) => getSubjectScore(data, key) > 0);
}

function buildScaleTicks(max: number, step: number): number[] {
    const ticks: number[] = [];
    for (let v = max; v >= 0; v -= step) ticks.push(v);
    return ticks;
}

function TrendLineChart({
    simIds,
    values,
    maxValue,
    accent = '#6366f1',
    currentSim,
}: {
    simIds: string[];
    values: number[];
    maxValue: number;
    accent?: string;
    currentSim: string | null;
}) {
    const vbW = 480;
    const plotChartH = 160;
    const labelBlockH = 54;
    const vbH = plotChartH + labelBlockH;
    const tickStep = maxValue >= 500 ? 50 : 10;
    const ticks = buildScaleTicks(maxValue, tickStep);
    const plot = { l: 40, r: 16, t: 14, b: 12 };
    const xInset = values.length <= 5 ? 10 : 8;
    const plotW = vbW - plot.l - plot.r;
    const plotH = plotChartH - plot.t - plot.b;
    const baselineY = plot.t + plotH;
    const n = values.length;
    const scoreFont = n >= 8 ? 11 : 12;
    const deltaFont = n >= 8 ? 8.5 : 9;
    const simFont = n >= 8 ? 7.5 : 8.5;

    const toY = (v: number) => plot.t + plotH * (1 - v / maxValue);
    const toX = (i: number) => plot.l + xInset + (i / Math.max(n - 1, 1)) * (plotW - xInset * 2);

    const points = values.map((v, i) => ({
        x: toX(i),
        y: toY(v),
        v,
        simId: simIds[i],
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1]?.x.toFixed(2) ?? plot.l} ${baselineY} L ${points[0]?.x.toFixed(2) ?? plot.l} ${baselineY} Z`;
    const gradId = `stn-line-${accent.replace('#', '')}`;

    return (
        <div className="w-full">
            <svg
                viewBox={`0 0 ${vbW} ${vbH}`}
                className="w-full h-auto block"
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label={`Curva de evolución de puntajes entre ${simIds.length} simulacros`}
            >
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={accent} stopOpacity="0.38" />
                        <stop offset="100%" stopColor={accent} stopOpacity="0.04" />
                    </linearGradient>
                </defs>

                {ticks.map((tick) => {
                    const y = toY(tick);
                    const isBaseline = tick === 0;
                    const isTop = tick === maxValue;
                    return (
                        <g key={tick}>
                            <line
                                x1={plot.l}
                                y1={y}
                                x2={vbW - plot.r}
                                y2={y}
                                stroke={isBaseline ? '#94a3b8' : isTop ? '#cbd5e1' : '#e2e8f0'}
                                strokeWidth={isBaseline || isTop ? 1.1 : 0.85}
                                vectorEffect="non-scaling-stroke"
                            />
                            <text
                                x={plot.l - 6}
                                y={y + 3}
                                textAnchor="end"
                                fill="#475569"
                                style={{ fontSize: 9, fontWeight: 700 }}
                            >
                                {tick}
                            </text>
                        </g>
                    );
                })}

                <path d={areaPath} fill={`url(#${gradId})`} />
                <path
                    d={linePath}
                    fill="none"
                    stroke={accent}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />

                {points.map((p) => {
                    const isCurrent = p.simId === currentSim;
                    return (
                        <g key={p.simId}>
                            {isCurrent ? (
                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r="7"
                                    fill={accent}
                                    fillOpacity="0.16"
                                    vectorEffect="non-scaling-stroke"
                                />
                            ) : null}
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r={isCurrent ? 5 : 4}
                                fill={isCurrent ? accent : 'white'}
                                stroke={accent}
                                strokeWidth={isCurrent ? 0 : 2}
                                vectorEffect="non-scaling-stroke"
                            />
                        </g>
                    );
                })}

                <line
                    x1={plot.l}
                    y1={plotChartH + 4}
                    x2={vbW - plot.r}
                    y2={plotChartH + 4}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                />

                {points.map((p, idx) => {
                    const prev = idx > 0 ? values[idx - 1] : 0;
                    const delta = idx > 0 ? p.v - prev : 0;
                    const isCurrent = p.simId === currentSim;
                    const scoreY = plotChartH + 18;
                    const deltaY = plotChartH + 30;
                    const simY = plotChartH + 44;

                    return (
                        <g key={`label-${p.simId}`}>
                            <title>{`${p.simId}: ${p.v} pts${delta !== 0 ? ` (${delta > 0 ? '+' : ''}${delta})` : ''}`}</title>
                            <text
                                x={p.x}
                                y={scoreY}
                                textAnchor="middle"
                                fill={isCurrent ? '#4338ca' : '#0f172a'}
                                style={{ fontSize: scoreFont, fontWeight: 900 }}
                            >
                                {p.v}
                            </text>
                            {delta !== 0 ? (
                                <text
                                    x={p.x}
                                    y={deltaY}
                                    textAnchor="middle"
                                    fill={delta > 0 ? '#047857' : '#e11d48'}
                                    style={{ fontSize: deltaFont, fontWeight: 700 }}
                                >
                                    {delta > 0 ? '+' : ''}
                                    {delta}
                                </text>
                            ) : (
                                <text
                                    x={p.x}
                                    y={deltaY}
                                    textAnchor="middle"
                                    fill="transparent"
                                    style={{ fontSize: deltaFont }}
                                    aria-hidden
                                >
                                    ·
                                </text>
                            )}
                            <text
                                x={p.x}
                                y={simY}
                                textAnchor="middle"
                                fill={isCurrent ? '#4f46e5' : '#475569'}
                                style={{ fontSize: simFont, fontWeight: 700 }}
                            >
                                {p.simId.length > 9 && n >= 7
                                    ? p.simId.replace(/^SG11-/, '')
                                    : p.simId}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

function DeltaBadge({ delta, size = 'sm' }: { delta: number; size?: 'sm' | 'xs' }) {
    const cls = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';
    if (delta === 0) {
        return <span className={`${cls} inline-flex rounded-full bg-slate-100 text-slate-500 font-bold`}>Sin cambio</span>;
    }
    const up = delta > 0;
    return (
        <span
            className={`${cls} inline-flex items-center gap-1 rounded-full font-bold ${
                up ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
            }`}
        >
            {up ? '↑' : '↓'} {Math.abs(delta)} pts
        </span>
    );
}

export default function StudentScoreHistoryPanel({
    historicalData,
    simulacrosDelEstudiante,
    simulacroActual,
    materias,
}: {
    historicalData: Record<string, StudentSimSnapshot>;
    simulacrosDelEstudiante: string[];
    simulacroActual: string | null;
    materias: MateriaMeta[];
}) {
    const materiaKeys = useMemo(() => materias.map((m) => m.key), [materias]);

    const loadedSimIds = useMemo(
        () =>
            simulacrosDelEstudiante.filter((s) =>
                hasHistoricoEntry(historicalData[s], materiaKeys),
            ),
        [simulacrosDelEstudiante, historicalData, materiaKeys],
    );

    const historyPending =
        simulacrosDelEstudiante.length >= 2 &&
        Object.keys(historicalData).length === 0;

    const [selectedSims, setSelectedSims] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'global' | 'areas'>('global');

    useEffect(() => {
        if (loadedSimIds.length === 0) return;
        setSelectedSims(new Set(loadedSimIds));
    }, [loadedSimIds.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

    const simIds = useMemo(
        () => loadedSimIds.filter((s) => selectedSims.has(s)),
        [loadedSimIds, selectedSims],
    );

    const analytics = useMemo(() => {
        if (simIds.length < 2) return null;
        const first = historicalData[simIds[0]];
        const last = historicalData[simIds[simIds.length - 1]];
        if (!first || !last) return null;
        const globalDelta = (last.puntaje_global || 0) - (first.puntaje_global || 0);
        const firstGlobal = first.puntaje_global || 0;
        const lastGlobal = last.puntaje_global || 0;
        let best = { label: '', delta: -Infinity, color: '#6366f1' };
        let worst = { label: '', delta: Infinity, color: '#6366f1' };
        materias.forEach((m) => {
            const d = getSubjectScore(last, m.key) - getSubjectScore(first, m.key);
            if (d > best.delta) best = { label: m.label, delta: d, color: m.color };
            if (d < worst.delta) worst = { label: m.label, delta: d, color: m.color };
        });
        return { globalDelta, firstGlobal, lastGlobal, best, worst };
    }, [simIds, historicalData, materias]);

    const globalValues = useMemo(
        () => simIds.map((s) => historicalData[s]?.puntaje_global || 0),
        [simIds, historicalData],
    );

    const areaSeries = useMemo(
        () =>
            materias.map((m) => ({
                key: m.key,
                label: m.label,
                color: m.color,
                values: simIds.map((s) => getSubjectScore(historicalData[s], m.key)),
            })),
        [simIds, historicalData, materias],
    );

    const toggleSim = (simId: string) => {
        setSelectedSims((prev) => {
            const next = new Set(prev);
            if (next.has(simId)) next.delete(simId);
            else next.add(simId);
            return next;
        });
    };

    if (simulacrosDelEstudiante.length < 2) {
        return null;
    }

    return (
        <AnimateIn type="fadeUp" delay={0.12}>
            <section
                id="historico-puntajes"
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden scroll-mt-24"
            >
                {/* Header — compacto, ~1/5 visual */}
                <div className="relative bg-gradient-to-r from-indigo-50/90 via-white to-violet-50/60 px-4 sm:px-6 py-4 border-b border-slate-200">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Tu evolución</p>
                                <h2 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight leading-tight">
                                    Histórico de puntajes
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed hidden sm:block">
                                    Compara simulacros y revisa tu progreso global o por área.
                                </p>
                            </div>
                        </div>
                        {analytics ? (
                            <div className="flex items-center gap-3 shrink-0 sm:ml-auto">
                                <DeltaBadge delta={analytics.globalDelta} />
                                <p className="text-xs text-slate-600 font-semibold tabular-nums whitespace-nowrap">
                                    {analytics.firstGlobal} → {analytics.lastGlobal}
                                </p>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                    {historyPending ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center">
                            <p className="text-sm font-semibold text-slate-700">Cargando tu historial…</p>
                            <p className="text-xs text-slate-500 mt-1">Consultando puntajes de simulacros anteriores.</p>
                        </div>
                    ) : loadedSimIds.length < 2 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
                            <p className="text-sm font-semibold text-slate-700">Aún no hay suficientes puntajes para comparar</p>
                            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                                Necesitas resultados en al menos dos simulacros para ver la curva de evolución.
                            </p>
                        </div>
                    ) : null}

                    {loadedSimIds.length >= 2 ? (
                    <>
                    {/* Selector — grid proporcional */}
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Simulacros</p>
                            <div className="flex gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setSelectedSims(new Set(loadedSimIds))}
                                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                                >
                                    Todos
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedSims(new Set())}
                                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                                >
                                    Limpiar
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {loadedSimIds.map((simId) => {
                                const snap = historicalData[simId];
                                const isSelected = selectedSims.has(simId);
                                const isCurrent = simId === simulacroActual;
                                return (
                                    <button
                                        key={simId}
                                        type="button"
                                        onClick={() => toggleSim(simId)}
                                        className={`rounded-lg border px-2 py-1.5 text-left transition-colors duration-150 ${
                                            isSelected
                                                ? 'border-indigo-300 bg-indigo-50/90 ring-1 ring-indigo-200'
                                                : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <span className="text-[10px] font-bold text-slate-800 truncate leading-tight">{simId}</span>
                                            <span
                                                className={`h-3.5 w-3.5 shrink-0 rounded flex items-center justify-center ${
                                                    isSelected ? 'bg-indigo-500 text-white' : 'border border-slate-200 bg-white'
                                                }`}
                                            >
                                                {isSelected ? (
                                                    <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                                                        <path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                ) : null}
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <p className={`text-sm font-black tabular-nums leading-none ${isSelected ? 'text-indigo-700' : 'text-slate-900'}`}>
                                                {snap?.puntaje_global ?? '—'}
                                            </p>
                                            <p className="text-[9px] text-slate-400 font-medium">pts</p>
                                        </div>
                                        {isCurrent ? (
                                            <span className="inline-block mt-0.5 text-[8px] font-bold uppercase text-cyan-700 bg-cyan-100 px-1 py-px rounded">
                                                Actual
                                            </span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedSims.size < 2 ? (
                            <p className="text-[11px] text-amber-800 font-medium mt-2.5 flex items-center gap-1.5 bg-amber-50 rounded-lg px-2.5 py-2 border border-amber-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Selecciona al menos 2 simulacros.
                            </p>
                        ) : null}
                    </div>

                    {simIds.length >= 2 ? (
                        <>
                            {/* Panel unificado: tabs + chart */}
                            <div className={`rounded-xl border border-slate-200 bg-slate-50/40 ${viewMode === 'global' ? 'overflow-hidden' : ''}`}>
                                <div className="grid grid-cols-2 border-b border-slate-200 bg-white">
                                    {(
                                        [
                                            { id: 'global' as const, label: 'Puntaje global', sub: '0 – 500' },
                                            { id: 'areas' as const, label: 'Por área', sub: '0 – 100' },
                                        ] as const
                                    ).map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setViewMode(tab.id)}
                                            className={`px-3 py-2.5 text-left transition-colors border-b-2 -mb-px ${
                                                viewMode === tab.id
                                                    ? 'border-indigo-600 bg-indigo-50/50'
                                                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                            }`}
                                        >
                                            <p className={`text-xs sm:text-sm font-bold ${viewMode === tab.id ? 'text-indigo-800' : 'text-slate-700'}`}>
                                                {tab.label}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-medium">{tab.sub}</p>
                                        </button>
                                    ))}
                                </div>

                                <div className={`${viewMode === 'areas' ? 'p-4 sm:p-6 lg:p-7' : 'p-3 sm:p-4 lg:px-3 lg:py-5'} bg-white`}>
                                    {viewMode === 'global' ? (
                                        <>
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-bold text-slate-600">Curva de evolución</p>
                                                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                    {simIds.length} simulacros
                                                </span>
                                            </div>
                                            <TrendLineChart
                                                simIds={simIds}
                                                values={globalValues}
                                                maxValue={500}
                                                currentSim={simulacroActual}
                                            />
                                        </>
                                    ) : (
                                        <AreaComparisonView
                                            simIds={simIds}
                                            series={areaSeries}
                                            currentSim={simulacroActual}
                                        />
                                    )}
                                </div>

                                {analytics && viewMode === 'global' ? (
                                    <div className="flex border-t border-slate-200 bg-slate-50/60 divide-x divide-slate-200">
                                        <div className="flex-1 min-w-0 px-3 py-2.5">
                                            <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-700">Mejor área</p>
                                            <p className="text-xs sm:text-sm font-black truncate" style={{ color: analytics.best.color }}>
                                                {analytics.best.label || '—'}
                                            </p>
                                            {analytics.best.delta !== -Infinity ? (
                                                <p className="text-[10px] text-emerald-600 font-bold tabular-nums">+{analytics.best.delta} pts</p>
                                            ) : null}
                                        </div>
                                        <div className="flex-1 min-w-0 px-3 py-2.5">
                                            <p className="text-[9px] font-bold uppercase tracking-wide text-amber-700">Reforzar</p>
                                            <p className="text-xs sm:text-sm font-black truncate" style={{ color: analytics.worst.color }}>
                                                {analytics.worst.label || '—'}
                                            </p>
                                            {analytics.worst.delta !== Infinity ? (
                                                <p className="text-[10px] text-rose-600 font-bold tabular-nums">
                                                    {analytics.worst.delta > 0 ? '+' : ''}{analytics.worst.delta} pts
                                                </p>
                                            ) : null}
                                        </div>
                                        <div className="flex-1 min-w-0 px-3 py-2.5">
                                            <p className="text-[9px] font-bold uppercase tracking-wide text-indigo-700">Comparados</p>
                                            <p className="text-lg font-black text-slate-900 tabular-nums leading-tight">{simIds.length}</p>
                                            <p className="text-[10px] text-slate-500">simulacros</p>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </>
                    ) : null}
                    </>
                    ) : null}
                </div>
            </section>
        </AnimateIn>
    );
}
