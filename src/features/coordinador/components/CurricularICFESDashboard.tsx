'use client';

import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Estudiante } from '@shared/types';
import type { QuestionStat } from '@features/coordinador/hooks/useCoordinadorData';
import CoordCard from '@features/coordinador/components/ui/CoordCard';
import HorizontalScrollPanel from '@features/coordinador/components/ui/HorizontalScrollPanel';
import KpiTile from '@features/coordinador/components/ui/KpiTile';
import SectionHeader from '@features/coordinador/components/ui/SectionHeader';
import CoordinatorPerformanceAreaNav from '@features/coordinador/components/CoordinatorPerformanceAreaNav';
import CoordinadorInsightModal, {
    CoordInsightBulletList,
    CoordInsightHighlight,
    CoordInsightSection,
} from '@features/coordinador/components/CoordinadorInsightModal';
import {
    ICFES_AREA_OPTIONS,
    ICFES_AREA_THRESHOLDS,
    ICFES_NIVEL_LABEL,
    ICFES_NIVEL_NAME,
    MARCO_ICFES_PLACEHOLDER,
    areaScoreToNivel,
    type AreaThresholds,
    type IcfesAreaKey,
    type IcfesNivelKey,
} from '@features/coordinador/lib/icfesCurricularModel';
import {
    AREA_ACCENT,
    AREA_SHORT,
    NIVEL_COLORS,
    NIVEL_SHORT,
} from '@features/coordinador/components/desempeno/icfesDashboardTokens';
import { icfesAreaRgba } from '@features/coordinador/lib/icfesAreaColors';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import {
    AlertTriangle,
    BookOpen,
    Calculator,
    Compass,
    Globe,
    Languages,
    Layers,
    Microscope,
    ShieldAlert,
    Target,
    TrendingUp,
    X,
} from 'lucide-react';

/* ─── design tokens: ver icfesDashboardTokens.tsx ─────────────────────── */

/* ─── types ──────────────────────────────────────────────────────────────── */

export interface CurricularICFESDashboardProps {
    estudiantes: Estudiante[];
    pseudoPensum: boolean;
    questionAnalysis?: Record<string, QuestionStat[]>;
    /**
     * Si true: solo donut/histograma/KPIs (sin matriz de brechas ni ruta).
     * Desempeño no lo usa; panel completo según docs/coordinador-desempeno.md.
     */
    nivelesDistribucionOnly?: boolean;
}

type BrechaRow = {
    id: string;
    afirmacion: string;
    evidencia: string;
    skillFaltante: string;
    moduloSugerido: string;
    pctAfectacion: number;
    criticidad: 'Alta' | 'Media' | 'Baja';
    nivelObjetivo: IcfesNivelKey;
};

type AreaStat = {
    key: IcfesAreaKey;
    label: string;
    shortLabel: string;
    total: number;
    niveles: Record<IcfesNivelKey, number>;
    avg: number;
    pctBueno: number;
    modalNivel: IcfesNivelKey | null;
};

type PreguntaCritica = {
    num: string;
    failRate: number;
    total: number;
    errors: number;
    respuestaCorrecta: string;
    acumulado: number; // error acumulado en orden descendente (%)
};

