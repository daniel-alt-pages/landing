'use client';
import { ReactNode, useState } from 'react';
import { Users, Percent, Activity, ChevronDown } from 'lucide-react';
import type { InstitutionMetrics } from '@features/coordinador/hooks/useCoordinadorData';
import { scoreRangeCenter, scoreRangeRows } from '@features/coordinador/lib/globalScoreStats';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';

/**
 * Bloque de 3 grupos estadísticos del puntaje global.
 *
 * Reproduce el bloque que existía en producción y se perdió:
 *   1. Tamaño del grupo y extremos (con histograma mini)
 *   2. Percentiles del puntaje global (con escala 0-500)
 *   3. Dispersión del grupo (con curva de distribución normal)
 *
 * Más una franja inferior con: Promedio · Mediana · Sesgo (Pearson) · CV · N.
 */

interface Props {
    inst: InstitutionMetrics;
}

interface ChipProps {
    value: ReactNode;
    label: string;
    sub?: string;
    color?: string;
}

function StatChip({ value, label, sub, color = 'rgba(255,255,255,0.06)' }: ChipProps) {
    const [open, setOpen] = useState(false);
    const interactive = Boolean(sub);

    return (
        <div
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            className={`group rounded-xl px-3 py-2.5 w-full flex flex-col gap-1 transition-all duration-300 ${
                interactive ? 'cursor-pointer hover:-translate-y-0.5 hover:bg-white/[0.07] hover:shadow-[0_14px_35px_rgba(8,47,73,0.24)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300/50' : ''
            }`}
            style={{
                background:
                    'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(15,23,42,0.3))',
                border: `1px solid ${color}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 24px ${color}22`,
            }}
            onClick={() => interactive && setOpen(v => !v)}
            onKeyDown={(e) => {
                if (!interactive) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setOpen(v => !v);
                }
            }}
        >
            <div className="flex items-start justify-between gap-2 min-w-0">
                <p
                    className="text-[10px] lg:text-[11px] font-medium leading-snug flex-1 min-w-0"
                    style={{ color: 'var(--coord-text-secondary)' }}
                >
                    {label}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                    <span
                        className="text-[13px] lg:text-[14px] font-bold leading-none tabular-nums tracking-tight"
                        style={{ color: 'var(--coord-text-primary)', textShadow: '0 0 14px rgba(34,211,238,0.18)' }}
                    >
                        {value}
                    </span>
                    {interactive && (
                        <ChevronDown
                            className={`w-3.5 h-3.5 shrink-0 opacity-45 transition-transform ${open ? 'rotate-180' : ''}`}
                            style={{ color: 'var(--coord-text-tertiary)' }}
                            aria-hidden
                        />
                    )}
                </div>
            </div>
            {open && sub && (
                <p
                    className="text-[10px] pt-1.5 leading-snug border-t border-white/[0.06]"
                    style={{ color: 'var(--coord-text-tertiary)' }}
                >
                    {sub}
                </p>
            )}
        </div>
    );
}

/**
 * Histograma mini con eje X 0-500.
 * Se construye desde la distribución por rangos del hook.
 */
