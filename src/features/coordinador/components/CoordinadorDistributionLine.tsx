'use client';
import { useMemo, useState } from 'react';
import type { InstitutionMetrics } from '@features/coordinador/hooks/useCoordinadorData';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import {
    APROBACION_UMBRAL,
    LEVEL_FOR_SCORE_RANGE,
    scoreRangeRows,
} from '@features/coordinador/lib/globalScoreStats';

interface Props {
    inst: InstitutionMetrics;
}

const LEVEL_COLORS: Record<string, { dot: string; legend: string }> = {
    superior: { dot: '#10b981', legend: 'bg-emerald-500' },
    alto: { dot: '#3b82f6', legend: 'bg-blue-500' },
    medio: { dot: '#f59e0b', legend: 'bg-amber-500' },
    bajo: { dot: '#ef4444', legend: 'bg-red-500' },
};

export default function CoordinadorDistributionLine({ inst }: Props) {
    const data = useMemo(() => {
        return scoreRangeRows(inst.distribucion).map((row) => ({
            ...row,
            level: LEVEL_FOR_SCORE_RANGE[row.range as keyof typeof LEVEL_FOR_SCORE_RANGE] ?? row.level,
        }));
    }, [inst.distribucion]);

    const approvalSplitIndex = data.findIndex((d) => d.aprobado);
    const belowApproval = data
        .slice(0, approvalSplitIndex >= 0 ? approvalSplitIndex : data.length)
        .reduce((s, d) => s + d.count, 0);
    const atOrAboveApproval = data
        .slice(approvalSplitIndex >= 0 ? approvalSplitIndex : data.length)
        .reduce((s, d) => s + d.count, 0);

    const max = Math.max(...data.map((d) => d.count), 1);
    const ticks = useMemo(() => {
        const step = Math.max(1, Math.ceil(max / 4));
        return [0, step, step * 2, step * 3, step * 4].map((v) => Math.round(v));
    }, [max]);
    const yMax = ticks[ticks.length - 1];

    const W = 960,
        H = 280,
        padL = 56,
        padR = 16,
        padT = 28,
        padB = 56;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;

    const pts = data.map((d, i) => ({
        ...d,
        x: padL + i * stepX,
        y: padT + (1 - d.count / yMax) * innerH,
    }));

    const linePath =
        pts.length === 0
            ? ''
            : pts
                  .map((p, i) =>
                      i === 0
                          ? `M ${p.x},${p.y}`
                          : `Q ${(pts[i - 1].x + p.x) / 2},${pts[i - 1].y} ${p.x},${p.y}`,
                  )
                  .join(' ');

    const areaPath =
        pts.length === 0
            ? ''
            : `${linePath} L ${pts[pts.length - 1].x},${padT + innerH} L ${pts[0].x},${padT + innerH} Z`;

    const [hover, setHover] = useState<number | null>(null);

    const approvalDividerX =
        approvalSplitIndex >= 0 && pts[approvalSplitIndex]
            ? pts[approvalSplitIndex].x - stepX / 2
            : null;

    return (
        <div
            data-coordinator-theme
            data-coord-tour={TourAnchors.dashboardDistribution}
            className="coord-card p-5 sm:p-6"
        >
            <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                <div>
                    <h3
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: 'var(--coord-text-secondary)' }}
                    >
                        Distribución de puntajes globales
                    </h3>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--coord-text-tertiary)' }}>
                        9 rangos fijos (0–500) · umbral de aprobación ≥{APROBACION_UMBRAL} pts
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
                    {(['superior', 'alto', 'medio', 'bajo'] as const).map((lvl) => (
                        <span
                            key={lvl}
                            className="flex items-center gap-1.5"
                            style={{ color: 'var(--coord-text-secondary)' }}
                        >
                            <span className="w-2 h-2 rounded-full" style={{ background: LEVEL_COLORS[lvl].dot }} />
                            <span className="capitalize">{lvl}</span>
                        </span>
                    ))}
                </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-4 text-[11px] font-semibold">
                <span style={{ color: '#fb7185' }}>
                    Sin aprobar (&lt;{APROBACION_UMBRAL}): <strong className="tabular-nums">{belowApproval}</strong>
                </span>
                <span style={{ color: '#34d399' }}>
                    Aprobados (≥{APROBACION_UMBRAL}): <strong className="tabular-nums">{atOrAboveApproval}</strong>
                </span>
            </div>

            <div className="relative w-full overflow-x-auto">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[600px]" style={{ height: H }}>
                    <defs>
                        <linearGradient id="distLineFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="distLineStroke" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#c4b5fd" />
                            <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                    </defs>

                    {approvalDividerX !== null && (
                        <>
                            <rect
                                x={padL}
                                y={padT}
                                width={approvalDividerX - padL}
                                height={innerH}
                                fill="rgba(251,113,133,0.04)"
                            />
                            <rect
                                x={approvalDividerX}
                                y={padT}
                                width={W - padR - approvalDividerX}
                                height={innerH}
                                fill="rgba(52,211,153,0.04)"
                            />
                            <line
                                x1={approvalDividerX}
                                x2={approvalDividerX}
                                y1={padT}
                                y2={padT + innerH}
                                stroke="rgba(52,211,153,0.45)"
                                strokeWidth={1.5}
                                strokeDasharray="4 4"
                            />
                        </>
                    )}

                    {ticks.map((t) => {
                        const y = padT + (1 - t / yMax) * innerH;
                        return (
                            <g key={t}>
                                <line
                                    x1={padL}
                                    x2={W - padR}
                                    y1={y}
                                    y2={y}
                                    stroke="rgba(255,255,255,0.05)"
                                    strokeWidth={1}
                                />
                                <text
                                    x={padL - 8}
                                    y={y + 3}
                                    textAnchor="end"
                                    fill="rgba(255,255,255,0.55)"
                                    fontSize="11"
                                    fontWeight="600"
                                >
                                    {t}
                                </text>
                            </g>
                        );
                    })}

                    <path d={areaPath} fill="url(#distLineFill)" />
                    <path
                        d={linePath}
                        fill="none"
                        stroke="url(#distLineStroke)"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {pts.map((p, i) => {
                        const c = LEVEL_COLORS[p.level].dot;
                        const isHover = hover === i;
                        return (
                            <g
                                key={p.range}
                                onMouseEnter={() => setHover(i)}
                                onMouseLeave={() => setHover(null)}
                                style={{ cursor: 'pointer' }}
                            >
                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={isHover ? 6 : 4.5}
                                    fill={c}
                                    stroke="rgba(7,8,13,0.9)"
                                    strokeWidth={2}
                                    opacity={p.aprobado ? 1 : 0.85}
                                />
                                <text
                                    x={p.x}
                                    y={p.y - 12}
                                    textAnchor="middle"
                                    fill="rgba(255,255,255,0.92)"
                                    fontSize={isHover ? 13 : 12}
                                    fontWeight="800"
                                >
                                    {p.count}
                                </text>
                                {(() => {
                                    const [a, b] = p.range.split('-');
                                    return (
                                        <>
                                            <text
                                                x={p.x}
                                                y={padT + innerH + 18}
                                                textAnchor="middle"
                                                fill="rgba(255,255,255,0.6)"
                                                fontSize="11"
                                                fontWeight="700"
                                            >
                                                {a}
                                            </text>
                                            {b && (
                                                <text
                                                    x={p.x}
                                                    y={padT + innerH + 32}
                                                    textAnchor="middle"
                                                    fill="rgba(255,255,255,0.45)"
                                                    fontSize="11"
                                                    fontWeight="600"
                                                >
                                                    {b}
                                                </text>
                                            )}
                                        </>
                                    );
                                })()}
                            </g>
                        );
                    })}

                    <line
                        x1={padL}
                        x2={W - padR}
                        y1={padT + innerH}
                        y2={padT + innerH}
                        stroke="rgba(255,255,255,0.1)"
                    />
                </svg>

                {hover !== null && pts[hover] && (
                    <div
                        className="absolute pointer-events-none rounded-lg px-3 py-2 text-[11px] shadow-xl"
                        style={{
                            left: `${(pts[hover].x / W) * 100}%`,
                            top: `${(pts[hover].y / H) * 100}%`,
                            transform: 'translate(-50%, -130%)',
                            background: 'rgba(15, 23, 42, 0.96)',
                            border: '1px solid rgba(99,102,241,0.4)',
                            color: 'rgba(255,255,255,0.92)',
                            minWidth: 140,
                        }}
                    >
                        <div className="font-bold mb-0.5">Rango {pts[hover].range}</div>
                        <div>
                            <span className="opacity-70">Estudiantes:</span>{' '}
                            <strong>{pts[hover].count}</strong>
                        </div>
                        <div className="capitalize opacity-70">Nivel: {pts[hover].level}</div>
                        <div className={pts[hover].aprobado ? 'text-emerald-300' : 'text-rose-300'}>
                            {pts[hover].aprobado ? `≥${APROBACION_UMBRAL} pts (aprobado)` : `<${APROBACION_UMBRAL} pts`}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
