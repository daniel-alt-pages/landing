'use client';

import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
    type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
    canonicalInstitutionName,
    institutionsMatch,
} from '@shared/lib/institucionesAcondicionamiento';
import { getInstitutionLogo } from '@shared/lib/institucionesLogos';
import { NATIONAL_STATS } from '@features/benchmark/lib/nationalData';
import type { CoordinatorSimSummary, SimSnapshot } from '@features/coordinador/pages/historico/lib/snapshotHelpers';
import { isIndividualInstitution } from '@shared/lib/pifaCurso';

/** Avatar compacto para listas delgadas. */
export function InstitutionLogoMark({
    name,
    color,
    size = 36,
}: {
    name: string;
    color?: string;
    size?: number;
}) {
    const logo = getInstitutionLogo(name);
    const [broken, setBroken] = useState(false);
    const initial = (name.trim().charAt(0) || '?').toUpperCase();

    useEffect(() => {
        setBroken(false);
    }, [logo, name]);

    if (logo && !broken) {
        return (
            // eslint-disable-next-line @next/next/no-img-element -- logos en /public
            <img
                src={logo}
                alt=""
                width={size}
                height={size}
                className="shrink-0 rounded-full bg-white/90 object-cover ring-1 ring-white/25"
                style={{ width: size, height: size, minWidth: size, minHeight: size }}
                loading="eager"
                decoding="async"
                onError={() => setBroken(true)}
            />
        );
    }
    return (
        <span
            className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-slate-950 ring-1 ring-white/20"
            style={{
                width: size,
                height: size,
                minWidth: size,
                minHeight: size,
                fontSize: Math.max(11, Math.round(size * 0.38)),
                background: color || 'rgba(148,163,184,0.85)',
            }}
            aria-hidden
        >
            {initial}
        </span>
    );
}

/** Paleta alto contraste sobre navy (WCAG data lines ≥3:1 vs fondo oscuro). */
export const INST_COLORS = [
    '#c4b5fd', // violet-300
    '#67e8f9', // cyan-300
    '#fcd34d', // amber-300
    '#6ee7b7', // emerald-300
    '#fca5a5', // red-300
    '#f9a8d4', // pink-300
    '#93c5fd', // blue-300
    '#bef264', // lime-300
    '#d8b4fe', // purple-300
    '#5eead4', // teal-300
    '#fdba74', // orange-300
    '#86efac', // green-300
    '#fda4af', // rose-300
    '#e9d5ff', // fuchsia-tint
    '#7dd3fc', // sky-300
    '#fde047', // yellow-300
];

/** ponytail: SVG densifica a >12 series. Si >80 IE, valorar canvas. */
export const DENSE_SERIES_THRESHOLD = 12;

/** Color estable según orden en la selección (misma clave en lista, leyenda y gráfica). */
export function institutionSeriesColor(name: string, selectedOrdered: string[]): string {
    const idx = selectedOrdered.findIndex((p) => institutionsMatch(p, name));
    return INST_COLORS[(idx >= 0 ? idx : 0) % INST_COLORS.length];
}

export type InstSeries = {
    name: string;
    color: string;
    points: Array<{ simId: string; avg: number; count: number }>;
};

function dist2ToSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 < 1e-6) {
        const ex = px - x1;
        const ey = py - y1;
        return ex * ex + ey * ey;
    }
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const qx = x1 + t * dx;
    const qy = y1 + t * dy;
    const ex = px - qx;
    const ey = py - qy;
    return ex * ex + ey * ey;
}

type HoverPoint = {
    si: number;
    pi: number;
    name: string;
    color: string;
    simId: string;
    avg: number;
    count: number;
    x: number;
    y: number;
};

export type PointDetail = {
    name: string;
    color: string;
    simId: string;
    avg: number;
    count: number;
    mine: boolean;
};

function shortSimLabel(simId: string): string {
    return String(simId || '').replace(/^SG11-?/i, '') || simId;
}