function HistogramMini({ inst }: Props) {
    const rows = scoreRangeRows(inst.distribucion);
    const max = Math.max(...rows.map((r) => r.count), 1);
    const W = 280, H = 72, pad = 6;
    const innerW = W - 2 * pad;
    const valueToX = (v: number) => pad + (Math.max(0, Math.min(500, v)) / 500) * innerW;
    const meanX = valueToX(inst.avg);
    const medianX = valueToX(inst.median);

    // Cada bin se coloca en el centro de su rango sobre la escala 0–500 (igual que media/mediana).
    const points = rows.map((row) => {
        const x = valueToX(scoreRangeCenter(row.range));
        const y = H - pad - (row.count / max) * (H - 2 * pad);
        return { x, y };
    });
    // Build smooth path
    const pathD = points.length === 0
        ? ''
        : `M ${points[0].x},${H - pad} ${points
              .map((p, i) =>
                  i === 0
                      ? `L ${p.x},${p.y}`
                      : `Q ${(points[i - 1].x + p.x) / 2},${(points[i - 1].y + p.y) / 2} ${p.x},${p.y}`
              )
              .join(' ')} L ${points[points.length - 1].x},${H - pad} Z`;

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[68px] lg:h-[72px]">
                <defs>
                    <linearGradient id="histFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
                    </linearGradient>
                </defs>
                <path d={pathD} fill="url(#histFill)" stroke="#a5b4fc" strokeWidth={1.5} />
                {/* mean line */}
                <line
                    x1={meanX}
                    x2={meanX}
                    y1={pad}
                    y2={H - pad}
                    stroke="#c4b5fd"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                />
                {/* median line */}
                <line
                    x1={medianX}
                    x2={medianX}
                    y1={pad}
                    y2={H - pad}
                    stroke="#34d399"
                    strokeDasharray="2 4"
                    strokeWidth={1.2}
                />
            </svg>
            <div className="flex items-center justify-center gap-3 mt-0.5 text-[9px] lg:text-[10px]" style={{ color: 'var(--coord-text-tertiary)' }}>
                <span><span style={{ color: '#c4b5fd' }}>—</span> Media {inst.avg}</span>
                <span><span style={{ color: '#34d399' }}>—</span> Mediana {inst.median}</span>
            </div>
        </div>
    );
}

function PercentileScale({ inst }: Props) {
    const W = 320, H = 28, pad = 8;
    const x = (v: number) => pad + (Math.max(0, Math.min(500, v)) / 500) * (W - 2 * pad);
    const markers: { v: number; label: string; color: string }[] = [
        { v: inst.p25, label: 'P25', color: '#fbbf24' },
        { v: inst.median, label: 'P50', color: '#a5b4fc' },
        { v: inst.p75, label: 'P75', color: '#a78bfa' },
        { v: inst.p90, label: 'P90', color: '#34d399' },
        { v: inst.avg, label: 'μ', color: '#f472b6' },
    ];
    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[26px] lg:h-[28px]">
                <defs>
                    <linearGradient id="scale" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="40%" stopColor="#f59e0b" />
                        <stop offset="65%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                </defs>
                <rect
                    x={pad}
                    y={H / 2 - 3}
                    width={W - 2 * pad}
                    height={6}
                    rx={3}
                    fill="url(#scale)"
                    opacity={0.55}
                />
                {markers.map(m => (
                    <line
                        key={m.label}
                        x1={x(m.v)}
                        x2={x(m.v)}
                        y1={H / 2 - 7}
                        y2={H / 2 + 7}
                        stroke={m.color}
                        strokeWidth={1.75}
                    />
                ))}
            </svg>
            <div className="flex items-center justify-between text-[9px] mt-1" style={{ color: 'var(--coord-text-tertiary)' }}>
                <span>0</span>
                <span>500</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
                {markers.map(m => (
                    <span
                        key={m.label}
                        className="text-[9px] lg:text-[10px] font-semibold px-1.5 py-0.5 rounded tabular-nums whitespace-nowrap"
                        style={{
                            background: `${m.color}1f`,
                            color: m.color,
                            border: `1px solid ${m.color}40`,
                        }}
                    >
                        {m.label} {Math.round(m.v)}
                    </span>
                ))}
            </div>
        </div>
    );
}

