'use client';

import React, { useMemo, useState } from 'react';
import { BarChart3, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { SG_AREA_COLORS } from '@shared/lib/sgAreaColors';

interface AreaData {
    label: string;
    value: number;
    maxValue?: number;
}

interface RadarChartProps {
    data: AreaData[];
    size?: number;
    showLabels?: boolean;
    fillColor?: string;
    strokeColor?: string;
}

const SHORT_TO_AREA: Record<string, keyof typeof SG_AREA_COLORS> = {
    LEC: 'lectura crítica',
    MAT: 'matemáticas',
    SOC: 'sociales y ciudadanas',
    CIE: 'ciencias naturales',
    CIEN: 'ciencias naturales',
    NAT: 'ciencias naturales',
    ING: 'inglés',
};

function getAreaConfig(label: string) {
    const key = label.toUpperCase().trim();
    const areaKey = SHORT_TO_AREA[key] ?? SHORT_TO_AREA[key.substring(0, 3)] ?? 'lectura crítica';
    const c = SG_AREA_COLORS[areaKey];
    return {
        color: c.hex,
        gradient: c.gradient,
        glow: `${c.hex}80`,
        fullName: c.label,
    };
}

function getPerformanceLevel(value: number, max: number = 100) {
    const percent = (value / max) * 100;
    if (percent >= 70) return { label: 'Excelente', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: TrendingUp };
    if (percent >= 55) return { label: 'Bueno', color: 'text-cyan-400', bg: 'bg-cyan-500/20', icon: TrendingUp };
    if (percent >= 40) return { label: 'Regular', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: Minus };
    return { label: 'Bajo', color: 'text-rose-400', bg: 'bg-rose-500/20', icon: TrendingDown };
}

function polarPoint(cx: number, cy: number, radius: number, index: number, total: number) {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
    };
}

export default function RadarChart({ data, size = 220 }: RadarChartProps) {
    const [hoveredArea, setHoveredArea] = useState<string | null>(null);
    const cx = size / 2;
    const cy = size / 2;
    const maxRadius = size * 0.36;

    const enriched = useMemo(
        () =>
            data.map((d) => ({
                ...d,
                config: getAreaConfig(d.label),
                max: d.maxValue ?? 100,
                pct: Math.min(100, Math.max(0, ((d.value ?? 0) / (d.maxValue ?? 100)) * 100)),
            })),
        [data],
    );

    const polygonPoints = enriched
        .map((d, i) => {
            const r = (d.pct / 100) * maxRadius;
            const p = polarPoint(cx, cy, r, i, enriched.length);
            return `${p.x},${p.y}`;
        })
        .join(' ');

    const gridLevels = [0.25, 0.5, 0.75, 1];

    const active = hoveredArea
        ? enriched.find((d) => d.label === hoveredArea) ?? enriched[0]
        : enriched.reduce((best, d) => (d.value > best.value ? d : best), enriched[0]);

    const activeLevel = active ? getPerformanceLevel(active.value, active.max) : null;
    const ActiveIcon = activeLevel?.icon ?? BarChart3;

    return (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="relative mx-auto shrink-0" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
                    {gridLevels.map((level) => {
                        const pts = enriched
                            .map((_, i) => {
                                const p = polarPoint(cx, cy, maxRadius * level, i, enriched.length);
                                return `${p.x},${p.y}`;
                            })
                            .join(' ');
                        return (
                            <polygon
                                key={level}
                                points={pts}
                                fill="none"
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth={1}
                            />
                        );
                    })}
                    {enriched.map((d, i) => {
                        const outer = polarPoint(cx, cy, maxRadius, i, enriched.length);
                        return (
                            <line
                                key={`axis-${d.label}`}
                                x1={cx}
                                y1={cy}
                                x2={outer.x}
                                y2={outer.y}
                                stroke="rgba(255,255,255,0.06)"
                                strokeWidth={1}
                            />
                        );
                    })}
                    <polygon
                        points={polygonPoints}
                        fill="rgba(99,102,241,0.18)"
                        stroke="rgba(139,92,246,0.85)"
                        strokeWidth={2}
                        style={{ filter: 'drop-shadow(0 0 12px rgba(139,92,246,0.35))' }}
                    />
                    {enriched.map((d, i) => {
                        const r = (d.pct / 100) * maxRadius;
                        const p = polarPoint(cx, cy, r, i, enriched.length);
                        const isHovered = hoveredArea === d.label;
                        return (
                            <circle
                                key={`dot-${d.label}`}
                                cx={p.x}
                                cy={p.y}
                                r={isHovered ? 6 : 4}
                                fill={d.config.color}
                                stroke="rgba(255,255,255,0.9)"
                                strokeWidth={1.5}
                                style={{
                                    filter: isHovered ? `drop-shadow(0 0 8px ${d.config.glow})` : undefined,
                                    transition: 'r 150ms ease-out',
                                }}
                            />
                        );
                    })}
                </svg>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                        ICFES
                    </div>
                </div>
            </div>

            <div className="min-w-0 flex-1 space-y-2">
                {active && activeLevel ? (
                    <div
                        className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-3"
                        style={{ boxShadow: `0 0 24px ${active.config.glow.replace('80', '20')}` }}
                    >
                        <div className="flex items-center gap-2">
                            <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: active.config.color }}
                                aria-hidden
                            />
                            <p className="text-sm font-bold text-white">{active.config.fullName}</p>
                            <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${activeLevel.bg} ${activeLevel.color}`}>
                                <ActiveIcon className="h-3 w-3" aria-hidden />
                                {activeLevel.label}
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-black tabular-nums text-white">{Math.round(active.value)}</p>
                    </div>
                ) : null}

                <ul className="space-y-1.5">
                    {enriched.map((d) => {
                        const level = getPerformanceLevel(d.value, d.max);
                        const isHovered = hoveredArea === d.label;
                        return (
                            <li key={d.label}>
                                <button
                                    type="button"
                                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${
                                        isHovered
                                            ? 'border-white/15 bg-white/[0.06]'
                                            : 'border-transparent bg-white/[0.02] hover:bg-white/[0.04]'
                                    }`}
                                    style={
                                        isHovered
                                            ? { boxShadow: `inset 3px 0 0 0 ${d.config.color}` }
                                            : undefined
                                    }
                                    onMouseEnter={() => setHoveredArea(d.label)}
                                    onMouseLeave={() => setHoveredArea(null)}
                                    onFocus={() => setHoveredArea(d.label)}
                                    onBlur={() => setHoveredArea(null)}
                                >
                                    <span
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-white"
                                        style={{ backgroundColor: `${d.config.color}33`, color: d.config.color }}
                                    >
                                        {d.label.slice(0, 3)}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate text-xs font-semibold text-white/80">
                                                {d.config.fullName}
                                            </span>
                                            <span className="text-sm font-black tabular-nums text-white">
                                                {Math.round(d.value)}
                                            </span>
                                        </div>
                                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${d.pct}%`, backgroundColor: d.config.color }}
                                            />
                                        </div>
                                    </div>
                                    <span className={`hidden text-[10px] font-bold sm:inline ${level.color}`}>
                                        {level.label}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
