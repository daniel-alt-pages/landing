'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import type { InstitutionMetrics } from '@features/coordinador/hooks/useCoordinadorData';
import type { Estudiante } from '@shared/types';
import { NATIONAL_STATS, AREA_MAP } from '@features/benchmark/lib/nationalData';
import { clasificarNivel } from '@features/coordinador/lib/coordinadorDataHelpers';
import { studentDocumentId, studentFullName, filterStudentsForSimulation } from '@shared/lib/studentDisplay';
import SimulationSourceBadge from '@features/coordinador/components/ui/SimulationSourceBadge';
import { SG_AREA_COLORS, SG_AREA_ORDER } from '@shared/lib/sgAreaColors';

const AREA_DEFS = SG_AREA_ORDER.map((key) => {
    const c = SG_AREA_COLORS[key];
    return { key: c.key, short: c.short, color: c.hex } as const;
});

type AreaKey = (typeof AREA_DEFS)[number]['key'];

const NIVEL_KEYS = ['Superior', 'Alto', 'Medio', 'Bajo'] as const;

const NIVEL_STYLE: Record<string, { color: string; label: string; range: string }> = {
    Superior: { color: '#10b981', label: 'Superior', range: '≥ 400 pts' },
    Alto: { color: '#3b82f6', label: 'Alto', range: '325 – 399' },
    Medio: { color: '#f59e0b', label: 'Medio', range: '250 – 324' },
    Bajo: { color: '#ef4444', label: 'Bajo', range: '< 250' },
};

const Y_TICKS_5 = Array.from({ length: 21 }, (_, i) => i * 5);

const UNIFIED_SCATTER = {
    w: 920,
    h: 440,
    padL: 56,
    padR: 16,
    padT: 8,
    padB: 20,
} as const;

const GLOBAL_TICKS = [0, 100, 200, 300, 400, 500];
const AREA_TICKS = [0, 25, 50, 75, 100];

function areaScore(e: Estudiante, key: AreaKey): number | null {
    const p = Number(e.puntajes?.[key]?.puntaje) || 0;
    return p > 0 ? p : null;
}

function clamp(v: number, min: number, max: number) {
    return Math.min(max, Math.max(min, v));
}

function studentKey(e: Estudiante): string {
    return (
        e.informacion_personal?.numero_identificacion ||
        `${e.informacion_personal?.nombres ?? ''}-${e.informacion_personal?.apellidos ?? ''}`
    );
}

function jitterOffset(seed: string, amplitude: number): number {
    let h = 0;
    for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
    const t = ((h >>> 0) % 1000) / 1000;
    return (t - 0.5) * amplitude;
}

type RowDef = {
    id: string;
    label: string;
    color: string;
    max: number;
    ticks: number[];
    getScore: (e: Estudiante) => number | null;
};

type StudentDot = {
    student: Estudiante;
    key: string;
    name: string;
    docId: string;
    nivel: string;
    globalPts: number;
    scores: Record<string, number | null>;
};

type PinnedSelection = {
    key: string;
    dot: StudentDot;
};