function DispersionBell({ inst }: Props) {
    // Curva normal escalada al ancho del SVG
    const W = 280, H = 72, pad = 6;
    const sigma = Math.max(inst.stdDev, 5);
    const mu = inst.avg;
    const xToValue = (px: number) => ((px - pad) / (W - 2 * pad)) * 500;
    const valueToY = (v: number) => {
        const z = (v - mu) / sigma;
        const phi = Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
        return phi;
    };
    const points: string[] = [];
    let maxPhi = 0;
    const samples: { x: number; phi: number }[] = [];
    for (let px = pad; px <= W - pad; px += 2) {
        const v = xToValue(px);
        const phi = valueToY(v);
        if (phi > maxPhi) maxPhi = phi;
        samples.push({ x: px, phi });
    }
    samples.forEach(s => {
        const y = H - pad - (s.phi / Math.max(maxPhi, 1e-9)) * (H - 2 * pad);
        points.push(`${s.x},${y}`);
    });
    const pathTop = `M ${points.join(' L ')}`;
    const pathArea = `${pathTop} L ${W - pad},${H - pad} L ${pad},${H - pad} Z`;

    const meanPx = pad + (Math.max(0, Math.min(500, mu)) / 500) * (W - 2 * pad);

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[68px] lg:h-[72px]">
                <defs>
                    <linearGradient id="bellFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={pathArea} fill="url(#bellFill)" stroke="#67e8f9" strokeWidth={1.5} />
                <line
                    x1={meanPx}
                    x2={meanPx}
                    y1={pad}
                    y2={H - pad}
                    stroke="#67e8f9"
                    strokeDasharray="3 3"
                    strokeWidth={1.4}
                />
            </svg>
            <p
                className="text-[9px] lg:text-[10px] text-center mt-0.5"
                style={{ color: 'var(--coord-text-tertiary)' }}
            >
                σ ≈ {sigma.toFixed(1)} · centrada en promedio ({inst.avg})
            </p>
        </div>
    );
}

