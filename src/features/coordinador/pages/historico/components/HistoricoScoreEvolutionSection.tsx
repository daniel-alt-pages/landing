'use client';

import { useMemo } from 'react';
import { CoordCard, SectionHeader, TabBar } from '@features/coordinador/components/ui';
import type { SimSnapshot } from '@features/coordinador/pages/historico/lib/snapshotHelpers';

export type HistoricoMetric = 'avg' | 'median' | 'max' | 'min' | 'tasaAprobacion';

const METRIC_LABELS: Record<HistoricoMetric, string> = {
    avg: 'Promedio',
    median: 'Mediana',
    max: 'Máximo',
    min: 'Mínimo',
    tasaAprobacion: '% Aprobación',
};

const METRIC_SHORT: Record<HistoricoMetric, string> = {
    avg: 'Prom.',
    median: 'Med.',
    max: 'Máx.',
    min: 'Mín.',
    tasaAprobacion: '% Aprob.',
};

type Point = {
    simId: string;
    value: number;
    count: number;
    delta: number;
    isCurrent: boolean;
    x: number;
    y: number;
};

function formatSimLabel(simId: string): string {
    if (simId.length <= 12) return simId;
    const parts = simId.split('-');
    if (parts.length >= 3) return parts.slice(-2).join('-');
    return `${simId.slice(0, 5)}…${simId.slice(-4)}`;
}

function formatValue(metric: HistoricoMetric, value: number): string {
    return metric === 'tasaAprobacion' ? `${value}%` : String(Math.round(value));
}

function formatDelta(metric: HistoricoMetric, delta: number): string {
    const n = metric === 'tasaAprobacion' ? Math.abs(delta) : Math.abs(Math.round(delta));
    const suffix = metric === 'tasaAprobacion' ? 'pp' : '';
    return `${delta > 0 ? '↑' : '↓'}${n}${suffix}`;
}

type Props = {
    simIds: string[];
    historicalData: Record<string, SimSnapshot>;
    currentSimulation: string;
    selectedMetric: HistoricoMetric;
    onMetricChange: (metric: HistoricoMetric) => void;
    tourAnchor?: string;
};

