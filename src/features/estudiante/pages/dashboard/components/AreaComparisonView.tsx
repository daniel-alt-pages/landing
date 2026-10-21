'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type AreaSeries = { key: string; label: string; color: string; values: number[] };
type DetailTab = 'sim' | 'table' | 'ranking';

function areaDelta(values: number[]) {
    const first = values.find((v) => v > 0) ?? 0;
    const last = values[values.length - 1] ?? 0;
    return first > 0 && last > 0 ? last - first : 0;
}

function buildScaleTicks(max: number, step: number): number[] {
    const ticks: number[] = [];
    for (let v = max; v >= 0; v -= step) ticks.push(v);
    return ticks;
}

function shortSimLabel(simId: string) {
    return simId.replace(/^SG11-/, '');
}

function scoreBandClass(score: number) {
    if (score <= 0) return 'bg-slate-50 text-slate-400';
    if (score < 40) return 'bg-rose-50 text-rose-800';
    if (score < 60) return 'bg-amber-50 text-amber-900';
    if (score < 80) return 'bg-sky-50 text-sky-900';
    return 'bg-emerald-50 text-emerald-900';
}

function scoreLevelLabel(score: number) {
    if (score < 40) return 'Básico';
    if (score < 60) return 'En desarrollo';
    if (score < 80) return 'Competente';
    return 'Destacado';
}