export default function CoordinadorStatsGroups({ inst }: Props) {
    // Sesgo de Pearson aproximado: (avg - median) * 3 / stdDev
    const sesgo =
        inst.stdDev > 0 ? Math.round(((inst.avg - inst.median) * 3) / inst.stdDev * 100) / 100 : 0;

    return (
        <div data-coordinator-theme className="relative mt-4 space-y-3 lg:space-y-4">
            <p
                className="rounded-2xl border border-cyan-300/10 bg-white/[0.045] px-3 py-2 text-[10px] lg:text-[11px] leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                style={{ color: 'var(--coord-text-secondary)' }}
            >
                Todos estos números son del{' '}
                <span style={{ color: 'var(--coord-text-primary)' }} className="font-bold">
                    mismo grupo de estudiantes
                </span>{' '}
                (simulacro e institución del bloque de filtros del informe). Toca una tarjeta para
                ver la explicación debajo de este bloque.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
                {/* GRUPO 1: Tamaño y extremos */}
                <div
                    className="relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-violet-300/15 bg-slate-950/65 p-3.5 shadow-[0_18px_55px_rgba(15,23,42,0.4)] backdrop-blur-xl lg:p-4"
                    data-coord-tour={TourAnchors.dashboardKpisG1Chart}
                >
                    <div
                        className="pointer-events-none absolute inset-0 opacity-70"
                        style={{
                            background:
                                'radial-gradient(circle at 12% 0%, rgba(167,139,250,0.2), transparent 30%), linear-gradient(135deg, rgba(255,255,255,0.055), transparent 42%)',
                        }}
                    />
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-300 via-indigo-400 to-transparent" />
                    <div className="relative flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <p
                            className="text-[10px] font-bold uppercase tracking-widest"
                            style={{ color: 'var(--coord-text-tertiary)' }}
                        >
                            Grupo 1 · 3
                        </p>
                        <Users className="w-4 h-4" style={{ color: '#a5b4fc' }} />
                    </div>
                    <h3
                        className="text-[13px] lg:text-sm font-extrabold mb-1"
                        style={{ color: 'var(--coord-text-primary)' }}
                    >
                        Tamaño del grupo y extremos
                    </h3>
                    <p className="text-[10px] lg:text-[11px] mb-2 lg:mb-2.5 line-clamp-2 lg:line-clamp-1" style={{ color: 'var(--coord-text-tertiary)' }}>
                        Cuántos estudiantes entran en el cálculo y el puntaje global más alto y
                        más bajo del grupo.
                    </p>

                    <div className="flex flex-col gap-3 flex-1 min-w-0">
                        <div className="w-full min-w-0 shrink-0">
                            <p
                                className="text-[9px] lg:text-[10px] font-semibold uppercase tracking-wide mb-1"
                                style={{ color: 'var(--coord-text-tertiary)' }}
                            >
                                Histograma de puntajes
                            </p>
                            <HistogramMini inst={inst} />
                        </div>

                        <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-3 w-full min-w-0">
                        <StatChip
                            value={inst.students.length}
                            label="Estudiantes evaluados"
                            sub="Con puntaje global registrado en este informe."
                            color="rgba(165,180,252,0.25)"
                        />
                        <StatChip
                            value={inst.max}
                            label="Puntaje global más alto"
                            sub="El mejor resultado individual del grupo."
                            color="rgba(52,211,153,0.25)"
                        />
                        <StatChip
                            value={inst.min}
                            label="Puntaje global más bajo"
                            sub="El resultado individual más bajo del grupo."
                            color="rgba(244,63,94,0.25)"
                        />
                        </div>
                    </div>
                    </div>
                </div>

                {/* GRUPO 2: Percentiles */}
                <div
                    className="relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-fuchsia-300/15 bg-slate-950/65 p-3.5 shadow-[0_18px_55px_rgba(15,23,42,0.4)] backdrop-blur-xl lg:p-4"
                    data-coord-tour={TourAnchors.dashboardKpisG2Chart}
                >
                    <div
                        className="pointer-events-none absolute inset-0 opacity-70"
                        style={{
                            background:
                                'radial-gradient(circle at 88% 2%, rgba(244,114,182,0.18), transparent 30%), linear-gradient(135deg, rgba(251,191,36,0.08), transparent 46%)',
                        }}
                    />
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-300 via-fuchsia-400 to-transparent" />
                    <div className="relative flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <p
                            className="text-[10px] font-bold uppercase tracking-widest"
                            style={{ color: 'var(--coord-text-tertiary)' }}
                        >
                            Grupo 2 · 3
                        </p>
                        <Percent className="w-4 h-4" style={{ color: '#fbbf24' }} />
                    </div>
                    <h3
                        className="text-[13px] lg:text-sm font-extrabold mb-1"
                        style={{ color: 'var(--coord-text-primary)' }}
                    >
                        Percentiles del puntaje global
                    </h3>
                    <p className="text-[10px] lg:text-[11px] mb-2 lg:mb-2.5 line-clamp-2 lg:line-clamp-1" style={{ color: 'var(--coord-text-tertiary)' }}>
                        Se ordenan los puntajes globales de menor a mayor. Cada percentil indica
                        el valor por debajo del cual cae ese porcentaje del grupo.
                    </p>

                    <div className="flex flex-col gap-3 flex-1 min-w-0">
                        <div className="w-full min-w-0 shrink-0">
                            <p
                                className="text-[9px] lg:text-[10px] font-semibold uppercase tracking-wide mb-1"
                                style={{ color: 'var(--coord-text-tertiary)' }}
                            >
                                Escala percentual (0–500)
                            </p>
                            <PercentileScale inst={inst} />
                        </div>

                        <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-3 w-full min-w-0">
                        <StatChip
                            value={inst.p90}
                            label="Percentil 90"
                            sub="Solo el 10 % del grupo está por encima."
                            color="rgba(52,211,153,0.25)"
                        />
                        <StatChip
                            value={inst.p75}
                            label="Percentil 75"
                            sub="Tres cuartos del grupo en o por debajo."
                            color="rgba(167,139,250,0.25)"
                        />
                        <StatChip
                            value={inst.p25}
                            label="Percentil 25"
                            sub="Un cuarto del grupo en o por debajo."
                            color="rgba(251,191,36,0.25)"
                        />
                        </div>
                    </div>
                    </div>
                </div>

                {/* GRUPO 3: Dispersión */}
                <div
                    className="relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-cyan-300/15 bg-slate-950/65 p-3.5 shadow-[0_18px_55px_rgba(15,23,42,0.4)] backdrop-blur-xl lg:p-4"
                    data-coord-tour={TourAnchors.dashboardKpisG3Chart}
                >
                    <div
                        className="pointer-events-none absolute inset-0 opacity-70"
                        style={{
                            background:
                                'radial-gradient(circle at 75% 0%, rgba(34,211,238,0.2), transparent 32%), linear-gradient(135deg, rgba(96,165,250,0.08), transparent 45%)',
                        }}
                    />
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-300 via-sky-400 to-transparent" />
                    <div className="relative flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <p
                            className="text-[10px] font-bold uppercase tracking-widest"
                            style={{ color: 'var(--coord-text-tertiary)' }}
                        >
                            Grupo 3 · 3
                        </p>
                        <Activity className="w-4 h-4" style={{ color: '#67e8f9' }} />
                    </div>
                    <h3
                        className="text-[13px] lg:text-sm font-extrabold mb-1"
                        style={{ color: 'var(--coord-text-primary)' }}
                    >
                        Dispersión del grupo
                    </h3>
                    <p className="text-[10px] lg:text-[11px] mb-2 lg:mb-2.5 line-clamp-2 lg:line-clamp-1" style={{ color: 'var(--coord-text-tertiary)' }}>
                        Miden qué tan «esparcidos» están los puntajes globales respecto al centro
                        del grupo.
                    </p>

                    <div className="flex flex-col gap-3 flex-1 min-w-0">
                        <div className="w-full min-w-0 shrink-0">
                            <p
                                className="text-[9px] lg:text-[10px] font-semibold uppercase tracking-wide mb-1"
                                style={{ color: 'var(--coord-text-tertiary)' }}
                            >
                                Curva de distribución (modelo)
                            </p>
                            <DispersionBell inst={inst} />
                        </div>

                        <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-3 w-full min-w-0">
                        <StatChip
                            value={inst.stdDev}
                            label="Desviación estándar"
                            sub="Qué tan lejos suelen estar los puntajes del promedio."
                            color="rgba(103,232,249,0.25)"
                        />
                        <StatChip
                            value={inst.iqr}
                            label="Rango intercuartílico"
                            sub="Percentil 75 menos percentil 25."
                            color="rgba(96,165,250,0.25)"
                        />
                        </div>
                    </div>
                    </div>
                </div>
            </div>

            {/* Franja inferior: Promedio · Mediana · Sesgo · CV · N */}
            <div
                className="rounded-2xl px-2.5 py-2.5 lg:px-3 lg:py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-1 shadow-[0_18px_55px_rgba(8,47,73,0.28)]"
                data-coord-tour={TourAnchors.dashboardKpisSummary}
                style={{
                    background:
                        'linear-gradient(90deg, rgba(8,47,73,0.46), rgba(30,41,59,0.76), rgba(49,46,129,0.36))',
                    border: '1px solid rgba(125,211,252,0.16)',
                }}
            >
                {[
                    { label: 'Promedio', value: inst.avg, color: '#a5b4fc' },
                    { label: 'Mediana', value: inst.median, color: '#34d399' },
                    { label: 'Sesgo (Pearson)', value: sesgo.toFixed(2), color: '#fbbf24' },
                    { label: 'CV %', value: inst.coefVar, color: '#f472b6' },
                    { label: 'N', value: inst.students.length, color: '#22d3ee' },
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5 lg:gap-2 rounded-xl px-2 py-1.5 lg:px-2.5 bg-white/[0.035]">
                        <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: item.color, boxShadow: `0 0 12px ${item.color}` }}
                        />
                        <div className="min-w-0 flex lg:flex-row lg:items-baseline lg:gap-1.5">
                            <p
                                className="text-[10px] lg:text-[11px] font-medium leading-tight truncate"
                                style={{ color: 'var(--coord-text-secondary)' }}
                            >
                                {item.label}
                            </p>
                            <p
                                className="text-[13px] lg:text-[14px] font-bold tabular-nums leading-none tracking-tight lg:shrink-0"
                                style={{ color: 'var(--coord-text-primary)' }}
                            >
                                {item.value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