export default function HistoricoScoreEvolutionSection({
    simIds,
    historicalData,
    currentSimulation,
    selectedMetric,
    onMetricChange,
    tourAnchor,
}: Props) {
    const chart = useMemo(() => {
        const raw = simIds
            .map((simId, idx) => {
                const snap = historicalData[simId];
                if (!snap) return null;
                const value =
                    selectedMetric === 'tasaAprobacion'
                        ? snap.tasaAprobacion
                        : snap[selectedMetric];
                const prev =
                    idx > 0
                        ? selectedMetric === 'tasaAprobacion'
                            ? historicalData[simIds[idx - 1]]?.tasaAprobacion ?? 0
                            : historicalData[simIds[idx - 1]]?.[selectedMetric] ?? 0
                        : 0;
                return {
                    simId,
                    value,
                    count: snap.count,
                    delta: idx > 0 ? value - prev : 0,
                    isCurrent: simId === currentSimulation,
                };
            })
            .filter((p): p is NonNullable<typeof p> => p != null);

        if (raw.length === 0) return null;

        const values = raw.map((p) => p.value);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const span = maxVal - minVal || 1;
        const pad =
            selectedMetric === 'tasaAprobacion'
                ? 8
                : Math.max(12, span * 0.18);
        const yMin = selectedMetric === 'tasaAprobacion' ? 0 : Math.max(0, minVal - pad);
        const yMax =
            selectedMetric === 'tasaAprobacion'
                ? 100
                : maxVal + pad;

        const w = 320;
        const h = 120;
        const padX = 18;
        const padTop = 22;
        const padBottom = 14;
        const innerW = w - padX * 2;
        const innerH = h - padTop - padBottom;

        const points: Point[] = raw.map((p, idx) => {
            const x =
                raw.length === 1
                    ? w / 2
                    : padX + (idx / (raw.length - 1)) * innerW;
            const y =
                padTop +
                (1 - (p.value - yMin) / (yMax - yMin || 1)) * innerH;
            return { ...p, x, y };
        });

        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const areaPath = `${linePath} L ${points[points.length - 1].x} ${h - padBottom} L ${points[0].x} ${h - padBottom} Z`;

        const gridYs = [0.25, 0.5, 0.75].map(
            (t) => padTop + t * innerH,
        );

        return { points, linePath, areaPath, gridYs, w, h, yMin, yMax };
    }, [simIds, historicalData, selectedMetric, currentSimulation]);

    const metricOptions = (['avg', 'median', 'max', 'min', 'tasaAprobacion'] as const).map(
        (m) => ({
            value: m,
            label: (
                <>
                    <span className="historico-metric-tabs__full">{METRIC_LABELS[m]}</span>
                    <span className="historico-metric-tabs__short">{METRIC_SHORT[m]}</span>
                </>
            ),
            ariaLabel: METRIC_LABELS[m],
        }),
    );

    return (
        <CoordCard stripe="violet" data-coord-tour={tourAnchor}>
            <SectionHeader
                title="Evolución del Puntaje"
                description={`${METRIC_LABELS[selectedMetric]} por simulacro`}
                accent="#8b5cf6"
                icon={
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                        <path d="M2 12L6 6l3 4 5-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                }
                right={
                    <div className="historico-metric-tabs scrollbar-none">
                        <TabBar
                            value={selectedMetric}
                            onChange={onMetricChange}
                            size="sm"
                            ariaLabel="Métrica a graficar"
                            options={metricOptions}
                        />
                    </div>
                }
            />

            {!chart ? (
                <p className="text-xs text-white/40 py-8 text-center">Sin datos para graficar.</p>
            ) : (
                <div className="historico-evolution">
                    <div className="historico-evolution__chart-wrap">
                        <svg
                            viewBox={`0 0 ${chart.w} ${chart.h}`}
                            className="historico-evolution__chart"
                            role="img"
                            aria-label={`Evolución: ${METRIC_LABELS[selectedMetric]} en ${chart.points.length} simulacros`}
                        >
                            <defs>
                                <linearGradient id="historico-evolution-area" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                                </linearGradient>
                                <filter id="historico-evolution-glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="2" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {chart.gridYs.map((gy) => (
                                <line
                                    key={gy}
                                    x1={12}
                                    x2={chart.w - 12}
                                    y1={gy}
                                    y2={gy}
                                    className="historico-evolution__grid"
                                />
                            ))}

                            <path d={chart.areaPath} fill="url(#historico-evolution-area)" />
                            <path d={chart.linePath} className="historico-evolution__line" />

                            {chart.points.map((p) => (
                                <g key={p.simId}>
                                    <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r={p.isCurrent ? 6 : 4.5}
                                        className={p.isCurrent ? 'historico-evolution__dot--current' : 'historico-evolution__dot'}
                                    />
                                    <text
                                        x={p.x}
                                        y={p.y - 12}
                                        textAnchor="middle"
                                        className={
                                            p.isCurrent
                                                ? 'historico-evolution__value--current'
                                                : 'historico-evolution__value'
                                        }
                                    >
                                        {formatValue(selectedMetric, p.value)}
                                    </text>
                                </g>
                            ))}
                        </svg>
                    </div>

                    <div
                        className="historico-evolution__columns"
                        style={{ gridTemplateColumns: `repeat(${chart.points.length}, minmax(0, 1fr))` }}
                    >
                        {chart.points.map((p) => (
                            <div
                                key={p.simId}
                                className={`historico-evolution__col ${p.isCurrent ? 'historico-evolution__col--current' : ''}`}
                            >
                                {p.delta !== 0 ? (
                                    <span
                                        className="historico-evolution__delta"
                                        data-tone={p.delta > 0 ? 'up' : 'down'}
                                    >
                                        {formatDelta(selectedMetric, p.delta)}
                                    </span>
                                ) : (
                                    <span className="historico-evolution__delta historico-evolution__delta--empty" aria-hidden />
                                )}
                                <p
                                    className="historico-evolution__sim"
                                    title={p.simId}
                                >
                                    {formatSimLabel(p.simId)}
                                </p>
                                <p className="historico-evolution__count">{p.count} est.</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </CoordCard>
    );
}