function SoftEmptyState({
    title,
    body,
    tone = 'success',
    icon,
}: {
    title: string;
    body: string;
    tone?: 'success' | 'info' | 'warning';
    icon?: React.ReactNode;
}) {
    const color = tone === 'success' ? '#34d399' : tone === 'warning' ? '#fbbf24' : '#60a5fa';
    return (
        <div
            className="rounded-xl px-4 py-5 text-center"
            style={{
                background: `linear-gradient(135deg, ${color}12, rgba(255,255,255,0.025))`,
                border: `1px solid ${color}30`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 18px ${color}0d`,
            }}
            role="status"
        >
            <div
                className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ color, background: `${color}18`, border: `1px solid ${color}35` }}
            >
                {icon ?? <Target size={18} />}
            </div>
            <div className="text-sm font-black coord-text-head">{title}</div>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed coord-text-muted">{body}</p>
        </div>
    );
}

/* ─── helpers ────────────────────────────────────────────────────────────── */

function pct(n: number, d: number): number {
    if (d <= 0) return 0;
    return Math.round((n / d) * 1000) / 10;
}

function normalizeKey(s: string): string {
    return String(s || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getAreaScore(est: Estudiante, area: IcfesAreaKey): number {
    const p = est.puntajes || {};
    if (p[area]?.puntaje) return Number(p[area].puntaje) || 0;
    const target = normalizeKey(area);
    const found = Object.keys(p).find((k) => normalizeKey(k) === target);
    return found ? Number(p[found]?.puntaje) || 0 : 0;
}

function criticidadFromPct(p: number): BrechaRow['criticidad'] {
    if (p > 50) return 'Alta';
    if (p >= 30) return 'Media';
    return 'Baja';
}

function toneForCriticidad(c: BrechaRow['criticidad']) {
    return c === 'Alta' ? 'danger' : c === 'Media' ? 'warning' : 'neutral';
}

/* ─── SVG: Main Donut Chart (stroke-dasharray) ───────────────────────────── */

function DonutChart({
    niveles,
    total,
    modalNivel,
    nivelFocus,
    onSegmentClick,
    size = 200,
}: {
    niveles: Record<IcfesNivelKey, number>;
    total: number;
    modalNivel: IcfesNivelKey | null;
    nivelFocus: IcfesNivelKey | null;
    onSegmentClick: (nivel: IcfesNivelKey) => void;
    size?: number;
}) {
    const cx = size / 2;
    const cy = size / 2;
    const thickness = 32;
    const r = (size - thickness) / 2 - 4;
    const circumference = 2 * Math.PI * r;
    const gap = 4;

    let accumulated = 0;
    const segments = ([1, 2, 3, 4] as IcfesNivelKey[]).map((nivel) => {
        const count = niveles[nivel] || 0;
        const fraction = total > 0 ? count / total : 0.25;
        const segLen = fraction * circumference;
        const startOffset = accumulated;
        accumulated += segLen;
        return { nivel, count, fraction, segLen, startOffset };
    }).filter((s) => s.segLen > gap * 2);

    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
                {/* SVG glow filter */}
                <defs>
                    <filter id="glow-donut" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background track */}
                <circle
                    cx={cx} cy={cy} r={r}
                    fill="none"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth={thickness}
                />

                {segments.map((seg) => {
                    const isActive = nivelFocus === null || nivelFocus === seg.nivel;
                    const isFocused = nivelFocus === seg.nivel;
                    return (
                        <circle
                            key={seg.nivel}
                            cx={cx} cy={cy} r={r}
                            fill="none"
                            stroke={NIVEL_COLORS[seg.nivel]}
                            strokeWidth={isFocused ? thickness + 4 : thickness}
                            strokeDasharray={`${seg.segLen - gap} ${circumference - (seg.segLen - gap)}`}
                            strokeDashoffset={-(seg.startOffset + gap / 2)}
                            transform={`rotate(-90 ${cx} ${cy})`}
                            strokeLinecap="round"
                            opacity={isActive ? 1 : 0.15}
                            style={{
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                filter: isFocused
                                    ? `drop-shadow(0 0 8px ${NIVEL_COLORS[seg.nivel]}cc)`
                                    : undefined,
                            }}
                            onClick={() => onSegmentClick(seg.nivel)}
                        />
                    );
                })}
            </svg>

            {/* Center label */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                }}
            >
                {modalNivel ? (
                    <>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--coord-text-secondary)' }}>
                            Modal
                        </span>
                        <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.1, color: NIVEL_COLORS[modalNivel] }}>
                            {NIVEL_SHORT[modalNivel]}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: NIVEL_COLORS[modalNivel], opacity: 0.8 }}>
                            {pct(niveles[modalNivel] || 0, total)}%
                        </span>
                    </>
                ) : (
                    <span style={{ fontSize: 12, color: 'var(--coord-text-secondary)' }}>—</span>
                )}
            </div>
        </div>
    );
}

/* ─── SVG: Radar Chart ───────────────────────────────────────────────────── */

function RadarChart({
    areas,
    selected,
    onSelect,
    size = 260,
}: {
    areas: AreaStat[];
    selected: IcfesAreaKey;
    onSelect: (key: IcfesAreaKey) => void;
    size?: number;
}) {
    const cx = size / 2;
    const cy = size / 2;
    const maxR = size / 2 - 36;
    const n = areas.length;
    const angleStep = (2 * Math.PI) / n;

    function angle(i: number) {
        return i * angleStep - Math.PI / 2;
    }

    function point(i: number, value: number, maxVal: number) {
        const r = (value / maxVal) * maxR;
        return {
            x: cx + r * Math.cos(angle(i)),
            y: cy + r * Math.sin(angle(i)),
        };
    }

    const maxVal = Math.max(...areas.map((a) => a.avg), 1);
    const accent = AREA_ACCENT[selected] ?? '#94a3b8';

    const polygonPoints = areas
        .map((a, i) => {
            const p = point(i, a.avg, maxVal);
            return `${p.x},${p.y}`;
        })
        .join(' ');

    const rings = [25, 50, 75, 100];

    return (
        <div style={{ position: 'relative' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
                <defs>
                    <radialGradient id="radar-fill" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={accent} stopOpacity="0.08" />
                    </radialGradient>
                </defs>

                {/* Background rings */}
                {rings.map((v) => {
                    const pts = areas
                        .map((_, i) => {
                            const r = (v / 100) * maxR;
                            return `${cx + r * Math.cos(angle(i))},${cy + r * Math.sin(angle(i))}`;
                        })
                        .join(' ');
                    return (
                        <polygon
                            key={v}
                            points={pts}
                            fill="none"
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth={1}
                        />
                    );
                })}

                {/* Ring value labels */}
                {rings.slice(0, 3).map((v) => (
                    <text
                        key={v}
                        x={cx + 3}
                        y={cy - (v / 100) * maxR - 3}
                        fontSize={8}
                        fill="rgba(255,255,255,0.2)"
                        textAnchor="start"
                    >
                        {v}
                    </text>
                ))}

                {/* Axes */}
                {areas.map((_, i) => {
                    const end = point(i, maxVal, maxVal);
                    return (
                        <line
                            key={i}
                            x1={cx} y1={cy}
                            x2={end.x} y2={end.y}
                            stroke="rgba(255,255,255,0.07)"
                            strokeWidth={1}
                        />
                    );
                })}

                {/* Data polygon fill */}
                <polygon
                    points={polygonPoints}
                    fill="url(#radar-fill)"
                    stroke={accent}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    style={{ filter: `drop-shadow(0 0 6px ${icfesAreaRgba(selected, 0.4)})` }}
                />

                {/* Data points + labels */}
                {areas.map((a, i) => {
                    const pt = point(i, a.avg, maxVal);
                    const labelPt = point(i, maxVal * 1.28, maxVal);
                    const isActive = a.key === selected;
                    const areaAccent = AREA_ACCENT[a.key] ?? '#94a3b8';
                    const nivelColor = a.modalNivel ? NIVEL_COLORS[a.modalNivel] : areaAccent;
                    const textAnchor =
                        Math.abs(Math.cos(angle(i))) < 0.15
                            ? 'middle'
                            : Math.cos(angle(i)) > 0
                              ? 'start'
                              : 'end';

                    return (
                        <g key={a.key} style={{ cursor: 'pointer' }} onClick={() => onSelect(a.key)}>
                            {/* Hit area */}
                            <circle cx={labelPt.x} cy={labelPt.y} r={20} fill="transparent" />

                            {/* Data point */}
                            <circle
                                cx={pt.x} cy={pt.y} r={isActive ? 7 : 5}
                                fill={nivelColor}
                                stroke={isActive ? '#fff' : 'transparent'}
                                strokeWidth={1.5}
                                style={{
                                    transition: 'all 0.25s',
                                    filter: isActive ? `drop-shadow(0 0 6px ${nivelColor}cc)` : undefined,
                                }}
                            />

                            {/* Label */}
                            <text
                                x={labelPt.x}
                                y={labelPt.y + 4}
                                textAnchor={textAnchor}
                                fontSize={isActive ? 10 : 9}
                                fontWeight={isActive ? 700 : 500}
                                fill={isActive ? areaAccent : 'rgba(255,255,255,0.5)'}
                                style={{ transition: 'all 0.2s' }}
                            >
                                {a.shortLabel}
                            </text>

                            {/* Score label on point */}
                            {a.avg > 0 && (
                                <text
                                    x={pt.x}
                                    y={pt.y - 8}
                                    textAnchor="middle"
                                    fontSize={8}
                                    fontWeight={700}
                                    fill={nivelColor}
                                    opacity={0.9}
                                >
                                    {a.avg}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

/* ─── SVG: Distribución por niveles (área suavizada) ─────────────────────── */

/** Genera zonas de nivel dinámicas según los umbrales oficiales del área. */
function getNivelZones(th: AreaThresholds) {
    return [
        { nivel: 1 as IcfesNivelKey, from: 0,           to: th.n1Max + 1, label: 'Mínimo'        },
        { nivel: 2 as IcfesNivelKey, from: th.n1Max + 1, to: th.n2Max + 1, label: 'Básico'        },
        { nivel: 3 as IcfesNivelKey, from: th.n2Max + 1, to: th.n3Max + 1, label: 'Satisfactorio' },
        { nivel: 4 as IcfesNivelKey, from: th.n3Max + 1, to: 100,          label: 'Avanzado'      },
    ];
}

/** Genera bins de distribución con bins más finos alrededor de los límites de nivel. */
function getScoreBins(th: AreaThresholds) {
    const bounds = [th.n1Max + 1, th.n2Max + 1, th.n3Max + 1];
    const rawBins: Array<{ from: number; to: number }> = [];
    // 5-pt bins through the whole 0-100 range; split at boundaries
    for (let f = 0; f < 100; ) {
        const t = Math.min(f + 10, 100);
        // check if a boundary falls inside this bin
        const cut = bounds.find((b) => b > f && b < t);
        if (cut !== undefined) {
            rawBins.push({ from: f, to: cut });
            rawBins.push({ from: cut, to: t });
        } else {
            rawBins.push({ from: f, to: t });
        }
        f = t;
    }
    return rawBins.map((b) => ({ ...b, cx: (b.from + b.to) / 2 }));
}

function binNivel(cx: number, th: AreaThresholds): IcfesNivelKey {
    if (cx <= th.n1Max) return 1;
    if (cx <= th.n2Max) return 2;
    if (cx <= th.n3Max) return 3;
    return 4;
}

function smoothPath(pts: Array<{ x: number; y: number }>): string {
    if (pts.length < 2) return '';
    const d: string[] = [`M ${pts[0].x} ${pts[0].y}`];
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        d.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`);
    }
    return d.join(' ');
}

function DistribucionAreaChart({
    scores,
    areaLabel,
    areaKey,
    thresholds,
}: {
    scores: Array<{ score: number; nivel: IcfesNivelKey }>;
    areaLabel: string;
    areaKey: IcfesAreaKey;
    thresholds: AreaThresholds;
}) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    if (scores.length === 0) return null;

    const NIVEL_ZONES = getNivelZones(thresholds);
    const SCORE_BINS = getScoreBins(thresholds);

    const W = 760;
    const H = 300;
    const padL = 48;
    const padR = 26;
    const padTop = 62;   // extra room so top labels never clip
    const padBot = 72;
    const plotW = W - padL - padR;
    const plotH = H - padTop - padBot;
    const total = scores.length;

    const sx = (score: number) => padL + (score / 100) * plotW;
    const sy = (count: number, maxC: number) =>
        padTop + plotH - (count / Math.max(maxC, 1)) * plotH;

    const bins = SCORE_BINS.map((b) => {
        const count = scores.filter((s) => s.score >= b.from && s.score < b.to).length;
        return { ...b, count, nivel: binNivel(b.cx, thresholds) };
    });

    const maxCount = Math.max(...bins.map((b) => b.count), 1);
    const pts = bins.map((b) => ({ x: sx(b.cx), y: sy(b.count, maxCount) }));
    const linePath = smoothPath(pts);
    const areaPath =
        linePath +
        ` L ${pts[pts.length - 1].x} ${padTop + plotH}` +
        ` L ${pts[0].x} ${padTop + plotH} Z`;

    const gridVals = [0.25, 0.5, 0.75, 1].map((f) => Math.round(f * maxCount));

    // Tooltip geometry for hovered bin
    const hov = hoveredIdx !== null ? bins[hoveredIdx] : null;
    const hovPx = hov ? sx(hov.cx) : 0;
    const hovPy = hov ? sy(hov.count, maxCount) : 0;
    const tooltipW = 148;
    const tooltipH = 72;
    const tipRawX = hovPx - tooltipW / 2;
    const tipX = Math.max(padL, Math.min(tipRawX, padL + plotW - tooltipW));
    // Place tooltip above the dot; if dot is near top, place below
    const tipAbove = hovPy - padTop > tooltipH + 14;
    const tipY = tipAbove ? hovPy - tooltipH - 12 : hovPy + 14;
    const nivelZone = hov ? NIVEL_ZONES.find((z) => z.nivel === hov.nivel) : null;
    const tooltipNivelRange = nivelZone
        ? `${nivelZone.from}–${nivelZone.nivel === 4 ? 100 : nivelZone.to - 1}`
        : '';

    // unique SVG id prefix per area to avoid collision when multiple mount
    const uid = areaLabel.replace(/\s/g, '_');

    return (
        <div className="min-w-0 max-w-full">
            {/* Legend row */}
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {NIVEL_ZONES.map((z) => (
                    <div key={z.nivel} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span style={{
                            width: 9, height: 9, borderRadius: '50%',
                            background: NIVEL_COLORS[z.nivel],
                            boxShadow: `0 0 5px ${NIVEL_COLORS[z.nivel]}88`,
                            flexShrink: 0,
                        }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                            {z.label}
                        </span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.62)' }}>
                            {z.from}–{z.nivel === 4 ? 100 : z.to - 1}
                        </span>
                    </div>
                ))}
            </div>

            <HorizontalScrollPanel
                className="min-w-0 max-w-full"
                contentClassName="min-w-0 lg:min-w-[720px]"
                label={`Desplazamiento horizontal de distribución ${areaLabel}`}
            >
                <svg
                    width="100%"
                    height={H}
                    viewBox={`0 0 ${W} ${H}`}
                    preserveAspectRatio="xMidYMid meet"
                    className="w-full max-w-full lg:min-w-[720px]"
                    style={{ overflow: 'visible', cursor: 'crosshair' }}
                    onMouseLeave={() => setHoveredIdx(null)}
                >
                <defs>
                    {NIVEL_ZONES.map((z) => (
                        <linearGradient key={z.nivel} id={`zg-${uid}-${z.nivel}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={NIVEL_COLORS[z.nivel]} stopOpacity="0.12" />
                            <stop offset="100%" stopColor={NIVEL_COLORS[z.nivel]} stopOpacity="0.02" />
                        </linearGradient>
                    ))}
                    <linearGradient id={`af-${uid}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={icfesAreaRgba(areaKey, 0.4)} />
                        <stop offset="100%" stopColor={icfesAreaRgba(areaKey, 0.02)} />
                    </linearGradient>
                    <clipPath id={`pc-${uid}`}>
                        <rect x={padL} y={padTop} width={plotW} height={plotH} />
                    </clipPath>
                    <filter id={`glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>

                {/* ── Nivel background zones ── */}
                {NIVEL_ZONES.map((z) => {
                    const x1 = sx(z.from);
                    const x2 = sx(z.to);
                    const isHovZone = hov?.nivel === z.nivel;
                    return (
                        <g key={z.nivel}>
                            <rect x={x1} y={padTop} width={x2 - x1} height={plotH}
                                fill={`url(#zg-${uid}-${z.nivel})`}
                                opacity={hoveredIdx !== null && !isHovZone ? 0.5 : 1}
                                style={{ transition: 'opacity 0.2s' }}
                            />
                            {/* Bottom stripe */}
                            <rect x={x1} y={padTop + plotH} width={x2 - x1} height={4}
                                fill={NIVEL_COLORS[z.nivel]}
                                opacity={isHovZone ? 0.85 : 0.45}
                                style={{ transition: 'opacity 0.2s' }}
                            />
                            {/* Zone label */}
                            <text x={(x1 + x2) / 2} y={padTop + plotH - 10}
                                textAnchor="middle" fontSize={10} fontWeight={800}
                                fill={NIVEL_COLORS[z.nivel]}
                                opacity={isHovZone ? 0.9 : 0.62}
                                style={{ userSelect: 'none', transition: 'opacity 0.2s' }}
                            >
                                {z.label.toUpperCase()}
                            </text>
                        </g>
                    );
                })}

                {/* ── Boundary lines ── */}
                {[thresholds.n1Max, thresholds.n2Max, thresholds.n3Max].map((v) => (
                    <line key={v}
                        x1={sx(v)} y1={padTop} x2={sx(v)} y2={padTop + plotH + 4}
                        stroke="rgba(255,255,255,0.13)" strokeWidth={1.5} strokeDasharray="4,3"
                    />
                ))}

                {/* ── Gridlines ── */}
                {gridVals.map((v) => {
                    const y = sy(v, maxCount);
                    return (
                        <g key={v}>
                            <line x1={padL} y1={y} x2={padL + plotW} y2={y}
                                stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                            <text x={padL - 5} y={y + 3} textAnchor="end"
                                fontSize={8} fill="rgba(255,255,255,0.52)">
                                {v}
                            </text>
                        </g>
                    );
                })}

                {/* ── Area fill ── */}
                <path d={areaPath} fill={`url(#af-${uid})`} clipPath={`url(#pc-${uid})`} />

                {/* ── Smooth line ── */}
                <path d={linePath} fill="none"
                    stroke={icfesAreaRgba(areaKey, 0.85)} strokeWidth={2.5}
                    strokeLinejoin="round" strokeLinecap="round"
                    clipPath={`url(#pc-${uid})`}
                    style={{ filter: `drop-shadow(0 0 5px ${icfesAreaRgba(areaKey, 0.5)})` }}
                />

                {/* ── Crosshair for hovered bin ── */}
                {hov && hov.count > 0 && (
                    <line
                        x1={hovPx} y1={hovPy + 7} x2={hovPx} y2={padTop + plotH}
                        stroke={NIVEL_COLORS[hov.nivel]}
                        strokeWidth={1} strokeDasharray="3,3"
                        opacity={0.5}
                    />
                )}

                {/* ── Data points ── */}
                {bins.map((b, i) => {
                    if (b.count === 0) return null;
                    const px = sx(b.cx);
                    const py = sy(b.count, maxCount);
                    const color = NIVEL_COLORS[b.nivel];
                    const isHov = hoveredIdx === i;
                    const isMax = b.count === maxCount;
                    const r = isHov ? 8 : isMax ? 7 : 5;
                    const faded = hoveredIdx !== null && !isHov ? 0.3 : 1;

                    // Clamp label y so it never goes above padTop area
                    const labelY = Math.max(padTop + 10, py - r - 5);

                    return (
                        <g key={i} style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onClick={() => setHoveredIdx(isHov ? null : i)}
                        >
                            {/* Invisible hit zone (full column width) */}
                            <rect
                                x={i === 0 ? padL : (sx(b.from) + sx(bins[i - 1]?.cx ?? b.from)) / 2}
                                y={padTop}
                                width={sx(b.to) - sx(b.from)}
                                height={plotH}
                                fill="transparent"
                            />
                            {/* Glow halo */}
                            <circle cx={px} cy={py} r={r + 5} fill={color}
                                opacity={isHov ? 0.22 : 0.1}
                                style={{ transition: 'all 0.2s' }} />
                            {/* Dot */}
                            <circle cx={px} cy={py} r={r}
                                fill={color}
                                stroke={isHov || isMax ? '#fff' : 'rgba(8,8,16,0.85)'}
                                strokeWidth={isHov ? 2 : isMax ? 1.5 : 1}
                                opacity={faded}
                                style={{
                                    transition: 'all 0.2s',
                                    filter: isHov ? `drop-shadow(0 0 8px ${color})` : undefined,
                                }}
                            />
                            {/* Count label (clamped) */}
                            <text x={px} y={labelY}
                                textAnchor="middle"
                                fontSize={isHov ? 13 : isMax ? 12 : 10}
                                fontWeight={isHov || isMax ? 800 : 600}
                                fill={color}
                                stroke="rgba(8,8,16,0.82)"
                                strokeWidth={2.5}
                                paintOrder="stroke"
                                opacity={faded}
                                style={{ transition: 'all 0.2s', userSelect: 'none' }}
                            >
                                {b.count}
                            </text>
                        </g>
                    );
                })}

                {/* ── Tooltip ── */}
                {hov && hov.count > 0 && (
                    <g style={{ pointerEvents: 'none' }}>
                        {/* Shadow rect */}
                        <rect x={tipX + 2} y={tipY + 2}
                            width={tooltipW} height={tooltipH}
                            rx={8} fill="rgba(0,0,0,0.4)"
                        />
                        {/* Background */}
                        <rect x={tipX} y={tipY}
                            width={tooltipW} height={tooltipH}
                            rx={8}
                            fill="rgba(12,12,22,0.96)"
                            stroke={NIVEL_COLORS[hov.nivel]}
                            strokeWidth={1.5}
                            strokeOpacity={0.7}
                        />
                        {/* Nivel indicator bar on left */}
                        <rect x={tipX} y={tipY + 8}
                            width={3} height={tooltipH - 16}
                            rx={2} fill={NIVEL_COLORS[hov.nivel]}
                        />
                        {/* Nivel label */}
                        <text x={tipX + 12} y={tipY + 18}
                            fontSize={9} fontWeight={700}
                            fill={NIVEL_COLORS[hov.nivel]} letterSpacing="0.08em">
                            {(nivelZone?.label ?? '').toUpperCase()} · {tooltipNivelRange} pts
                        </text>
                        {/* Range */}
                        <text x={tipX + 12} y={tipY + 32}
                            fontSize={10} fill="rgba(255,255,255,0.55)">
                            Rango: {hov.from}–{hov.to} pts
                        </text>
                        {/* Count */}
                        <text x={tipX + 12} y={tipY + 48}
                            fontSize={13} fontWeight={800} fill="#fff">
                            {hov.count}
                            <tspan fontSize={9} fontWeight={400} fill="rgba(255,255,255,0.45)">
                                {' '}estudiantes
                            </tspan>
                        </text>
                        {/* Percentage */}
                        <text x={tipX + 12} y={tipY + 63}
                            fontSize={9} fill="rgba(255,255,255,0.45)">
                            {pct(hov.count, total)}% del total evaluado
                        </text>
                    </g>
                )}

                {/* ── X axis line ── */}
                <line x1={padL} y1={padTop + plotH} x2={padL + plotW} y2={padTop + plotH}
                    stroke="rgba(255,255,255,0.1)" strokeWidth={1} />

                {/* X tick labels — boundaries from official ICFES thresholds */}
                {(() => {
                    const boundaries = [thresholds.n1Max, thresholds.n2Max, thresholds.n3Max];
                    const allTicks = Array.from(new Set([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, ...boundaries])).sort((a, b) => a - b);
                    return allTicks.map((v) => {
                        const isBoundary = boundaries.includes(v);
                        return (
                            <text key={v} x={sx(v)} y={padTop + plotH + 18 + (isBoundary ? 0 : 12)}
                                textAnchor="middle"
                                fontSize={isBoundary ? 11 : 9}
                                fontWeight={isBoundary ? 700 : 400}
                                fill={isBoundary ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.50)'}>
                                {v}
                            </text>
                        );
                    });
                })()}

                {/* X range labels (nivel) — inclusive ranges per official docs */}
                {NIVEL_ZONES.map((z) => (
                    <text key={`rl-${z.nivel}`}
                        x={(sx(z.from) + sx(z.to)) / 2} y={padTop + plotH + 52}
                        textAnchor="middle" fontSize={10} fontWeight={700}
                        fill={NIVEL_COLORS[z.nivel]} opacity={0.75}>
                        {z.from}–{z.nivel === 4 ? 100 : z.to - 1}
                    </text>
                ))}
                </svg>
            </HorizontalScrollPanel>
        </div>
    );
}

/* ─── Alertas Críticas Modal ─────────────────────────────────────────────── */

const THRESHOLD = 51;

function AlertasModal({
    open,
    onClose,
    areaLabel,
    brechas,
    preguntas,
}: {
    open: boolean;
    onClose: () => void;
    areaLabel: string;
    brechas: BrechaRow[];
    preguntas: PreguntaCritica[];
}) {
    if (!open) return null;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2000,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                padding: '0',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Backdrop */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(6px)',
                }}
            />

            {/* Sheet */}
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: 680,
                    maxHeight: '88dvh',
                    borderRadius: '1.5rem 1.5rem 0 0',
                    background: 'rgba(10,10,18,0.97)',
                    border: '1px solid rgba(251,113,133,0.25)',
                    borderBottom: 'none',
                    boxShadow: '0 -8px 48px rgba(251,113,133,0.15), 0 0 0 1px rgba(255,255,255,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '1.25rem 1.5rem 1rem',
                        borderBottom: '1px solid rgba(251,113,133,0.15)',
                        flexShrink: 0,
                        background: 'linear-gradient(180deg, rgba(251,113,133,0.08) 0%, transparent 100%)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                                <ShieldAlert size={18} color="#fb7185" />
                                <span style={{ color: '#fb7185', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em' }}>
                                    Focos de Alerta Críticos
                                </span>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: 0 }}>
                                {areaLabel} · Elementos que afectan a más del {THRESHOLD}% del grupo
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.10)',
                                border: '1px solid rgba(255,255,255,0.18)',
                                borderRadius: '0.5rem',
                                padding: '0.375rem',
                                cursor: 'pointer',
                                color: 'rgba(255,255,255,0.75)',
                                flexShrink: 0,
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Summary pills */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '0.25rem 0.75rem',
                                borderRadius: '999px',
                                background: 'rgba(251,113,133,0.15)',
                                border: '1px solid rgba(251,113,133,0.35)',
                                color: '#fb7185',
                            }}
                        >
                            {brechas.length} brecha{brechas.length !== 1 ? 's' : ''} curricular{brechas.length !== 1 ? 'es' : ''}
                        </span>
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '0.25rem 0.75rem',
                                borderRadius: '999px',
                                background: 'rgba(251,191,36,0.15)',
                                border: '1px solid rgba(251,191,36,0.35)',
                                color: '#fbbf24',
                            }}
                        >
                            {preguntas.length} pregunta{preguntas.length !== 1 ? 's' : ''} crítica{preguntas.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* Body — scrollable */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '1rem 1.5rem 2rem' }}>

                    {/* ── Brechas curriculares ── */}
                    {brechas.length > 0 && (
                        <section style={{ marginBottom: '1.5rem' }}>
                            <div style={{
                                fontSize: 10,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: '#fb7185',
                                marginBottom: '0.625rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}>
                                <span style={{ flex: 1, height: 1, background: 'rgba(251,113,133,0.2)' }} />
                                Brechas curriculares ({'>'}{THRESHOLD}% afectación)
                                <span style={{ flex: 1, height: 1, background: 'rgba(251,113,133,0.2)' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {brechas.map((b) => (
                                    <div
                                        key={b.id}
                                        style={{
                                            borderRadius: '0.875rem',
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(251,113,133,0.06)',
                                            border: '1px solid rgba(251,113,133,0.2)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>
                                                    {b.afirmacion || 'Competencia (Marco)'}
                                                </div>
                                                {b.skillFaltante && (
                                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 3 }}>
                                                        {b.skillFaltante}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <div style={{ fontSize: 20, fontWeight: 900, color: '#fb7185', lineHeight: 1 }}>
                                                    {b.pctAfectacion}%
                                                </div>
                                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.62)', marginTop: 2 }}>
                                                    Obj.: {ICFES_NIVEL_NAME[b.nivelObjetivo]}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Afectación bar */}
                                        <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${b.pctAfectacion}%`,
                                                background: 'linear-gradient(90deg, #fb718588, #fb7185)',
                                                borderRadius: 4,
                                                boxShadow: '0 0 8px rgba(251,113,133,0.5)',
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {brechas.length === 0 && (
                        <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 13, textAlign: 'center', padding: '1rem 0' }}>
                            Sin brechas curriculares por encima del {THRESHOLD}%.
                        </p>
                    )}

                    {/* ── Preguntas críticas ── */}
                    {preguntas.length > 0 && (
                        <section>
                            <div style={{
                                fontSize: 10,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: '#fbbf24',
                                marginBottom: '0.625rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}>
                                <span style={{ flex: 1, height: 1, background: 'rgba(251,191,36,0.2)' }} />
                                Preguntas críticas · error acumulado {'>'}{THRESHOLD}%
                                <span style={{ flex: 1, height: 1, background: 'rgba(251,191,36,0.2)' }} />
                            </div>

                            {/* Table header */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '3rem 1fr 6rem 7rem',
                                gap: '0.5rem',
                                padding: '0.25rem 0.75rem',
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: 'rgba(255,255,255,0.3)',
                                marginBottom: '0.25rem',
                            }}>
                                <span>P#</span>
                                <span>Error acumulado</span>
                                <span style={{ textAlign: 'right' }}>% Error</span>
                                <span style={{ textAlign: 'center' }}>Clave</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                {preguntas.map((q, i) => {
                                    const barW = q.failRate;
                                    const acumColor = q.acumulado >= 90 ? '#fb7185' : q.acumulado >= 70 ? '#fbbf24' : '#60a5fa';
                                    return (
                                        <div
                                            key={q.num}
                                            style={{
                                                borderRadius: '0.75rem',
                                                padding: '0.625rem 0.75rem',
                                                background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                                                border: '1px solid rgba(251,191,36,0.12)',
                                                display: 'grid',
                                                gridTemplateColumns: '3rem 1fr 6rem 7rem',
                                                gap: '0.5rem',
                                                alignItems: 'center',
                                            }}
                                        >
                                            {/* Question number */}
                                            <div style={{
                                                width: 32, height: 32,
                                                borderRadius: '50%',
                                                background: 'rgba(251,191,36,0.15)',
                                                border: '1.5px solid rgba(251,191,36,0.4)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 11, fontWeight: 800, color: '#fbbf24',
                                            }}>
                                                {q.num}
                                            </div>

                                            {/* Accumulated error bar */}
                                            <div>
                                                <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.14)', overflow: 'hidden', marginBottom: 3 }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${barW}%`,
                                                        background: `linear-gradient(90deg, ${acumColor}66, ${acumColor})`,
                                                        borderRadius: 4,
                                                        boxShadow: `0 0 6px ${acumColor}66`,
                                                        transition: 'width 0.5s ease',
                                                    }} />
                                                </div>
                                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.62)' }}>
                                                    {q.errors} de {q.total} estudiantes erran
                                                </div>
                                            </div>

                                            {/* Fail % */}
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontSize: 16, fontWeight: 900, color: acumColor }}>{q.failRate}%</span>
                                            </div>

                                            {/* Correct answer key */}
                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                {q.respuestaCorrecta ? (
                                                    <span style={{
                                                        width: 28, height: 28,
                                                        borderRadius: '0.5rem',
                                                        background: 'rgba(52,211,153,0.15)',
                                                        border: '1.5px solid rgba(52,211,153,0.4)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 12, fontWeight: 800, color: '#34d399',
                                                    }}>
                                                        {q.respuestaCorrecta}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>—</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {preguntas.length === 0 && (
                        <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 13, textAlign: 'center', padding: '1rem 0' }}>
                            Sin preguntas críticas por encima del {THRESHOLD}% de error acumulado.
                        </p>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

/* ─── main component ─────────────────────────────────────────────────────── */

export default function CurricularICFESDashboard({
    estudiantes,
    pseudoPensum,
    questionAnalysis = {},
    nivelesDistribucionOnly = false,
}: CurricularICFESDashboardProps) {
    const [area, setArea] = useState<IcfesAreaKey>('lectura crítica');
    const [nivelFocus, setNivelFocus] = useState<IcfesNivelKey | null>(null);
    const [modal, setModal] = useState<null | { type: 'metodologia' } | { type: 'brecha'; row: BrechaRow }>(null);
    const [chartView, setChartView] = useState<'donut' | 'radar'>('donut');
    const [showAlertas, setShowAlertas] = useState(false);

    const sectionRef = useRef<HTMLDivElement>(null);
    const icfesZoneRef = useRef<HTMLDivElement>(null);

    function handleAreaSelect(key: IcfesAreaKey) {
        setArea(key);
        setNivelFocus(null);
    }

    /* ── all-areas stats ── */
    const allAreasStats = useMemo<AreaStat[]>(() => {
        return ICFES_AREA_OPTIONS.map((opt) => {
            const areaKey = opt.key as IcfesAreaKey;
            const evals = estudiantes
                .map((e) => ({ e, score: getAreaScore(e, areaKey) }))
                .filter((x) => (Number(x.score) || 0) > 0);

            const total = evals.length;
            const nv: Record<IcfesNivelKey, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
            let scoreSum = 0;

            evals.forEach(({ score }) => {
                const n = areaScoreToNivel(score, areaKey);
                if (n) nv[n]++;
                scoreSum += score;
            });

            const avg = total > 0 ? Math.round(scoreSum / total) : 0;
            const pctBueno = pct((nv[3] || 0) + (nv[4] || 0), total);
            const modalNivel = (Object.entries(nv) as Array<[`${IcfesNivelKey}`, number]>)
                .map(([k, v]) => ({ k: Number(k) as IcfesNivelKey, v }))
                .sort((a, b) => b.v - a.v)[0]?.k ?? null;

            return {
                key: areaKey,
                label: opt.label,
                shortLabel: AREA_SHORT[areaKey] ?? opt.label,
                total,
                niveles: nv,
                avg,
                pctBueno,
                modalNivel,
            };
        });
    }, [estudiantes]);

    /* ── current area stats ── */
    const computed = useMemo(() => {
        const evals = estudiantes
            .map((e) => ({ e, score: getAreaScore(e, area) }))
            .filter((x) => (Number(x.score) || 0) > 0);

        const totalEvaluados = evals.length;
        const niveles: Record<IcfesNivelKey, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
        const levelByStudent = new Map<Estudiante, IcfesNivelKey>();
        const scores: Array<{ score: number; nivel: IcfesNivelKey }> = [];

        evals.forEach(({ e, score }) => {
            const n = areaScoreToNivel(score, area);
            if (!n) return;
            niveles[n]++;
            levelByStudent.set(e, n);
            scores.push({ score, nivel: n });
        });

        const modalNivel: IcfesNivelKey | null = (Object.entries(niveles) as Array<[`${IcfesNivelKey}`, number]>)
            .map(([k, v]) => ({ k: Number(k) as IcfesNivelKey, v }))
            .sort((a, b) => b.v - a.v)[0]?.k ?? null;

        const marco = MARCO_ICFES_PLACEHOLDER[area];
        const allSkills = (Object.values(marco?.niveles || {}) as any[])
            .flatMap((n) => n?.skills || [])
            .filter((s: any) => s?.id);

        const rows: BrechaRow[] = [];
        (Object.entries(marco.niveles) as Array<[`${IcfesNivelKey}`, any]>).forEach(([nivelKeyStr, nivelObj]) => {
            const nivelObjetivo = Number(nivelKeyStr) as IcfesNivelKey;
            (nivelObj?.skills || []).forEach((sk: any) => {
                const afectados = totalEvaluados === 0
                    ? 0
                    : evals.filter(({ e }) => (levelByStudent.get(e) || 1) < nivelObjetivo).length;
                const pctAfectacion = pct(afectados, totalEvaluados);
                rows.push({
                    id: String(sk.id),
                    afirmacion: String(sk.afirmacion || ''),
                    evidencia: String(sk.evidencia || ''),
                    skillFaltante: String(sk.skillFaltante || ''),
                    moduloSugerido: String(sk.moduloSugerido || ''),
                    pctAfectacion,
                    criticidad: criticidadFromPct(pctAfectacion),
                    nivelObjetivo,
                });
            });
        });

        const rowsSorted = [...rows].sort((a, b) => b.pctAfectacion - a.pctAfectacion);
        const foco = rowsSorted[0] || null;

        const filteredRows = nivelFocus === null
            ? rowsSorted
            : rowsSorted.filter((r) => r.nivelObjetivo > nivelFocus);

        const brechasCriticas = rowsSorted.filter((r) => r.pctAfectacion > THRESHOLD);
        const topModules = rowsSorted.filter((r) => r.moduloSugerido).slice(0, 5).map((r) => r.moduloSugerido);
        const topBrechas = rowsSorted.slice(0, 5);

        const estrategias = [
            'Tutorías focalizadas por habilidad crítica (grupos pequeños, 2×/semana).',
            'Re-evaluación corta (quincenal) por micro-competencias para medir avance real.',
            'Secuencias didácticas: antes / durante / después con rúbrica por afirmación.',
            'Banco de ítems tipo ICFES por nivel (1→4) con retroalimentación inmediata.',
        ];

        return {
            totalEvaluados,
            niveles,
            modalNivel,
            foco,
            filteredRows,
            brechasCriticas,
            topModules,
            topBrechas,
            estrategias,
            hasMarcoData: allSkills.length > 0,
            scores,
        };
    }, [estudiantes, area, nivelFocus]);

    /* ── preguntas críticas: error acumulado > THRESHOLD ── */
    const preguntasCriticas = useMemo<PreguntaCritica[]>(() => {
        const qStats = new Map<string, { total: number; errors: number; correctaKey: string }>();
        const areaNorm = normalizeKey(area);

        for (const est of estudiantes) {
            const rd = (est as any).respuestas_detalladas;
            if (!rd || typeof rd !== 'object') continue;

            // Find matching area key (case-insensitive)
            const matchKey = Object.keys(rd).find((k) => normalizeKey(k) === areaNorm);
            if (!matchKey) continue;

            const areaRd = rd[matchKey];
            if (!areaRd || typeof areaRd !== 'object') continue;

            for (const [num, q] of Object.entries(areaRd) as Array<[string, any]>) {
                if (q?.invalidada) continue;
                const prev = qStats.get(num) ?? { total: 0, errors: 0, correctaKey: '' };
                prev.total++;
                if (q?.es_correcta === false) prev.errors++;
                if (!prev.correctaKey && q?.correcta) prev.correctaKey = String(q.correcta);
                qStats.set(num, prev);
            }
        }

        if (qStats.size === 0) {
            const matchKey = Object.keys(questionAnalysis).find((k) => normalizeKey(k) === areaNorm);
            const rows = matchKey ? questionAnalysis[matchKey] || [] : [];
            rows.forEach((q) => {
                const total = Number(q.total) || 0;
                const errors = Number(q.failed) || Math.round(total * (Number(q.rate) || 0));
                if (total <= 0) return;
                qStats.set(String(q.num), {
                    total,
                    errors,
                    correctaKey: String(q.correct || ''),
                });
            });
        }

        // Sort by question number numerically
        const rows = Array.from(qStats.entries())
            .map(([num, s]) => ({
                num,
                failRate: pct(s.errors, s.total),
                total: s.total,
                errors: s.errors,
                respuestaCorrecta: s.correctaKey,
                acumulado: 0,
            }))
            .filter((q) => q.failRate > THRESHOLD)
            .sort((a, b) => b.failRate - a.failRate);

        // Add accumulated error column (running sum of individual errors as % of total students)
        const totalEst = estudiantes.length || 1;
        let acum = 0;
        rows.forEach((q) => {
            acum += (q.errors / totalEst) * 100;
            q.acumulado = Math.min(100, Math.round(acum * 10) / 10);
        });

        return rows;
    }, [estudiantes, questionAnalysis, area]);

    const hasAreaScoreData = computed.totalEvaluados > 0;
    const hasQuestionDataForArea = useMemo(() => {
        const areaNorm = normalizeKey(area);
        const matchKey = Object.keys(questionAnalysis || {}).find((k) => normalizeKey(k) === areaNorm);
        return !!matchKey && (questionAnalysis[matchKey] || []).some((q) => (Number(q.total) || 0) > 0);
    }, [questionAnalysis, area]);

    const levelBars = ([1, 2, 3, 4] as IcfesNivelKey[]).map((nivel) => {
        const count = computed.niveles[nivel] || 0;
        const pctLevel = pct(count, computed.totalEvaluados);
        return { nivel, label: ICFES_NIVEL_LABEL[nivel], count, pct: pctLevel };
    });

    /* ────────────────────────────────────────────────────────────────────── */

    return (
        <div
            className="space-y-6 min-w-0 max-w-full overflow-x-hidden"
            ref={sectionRef}
        >
            <div ref={icfesZoneRef} className="space-y-6 min-w-0">
            {/* ── HEADER ──────────────────────────────────────────────────── */}
            <CoordCard stripe={pseudoPensum ? 'amber' : 'indigo'}>
                <SectionHeader
                    title={
                        nivelesDistribucionOnly
                            ? 'Distribución de puntajes por nivel ICFES'
                            : 'Dashboard Curricular y Niveles de Desempeño (ICFES)'
                    }
                    description={
                        nivelesDistribucionOnly
                            ? 'Donut y histograma por área según umbrales oficiales ICFES.'
                            : pseudoPensum
                              ? 'Sin metadata curricular: este módulo asume el rol de guía principal y activa Ruta de Nivelación Automática.'
                              : 'Con pensum activo: este módulo funciona como reporte complementario para coordinación.'
                    }
                    accent={pseudoPensum ? 'var(--coord-warning)' : 'var(--coord-accent)'}
                    icon={<Layers size={16} />}
                    right={
                        <button
                            type="button"
                            className="coord-btn-ghost"
                            onClick={() => setModal({ type: 'metodologia' })}
                        >
                            Metodología
                        </button>
                    }
                />

                {!computed.hasMarcoData && (
                    <p className="mt-2 text-xs coord-text-muted">Marco de referencia: scaffold placeholder activo.</p>
                )}
            </CoordCard>

            {/* ── KPI PANEL ───────────────────────────────────────────────── */}
            <CoordCard stripe="violet">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <SectionHeader
                        title="Panel ejecutivo"
                        description="KPIs del área seleccionada."
                        accent="var(--coord-accent)"
                        icon={<Target size={16} />}
                    />
                    {/* Alertas button */}
                    {(computed.brechasCriticas.length > 0 || preguntasCriticas.length > 0) && (
                        <button
                            type="button"
                            onClick={() => setShowAlertas(true)}
                            className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all sm:w-auto sm:justify-start"
                            style={{
                                background: 'rgba(251,113,133,0.12)',
                                border: '1.5px solid rgba(251,113,133,0.45)',
                                color: '#fb7185',
                                boxShadow: '0 0 16px rgba(251,113,133,0.15)',
                            }}
                        >
                            <ShieldAlert size={14} />
                            <span>
                                {computed.brechasCriticas.length + preguntasCriticas.length} alertas críticas
                            </span>
                            <span
                                className="w-2 h-2 rounded-full animate-pulse"
                                style={{ background: '#fb7185', boxShadow: '0 0 6px #fb7185' }}
                            />
                        </button>
                    )}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                    <KpiTile label="Total evaluados" value={computed.totalEvaluados} tone="neutral" />
                    <KpiTile
                        label="Nivel modal"
                        value={computed.modalNivel ? ICFES_NIVEL_NAME[computed.modalNivel] : '—'}
                        tone="info"
                    />
                    <button
                        type="button"
                        className="min-w-0 w-full text-left transition-opacity hover:opacity-80"
                        onClick={() => (computed.brechasCriticas.length > 0 || preguntasCriticas.length > 0) && setShowAlertas(true)}
                    >
                        <KpiTile
                            label="Foco de alerta principal"
                            value={computed.foco ? `${computed.foco.criticidad}: ${computed.foco.moduloSugerido || 'Brecha crítica'}` : '—'}
                            sub={computed.foco ? `${computed.foco.pctAfectacion}% afectados · clic para ver todas` : undefined}
                            tone={computed.foco?.criticidad === 'Alta' ? 'danger' : computed.foco?.criticidad === 'Media' ? 'warning' : 'neutral'}
                            icon={<AlertTriangle size={14} />}
                        />
                    </button>
                </div>
            </CoordCard>

            {/* ── CHART TOGGLE: DONUT / RADAR ──────────────────────────────── */}
            <CoordCard stripe="cyan" data-coord-tour={TourAnchors.desempenoCurricularDonut}>
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <SectionHeader
                        title={chartView === 'donut' ? 'Distribución por niveles' : 'Radar comparativo — todas las áreas'}
                        description={chartView === 'donut'
                            ? 'Clic en un segmento del donut para filtrar brechas hacia el nivel superior.'
                            : 'Radar de desempeño promedio por área. Clic en punto para cambiar el área activa.'}
                        accent="var(--coord-info)"
                        icon={<Target size={16} />}
                    />
                    <div
                        className="flex shrink-0 rounded-xl overflow-hidden"
                        style={{ border: '1px solid var(--coord-border)' }}
                    >
                        {(['donut', 'radar'] as const).map((v) => (
                            <button
                                key={v}
                                type="button"
                                className="px-3 py-1.5 text-xs font-semibold capitalize transition-colors"
                                style={{
                                    background: chartView === v ? 'var(--coord-accent)' : 'transparent',
                                    color: chartView === v ? '#fff' : 'var(--coord-text-secondary)',
                                }}
                                onClick={() => setChartView(v)}
                            >
                                {v === 'donut' ? 'Área' : 'Radar'}
                            </button>
                        ))}
                    </div>
                </div>

                {chartView === 'donut' ? (
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                        <div className="flex flex-col items-center gap-3 shrink-0">
                            <DonutChart
                                niveles={computed.niveles}
                                total={computed.totalEvaluados}
                                modalNivel={computed.modalNivel}
                                nivelFocus={nivelFocus}
                                onSegmentClick={(nivel) => setNivelFocus((prev) => (prev === nivel ? null : nivel))}
                                size={200}
                            />
                            {nivelFocus !== null && (
                                <button
                                    type="button"
                                    className="text-[10px] font-bold coord-btn-ghost px-3 py-1"
                                    onClick={() => setNivelFocus(null)}
                                >
                                    Quitar filtro
                                </button>
                            )}
                        </div>

                        {/* Level legend */}
                        <div className="flex-1 min-w-0 space-y-2 w-full">
                            <div className="text-[10px] font-bold uppercase tracking-widest coord-text-muted mb-3">
                                Niveles · Clic para filtrar brechas
                            </div>
                            {levelBars.map((b) => {
                                const isActive = nivelFocus === b.nivel;
                                const color = NIVEL_COLORS[b.nivel];
                                return (
                                    <button
                                        key={b.nivel}
                                        type="button"
                                        className="w-full text-left rounded-xl border transition-all px-3 py-2"
                                        style={{
                                            borderColor: isActive ? color : `${color}44`,
                                            background: isActive ? `${color}18` : `${color}06`,
                                            boxShadow: isActive ? `0 0 12px ${color}22` : undefined,
                                        }}
                                        onClick={() => setNivelFocus((prev) => (prev === b.nivel ? null : b.nivel))}
                                        aria-pressed={isActive}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{ background: color, boxShadow: `0 0 5px ${color}88` }}
                                                />
                                                <span className="text-xs font-semibold coord-text-head">{b.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs shrink-0">
                                                <span className="font-black tabular-nums" style={{ color }}>
                                                    {b.pct}%
                                                </span>
                                                <span className="coord-text-muted">({b.count})</span>
                                            </div>
                                        </div>
                                        <div
                                            className="mt-1.5 h-1.5 rounded-full overflow-hidden"
                                            style={{ background: 'var(--coord-trace-bg)' }}
                                        >
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${Math.min(100, Math.max(0, b.pct))}%`,
                                                    background: color,
                                                    boxShadow: `0 0 6px ${color}66`,
                                                    transition: 'width 0.5s ease',
                                                }}
                                            />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <RadarChart
                            areas={allAreasStats}
                            selected={area}
                            onSelect={handleAreaSelect}
                            size={280}
                        />
                    </div>
                )}
            </CoordCard>

            {/* ── DISTRIBUCIÓN POR NIVELES (área chart) ────────────────────── */}
            <CoordCard stripe="violet">
                <SectionHeader
                    title="Distribución de puntajes por nivel ICFES"
                    description="Rangos oficiales por área. Cada punto = conteo de estudiantes en ese rango."
                    accent="var(--coord-accent)"
                    icon={<TrendingUp size={16} />}
                />
                {computed.scores.length > 0 ? (
                    <div
                        className="mt-4 min-w-0 max-w-full overflow-hidden rounded-xl p-4"
                        style={{ background: 'var(--coord-trace-bg)', border: '1px solid var(--coord-border)' }}
                    >
                        <DistribucionAreaChart
                            scores={computed.scores}
                            areaLabel={AREA_SHORT[area] ?? area}
                            areaKey={area}
                            thresholds={ICFES_AREA_THRESHOLDS[area]}
                        />
                    </div>
                ) : (
                    <div className="mt-4">
                        <SoftEmptyState
                            title="Sin puntajes válidos para esta área"
                            body="No se puede evaluar desempeño todavía: faltan puntajes de área mayores a 0. Revisa carga de resultados antes de interpretar este bloque."
                            tone="warning"
                            icon={<TrendingUp size={18} />}
                        />
                    </div>
                )}
            </CoordCard>

            {/* ── MATRIZ DE BRECHAS (solo con pensum / metadata por ítem) ───── */}
            {!nivelesDistribucionOnly && (
            <CoordCard stripe="emerald" data-coord-tour={TourAnchors.desempenoCurricularBrechas}>
                <SectionHeader
                    title="Matriz de brechas vs. Marco de Referencia"
                    description="Competencias fallidas (Afirmaciones/Evidencias) inferidas desde el nivel actual hacia niveles superiores."
                    accent="var(--coord-success)"
                    icon={<BookOpen size={16} />}
                    right={
                        computed.topBrechas.length > 0 ? (
                            <span className="coord-pill" data-tone="info">
                                Top {computed.topBrechas.length}
                            </span>
                        ) : null
                    }
                />

                {nivelFocus !== null && (
                    <div
                        className="mt-3 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs"
                        style={{
                            background: `${NIVEL_COLORS[nivelFocus]}12`,
                            border: `1px solid ${NIVEL_COLORS[nivelFocus]}44`,
                        }}
                    >
                        <span className="coord-text-muted">
                            Filtro activo: brechas hacia niveles superiores al{' '}
                            <strong style={{ color: NIVEL_COLORS[nivelFocus] }}>{NIVEL_SHORT[nivelFocus]}</strong>
                        </span>
                        <button
                            type="button"
                            className="text-[10px] font-bold coord-btn-ghost px-2 py-0.5"
                            onClick={() => setNivelFocus(null)}
                        >
                            Quitar
                        </button>
                    </div>
                )}

                <div className="mt-4 space-y-3">
                    {computed.filteredRows.length === 0 ? (
                        <SoftEmptyState
                            title={hasAreaScoreData ? 'Sin brechas para este filtro' : 'Datos insuficientes para detectar brechas'}
                            body={
                                !hasAreaScoreData
                                    ? 'No hay puntajes válidos para esta área. No se debe interpretar como buen desempeño hasta corregir la carga.'
                                    : nivelFocus !== null
                                      ? 'No hay competencias pendientes hacia niveles superiores para el filtro activo. Quita el filtro o cambia de área.'
                                      : 'No se detectaron brechas curriculares relevantes con los datos disponibles. Mantener seguimiento.'
                            }
                            tone={hasAreaScoreData ? 'success' : 'warning'}
                            icon={hasAreaScoreData ? <BookOpen size={18} /> : <AlertTriangle size={18} />}
                        />
                    ) : (
                        computed.filteredRows.map((r) => (
                            <details
                                key={r.id}
                                className="rounded-xl border border-[var(--coord-border)] bg-[var(--coord-surface)] open:bg-[var(--coord-surface-elevated)] transition-colors"
                            >
                                <summary className="cursor-pointer select-none px-4 py-3 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold coord-text-head">
                                            {r.afirmacion || 'Competencia / Afirmación'}
                                        </div>
                                        <div className="mt-1 text-xs coord-text-muted">
                                            {r.skillFaltante || '—'} · Obj.: {ICFES_NIVEL_NAME[r.nivelObjetivo]}
                                        </div>
                                        <button
                                            type="button"
                                            className="mt-2 text-[11px] font-semibold underline underline-offset-4"
                                            style={{ color: 'var(--coord-accent)' }}
                                            onClick={(e) => { e.preventDefault(); setModal({ type: 'brecha', row: r }); }}
                                        >
                                            Ver detalle
                                        </button>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <div className="text-base font-extrabold tabular-nums coord-text-primary">
                                            {r.pctAfectacion}%
                                        </div>
                                        <div
                                            className="text-xs font-bold"
                                            style={{
                                                color: toneForCriticidad(r.criticidad) === 'danger'
                                                    ? 'var(--coord-danger)'
                                                    : toneForCriticidad(r.criticidad) === 'warning'
                                                      ? 'var(--coord-warning)'
                                                      : 'var(--coord-text-secondary)',
                                            }}
                                        >
                                            {r.criticidad}
                                        </div>
                                    </div>
                                </summary>
                                <div className="px-4 pb-4 pt-0 space-y-2">
                                    <div className="text-xs coord-text-muted">Evidencia (Marco)</div>
                                    <div className="text-sm coord-text-body leading-relaxed">{r.evidencia || '—'}</div>
                                    {pseudoPensum && r.moduloSugerido && (
                                        <div className="mt-3 rounded-lg border border-[var(--coord-border)] bg-[var(--coord-trace-bg)] px-3 py-2">
                                            <div className="text-xs coord-text-muted">Módulo sugerido</div>
                                            <div className="text-sm font-medium coord-text-head">{r.moduloSugerido}</div>
                                        </div>
                                    )}
                                </div>
                            </details>
                        ))
                    )}
                </div>

                {computed.topBrechas.length > 0 && (
                    <div className="mt-5 rounded-xl border border-[var(--coord-border)] bg-[var(--coord-trace-bg)] p-4">
                        <div className="text-[11px] font-bold uppercase tracking-wider coord-text-muted mb-3">
                            Top brechas por afectación
                        </div>
                        <div className="space-y-2">
                            {computed.topBrechas.map((b) => (
                                <button
                                    key={`top-${b.id}`}
                                    type="button"
                                    className="w-full text-left rounded-lg px-3 py-2 border border-[var(--coord-border)] hover:bg-[var(--coord-trace-bg-strong)] transition-colors"
                                    onClick={() => setModal({ type: 'brecha', row: b })}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold coord-text-head line-clamp-1">
                                                {b.moduloSugerido || b.afirmacion || 'Brecha'}
                                            </div>
                                            <div className="text-xs coord-text-muted">
                                                {ICFES_NIVEL_NAME[b.nivelObjetivo]} ·{' '}
                                                <span
                                                    className="font-bold"
                                                    style={{
                                                        color: b.criticidad === 'Alta'
                                                            ? 'var(--coord-danger)'
                                                            : b.criticidad === 'Media'
                                                              ? 'var(--coord-warning)'
                                                              : 'var(--coord-text-secondary)',
                                                    }}
                                                >
                                                    {b.criticidad}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-base font-extrabold tabular-nums coord-text-primary">
                                            {b.pctAfectacion}%
                                        </div>
                                    </div>
                                    <div
                                        className="mt-2 h-2 rounded-full overflow-hidden"
                                        style={{ background: 'var(--coord-trace-bg-strong)' }}
                                    >
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${Math.min(100, Math.max(0, b.pctAfectacion))}%`,
                                                background: b.criticidad === 'Alta'
                                                    ? 'var(--coord-danger)'
                                                    : b.criticidad === 'Media'
                                                      ? 'var(--coord-warning)'
                                                      : 'var(--coord-info)',
                                            }}
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {computed.topBrechas.length === 0 && (
                    <div className="mt-5">
                        <SoftEmptyState
                            title={
                                hasAreaScoreData || hasQuestionDataForArea
                                    ? 'Sin top de brechas'
                                    : 'Sin base para ranking de brechas'
                            }
                            body={
                                hasAreaScoreData || hasQuestionDataForArea
                                    ? 'No hay afectaciones suficientes para construir un ranking de brechas. Este bloque queda en seguimiento.'
                                    : 'Faltan puntajes o agregados de preguntas para esta área. Verifica datos antes de concluir que no hay brechas.'
                            }
                            tone={hasAreaScoreData || hasQuestionDataForArea ? 'success' : 'warning'}
                            icon={hasAreaScoreData || hasQuestionDataForArea ? undefined : <AlertTriangle size={18} />}
                        />
                    </div>
                )}
            </CoordCard>
            )}

            {/* ── ESTRATEGIAS / RUTA (solo modo curricular completo) ─────── */}
            {!nivelesDistribucionOnly && (
            <CoordCard stripe={pseudoPensum ? 'amber' : 'indigo'}>
                <SectionHeader
                    title={pseudoPensum ? 'Ruta de nivelación y recomendaciones' : 'Estrategias de aula'}
                    description={
                        pseudoPensum
                            ? 'Plan de choque curricular sugerido desde brechas detectadas.'
                            : 'Recomendaciones pedagógicas para acompañar el pensum actual.'
                    }
                    accent={pseudoPensum ? 'var(--coord-warning)' : 'var(--coord-accent)'}
                    icon={<Compass size={16} />}
                />
                <div className="mt-4">
                    <ul className="space-y-2">
                        {(pseudoPensum
                            ? computed.topModules.length > 0
                                ? computed.topModules
                                : ['Módulo sugerido: (pendiente de cargar marco oficial)']
                            : computed.estrategias
                        ).map((s, i) => (
                            <li
                                key={`${s}-${i}`}
                                className="rounded-xl border border-[var(--coord-border)] bg-[var(--coord-trace-bg)] px-4 py-3 text-sm coord-text-body"
                            >
                                {pseudoPensum && (
                                    <div className="text-xs coord-text-muted mb-0.5">Módulo sugerido</div>
                                )}
                                {s}
                            </li>
                        ))}
                    </ul>
                </div>
            </CoordCard>
            )}

            </div>

            <CoordinatorPerformanceAreaNav
                items={allAreasStats.map((a) => ({ key: a.key, label: a.shortLabel }))}
                activeKey={area}
                onSelect={(key) => handleAreaSelect(key as IcfesAreaKey)}
                layout="floating"
                floatingZoneRef={icfesZoneRef}
                label="Seleccionar área ICFES"
            />

            {/* ── MODALS ───────────────────────────────────────────────────── */}
            <CoordinadorInsightModal
                open={modal?.type === 'metodologia'}
                onClose={() => setModal(null)}
                title="Metodología (ICFES → Brechas → Ruta)"
                subtitle="Cómo se arma este panel y cómo leerlo."
                accent="cyan"
                size="lg"
            >
                <CoordInsightHighlight>
                    Este panel cruza <strong>Niveles de desempeño</strong> con el{' '}
                    <strong>Marco de Referencia ICFES</strong>. Al identificar el nivel de un estudiante, se infieren
                    las competencias que aún no domina.
                </CoordInsightHighlight>

                <CoordInsightSection title="Elementos del panel" accent="indigo">
                    <CoordInsightBulletList>
                        <li>
                            <strong>Selector de área</strong>: burbuja flotante; solo visible mientras recorres el bloque
                            ICFES (Dashboard Curricular → Ruta de nivelación).
                        </li>
                        <li>
                            <strong>Donut</strong>: distribución Nivel 1–4. Clic en segmento filtra las brechas.
                        </li>
                        <li>
                            <strong>Radar</strong>: comparativa de promedio entre todas las áreas. Clic en punto cambia
                            el área activa.
                        </li>
                        <li>
                            <strong>Histograma</strong>: frecuencia de estudiantes por rango de puntaje; color = nivel
                            dominante.
                        </li>
                        <li>
                            <strong>Criticidad Alta</strong>: afecta a más del 50% del grupo.
                        </li>
                    </CoordInsightBulletList>
                </CoordInsightSection>
            </CoordinadorInsightModal>

            <CoordinadorInsightModal
                open={modal?.type === 'brecha'}
                onClose={() => setModal(null)}
                title={modal?.type === 'brecha' ? (modal.row.moduloSugerido || 'Detalle de brecha') : ''}
                subtitle={
                    modal?.type === 'brecha'
                        ? `${ICFES_NIVEL_NAME[modal.row.nivelObjetivo]} · ${modal.row.pctAfectacion}% afectados · ${modal.row.criticidad}`
                        : undefined
                }
                footer={
                    modal?.type === 'brecha' ? (
                        <div className="flex justify-end">
                            <button className="coord-btn-ghost" onClick={() => setModal(null)} type="button">Cerrar</button>
                        </div>
                    ) : undefined
                }
            >
                {modal?.type === 'brecha' && (
                    <div className="space-y-3">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-wider coord-text-muted">Afirmación (Marco)</div>
                            <div className="mt-1 coord-text-body">{modal.row.afirmacion || '—'}</div>
                        </div>
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-wider coord-text-muted">Evidencia</div>
                            <div className="mt-1 coord-text-body">{modal.row.evidencia || '—'}</div>
                        </div>
                        <div className="rounded-xl border border-[var(--coord-border)] bg-[var(--coord-trace-bg)] p-3">
                            <div className="text-[11px] font-bold uppercase tracking-wider coord-text-muted">Skill faltante</div>
                            <div className="mt-1 coord-text-head font-semibold">{modal.row.skillFaltante || '—'}</div>
                        </div>
                        {pseudoPensum && modal.row.moduloSugerido && (
                            <div className="rounded-xl border border-[var(--coord-border)] bg-[var(--coord-warning-soft)] p-3">
                                <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--coord-warning)' }}>
                                    Módulo sugerido
                                </div>
                                <div className="mt-1 coord-text-head font-semibold">{modal.row.moduloSugerido}</div>
                            </div>
                        )}
                    </div>
                )}
            </CoordinadorInsightModal>

            {/* ── ALERTAS CRÍTICAS MODAL ───────────────────────────────────── */}
            <AlertasModal
                open={showAlertas}
                onClose={() => setShowAlertas(false)}
                areaLabel={AREA_SHORT[area] ?? area}
                brechas={computed.brechasCriticas}
                preguntas={preguntasCriticas}
            />

        </div>
    );
}