export function collectInstitutionKeys(
    summary: Record<string, CoordinatorSimSummary>,
    simIds: string[],
): string[] {
    const byCanon = new Map<string, string>();
    for (const simId of simIds) {
        const instMap = summary[simId]?.institutions || {};
        for (const raw of Object.keys(instMap)) {
            if (isIndividualInstitution(raw)) continue;
            const display = canonicalInstitutionName(raw);
            const key = display.toUpperCase();
            if (!byCanon.has(key)) byCanon.set(key, display);
        }
    }
    return [...byCanon.values()].sort((a, b) => a.localeCompare(b, 'es'));
}

/** Lookup O(1) por IE canónica × simulacro. */
export function buildSnapshotLookup(
    summary: Record<string, CoordinatorSimSummary>,
    simIds: string[],
    institutionNames: string[],
): Map<string, Map<string, SimSnapshot>> {
    const out = new Map<string, Map<string, SimSnapshot>>();
    for (const name of institutionNames) {
        out.set(name.toUpperCase(), new Map());
    }
    for (const simId of simIds) {
        const entries = Object.entries(summary[simId]?.institutions || {}).filter(
            ([raw]) => !isIndividualInstitution(raw),
        );
        const byCanon = new Map<string, SimSnapshot>();
        for (const [raw, snap] of entries) {
            byCanon.set(canonicalInstitutionName(raw).toUpperCase(), snap);
        }
        for (const name of institutionNames) {
            const bucket = out.get(name.toUpperCase());
            if (!bucket) continue;
            const direct = byCanon.get(name.toUpperCase());
            if (direct) {
                bucket.set(simId, direct);
                continue;
            }
            const hit = entries.find(([raw]) => institutionsMatch(raw, name));
            if (hit) bucket.set(simId, hit[1]);
        }
    }
    return out;
}

export function PanelShell({ children }: { children: ReactNode }) {
    return (
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
            {children}
        </div>
    );
}

export function PanelStatus({
    children,
    tone = 'muted',
}: {
    children: ReactNode;
    tone?: 'muted' | 'error';
}) {
    return (
        <PanelShell>
            <div
                className={`flex min-h-[220px] items-center justify-center px-6 py-12 text-center text-sm ${
                    tone === 'error' ? 'text-rose-300/90' : 'text-white/45'
                }`}
            >
                {children}
            </div>
        </PanelShell>
    );
}

export function PanelModal({
    open,
    title,
    description,
    onClose,
    children,
    footer,
    wide,
}: {
    open: boolean;
    title: string;
    description?: string;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
    wide?: boolean;
}) {
    const titleId = useId();
    const descId = useId();
    const closeRef = useRef<HTMLButtonElement>(null);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!open) return;
        const prevOverflow = document.body.style.overflow;
        const prevPadding = document.body.style.paddingRight;
        const scrollbar = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

        // Focus close without scrolling the underlying panel into view.
        closeRef.current?.focus({ preventScroll: true });

        const onKey = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopImmediatePropagation();
                onCloseRef.current();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            document.body.style.paddingRight = prevPadding;
            window.removeEventListener('keydown', onKey);
        };
    }, [open]);

    if (!open || typeof document === 'undefined') return null;

    // Portal a body: evita clip de CoordCard/Section (overflow:hidden).
    return createPortal(
        <div
            className="fixed inset-0 z-[300] flex items-end justify-center p-0 sm:items-center sm:p-6"
            data-evolution-modal-root
        >
            <button
                type="button"
                aria-label="Cerrar"
                className="absolute inset-0 bg-[#020617]/78 backdrop-blur-sm"
                onClick={() => onCloseRef.current()}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descId : undefined}
                className={`relative z-10 flex w-full flex-col overflow-hidden rounded-t-[1.25rem] border border-cyan-400/20 bg-[#0b1220] shadow-[0_40px_120px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(255,255,255,0.06)] sm:rounded-[1.25rem] ${
                    wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'
                }`}
                style={{ maxHeight: 'min(90dvh, 760px)' }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="shrink-0 border-b border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent px-5 py-4 sm:px-6">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300/80">
                                Comparativa
                            </p>
                            <h3 id={titleId} className="text-lg font-semibold tracking-tight text-white">
                                {title}
                            </h3>
                            {description ? (
                                <p id={descId} className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-white/55">
                                    {description}
                                </p>
                            ) : null}
                        </div>
                        <button
                            ref={closeRef}
                            type="button"
                            onClick={() => onCloseRef.current()}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/[0.03] text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/55"
                            aria-label="Cerrar modal"
                        >
                            <X className="h-4 w-4" aria-hidden />
                        </button>
                    </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
                    {children}
                </div>
                {footer ? (
                    <div className="shrink-0 border-t border-white/[0.08] bg-[#080e1a]/95 px-5 py-3.5 sm:px-6">
                        {footer}
                    </div>
                ) : null}
            </div>
        </div>,
        document.body,
    );
}