function MiniAreaBarChart({ series, simIdx, size = 'md' }: { series: AreaSeries[]; simIdx: number; size?: 'md' | 'lg' }) {
    const rows = series
        .map((s) => ({ ...s, score: s.values[simIdx] ?? 0 }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score);
    const barH = size === 'lg' ? 'h-2.5' : 'h-2';
    const labelW = size === 'lg' ? 'w-[6.5rem]' : 'w-[5rem]';

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-700 mb-3">Distribución por área</p>
            <div className="space-y-3">
                {rows.map((row) => (
                    <div key={row.key}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`${labelW} shrink-0 text-xs font-semibold text-slate-700 truncate`}>{row.label}</span>
                            <span className="text-xs font-bold text-slate-500">{scoreLevelLabel(row.score)}</span>
                            <span className="text-sm font-black tabular-nums w-8 text-right" style={{ color: row.color }}>
                                {row.score}
                            </span>
                        </div>
                        <div className={`${barH} rounded-full bg-slate-100 overflow-hidden`}>
                            <div className="h-full rounded-full" style={{ width: `${row.score}%`, background: row.color }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AreaTrendChart({
    values,
    color,
    simIds,
    highlightIdx,
    height = 80,
}: {
    values: number[];
    color: string;
    simIds: string[];
    highlightIdx: number;
    height?: number;
}) {
    const w = 300;
    const h = height;
    const pad = { l: 34, r: 10, t: 8, b: 22 };
    const plotW = w - pad.l - pad.r;
    const plotH = h - pad.t - pad.b;
    const max = 100;
    const yTicks = [100, 50, 0];
    const toY = (v: number) => pad.t + plotH * (1 - v / max);
    const toX = (i: number) => pad.l + (i / Math.max(values.length - 1, 1)) * plotW;
    const pts = values.map((v, i) => ({ x: toX(i), y: toY(v), v, i }));
    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${pts[pts.length - 1]?.x ?? pad.l} ${pad.t + plotH} L ${pts[0]?.x ?? pad.l} ${pad.t + plotH} Z`;

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Evolución histórica del puntaje por área">
            <defs>
                <linearGradient id={`trend-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                </linearGradient>
            </defs>
            {yTicks.map((tick) => (
                <g key={tick}>
                    <line
                        x1={pad.l}
                        y1={toY(tick)}
                        x2={w - pad.r}
                        y2={toY(tick)}
                        stroke={tick === 0 ? '#94a3b8' : '#e2e8f0'}
                        strokeWidth={tick === 0 ? 1 : 0.8}
                        vectorEffect="non-scaling-stroke"
                    />
                    <text
                        x={pad.l - 5}
                        y={toY(tick) + 3}
                        textAnchor="end"
                        fill="#64748b"
                        style={{ fontSize: 9, fontWeight: 700 }}
                    >
                        {tick}
                    </text>
                </g>
            ))}
            <path d={areaPath} fill={`url(#trend-${color.replace('#', '')})`} />
            <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            {pts.map((p) => (
                <g key={p.i}>
                    <circle
                        cx={p.x}
                        cy={p.y}
                        r={p.i === highlightIdx ? 5 : 3.5}
                        fill={p.i === highlightIdx ? color : 'white'}
                        stroke={color}
                        strokeWidth={p.i === highlightIdx ? 0 : 2}
                        vectorEffect="non-scaling-stroke"
                    />
                    <text x={p.x} y={h - 4} textAnchor="middle" fill={p.i === highlightIdx ? '#4338ca' : '#64748b'} style={{ fontSize: 9, fontWeight: p.i === highlightIdx ? 800 : 600 }}>
                        {shortSimLabel(simIds[p.i] ?? '')}
                    </text>
                </g>
            ))}
        </svg>
    );
}

function AreaPanelModal({
    open,
    title,
    subtitle,
    onClose,
    tabs,
    activeTab,
    onTabChange,
    children,
}: {
    open: boolean;
    title: string;
    subtitle?: string;
    onClose: () => void;
    tabs: { id: DetailTab; label: string }[];
    activeTab: DetailTab;
    onTabChange: (tab: DetailTab) => void;
    children: ReactNode;
}) {
    useEffect(() => {
        if (!open) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[115] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <button type="button" className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm" aria-label="Cerrar" onClick={onClose} />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="area-panel-modal-title"
                className="relative z-10 flex h-dvh max-h-dvh w-full flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:h-auto sm:max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom,0px)-2rem))] sm:max-w-2xl sm:rounded-2xl lg:max-w-3xl"
            >
                <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-4 shrink-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-1">Análisis por área</p>
                            <h3 id="area-panel-modal-title" className="text-lg font-black text-slate-900 truncate">
                                {title}
                            </h3>
                            {subtitle ? <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p> : null}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="shrink-0 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            aria-label="Cerrar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex gap-1 mt-4 p-1 bg-slate-100 rounded-xl">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => onTabChange(tab.id)}
                                className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                                    activeTab === tab.id ? 'bg-white text-indigo-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">{children}</div>
            </div>
        </div>,
        document.body,
    );
}

export default function AreaComparisonView({
    simIds,
    series,
    currentSim,
}: {
    simIds: string[];
    series: AreaSeries[];
    currentSim: string | null;
}) {
    const [focusKey, setFocusKey] = useState<string | null>(null);
    const [activeSimIdx, setActiveSimIdx] = useState<number>(() => Math.max(simIds.length - 1, 0));
    const [hoverSimIdx, setHoverSimIdx] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [detailTab, setDetailTab] = useState<DetailTab>('sim');

    useEffect(() => {
        setActiveSimIdx((prev) => Math.min(prev, Math.max(simIds.length - 1, 0)));
    }, [simIds.length]);

    const previewIdx = hoverSimIdx ?? activeSimIdx;
    const highlightKey = focusKey;
    const ranked = useMemo(() => [...series].sort((a, b) => areaDelta(b.values) - areaDelta(a.values)), [series]);
    const topArea = ranked[0];
    const topDelta = topArea ? areaDelta(topArea.values) : 0;
    const activeSimId = simIds[activeSimIdx] ?? null;
    const previewSimId = simIds[previewIdx] ?? null;

    const vbW = 520;
    const chartH = 200;
    const ticks = buildScaleTicks(100, 20);
    const plot = { l: 44, r: 16, t: 16, b: 36 };
    const xInset = 12;
    const plotW = vbW - plot.l - plot.r;
    const plotH = chartH - plot.t - plot.b;
    const maxValue = 100;

    const toY = (v: number) => plot.t + plotH * (1 - v / maxValue);
    const toX = (i: number) => plot.l + xInset + (i / Math.max(simIds.length - 1, 1)) * (plotW - xInset * 2);

    const toggleFocus = (key: string) => setFocusKey((prev) => (prev === key ? null : key));

    const lineOpacity = (key: string) => {
        if (!highlightKey) return 1;
        return highlightKey === key ? 1 : 0.14;
    };

    const scoresForIdx = (idx: number) =>
        [...series]
            .map((s) => ({ ...s, score: s.values[idx] ?? 0, prev: idx > 0 ? s.values[idx - 1] ?? 0 : 0 }))
            .filter((s) => s.score > 0)
            .sort((a, b) => b.score - a.score);

    const previewScores = useMemo(() => scoresForIdx(previewIdx), [series, previewIdx]);
    const activeSimScores = useMemo(() => scoresForIdx(activeSimIdx), [series, activeSimIdx]);

    const previewAvg = previewScores.length
        ? Math.round(previewScores.reduce((a, s) => a + s.score, 0) / previewScores.length)
        : 0;

    const openDetail = (tab: DetailTab = 'sim', simIdx?: number) => {
        if (simIdx !== undefined) setActiveSimIdx(simIdx);
        setDetailTab(tab);
        setModalOpen(true);
    };

    const handleColumnClick = (idx: number) => {
        setActiveSimIdx(idx);
        setHoverSimIdx(null);
        openDetail('sim', idx);
    };

    const handleColumnHover = (idx: number) => {
        setHoverSimIdx(idx);
    };

    const modalTabs: { id: DetailTab; label: string }[] = [
        { id: 'sim', label: 'Simulacro' },
        { id: 'table', label: 'Tabla completa' },
        { id: 'ranking', label: 'Progreso' },
    ];

    return (
        <div className="space-y-4 -mx-1 sm:mx-0">
            {topArea && topDelta > 0 ? (
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-2.5">
                    <p className="text-sm font-semibold text-emerald-950">
                        Mayor avance: <span className="font-black" style={{ color: topArea.color }}>{topArea.label}</span>
                        {' '}· <span className="tabular-nums text-emerald-700 font-black">+{topDelta} pts</span>
                    </p>
                </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
                {series.map((s) => {
                    const last = s.values[s.values.length - 1] ?? 0;
                    const isOn = focusKey === s.key;
                    return (
                        <button
                            key={s.key}
                            type="button"
                            onClick={() => toggleFocus(s.key)}
                            aria-pressed={isOn}
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                                isOn ? 'border-indigo-400 bg-indigo-50 text-indigo-900 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                            {s.label}
                            <span className="tabular-nums font-black" style={{ color: s.color }}>{last}</span>
                        </button>
                    );
                })}
                {focusKey ? (
                    <button type="button" onClick={() => setFocusKey(null)} className="text-xs font-bold text-indigo-600 px-2 py-1.5 hover:underline">
                        Ver todas las líneas
                    </button>
                ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                    <div>
                        <p className="text-sm font-bold text-slate-800">Evolución por simulacro</p>
                        <p className="text-xs text-slate-500 mt-0.5">Pasa el mouse para previsualizar · clic en columna para abrir detalle</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => openDetail('sim')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 shrink-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V17a2 2 0 01-2 2z" />
                        </svg>
                        Ver análisis detallado
                    </button>
                </div>

                <div className="p-4 sm:p-5">
                    <svg
                        viewBox={`0 0 ${vbW} ${chartH}`}
                        className="w-full h-auto block select-none"
                        style={{ maxHeight: 'clamp(200px, 42vw, 280px)' }}
                        preserveAspectRatio="xMidYMid meet"
                        role="img"
                        aria-label="Gráfica de evolución por área. Hover para previsualizar, clic para abrir análisis."
                        onMouseLeave={() => setHoverSimIdx(null)}
                    >
                        {ticks.map((tick) => {
                            const y = toY(tick);
                            return (
                                <g key={tick}>
                                    <line x1={plot.l} y1={y} x2={vbW - plot.r} y2={y} stroke={tick === 0 ? '#94a3b8' : '#e2e8f0'} strokeWidth={tick === 0 ? 1.2 : 0.75} vectorEffect="non-scaling-stroke" />
                                    {tick % 20 === 0 ? (
                                        <text x={plot.l - 6} y={y + 4} textAnchor="end" fill="#64748b" style={{ fontSize: 10, fontWeight: 700 }}>{tick}</text>
                                    ) : null}
                                </g>
                            );
                        })}

                        {previewIdx >= 0 ? (
                            <>
                                <rect
                                    x={toX(previewIdx) - (plotW / Math.max(simIds.length - 1, 1)) / 2}
                                    y={plot.t}
                                    width={plotW / Math.max(simIds.length - 1, 1)}
                                    height={plotH}
                                    fill="#6366f1"
                                    opacity={hoverSimIdx !== null ? 0.14 : 0.08}
                                    rx="4"
                                />
                                <line x1={toX(previewIdx)} y1={plot.t} x2={toX(previewIdx)} y2={plot.t + plotH} stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" vectorEffect="non-scaling-stroke" />
                            </>
                        ) : null}

                        {series.map((s) => {
                            const points = s.values.map((v, i) => ({ x: toX(i), y: toY(v), v, simId: simIds[i] }));
                            const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
                            return (
                                <g key={s.key} opacity={lineOpacity(s.key)} className="motion-safe:transition-opacity motion-safe:duration-150">
                                    <path d={linePath} fill="none" stroke={s.color} strokeWidth={highlightKey === s.key ? 3 : 2.2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                                    {points.map((p, idx) => {
                                        if (highlightKey && highlightKey !== s.key && previewIdx !== idx) return null;
                                        return (
                                            <circle key={`${s.key}-${p.simId}`} cx={p.x} cy={p.y} r={p.simId === currentSim ? 5 : previewIdx === idx ? 4.5 : 3} fill="white" stroke={s.color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
                                        );
                                    })}
                                </g>
                            );
                        })}

                        {simIds.map((simId, idx) => {
                            const colW = plotW / Math.max(simIds.length - 1, 1);
                            const cx = toX(idx);
                            const isPreview = previewIdx === idx;
                            return (
                                <g key={`col-${simId}`}>
                                    <text x={cx} y={plot.t + plotH + 18} textAnchor="middle" fill={isPreview ? '#4338ca' : simId === currentSim ? '#0891b2' : '#64748b'} style={{ fontSize: 10, fontWeight: isPreview ? 800 : 700 }}>
                                        {shortSimLabel(simId)}
                                    </text>
                                    {simId === currentSim ? (
                                        <text x={cx} y={plot.t + plotH + 30} textAnchor="middle" fill="#0891b2" style={{ fontSize: 8, fontWeight: 800 }}>ACTUAL</text>
                                    ) : null}
                                    <rect x={cx - colW / 2} y={plot.t} width={colW} height={plotH + 32} fill="transparent" className="cursor-pointer" onClick={() => handleColumnClick(idx)} onMouseEnter={() => handleColumnHover(idx)}>
                                        <title>{`Ver detalle de ${simId}`}</title>
                                    </rect>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                {hoverSimIdx !== null ? 'Previsualización' : 'Simulacro seleccionado'}
                            </p>
                            <p className="text-sm font-black text-slate-900">
                                {previewSimId}
                                {previewSimId === currentSim ? (
                                    <span className="ml-2 text-[10px] font-bold uppercase text-cyan-700 bg-cyan-100 px-1.5 py-0.5 rounded align-middle">Actual</span>
                                ) : null}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Promedio áreas: <span className="font-bold text-slate-700 tabular-nums">{previewAvg}</span>
                                {' · '}
                                {previewScores.length} áreas con puntaje
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {previewScores.slice(0, 5).map((row) => (
                                <span key={row.key} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold shadow-sm">
                                    <span className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                                    <span className="text-slate-600 max-w-[5rem] truncate">{row.label}</span>
                                    <span className="tabular-nums font-black" style={{ color: row.color }}>{row.score}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
                <button type="button" onClick={() => openDetail('table')} className="font-bold text-slate-600 hover:text-indigo-700 underline-offset-2 hover:underline">
                    Abrir tabla completa
                </button>
                <span className="text-slate-300">·</span>
                <button type="button" onClick={() => openDetail('ranking')} className="font-bold text-slate-600 hover:text-indigo-700 underline-offset-2 hover:underline">
                    Ver ranking de progreso
                </button>
            </div>

            <AreaPanelModal
                open={modalOpen}
                title={activeSimId ?? 'Análisis detallado'}
                subtitle={`Comparando ${simIds.length} simulacros · escala 0–100 por área`}
                onClose={() => setModalOpen(false)}
                tabs={modalTabs}
                activeTab={detailTab}
                onTabChange={setDetailTab}
            >
                {detailTab === 'sim' ? (
                    <div className="space-y-5">
                        <div className="flex flex-wrap gap-2">
                            {simIds.map((id, idx) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setActiveSimIdx(idx)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                                        activeSimIdx === idx ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    {shortSimLabel(id)}
                                    {id === currentSim ? ' · actual' : ''}
                                </button>
                            ))}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <MiniAreaBarChart series={series} simIdx={activeSimIdx} size="lg" />
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs font-bold text-slate-700 mb-2">Resumen del simulacro</p>
                                <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between"><dt className="text-slate-500">Simulacro</dt><dd className="font-bold text-slate-900">{activeSimId}</dd></div>
                                    <div className="flex justify-between"><dt className="text-slate-500">Promedio áreas</dt><dd className="font-black text-indigo-700 tabular-nums">{activeSimScores.length ? Math.round(activeSimScores.reduce((a, s) => a + s.score, 0) / activeSimScores.length) : '—'}</dd></div>
                                    <div className="flex justify-between"><dt className="text-slate-500">Mejor área</dt><dd className="font-bold" style={{ color: activeSimScores[0]?.color }}>{activeSimScores[0]?.label ?? '—'} ({activeSimScores[0]?.score ?? '—'})</dd></div>
                                </dl>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Detalle por área</p>
                            {activeSimScores.map((row) => {
                                const stepDelta = row.prev > 0 ? row.score - row.prev : 0;
                                const src = series.find((s) => s.key === row.key);
                                return (
                                    <div key={row.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" style={{ borderLeftWidth: 4, borderLeftColor: row.color }}>
                                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                            <div className="sm:w-40 shrink-0">
                                                <p className="text-sm font-bold text-slate-900">{row.label}</p>
                                                <p className="text-3xl font-black tabular-nums mt-1" style={{ color: row.color }}>{row.score}</p>
                                                <p className="text-xs font-semibold text-slate-500 mt-1">{scoreLevelLabel(row.score)}</p>
                                                {stepDelta !== 0 ? (
                                                    <p className={`text-sm font-bold tabular-nums mt-2 ${stepDelta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {stepDelta > 0 ? '+' : ''}{stepDelta} vs simulacro anterior
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-slate-400 mt-2">Primer registro en la serie</p>
                                                )}
                                            </div>
                                            {src ? (
                                                <div className="flex-1 min-w-0 pt-1">
                                                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Evolución histórica</p>
                                                    <AreaTrendChart values={src.values} color={row.color} simIds={simIds} highlightIdx={activeSimIdx} height={88} />
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : null}

                {detailTab === 'table' ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full min-w-[36rem] text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">Área</th>
                                    {simIds.map((simId, idx) => (
                                        <th key={simId} className="px-2 py-3 text-center text-xs font-bold text-slate-600">
                                            <button type="button" onClick={() => { setActiveSimIdx(idx); setDetailTab('sim'); }} className="hover:text-indigo-700 underline-offset-2 hover:underline">
                                                {shortSimLabel(simId)}
                                            </button>
                                        </th>
                                    ))}
                                    <th className="px-3 py-3 text-center text-xs font-bold uppercase text-slate-500">Δ total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {series.map((s) => {
                                    const delta = areaDelta(s.values);
                                    return (
                                        <tr key={s.key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                            <td className="sticky left-0 bg-white px-4 py-2.5 font-bold text-slate-800 whitespace-nowrap">
                                                <span className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle" style={{ background: s.color }} />
                                                {s.label}
                                            </td>
                                            {s.values.map((score, idx) => {
                                                const prev = idx > 0 ? s.values[idx - 1] : 0;
                                                const step = prev > 0 && score > 0 ? score - prev : null;
                                                return (
                                                    <td key={idx} className="px-1.5 py-2 text-center">
                                                        {score > 0 ? (
                                                            <div className={`rounded-lg px-2 py-1.5 ${scoreBandClass(score)}`}>
                                                                <span className="font-black tabular-nums">{score}</span>
                                                                {step !== null && step !== 0 ? (
                                                                    <span className={`block text-[10px] font-bold mt-0.5 ${step > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{step > 0 ? '+' : ''}{step}</span>
                                                                ) : null}
                                                            </div>
                                                        ) : '—'}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-3 py-2 text-center font-black tabular-nums">
                                                {delta !== 0 ? <span className={delta > 0 ? 'text-emerald-600' : 'text-rose-600'}>{delta > 0 ? '+' : ''}{delta}</span> : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : null}

                {detailTab === 'ranking' ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {ranked.map((s, rank) => {
                            const delta = areaDelta(s.values);
                            const last = s.values[s.values.length - 1] ?? 0;
                            const first = s.values.find((v) => v > 0) ?? 0;
                            return (
                                <button
                                    key={s.key}
                                    type="button"
                                    onClick={() => { toggleFocus(s.key); setModalOpen(false); }}
                                    className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-indigo-300 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                                    style={{ borderLeftWidth: 4, borderLeftColor: s.color }}
                                >
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="text-sm font-bold text-slate-800">#{rank + 1} {s.label}</span>
                                        {delta !== 0 ? (
                                            <span className={`text-sm font-black tabular-nums px-2 py-0.5 rounded-full ${delta > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                {delta > 0 ? '+' : ''}{delta}
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="text-2xl font-black tabular-nums" style={{ color: s.color }}>{last}</p>
                                    {first > 0 ? <p className="text-xs text-slate-500 mt-1 tabular-nums">{first} → {last} pts</p> : null}
                                    <div className="mt-3">
                                        <AreaTrendChart values={s.values} color={s.color} simIds={simIds} highlightIdx={activeSimIdx} height={72} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : null}
            </AreaPanelModal>
        </div>
    );
}