function ChartSection({
    title,
    hint,
    children,
}: {
    title: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-lg border border-white/[0.06] bg-[#0f172a]/50 p-4 min-w-0">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/65">{title}</h4>
                {hint && <p className="text-[9px] text-white/40 leading-snug">{hint}</p>}
            </div>
            {children}
        </section>
    );
}

function CompetenciasCompareLine({ inst }: { inst: InstitutionMetrics }) {
    const rows = useMemo(() => {
        return AREA_DEFS.map((a) => {
            const stat = inst.subjectStats.find((s) => s.key === a.key);
            const natKey = AREA_MAP[a.key];
            const nacional = natKey
                ? (NATIONAL_STATS.areas as Record<string, { mean: number }>)[natKey]?.mean ?? 0
                : 0;
            return {
                short: a.short,
                color: a.color,
                inst: stat?.avg ?? 0,
                nacional,
                delta: (stat?.avg ?? 0) - nacional,
            };
        });
    }, [inst.subjectStats]);

    const W = 640;
    const H = 280;
    const padL = 40;
    const padR = 12;
    const padT = 16;
    const padB = 32;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const stepX = innerW / Math.max(1, rows.length - 1);
    const toY = (v: number) => padT + (1 - v / 100) * innerH;

    const instPath = rows
        .map((r, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * stepX},${toY(r.inst)}`)
        .join(' ');
    const natPath = rows
        .map((r, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * stepX},${toY(r.nacional)}`)
        .join(' ');

    return (
        <ChartSection title="Comparativo institución vs nacional" hint="Escala 0–100 · eje Y cada 5 pts">
            <div className="mb-2 flex flex-wrap gap-2 text-[10px] font-semibold">
                <span className="flex items-center gap-1 text-indigo-300">
                    <span className="h-0.5 w-3 rounded bg-indigo-400" /> Inst.
                </span>
                <span className="flex items-center gap-1 text-white/45">
                    <span className="h-0.5 w-3 border-t border-dashed border-white/35" /> Nac.
                </span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-h-[280px]" role="img" aria-label="Líneas comparativas">
                {Y_TICKS_5.map((t) => (
                    <g key={t}>
                        <line
                            x1={padL}
                            x2={W - padR}
                            y1={toY(t)}
                            y2={toY(t)}
                            stroke={t % 25 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}
                        />
                        <text x={padL - 5} y={toY(t) + 3} textAnchor="end" fill="rgba(255,255,255,0.42)" fontSize="7">
                            {t}
                        </text>
                    </g>
                ))}
                <path d={natPath} fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="1.5" strokeDasharray="4 3" />
                <path d={instPath} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
                {rows.map((r, i) => {
                    const x = padL + i * stepX;
                    return (
                        <g key={r.short}>
                            <circle cx={x} cy={toY(r.inst)} r={5} fill={r.color} stroke="#0a0e1a" strokeWidth="1.5" />
                            <circle cx={x} cy={toY(r.nacional)} r={3.5} fill="rgba(255,255,255,0.45)" stroke="#0a0e1a" strokeWidth="1" />
                            <text x={x} y={H - 10} textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="10" fontWeight="700">
                                {r.short}
                            </text>
                        </g>
                    );
                })}
            </svg>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/45">
                {rows.map((r) => (
                    <span key={r.short}>
                        {r.short}{' '}
                        <strong className={r.delta >= 0 ? 'text-emerald-400/90' : 'text-rose-400/90'}>
                            {r.delta >= 0 ? '+' : ''}
                            {r.delta.toFixed(1)}
                        </strong>
                    </span>
                ))}
            </div>
        </ChartSection>
    );
}

function buildRows(): RowDef[] {
    return [
        {
            id: 'global',
            label: 'GLOBAL',
            color: '#a5b4fc',
            max: 500,
            ticks: GLOBAL_TICKS,
            getScore: (e) => ((e.puntaje_global || 0) > 0 ? e.puntaje_global! : null),
        },
        ...AREA_DEFS.map((a) => ({
            id: a.key,
            label: a.short,
            color: a.color,
            max: 100,
            ticks: AREA_TICKS,
            getScore: (e: Estudiante) => areaScore(e, a.key),
        })),
    ];
}

function buildStudentDots(students: Estudiante[]): StudentDot[] {
    return students
        .filter((e) => (e.puntaje_global || 0) > 0)
        .map((e) => {
            const name = studentFullName(e);
            const docId = studentDocumentId(e);
            const scores: Record<string, number | null> = {
                global: (e.puntaje_global || 0) > 0 ? e.puntaje_global! : null,
            };
            for (const a of AREA_DEFS) {
                scores[a.key] = areaScore(e, a.key);
            }
            return {
                student: e,
                key: studentKey(e),
                name: name || docId || 'Estudiante',
                docId,
                nivel: clasificarNivel(e.puntaje_global || 0),
                globalPts: e.puntaje_global || 0,
                scores,
            };
        });
}

const STUDENT_DETAIL_SLOT_CLASS =
    'h-[168px] rounded-xl border border-white/[0.08] bg-[#0f172a]/70 px-3 py-2.5 flex flex-col justify-center overflow-y-auto overscroll-contain';

function DispersionScoreChips({ dot }: { dot: StudentDot }) {
    const scoreRows = [
        {
            key: 'global',
            short: 'Global',
            color: '#a5b4fc',
            max: 500,
            score: dot.scores.global,
        },
        ...AREA_DEFS.map((a) => ({
            key: a.key,
            short: a.short,
            color: a.color,
            max: 100,
            score: dot.scores[a.key],
        })),
    ];

    return (
        <div
            className="flex flex-wrap gap-1.5"
            role="list"
            aria-label="Puntajes por área del estudiante seleccionado"
        >
            {scoreRows.map((row) => {
                const hasScore = row.score != null && row.score > 0;
                return (
                    <div
                        key={row.key}
                        role="listitem"
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-black/25 px-2 py-1 text-[10px]"
                    >
                        <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: row.color }}
                            aria-hidden
                        />
                        <span className="font-semibold text-white/55">{row.short}</span>
                        <span
                            className={`font-bold tabular-nums ${hasScore ? 'text-white' : 'text-white/30'}`}
                        >
                            {hasScore ? row.score : '—'}
                        </span>
                        <span className="text-[9px] tabular-nums text-white/30">/{row.max}</span>
                    </div>
                );
            })}
        </div>
    );
}