export function EvolutionLineChart({
    simIds,
    series,
    selectedSim,
    myName,
    onSelectSim,
    onPointDetail,
    yFit = false,
    tall = false,
    zoom = 1,
    showHint = true,
}: {
    simIds: string[];
    series: InstSeries[];
    selectedSim: string;
    myName: string;
    onSelectSim: (simId: string) => void;
    onPointDetail: (detail: PointDetail) => void;
    /** Acerca el eje Y al rango real de los datos (más legible). */
    yFit?: boolean;
    /** Altura mayor (pantalla completa). */
    tall?: boolean;
    /** Escala visual 1–2. */
    zoom?: number;
    showHint?: boolean;
}) {
    const [hovered, setHovered] = useState<HoverPoint | null>(null);
    const [hoverSeries, setHoverSeries] = useState<number | null>(null);
    const [tipPos, setTipPos] = useState<{ left: number; top: number } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const dense = series.length > DENSE_SERIES_THRESHOLD;
    const W = 760;
    const H = tall ? 540 : 400;
    const pad = { t: 28, r: 18, b: 58, l: 56 };
    const chartW = W - pad.l - pad.r;
    const chartH = H - pad.t - pad.b;
    const nat = NATIONAL_STATS.global.mean;
    const legendSeries = series.slice(0, dense ? 6 : 8);

    const syncTipPos = (svgX: number, svgY: number) => {
        const el = svgRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) return;
        const sx = (svgX / W) * rect.width + rect.left;
        const sy = (svgY / H) * rect.height + rect.top;
        const tipW = 340;
        const tipH = 36;
        const left = Math.min(Math.max(8, sx + 12), window.innerWidth - tipW - 8);
        const top = Math.min(Math.max(8, sy - tipH - 8), window.innerHeight - tipH - 8);
        setTipPos({ left, top });
    };

    const { yMin, yMax, yTicks } = useMemo(() => {
        const avgs = series
            .flatMap((s) => s.points.map((p) => p.avg))
            .filter((v) => v > 0);
        if (!yFit || avgs.length === 0) {
            const top = Math.min(
                500,
                Math.ceil(Math.max(500, nat, ...avgs, 1) / 25) * 25 || 500,
            );
            const ticks = [0, 100, 200, 300, 400, 500].filter((v) => v <= top);
            return { yMin: 0, yMax: top, yTicks: ticks };
        }
        const rawMin = Math.min(...avgs, nat);
        const rawMax = Math.max(...avgs, nat);
        const padY = Math.max(20, (rawMax - rawMin) * 0.14);
        const lo = Math.max(0, Math.floor((rawMin - padY) / 25) * 25);
        const hi = Math.min(500, Math.ceil((rawMax + padY) / 25) * 25 || 500);
        const span = Math.max(hi - lo, 25);
        const step = span <= 100 ? 25 : span <= 200 ? 50 : 100;
        const ticks: number[] = [];
        for (let v = lo; v <= hi + 0.001; v += step) ticks.push(v);
        if (ticks[ticks.length - 1] !== hi) ticks.push(hi);
        return { yMin: lo, yMax: hi, yTicks: ticks };
    }, [series, yFit, nat]);

    const xAt = (i: number) =>
        pad.l + (simIds.length <= 1 ? chartW / 2 : (i / (simIds.length - 1)) * chartW);
    const yAt = (v: number) => {
        const span = Math.max(yMax - yMin, 1);
        return pad.t + chartH - ((v - yMin) / span) * chartH;
    };
    const selectedIdx = Math.max(0, simIds.indexOf(selectedSim));
    const colW = Math.max(chartW / Math.max(simIds.length, 1), 20);
    const zoomClamped = Math.min(2, Math.max(1, zoom));

    const applyTip = (
        si: number,
        pt: { i: number; x: number; y: number; avg: number; count: number; simId: string },
    ) => {
        const s = series[si];
        if (!s) return;
        setHoverSeries(si);
        setHovered({
            si,
            pi: pt.i,
            name: s.name,
            color: s.color,
            simId: pt.simId,
            avg: pt.avg,
            count: pt.count,
            x: pt.x,
            y: pt.y,
        });
        syncTipPos(pt.x, pt.y);
    };

    /** Elige la serie más cercana al cursor (evita que otra línea “robe” el hover). */
    const pickNearestAtClient = (clientX: number, clientY: number) => {
        const el = svgRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) return;
        const svgX = ((clientX - rect.left) / rect.width) * W;
        const svgY = ((clientY - rect.top) / rect.height) * H;

        let bestSi = -1;
        let bestDist = Infinity;
        let bestPt: {
            i: number;
            x: number;
            y: number;
            avg: number;
            count: number;
            simId: string;
        } | null = null;

        for (let si = 0; si < series.length; si++) {
            const s = series[si]!;
            const pts = simIds
                .map((simId, i) => {
                    const hit = s.points.find((p) => p.simId === simId);
                    return hit && hit.avg > 0
                        ? {
                              i,
                              x: xAt(i),
                              y: yAt(hit.avg),
                              avg: hit.avg,
                              count: hit.count,
                              simId,
                          }
                        : null;
                })
                .filter(Boolean) as Array<{
                i: number;
                x: number;
                y: number;
                avg: number;
                count: number;
                simId: string;
            }>;
            if (pts.length === 0) continue;

            for (let k = 0; k < pts.length; k++) {
                const p = pts[k]!;
                const dPoint = (svgX - p.x) ** 2 + (svgY - p.y) ** 2;
                if (dPoint < bestDist) {
                    bestDist = dPoint;
                    bestSi = si;
                    bestPt = p;
                }
                if (k > 0) {
                    const prev = pts[k - 1]!;
                    const dSeg = dist2ToSegment(svgX, svgY, prev.x, prev.y, p.x, p.y);
                    if (dSeg < bestDist) {
                        bestDist = dSeg;
                        bestSi = si;
                        // Punto de tip: el vértice más cercano del segmento.
                        bestPt =
                            (svgX - prev.x) ** 2 + (svgY - prev.y) ** 2 <=
                            (svgX - p.x) ** 2 + (svgY - p.y) ** 2
                                ? prev
                                : p;
                    }
                }
            }
        }

        // ~18px en coords SVG (viewBox 760).
        if (bestSi < 0 || !bestPt || bestDist > 18 * 18) {
            setHoverSeries(null);
            setHovered(null);
            setTipPos(null);
            return;
        }
        applyTip(bestSi, bestPt);
    };

    const clearTip = () => {
        setHoverSeries(null);
        setHovered(null);
        setTipPos(null);
    };

    const chartSummary = useMemo(() => {
        return `Evolución del promedio global de ${series.length} institución${series.length === 1 ? '' : 'es'} a lo largo de ${simIds.length} simulacros. Línea punteada: promedio nacional ICFES ${nat.toFixed(1)}. Simulacro enfocado: ${selectedSim || 'ninguno'}.`;
    }, [series.length, simIds.length, nat, selectedSim]);

    const anyHover = hoverSeries !== null || hovered !== null;
    const hoverLogo = hovered ? getInstitutionLogo(hovered.name) : null;

    return (
        <div className={`relative w-full ${tall ? 'flex h-full min-h-0 flex-col' : ''}`}>
            {showHint ? (
                <p className="mb-2 text-[12px] leading-relaxed text-white/55">
                    {dense
                        ? 'Pasa el mouse sobre una línea para resaltar un colegio. Clic en un punto para ver el detalle.'
                        : 'Cada línea es un colegio. La punteada es el objetivo nacional ICFES.'}
                </p>
            ) : null}
            <p className="sr-only">{chartSummary}</p>
            <div
                className={`overscroll-contain rounded-xl ring-1 ring-cyan-400/20 ${tall ? 'min-h-0 flex-1 overflow-auto' : 'max-h-full overflow-auto'}`}
                style={{
                    background:
                        'radial-gradient(120% 80% at 10% 0%, rgba(34,211,238,0.08), transparent 55%), linear-gradient(180deg, #070d18 0%, #04070f 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 40px rgba(34,211,238,0.06)',
                }}
            >
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${W} ${H}`}
                    className="block"
                    role="img"
                    aria-label={chartSummary}
                    style={{
                        width: `${zoomClamped * 100}%`,
                        minWidth: '100%',
                        height: 'auto',
                    }}
                    onMouseLeave={clearTip}
                >
                <defs>
                    <filter id="evo-glow" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="2.2" result="b" />
                        <feMerge>
                            <feMergeNode in="b" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <linearGradient id="evo-plot" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(34,211,238,0.06)" />
                        <stop offset="100%" stopColor="rgba(2,6,23,0)" />
                    </linearGradient>
                </defs>

                <rect
                    x={pad.l}
                    y={pad.t}
                    width={chartW}
                    height={chartH}
                    fill="url(#evo-plot)"
                    stroke="rgba(148,163,184,0.18)"
                    strokeWidth={1}
                    rx={2}
                />

                {yTicks.map((v) => {
                    const y = yAt(v);
                    return (
                        <g key={v}>
                            <line
                                x1={pad.l}
                                y1={y}
                                x2={W - pad.r}
                                y2={y}
                                stroke="rgba(148,163,184,0.12)"
                                strokeWidth={1}
                            />
                            <text
                                x={pad.l - 8}
                                y={y + 3.5}
                                fill="rgba(226,232,240,0.55)"
                                fontSize="10"
                                fontFamily="ui-sans-serif, system-ui, sans-serif"
                                textAnchor="end"
                            >
                                {v}
                            </text>
                        </g>
                    );
                })}

                {/* Objetivo nacional (estilo referencia: línea discontinua) */}
                <line
                    x1={pad.l}
                    y1={yAt(nat)}
                    x2={W - pad.r}
                    y2={yAt(nat)}
                    stroke="#f43f5e"
                    strokeWidth="1.8"
                    strokeDasharray="7,5"
                    opacity={0.9}
                />

                {simIds.length > 0 && (
                    <rect
                        x={xAt(selectedIdx) - colW / 2}
                        y={pad.t}
                        width={colW}
                        height={chartH}
                        fill="rgba(34,211,238,0.07)"
                    />
                )}

                {hovered ? (
                    <g pointerEvents="none">
                        <line
                            x1={hovered.x}
                            y1={pad.t}
                            x2={hovered.x}
                            y2={pad.t + chartH}
                            stroke="rgba(34,211,238,0.45)"
                            strokeWidth="1"
                            strokeDasharray="3,3"
                        />
                        <line
                            x1={pad.l}
                            y1={hovered.y}
                            x2={W - pad.r}
                            y2={hovered.y}
                            stroke="rgba(34,211,238,0.35)"
                            strokeWidth="1"
                            strokeDasharray="3,3"
                        />
                    </g>
                ) : null}

                {series.map((s, si) => {
                    const mine = institutionsMatch(s.name, myName);
                    const activeSeries = hoverSeries === si || hovered?.si === si;
                    const pts = simIds
                        .map((simId, i) => {
                            const hit = s.points.find((p) => p.simId === simId);
                            return hit && hit.avg > 0
                                ? {
                                      i,
                                      x: xAt(i),
                                      y: yAt(hit.avg),
                                      avg: hit.avg,
                                      count: hit.count,
                                      simId,
                                  }
                                : null;
                        })
                        .filter(Boolean) as Array<{
                        i: number;
                        x: number;
                        y: number;
                        avg: number;
                        count: number;
                        simId: string;
                    }>;

                    if (pts.length === 0) return null;
                    const d = pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                    const showDots = !dense || mine || activeSeries;

                    let opacity = mine ? 1 : dense ? 0.32 : 0.55;
                    if (anyHover && !mine && !activeSeries) opacity = 0.08;
                    if (activeSeries && !mine) opacity = 1;

                    const strokeW = mine ? 2.6 : activeSeries ? 2.2 : dense ? 1.35 : 1.75;

                    return (
                        <g key={s.name} opacity={opacity} pointerEvents="none">
                            {mine ? (
                                <path
                                    d={d}
                                    fill="none"
                                    stroke={s.color}
                                    strokeWidth={strokeW + 3}
                                    strokeOpacity={0.35}
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                    filter="url(#evo-glow)"
                                />
                            ) : null}
                            <path
                                d={d}
                                fill="none"
                                stroke={s.color}
                                strokeWidth={strokeW}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />
                            {pts.map((p) => {
                                const active = hovered?.si === si && hovered?.pi === p.i;
                                const r = active ? 5.5 : mine ? 4.5 : 3.2;
                                if (!showDots) return null;
                                return mine ? (
                                    <rect
                                        key={`${s.name}-${p.simId}`}
                                        x={p.x - r}
                                        y={p.y - r}
                                        width={r * 2}
                                        height={r * 2}
                                        fill="#04070f"
                                        stroke={s.color}
                                        strokeWidth={active ? 2.2 : 1.8}
                                    />
                                ) : (
                                    <circle
                                        key={`${s.name}-${p.simId}`}
                                        cx={p.x}
                                        cy={p.y}
                                        r={r}
                                        fill="#04070f"
                                        stroke={s.color}
                                        strokeWidth={active ? 2.1 : 1.5}
                                    />
                                );
                            })}
                        </g>
                    );
                })}

                {/* Hit-test global: nombre+color de la línea realmente más cercana */}
                <rect
                    x={pad.l}
                    y={pad.t}
                    width={chartW}
                    height={chartH}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseMove={(e) => pickNearestAtClient(e.clientX, e.clientY)}
                />

                {series.map((s, si) => {
                    const mine = institutionsMatch(s.name, myName);
                    return simIds.map((simId, i) => {
                        const hit = s.points.find((p) => p.simId === simId);
                        if (!hit || hit.avg <= 0) return null;
                        const x = xAt(i);
                        const y = yAt(hit.avg);
                        const label = `${s.name}: ${hit.avg.toFixed(0)} en ${simId}${hit.count > 0 ? `, ${hit.count} estudiantes` : ''}`;
                        const detail: PointDetail = {
                            name: s.name,
                            color: s.color,
                            simId,
                            avg: hit.avg,
                            count: hit.count,
                            mine,
                        };
                        return (
                            <circle
                                key={`hit-${s.name}-${simId}`}
                                cx={x}
                                cy={y}
                                r={12}
                                fill="transparent"
                                className="cursor-pointer"
                                tabIndex={0}
                                role="button"
                                aria-label={`${label}. Abrir detalle.`}
                                onMouseEnter={() =>
                                    applyTip(si, {
                                        i,
                                        x,
                                        y,
                                        avg: hit.avg,
                                        count: hit.count,
                                        simId,
                                    })
                                }
                                onFocus={() =>
                                    applyTip(si, {
                                        i,
                                        x,
                                        y,
                                        avg: hit.avg,
                                        count: hit.count,
                                        simId,
                                    })
                                }
                                onBlur={clearTip}
                                onClick={() => {
                                    onSelectSim(simId);
                                    onPointDetail(detail);
                                }}
                                onKeyDown={(e: KeyboardEvent<SVGCircleElement>) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onSelectSim(simId);
                                        onPointDetail(detail);
                                    }
                                }}
                            />
                        );
                    });
                })}

                {/* Ejes */}
                <line
                    x1={pad.l}
                    y1={pad.t + chartH}
                    x2={W - pad.r}
                    y2={pad.t + chartH}
                    stroke="rgba(226,232,240,0.35)"
                    strokeWidth={1.2}
                />
                <line
                    x1={pad.l}
                    y1={pad.t}
                    x2={pad.l}
                    y2={pad.t + chartH}
                    stroke="rgba(226,232,240,0.35)"
                    strokeWidth={1.2}
                />
                <text
                    x={pad.l + chartW / 2}
                    y={H - 10}
                    fill="rgba(165,243,252,0.7)"
                    fontSize="11"
                    fontWeight="700"
                    textAnchor="middle"
                    letterSpacing="0.04em"
                >
                    NÚMERO DE SIMULACRO
                </text>
                <text
                    x={14}
                    y={pad.t + chartH / 2}
                    fill="rgba(165,243,252,0.7)"
                    fontSize="11"
                    fontWeight="700"
                    textAnchor="middle"
                    transform={`rotate(-90 14 ${pad.t + chartH / 2})`}
                    letterSpacing="0.04em"
                >
                    PROMEDIO GLOBAL
                </text>

                {simIds.map((simId, i) => {
                    const isFocus = simId === selectedSim;
                    return (
                        <text
                            key={simId}
                            x={xAt(i)}
                            y={H - 28}
                            fill={isFocus ? '#67e8f9' : 'rgba(226,232,240,0.55)'}
                            fontSize="10"
                            fontWeight={isFocus ? '700' : '600'}
                            textAnchor="middle"
                            className="cursor-pointer"
                            tabIndex={0}
                            role="button"
                            aria-label={`Enfocar simulacro ${simId}`}
                            onClick={() => onSelectSim(simId)}
                            onKeyDown={(e: KeyboardEvent<SVGTextElement>) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onSelectSim(simId);
                                }
                            }}
                        >
                            {shortSimLabel(simId)}
                        </text>
                    );
                })}

                </svg>
            </div>

            {/* Leyenda estilo referencia, dark futurista */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-white/10 bg-black/35 px-3 py-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/80">
                    <span className="inline-block h-0 w-6 border-t-2 border-dashed border-rose-400" aria-hidden />
                    Objetivo nacional ({nat.toFixed(1)})
                </span>
                {legendSeries.map((s) => {
                    const mine = institutionsMatch(s.name, myName);
                    const short =
                        s.name.length > 28 ? `${s.name.slice(0, 27)}…` : s.name;
                    return (
                        <span
                            key={s.name}
                            className="inline-flex max-w-[220px] items-center gap-1.5 text-[11px] font-medium text-white/75"
                            title={s.name}
                        >
                            <span
                                className="inline-block h-0 w-5 border-t-2"
                                style={{ borderColor: s.color }}
                                aria-hidden
                            />
                            {mine ? (
                                <span
                                    className="inline-block h-2 w-2 rotate-0 border"
                                    style={{ borderColor: s.color, background: '#04070f' }}
                                    aria-hidden
                                />
                            ) : (
                                <span
                                    className="inline-block h-2 w-2 rounded-full border"
                                    style={{ borderColor: s.color, background: '#04070f' }}
                                    aria-hidden
                                />
                            )}
                            <span className="truncate">
                                {mine ? 'Tu colegio' : short}
                            </span>
                        </span>
                    );
                })}
                {series.length > legendSeries.length ? (
                    <span className="text-[11px] text-white/40">
                        +{series.length - legendSeries.length} más (hover en gráfica)
                    </span>
                ) : null}
            </div>

            {hovered && tipPos && typeof document !== 'undefined'
                ? createPortal(
                      <div
                          className="pointer-events-none fixed z-[320] max-w-[min(92vw,380px)] rounded-md border border-white/15 bg-[#0b1220]/94 px-2.5 py-1 shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-sm"
                          style={{ left: tipPos.left, top: tipPos.top }}
                          role="tooltip"
                      >
                          <div className="flex items-center gap-1.5">
                              {hoverLogo ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                      src={hoverLogo}
                                      alt=""
                                      className="h-5 w-5 shrink-0 rounded-full bg-white/90 object-cover ring-1 ring-white/20"
                                  />
                              ) : (
                                  <span
                                      className="h-2 w-2 shrink-0 rounded-full"
                                      style={{ background: hovered.color }}
                                      aria-hidden
                                  />
                              )}
                              <p className="min-w-0 flex-1 text-[11px] font-semibold leading-snug break-words text-white">
                                  {hovered.name}
                              </p>
                              <span className="shrink-0 whitespace-nowrap text-[11px] font-semibold tabular-nums text-cyan-100">
                                  {hovered.avg.toFixed(0)} pts
                              </span>
                          </div>
                      </div>,
                      document.body,
                  )
                : null}
        </div>
    );
}
