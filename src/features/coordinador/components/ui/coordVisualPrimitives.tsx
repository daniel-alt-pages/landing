'use client';

import type { ReactNode } from 'react';
import type { DominioEstado } from '@features/coordinador/lib/competencyDominanceStats';

/** Barra de progreso con brillo — mismo lenguaje visual que Desempeño. */
export function GlowBar({
    pctVal,
    color,
    height = 8,
}: {
    pctVal: number;
    color: string;
    height?: number;
}) {
    const clamped = Math.min(100, Math.max(0, pctVal));
    return (
        <div
            className="rounded-full overflow-hidden"
            style={{
                height,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            <div
                className="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
                style={{
                    width: `${clamped}%`,
                    background: `linear-gradient(90deg, ${color}88, ${color})`,
                    boxShadow: `0 0 10px ${color}66, 0 0 20px ${color}22`,
                }}
            />
        </div>
    );
}

/** Anillo de dominio con halo. */
export function DominioRing({
    pct,
    color,
    size = 56,
    centerLabel,
}: {
    pct: number;
    color: string;
    size?: number;
    centerLabel?: ReactNode;
}) {
    const r = (size - 10) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <div
                className="absolute inset-0 rounded-full opacity-40 blur-md"
                style={{ background: color }}
                aria-hidden
            />
            <svg width={size} height={size} className="relative -rotate-90" aria-hidden>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={6}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={6}
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
                />
            </svg>
            {centerLabel != null && (
                <span className="absolute inset-0 flex items-center justify-center text-xs font-black tabular-nums coord-text-head">
                    {centerLabel}
                </span>
            )}
        </div>
    );
}

export const ESTADO_DOMINIO_UI: Record<
    DominioEstado,
    { label: string; color: string; from: string; to: string }
> = {
    dominada: { label: 'Dominada', color: '#34d399', from: '#064e3b', to: '#065f46' },
    en_desarrollo: { label: 'En desarrollo', color: '#fbbf24', from: '#451a03', to: '#78350f' },
    por_reforzar: { label: 'Por reforzar', color: '#fb7185', from: '#4c0519', to: '#881337' },
    urgente: { label: 'Prioridad urgente', color: '#f43f5e', from: '#4c0519', to: '#9f1239' },
};

/** Colores del nivel ICFES (badge de rango), distintos del estado de dominio/competencia. */
export const NIVEL_ICFES_UI: Record<
    1 | 2 | 3 | 4,
    { label: string; color: string; from: string; to: string }
> = {
    1: { label: 'Nivel 1', color: '#f87171', from: '#450a0a', to: '#7f1d1d' },
    2: { label: 'Nivel 2', color: '#fbbf24', from: '#451a03', to: '#78350f' },
    3: { label: 'Nivel 3', color: '#60a5fa', from: '#1e3a5f', to: '#1e40af' },
    4: { label: 'Nivel 4', color: '#22d3ee', from: '#083344', to: '#155e75' },
};

export function colorEstadoDominio(estado: DominioEstado): string {
    return ESTADO_DOMINIO_UI[estado]?.color ?? ESTADO_DOMINIO_UI.en_desarrollo.color;
}

export function EstadoDominioBadge({ estado }: { estado: DominioEstado }) {
    const cfg = ESTADO_DOMINIO_UI[estado] ?? ESTADO_DOMINIO_UI.en_desarrollo;
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
            style={{
                background: `linear-gradient(135deg, ${cfg.from}, ${cfg.to})`,
                color: cfg.color,
                border: `1px solid ${cfg.color}55`,
                boxShadow: `0 0 12px ${cfg.color}33`,
            }}
        >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
            {cfg.label}
        </span>
    );
}

export function CoordMiniKpi({
    label,
    value,
    sub,
    color = 'var(--coord-accent)',
}: {
    label: string;
    value: string | number;
    sub?: string;
    color?: string;
}) {
    return (
        <div
            className="rounded-xl p-3 space-y-1"
            style={{
                background: `linear-gradient(135deg, ${color}0d, transparent)`,
                border: `1px solid ${color}28`,
                boxShadow: `0 0 16px ${color}0d`,
            }}
        >
            <div
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: `${color}bb` }}
            >
                {label}
            </div>
            <div className="text-xl font-black tabular-nums coord-text-head" style={{ color }}>
                {value}
            </div>
            {sub ? <div className="text-[10px] coord-text-muted leading-tight">{sub}</div> : null}
        </div>
    );
}