function DispersionNivelLegend() {
    return (
        <div
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
            aria-label="Leyenda de colores por nivel global"
        >
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/45 shrink-0">
                Color del punto
            </span>
            {NIVEL_KEYS.map((nivel) => {
                const s = NIVEL_STYLE[nivel];
                return (
                    <div key={nivel} className="flex items-center gap-1.5 text-[10px] text-white/70">
                        <span
                            className="h-2.5 w-2.5 rounded-full ring-1 ring-white/15"
                            style={{ background: s.color }}
                        />
                        <span className="font-semibold" style={{ color: s.color }}>
                            {s.label}
                        </span>
                        <span className="text-white/40 tabular-nums">({s.range})</span>
                    </div>
                );
            })}
            <span className="text-[9px] text-white/35 hidden sm:inline">
                · La línea punteada une el mismo estudiante entre filas
            </span>
        </div>
    );
}

function DispersionInteractionSteps({ activeStep }: { activeStep?: 1 | 2 | 3 }) {
    const steps: Array<{ n: 1 | 2 | 3; label: string }> = [
        { n: 1, label: 'Hover → vista previa' },
        { n: 2, label: 'Clic → fijar' },
        { n: 3, label: '2.º clic → ficha' },
    ];

    return (
        <ol className="flex flex-wrap items-center gap-1" aria-label="Pasos de interacción con el gráfico">
            {steps.map((step) => {
                const active = activeStep === step.n;
                return (
                    <li
                        key={step.n}
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-medium transition-colors ${
                            active
                                ? 'border-indigo-400/40 bg-indigo-500/15 text-indigo-200/95'
                                : 'border-white/[0.06] bg-white/[0.02] text-white/40'
                        }`}
                    >
                        <span className="font-bold tabular-nums">{step.n}.</span> {step.label}
                    </li>
                );
            })}
        </ol>
    );
}

function DispersionStudentHeader({
    dot,
    onClose,
    badge,
}: {
    dot: StudentDot;
    onClose?: () => void;
    badge?: string;
}) {
    const nivelStyle = NIVEL_STYLE[dot.nivel] ?? NIVEL_STYLE.Medio;
    return (
        <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <h5 className="max-w-full truncate text-[13px] font-bold leading-tight text-white">
                        {dot.name}
                    </h5>
                    {badge && (
                        <span className="rounded-full border border-indigo-400/25 bg-indigo-500/15 px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-indigo-300/90">
                            {badge}
                        </span>
                    )}
                    <span
                        className="inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[9px]"
                        style={{
                            background: `${nivelStyle.color}12`,
                            borderColor: `${nivelStyle.color}44`,
                            color: nivelStyle.color,
                        }}
                    >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: nivelStyle.color }} />
                        {dot.nivel}
                        <span className="text-white/40">·</span>
                        <span className="font-semibold tabular-nums text-white/80">{dot.globalPts}</span>
                    </span>
                </div>
                {dot.docId && dot.docId !== dot.name && (
                    <p className="mt-0.5 truncate text-[9px] tabular-nums text-white/40">
                        Doc. {dot.docId}
                    </p>
                )}
            </div>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-white/50 transition-colors hover:border-white/20 hover:text-white/85"
                    aria-label="Quitar selección fijada"
                >
                    Soltar
                </button>
            )}
        </div>
    );
}

function DispersionStudentDetailSlot({
    activeDot,
    pinned,
    onStudentClick,
    onClearPin,
}: {
    activeDot: StudentDot | null;
    pinned: PinnedSelection | null;
    onStudentClick?: (e: Estudiante) => void;
    onClearPin: () => void;
}) {
    const dot = pinned?.dot ?? activeDot;
    const mode = pinned ? 'pinned' : activeDot ? 'preview' : 'empty';
    const activeStep = pinned ? 2 : activeDot ? 1 : undefined;
    const nivelStyle = dot ? (NIVEL_STYLE[dot.nivel] ?? NIVEL_STYLE.Medio) : null;

    return (
        <div className="mt-3 shrink-0">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                    Detalle del estudiante
                </p>
                <DispersionInteractionSteps activeStep={activeStep} />
            </div>
            <div
                className={`${STUDENT_DETAIL_SLOT_CLASS} ${
                    mode !== 'empty' && nivelStyle
                        ? 'border-opacity-100'
                        : 'border-dashed border-white/[0.06] bg-white/[0.02]'
                }`}
                style={
                    mode !== 'empty' && nivelStyle
                        ? { borderColor: `${nivelStyle.color}44` }
                        : undefined
                }
                aria-live="polite"
                aria-atomic="true"
            >
                {mode === 'empty' || !dot ? (
                    <p className="text-center text-[10px] leading-relaxed text-white/40">
                        Pasa el cursor sobre un punto para ver puntajes aquí.
                        <span className="hidden sm:inline"> Clic para fijar · segundo clic abre la ficha.</span>
                    </p>
                ) : (
                    <div className="space-y-2">
                        <DispersionStudentHeader
                            dot={dot}
                            onClose={mode === 'pinned' ? onClearPin : undefined}
                            badge={mode === 'pinned' ? 'Fijado' : 'Vista previa'}
                        />
                        <DispersionScoreChips dot={dot} />
                        {mode === 'preview' ? (
                            <p className="text-center text-[9px] font-medium text-indigo-200/75">
                                Clic en el punto para fijar la selección
                            </p>
                        ) : (
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                {onStudentClick && (
                                    <button
                                        type="button"
                                        onClick={() => onStudentClick(dot.student)}
                                        className="rounded-md border border-indigo-400/35 bg-indigo-500/15 px-3 py-1 text-[9px] font-bold uppercase tracking-wide text-indigo-200 transition-colors hover:bg-indigo-500/25"
                                    >
                                        Ver ficha
                                    </button>
                                )}
                                <p className="text-[9px] text-white/35">Esc · 2.º clic abre ficha</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    return pt.matrixTransform(ctm.inverse());
}

function UnifiedDispersionChart({
    students,
    simulationId,
    onStudentClick,
}: {
    students: Estudiante[];
    simulationId: string;
    onStudentClick?: (e: Estudiante) => void;
}) {
    const rows = useMemo(() => buildRows(), []);
    const svgRef = useRef<SVGSVGElement>(null);
    const chartRef = useRef<HTMLDivElement>(null);

    const [pinned, setPinned] = useState<PinnedSelection | null>(null);
    const [hoverKey, setHoverKey] = useState<string | null>(null);
    const [focusRowId, setFocusRowId] = useState<string>('global');
    const [nivelFilter, setNivelFilter] = useState<Set<string>>(() => new Set(NIVEL_KEYS));

    useEffect(() => {
        setPinned(null);
        setHoverKey(null);
    }, [simulationId]);

    const simStudents = useMemo(
        () => filterStudentsForSimulation(students, simulationId),
        [students, simulationId],
    );

    const dots = useMemo(() => buildStudentDots(simStudents), [simStudents]);

    const { w: W, h: H, padL, padR, padT, padB } = UNIFIED_SCATTER;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const rowH = innerH / rows.length;

    const sx = useCallback(
        (score: number, max: number) => padL + (clamp(score, 0, max) / max) * innerW,
        [innerW, padL],
    );

    const rowBand = useCallback(
        (rowIndex: number) => {
            const y0 = padT + rowIndex * rowH;
            return { y0, y1: y0 + rowH, cy: y0 + rowH / 2 };
        },
        [padT, rowH],
    );

    const visibleDots = useMemo(
        () => dots.filter((d) => nivelFilter.has(d.nivel)),
        [dots, nivelFilter],
    );

    const nivelCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const d of dots) counts[d.nivel] = (counts[d.nivel] ?? 0) + 1;
        return counts;
    }, [dots]);

    const dotByKey = useMemo(() => new Map(visibleDots.map((d) => [d.key, d])), [visibleDots]);

    const activeTrail = useMemo(() => {
        return rows.map((row, rowIndex) => {
            const band = rowBand(rowIndex);
            return { row, band, rowIndex };
        });
    }, [rows, rowBand]);

    const pinDot = useCallback((dot: StudentDot) => {
        setPinned({ key: dot.key, dot });
        setHoverKey(dot.key);
    }, []);

    const clearPin = useCallback(() => {
        setPinned(null);
        setHoverKey(null);
    }, []);

    const activeKey = pinned?.key ?? hoverKey;
    const activeDot = activeKey ? dotByKey.get(activeKey) ?? null : null;

    const pickNearestDot = useCallback(
        (svgX: number, svgY: number, radius = 16): string | null => {
            let bestKey: string | null = null;
            let bestDist = radius;
            for (const dot of visibleDots) {
                for (const { row, band, rowIndex } of activeTrail) {
                    const score = row.id === 'global' ? dot.scores.global : dot.scores[row.id];
                    if (score == null || score <= 0) continue;
                    const cx = sx(score, row.max);
                    const cy = band.cy + jitterOffset(`${dot.key}-${row.id}`, rowH * 0.52);
                    const dist = Math.hypot(cx - svgX, cy - svgY);
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestKey = dot.key;
                    }
                }
            }
            return bestKey;
        },
        [visibleDots, activeTrail, sx, rowH],
    );

    const handlePointerMove = useCallback(
        (e: PointerEvent<SVGSVGElement>) => {
            if (pinned) return;
            const svg = svgRef.current;
            if (!svg) return;
            const loc = clientToSvg(svg, e.clientX, e.clientY);
            if (!loc) return;
            const nearest = pickNearestDot(loc.x, loc.y);
            setHoverKey((prev) => (prev === nearest ? prev : nearest));
        },
        [pinned, pickNearestDot],
    );

    const handlePointerLeave = useCallback(() => {
        if (!pinned) setHoverKey(null);
    }, [pinned]);

    const handleChartClick = useCallback(
        (e: MouseEvent<SVGSVGElement>) => {
            const svg = svgRef.current;
            if (!svg) return;
            const loc = clientToSvg(svg, e.clientX, e.clientY);
            if (!loc) return;

            const nearestKey = pickNearestDot(loc.x, loc.y, 26);
            if (nearestKey) {
                const dot = dotByKey.get(nearestKey);
                if (!dot) return;
                if (pinned?.key === dot.key) {
                    onStudentClick?.(dot.student);
                } else {
                    pinDot(dot);
                }
                return;
            }

            const rowIndex = rows.findIndex((_, i) => {
                const band = rowBand(i);
                return loc.y >= band.y0 && loc.y <= band.y1;
            });
            if (rowIndex >= 0) focusRow(rows[rowIndex].id);
        },
        [dotByKey, onStudentClick, pickNearestDot, pinDot, pinned, rowBand, rows],
    );

    const handleChartKeyDown = useCallback(
        (e: KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Escape') {
                clearPin();
                return;
            }
            if (visibleDots.length === 0) return;
            const currentIdx = activeKey
                ? visibleDots.findIndex((d) => d.key === activeKey)
                : -1;
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                const next = visibleDots[(currentIdx + 1 + visibleDots.length) % visibleDots.length];
                if (pinned) pinDot(next);
                else setHoverKey(next.key);
            }
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const next = visibleDots[(currentIdx - 1 + visibleDots.length) % visibleDots.length];
                if (pinned) pinDot(next);
                else setHoverKey(next.key);
            }
            if (e.key === 'Enter' && activeDot) {
                e.preventDefault();
                if (pinned?.key === activeDot.key) onStudentClick?.(activeDot.student);
                else pinDot(activeDot);
            }
        },
        [activeKey, activeDot, visibleDots, pinned, pinDot, clearPin, onStudentClick],
    );

    const focusRow = (rowId: string) => setFocusRowId(rowId);

    const toggleNivel = (nivel: string) => {
        setNivelFilter((prev) => {
            const next = new Set(prev);
            if (next.has(nivel)) {
                if (next.size <= 1) return prev;
                next.delete(nivel);
            } else {
                next.add(nivel);
            }
            return next;
        });
    };

    const activePoints = useMemo(() => {
        if (!activeDot) return [];
        return activeTrail
            .map(({ row, band }) => {
                const score = row.id === 'global' ? activeDot.scores.global : activeDot.scores[row.id];
                if (score == null || score <= 0) return null;
                const cx = sx(score, row.max);
                const cy = band.cy + jitterOffset(`${activeDot.key}-${row.id}`, rowH * 0.52);
                return { row, band, score, cx, cy };
            })
            .filter(Boolean) as Array<{
            row: RowDef;
            band: ReturnType<typeof rowBand>;
            score: number;
            cx: number;
            cy: number;
        }>;
    }, [activeDot, activeTrail, sx, rowH]);

    const connectorPath =
        activePoints.length >= 2
            ? activePoints.map((p) => `${p.cx},${p.cy}`).join(' ')
            : '';

    return (
        <ChartSection
            title="Dispersión por estudiante"
            hint="Un punto por estudiante en cada fila; el color indica su nivel global ICFES"
        >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <SimulationSourceBadge simId={simulationId} />
                <p className="text-[10px] tabular-nums text-white/45">
                    Mostrando{' '}
                    <strong className="text-white/80">{visibleDots.length}</strong> de{' '}
                    <strong className="text-white/80">{dots.length}</strong> estudiantes
                </p>
            </div>

            <div className="mb-3 space-y-3">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                            Resaltar fila en el gráfico
                        </p>
                        <p className="mt-0.5 text-[9px] leading-snug text-white/40">
                            Enfatiza una escala (global o área). No oculta puntos ni filtra estudiantes.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Resaltar fila">
                        <button
                            type="button"
                            aria-pressed={focusRowId === 'global'}
                            onClick={() => focusRow('global')}
                            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors border ${
                                focusRowId === 'global'
                                    ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40'
                                    : 'bg-white/[0.04] text-white/45 border-white/[0.08] hover:text-white/70'
                            }`}
                        >
                            Global
                        </button>
                        {AREA_DEFS.map((a) => (
                            <button
                                key={a.key}
                                type="button"
                                aria-pressed={focusRowId === a.key}
                                onClick={() => focusRow(a.key)}
                                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors border ${
                                    focusRowId === a.key
                                        ? 'text-white border-white/25'
                                        : 'bg-white/[0.04] text-white/45 border-white/[0.08] hover:text-white/70'
                                }`}
                                style={
                                    focusRowId === a.key
                                        ? {
                                              background: `${a.color}22`,
                                              borderColor: `${a.color}55`,
                                              color: a.color,
                                          }
                                        : { borderColor: `${a.color}33` }
                                }
                            >
                                {a.short}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                                Filtrar por nivel global
                            </p>
                            <p className="mt-0.5 text-[9px] leading-snug text-white/40">
                                Activa o desactiva grupos. Debe quedar al menos un nivel visible.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por nivel">
                        {NIVEL_KEYS.map((nivel) => {
                            const s = NIVEL_STYLE[nivel];
                            const on = nivelFilter.has(nivel);
                            const count = nivelCounts[nivel] ?? 0;
                            return (
                                <button
                                    key={nivel}
                                    type="button"
                                    aria-pressed={on}
                                    onClick={() => toggleNivel(nivel)}
                                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all ${
                                        on ? 'opacity-100' : 'opacity-60'
                                    }`}
                                    style={{
                                        background: on ? `${s.color}18` : 'rgba(255,255,255,0.03)',
                                        borderColor: on ? `${s.color}44` : 'rgba(255,255,255,0.08)',
                                        color: on ? s.color : 'rgba(255,255,255,0.45)',
                                    }}
                                >
                                    <span
                                        className={`h-2 w-2 rounded-full ${on ? '' : 'opacity-40'}`}
                                        style={{ background: s.color }}
                                    />
                                    <span>{s.label}</span>
                                    <span className="tabular-nums text-white/40">({count})</span>
                                    {!on && (
                                        <span className="rounded bg-white/[0.06] px-1 py-px text-[8px] font-bold uppercase text-white/35">
                                            oculto
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <DispersionNivelLegend />
            </div>

            <div
                ref={chartRef}
                tabIndex={0}
                role="application"
                aria-label="Dispersión por nivel. Usa flechas para navegar estudiantes, Enter para fijar, Escape para soltar."
                className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-black/25 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
                onKeyDown={handleChartKeyDown}
            >
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${W} ${H}`}
                    className="w-full h-auto touch-none select-none block cursor-crosshair"
                    style={{ height: 'auto', aspectRatio: `${W} / ${H}` }}
                    role="img"
                    aria-hidden
                    onPointerMove={handlePointerMove}
                    onPointerLeave={handlePointerLeave}
                    onClick={handleChartClick}
                >
                    {connectorPath && (
                        <polyline
                            points={connectorPath}
                            fill="none"
                            stroke="rgba(255,255,255,0.35)"
                            strokeWidth={1.5}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            pointerEvents="none"
                        />
                    )}

                    {rows.map((row, rowIndex) => {
                        const band = rowBand(rowIndex);
                        const focused = focusRowId === row.id;
                        const rowActivePoint = activePoints.find((p) => p.row.id === row.id);

                        return (
                            <g key={row.id}>
                                <rect
                                    x={padL}
                                    y={band.y0 + 2}
                                    width={innerW}
                                    height={rowH - 4}
                                    rx={6}
                                    fill={focused ? `${row.color}14` : 'rgba(255,255,255,0.02)'}
                                    stroke={focused ? `${row.color}55` : 'rgba(255,255,255,0.06)'}
                                    strokeWidth={focused ? 1.5 : 1}
                                    pointerEvents="none"
                                    style={{ transition: 'fill 0.2s ease, stroke 0.2s ease' }}
                                />
                                <text
                                    x={padL - 8}
                                    y={band.cy + 4}
                                    textAnchor="end"
                                    fill={row.color}
                                    fontSize="10"
                                    fontWeight="800"
                                    pointerEvents="none"
                                >
                                    {row.label}
                                </text>
                                {row.ticks.map((t) => (
                                    <g key={`${row.id}-${t}`}>
                                        <line
                                            x1={sx(t, row.max)}
                                            x2={sx(t, row.max)}
                                            y1={band.y0 + 6}
                                            y2={band.y1 - 6}
                                            stroke="rgba(255,255,255,0.05)"
                                            pointerEvents="none"
                                        />
                                        <text
                                            x={sx(t, row.max)}
                                            y={band.y1 - 2}
                                            textAnchor="middle"
                                            fill="rgba(255,255,255,0.38)"
                                            fontSize="8"
                                            pointerEvents="none"
                                        >
                                            {t}
                                        </text>
                                    </g>
                                ))}

                                {rowActivePoint && (
                                    <>
                                        <line
                                            x1={rowActivePoint.cx}
                                            x2={rowActivePoint.cx}
                                            y1={band.y0 + 4}
                                            y2={band.y1 - 4}
                                            stroke={row.color}
                                            strokeOpacity={0.5}
                                            strokeDasharray="4 3"
                                            pointerEvents="none"
                                        />
                                        <rect
                                            x={rowActivePoint.cx - 22}
                                            y={band.y0 + 5}
                                            width={44}
                                            height={14}
                                            rx={4}
                                            fill="rgba(15,23,42,0.92)"
                                            stroke={`${row.color}66`}
                                            pointerEvents="none"
                                        />
                                        <text
                                            x={rowActivePoint.cx}
                                            y={band.y0 + 15}
                                            textAnchor="middle"
                                            fill={row.color}
                                            fontSize="8"
                                            fontWeight="700"
                                            pointerEvents="none"
                                        >
                                            {rowActivePoint.score}
                                        </text>
                                    </>
                                )}

                                {visibleDots.map((dot) => {
                                    const score = row.id === 'global' ? dot.scores.global : dot.scores[row.id];
                                    if (score == null || score <= 0) return null;
                                    const style = NIVEL_STYLE[dot.nivel] ?? NIVEL_STYLE.Medio;
                                    const isActive = activeKey === dot.key;
                                    const dim = activeKey !== null && !isActive;
                                    const cx = sx(score, row.max);
                                    const cy = band.cy + jitterOffset(`${dot.key}-${row.id}`, rowH * 0.52);

                                    return (
                                        <g key={`${row.id}-${dot.key}`} pointerEvents="none">
                                            <circle
                                                cx={cx}
                                                cy={cy}
                                                r={isActive ? 7.5 : 4.5}
                                                fill={style.color}
                                                fillOpacity={dim ? 0.12 : isActive ? 1 : 0.8}
                                                stroke={isActive ? '#fff' : '#0a0e1a'}
                                                strokeWidth={isActive ? 2 : 1.2}
                                                style={{
                                                    filter: isActive ? `drop-shadow(0 0 6px ${style.color})` : undefined,
                                                    transition: 'r 0.15s ease, fill-opacity 0.15s ease',
                                                }}
                                            />
                                            {isActive && (
                                                <circle
                                                    cx={cx}
                                                    cy={cy}
                                                    r={11}
                                                    fill="none"
                                                    stroke={style.color}
                                                    strokeOpacity={0.45}
                                                    strokeWidth={1}
                                                />
                                            )}
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}

                    <text
                        x={padL + innerW / 2}
                        y={H - 4}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.45)"
                        fontSize="9"
                        fontWeight="600"
                    >
                        Eje horizontal: puntaje · fila Global 0–500 · filas de área 0–100
                    </text>
                </svg>
            </div>

            <DispersionStudentDetailSlot
                activeDot={activeDot}
                pinned={pinned}
                onStudentClick={onStudentClick}
                onClearPin={clearPin}
            />
        </ChartSection>
    );
}

function CompetenciasScatterGrid({
    students,
    simulationId,
    onStudentClick,
}: {
    students: Estudiante[];
    simulationId: string;
    onStudentClick?: (e: Estudiante) => void;
}) {
    return (
        <UnifiedDispersionChart
            key={simulationId}
            students={students}
            simulationId={simulationId}
            onStudentClick={onStudentClick}
        />
    );
}

export default function CoordinadorCompetenciasCharts({
    inst,
    simulationId,
    onStudentClick,
}: {
    inst: InstitutionMetrics;
    simulationId: string;
    onStudentClick?: (e: Estudiante) => void;
}) {
    const simStudents = useMemo(
        () => filterStudentsForSimulation(inst.students, simulationId),
        [inst.students, simulationId],
    );
    if (!simStudents.length) return null;

    return (
        <div className="space-y-4 min-w-0 max-w-full overflow-hidden">
            <CompetenciasCompareLine inst={{ ...inst, students: simStudents }} />
            <CompetenciasScatterGrid
                students={simStudents}
                simulationId={simulationId}
                onStudentClick={onStudentClick}
            />
        </div>
    );
}
