'use client';
import { CoordIcon, CoordIcons } from '@features/coordinador/components/ui/CoordinatorIcons';
import { useCoordinadorData as useCoordinadorDataHook } from '@features/coordinador/hooks/useCoordinadorData';

export type UseCoordinadorDataFn = typeof useCoordinadorDataHook;
import { useCoordinadorPanelLayout } from '@features/coordinador/hooks/useCoordinadorPanelLayout';
import { NATIONAL_STATS, estimatePercentile } from '@features/benchmark/lib/nationalData';
import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search } from 'lucide-react';
import { LoadingState, ErrorState } from '@features/coordinador/components/ui';
import PercentilValue from '@features/coordinador/components/ui/PercentilValue';
import { humanPercentileShort } from '@features/benchmark/lib/benchmarkContextHelpers';
import BenchmarkContextPanel from '@features/coordinador/components/benchmark/BenchmarkContextPanel';
import { useBenchmarkContext } from '@features/coordinador/hooks/useBenchmarkContext';
import { MATERIAS as MATERIAS_BASE } from '@features/coordinador/lib/analisis/materias';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import CoordCard from '@features/coordinador/components/ui/CoordCard';
import type { Estudiante } from '@shared/types';
import {
    PIFA_SIN_DATO,
    isIndividualInstitution,
    studentCursoKey,
} from '@shared/lib/pifaCurso';
import InstitutionEvolutionPanel from '@features/coordinador/pages/comparativa/InstitutionEvolutionPanel';

const MATERIAS = MATERIAS_BASE.map((m) => ({
    key: m.key,
    label: m.label,
    short:
        m.key === 'lectura crítica' ? 'LEC'
        : m.key === 'matemáticas' ? 'MAT'
        : m.key === 'sociales y ciudadanas' ? 'SOC'
        : m.key === 'ciencias naturales' ? 'CIEN'
        : 'ING',
    color: m.color,
    bg:
        m.key === 'matemáticas' ? 'from-blue-500/20 to-blue-600/5'
        : m.key === 'lectura crítica' ? 'from-red-500/20 to-red-600/5'
        : m.key === 'sociales y ciudadanas' ? 'from-orange-400/20 to-orange-500/5'
        : m.key === 'ciencias naturales' ? 'from-green-500/20 to-green-600/5'
        : 'from-purple-500/20 to-purple-600/5',
    natKey:
        m.key === 'lectura crítica' ? 'Lectura'
        : m.key === 'matemáticas' ? 'Matematicas'
        : m.key === 'sociales y ciudadanas' ? 'Sociales'
        : m.key === 'ciencias naturales' ? 'Ciencias'
        : 'Ingles',
}));

const INST_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

// ═══════════════════════════════════════════
// Section wrapper with description
// ═══════════════════════════════════════════
function Section({
    title,
    description,
    accent,
    children,
    tourAnchor,
}: {
    title?: string;
    description?: string;
    accent: string;
    children: React.ReactNode;
    tourAnchor?: string;
}) {
    return (
        <CoordCard
            data-coord-tour={tourAnchor || undefined}
            padding="none"
            hoverable
            className="overflow-hidden"
            style={{ borderTop: `3px solid ${accent}` }}
        >
            <div className="p-5 lg:p-6">
                {title ? (
                    <div className="coord-section-header">
                        <div
                            className="coord-section-header__bar"
                            style={{ background: accent }}
                        />
                        <div>
                            <h3 className="coord-section-header__title">{title}</h3>
                            {description ? (
                                <p className="coord-section-header__desc">{description}</p>
                            ) : null}
                        </div>
                    </div>
                ) : null}
                {children}
            </div>
        </CoordCard>
    );
}

// ═══════════════════════════════════════════
// 1. LOLLIPOP CHART — Ranking global
// ═══════════════════════════════════════════
function InstitutionLegend({
    items,
}: {
    items: Array<{ name: string; color: string; isMine?: boolean }>;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const ordered = useMemo(() => {
        const mine = items.filter((i) => i.isMine);
        const rest = items.filter((i) => !i.isMine).sort((a, b) => a.name.localeCompare(b.name, 'es'));
        return [...mine, ...rest];
    }, [items]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return ordered;
        return ordered.filter((i) => i.name.toLowerCase().includes(q) || (i.isMine && 'tú'.includes(q)));
    }, [ordered, query]);

    return (
        <div className="mt-3">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-left transition-colors hover:bg-white/[0.05]"
                aria-expanded={open}
            >
                <span className="text-[11px] font-semibold text-white/55">
                    Leyenda
                    <span className="ml-1.5 font-normal text-white/30">{items.length} instituciones</span>
                </span>
                <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
                    aria-hidden
                />
            </button>
            {open ? (
                <div
                    className="mt-2 overflow-hidden rounded-xl"
                    style={{
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    <div className="border-b border-white/[0.06] p-2.5">
                        <div className="relative">
                            <Search
                                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30"
                                aria-hidden
                            />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Buscar institución…"
                                aria-label="Buscar en leyenda"
                                className="w-full rounded-lg border border-white/10 bg-black/30 py-1.5 pl-8 pr-3 text-[11px] text-white placeholder:text-white/25 focus:border-cyan-500/35 focus:outline-none focus:ring-1 focus:ring-cyan-500/25"
                            />
                        </div>
                    </div>
                    <ul className="max-h-56 overflow-y-auto px-1.5 py-1.5" role="list">
                        {filtered.length === 0 ? (
                            <li className="px-2 py-6 text-center text-[11px] text-white/30">Sin coincidencias</li>
                        ) : (
                            filtered.map((i) => (
                                <li
                                    key={i.name}
                                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 ${
                                        i.isMine ? 'bg-violet-500/10' : 'hover:bg-white/[0.03]'
                                    }`}
                                    title={i.name}
                                >
                                    <span
                                        className="h-2 w-2 shrink-0 rounded-full"
                                        style={{ background: i.color, boxShadow: `0 0 0 2px ${i.color}33` }}
                                        aria-hidden
                                    />
                                    <span
                                        className={`min-w-0 flex-1 truncate text-[11px] ${
                                            i.isMine ? 'font-semibold text-violet-100' : 'text-white/55'
                                        }`}
                                    >
                                        {i.name}
                                    </span>
                                    {i.isMine ? (
                                        <span className="shrink-0 rounded-md bg-violet-500/25 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-violet-200">
                                            Tú
                                        </span>
                                    ) : null}
                                </li>
                            ))
                        )}
                    </ul>
                    <div className="flex items-center gap-2 border-t border-white/[0.06] px-3 py-2 text-[10px] text-white/30">
                        <span className="h-0 w-5 border-t border-dashed border-white/35" aria-hidden />
                        Promedio nacional ICFES
                    </div>
                </div>
            ) : null}
        </div>
    );
}

// ═══════════════════════════════════════════
// GROUPED COLUMN CHART — All subjects
// ═══════════════════════════════════════════
function GroupedColumnChart({ institutions, myName }: {
    institutions: { name: string; color: string; subjectAvgs: Record<string, number> }[];
    myName: string;
}) {
    const [hovered, setHovered] = useState<{ inst: number; mat: number } | null>(null);
    const [tipPos, setTipPos] = useState<{ left: number; top: number } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const W = 700, H = 240, topPad = 20, bottomPad = 50, leftPad = 40, rightPad = 20;
    const chartW = W - leftPad - rightPad;
    const chartH = H - topPad - bottomPad;
    const maxVal = 80;
    const groupW = chartW / MATERIAS.length;
    const barW = Math.min(groupW / (institutions.length + 1), 18);
    const natAvgs = MATERIAS.map(m => NATIONAL_STATS.areas[m.natKey as keyof typeof NATIONAL_STATS.areas]?.mean || 50);

    const tip = (() => {
        if (!hovered) return null;
        const inst = institutions[hovered.inst];
        const m = MATERIAS[hovered.mat];
        if (!inst || !m) return null;
        return {
            name: inst.name,
            color: inst.color,
            short: m.short,
            score: inst.subjectAvgs[m.key] || 0,
        };
    })();

    const placeTip = (svgX: number, svgY: number) => {
        const el = svgRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const sx = (svgX / W) * rect.width + rect.left;
        const sy = (svgY / H) * rect.height + rect.top;
        const tipW = 320;
        const tipH = 34;
        const left = Math.min(Math.max(8, sx - tipW / 2), window.innerWidth - tipW - 8);
        const top = Math.min(Math.max(8, sy - tipH - 10), window.innerHeight - tipH - 8);
        setTipPos({ left, top });
    };

    return (
        <>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full">
            {/* Y-axis grid lines */}
            {[0, 20, 40, 60, 80].map(v => {
                const y = topPad + chartH - (v / maxVal) * chartH;
                return (
                    <g key={v}>
                        <line x1={leftPad} y1={y} x2={W - rightPad} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                        <text x={leftPad - 6} y={y + 3} fill="rgba(255,255,255,0.2)" fontSize="8" textAnchor="end">{v}</text>
                    </g>
                );
            })}

            {/* Groups per materia */}
            {MATERIAS.map((m, mi) => {
                const groupX = leftPad + mi * groupW + groupW / 2;
                const natY = topPad + chartH - (natAvgs[mi] / maxVal) * chartH;

                return (
                    <g key={m.key}>
                        {/* National average marker */}
                        <line x1={groupX - groupW * 0.35} y1={natY} x2={groupX + groupW * 0.35} y2={natY}
                            stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3,2" />

                        {/* Bars per institution */}
                        {institutions.map((inst, ii) => {
                            const score = inst.subjectAvgs[m.key] || 0;
                            const barH = (score / maxVal) * chartH;
                            const barX = groupX - (institutions.length * barW) / 2 + ii * barW;
                            const barY = topPad + chartH - barH;
                            const isMine = inst.name === myName;
                            const isHov = hovered?.inst === ii && hovered?.mat === mi;
                            const cx = barX + (barW - 2) / 2;

                            return (
                                <g key={inst.name}
                                    onMouseEnter={() => {
                                        setHovered({ inst: ii, mat: mi });
                                        placeTip(cx, barY);
                                    }}
                                    onMouseLeave={() => {
                                        setHovered(null);
                                        setTipPos(null);
                                    }}
                                    className="cursor-pointer">
                                    <rect x={barX} y={barY} width={barW - 2} height={Math.max(barH, 0)}
                                        rx={2} fill={isMine ? inst.color : `${inst.color}60`}
                                        stroke={isHov ? '#fff' : 'none'} strokeWidth={1}
                                        style={{ filter: isMine ? `drop-shadow(0 2px 4px ${inst.color}40)` : 'none', transition: 'all 0.2s' }} />
                                </g>
                            );
                        })}

                        {/* Materia label */}
                        <text x={groupX} y={H - bottomPad + 16} fill={m.color} fontSize="9" fontWeight="700" textAnchor="middle">{m.short}</text>
                        <text x={groupX} y={H - bottomPad + 26} fill="rgba(255,255,255,0.15)" fontSize="7" textAnchor="middle">nal: {natAvgs[mi].toFixed(0)}</text>
                    </g>
                );
            })}
        </svg>
        {tip && tipPos && typeof document !== 'undefined'
            ? createPortal(
                  <div
                      className="pointer-events-none fixed z-[320] max-w-[min(92vw,360px)] rounded-md border border-white/15 bg-[#0b1220]/92 px-2.5 py-1 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-sm"
                      style={{ left: tipPos.left, top: tipPos.top }}
                      role="tooltip"
                  >
                      <div className="flex items-center gap-1.5">
                          <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ background: tip.color }}
                              aria-hidden
                          />
                          <p className="min-w-0 flex-1 text-[11px] font-semibold leading-snug break-words text-white">
                              {tip.name}
                          </p>
                          <span className="shrink-0 whitespace-nowrap text-[11px] font-semibold tabular-nums text-cyan-100/90">
                              {tip.short} · {tip.score.toFixed(1)}
                          </span>
                      </div>
                  </div>,
                  document.body,
              )
            : null}
        </>
    );
}

// ═══════════════════════════════════════════
// 3. COMPARATIVA POR CURSO (PIFA) — reemplaza radar
// ═══════════════════════════════════════════
type CursoRow = {
    curso: string;
    count: number;
    global: number;
    areas: Record<string, number>;
};

function buildCursoRows(students: readonly Estudiante[]): CursoRow[] {
    const groups = new Map<string, Estudiante[]>();
    for (const s of students) {
        const curso = studentCursoKey(s);
        if (curso === PIFA_SIN_DATO) continue;
        if (!groups.has(curso)) groups.set(curso, []);
        groups.get(curso)!.push(s);
    }
    const rows: CursoRow[] = [];
    for (const [curso, list] of groups) {
        const globals = list.map((s) => s.puntaje_global || 0).filter((p) => p > 0);
        const areas: Record<string, number> = {};
        for (const m of MATERIAS) {
            const vals = list
                .map((s) => Number(s.puntajes?.[m.key]?.puntaje) || 0)
                .filter((p) => p > 0);
            areas[m.key] =
                vals.length > 0
                    ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
                    : 0;
        }
        rows.push({
            curso,
            count: list.length,
            global:
                globals.length > 0
                    ? Math.round(globals.reduce((a, b) => a + b, 0) / globals.length)
                    : 0,
            areas,
        });
    }
    return rows.sort((a, b) => b.global - a.global || a.curso.localeCompare(b.curso, 'es'));
}

function CursoComparativaPanel({ students }: { students: readonly Estudiante[] }) {
    const rows = useMemo(() => buildCursoRows(students), [students]);
    const institutionAvg = useMemo(() => {
        const scores = students.map((s) => s.puntaje_global || 0).filter((p) => p > 0);
        if (scores.length === 0) return 0;
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }, [students]);
    if (rows.length < 2) return null;

    const maxGlobal = Math.max(...rows.map((r) => r.global), 1);
    const bestByArea = Object.fromEntries(
        MATERIAS.map((m) => {
            let best = rows[0]!;
            for (const r of rows) {
                if ((r.areas[m.key] || 0) > (best.areas[m.key] || 0)) best = r;
            }
            return [m.key, best.curso];
        }),
    );

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[640px]">
                    <thead>
                        <tr className="border-b border-white/[0.08] text-white/40">
                            <th className="text-left py-2.5 px-2 font-bold uppercase tracking-wider text-[10px]">Curso</th>
                            <th className="text-center py-2.5 px-2 font-bold uppercase tracking-wider text-[10px]">Est.</th>
                            <th className="text-left py-2.5 px-2 font-bold uppercase tracking-wider text-[10px] min-w-[140px]">Global</th>
                            {MATERIAS.map((m) => (
                                <th
                                    key={m.key}
                                    className="text-center py-2.5 px-1.5 font-bold uppercase tracking-wider text-[10px]"
                                    style={{ color: `${m.color}99` }}
                                >
                                    {m.short}
                                </th>
                            ))}
                            <th className="text-center py-2.5 px-2 font-bold uppercase tracking-wider text-[10px]">Δ IE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => {
                            const delta = r.global - institutionAvg;
                            const barPct = Math.min(100, (r.global / maxGlobal) * 100);
                            return (
                                <tr
                                    key={r.curso}
                                    className={`border-b border-white/[0.04] ${i % 2 === 0 ? 'bg-white/[0.015]' : ''} hover:bg-white/[0.04] transition-colors`}
                                >
                                    <td className="py-2.5 px-2">
                                        <span className="font-bold text-white">{r.curso}</span>
                                    </td>
                                    <td className="py-2.5 px-2 text-center text-white/55 tabular-nums">{r.count}</td>
                                    <td className="py-2.5 px-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-cyan-500/50 to-cyan-400"
                                                    style={{ width: `${Math.max(barPct, 4)}%` }}
                                                />
                                            </div>
                                            <span className="w-8 text-right font-black text-white tabular-nums">{r.global}</span>
                                        </div>
                                    </td>
                                    {MATERIAS.map((m) => {
                                        const v = r.areas[m.key] || 0;
                                        const isBest = bestByArea[m.key] === r.curso && v > 0;
                                        return (
                                            <td key={m.key} className="py-2.5 px-1.5 text-center tabular-nums">
                                                <span
                                                    className={`inline-block min-w-[2.25rem] rounded-md px-1.5 py-0.5 font-bold ${
                                                        isBest ? 'ring-1' : ''
                                                    }`}
                                                    style={{
                                                        color: m.color,
                                                        background: `${m.color}14`,
                                                        boxShadow: isBest ? `0 0 0 1px ${m.color}55` : undefined,
                                                    }}
                                                >
                                                    {v > 0 ? v.toFixed(0) : '—'}
                                                </span>
                                            </td>
                                        );
                                    })}
                                    <td className="py-2.5 px-2 text-center">
                                        <span
                                            className={`text-[11px] font-bold tabular-nums ${
                                                delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                            }`}
                                        >
                                            {delta >= 0 ? '+' : ''}
                                            {delta.toFixed(0)}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <p className="text-[11px] text-white/35 leading-relaxed">
                {rows.length} cursos con dato PIFA · anillo = mejor curso por área · Δ IE vs promedio institucional ({institutionAvg}).
            </p>
        </div>
    );
}

// ═══════════════════════════════════════════
// 4. BULLET CHART — Percentile
// ═══════════════════════════════════════════
function BulletChart({ label, value, pct, color, natAvg }: { label: string; value: number; pct: number; color: string; natAvg: number }) {
    const maxVal = 80;
    return (
        <div className="group hover:bg-white/[0.02] rounded-lg px-3 py-2.5 transition-all">
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-[11px] font-bold text-white/70">{label}</span>
                </div>
                <PercentilValue value={pct} size="sm" style={{ color }} />
            </div>
            <div className="relative h-5 rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                {/* Background ranges: low / medium / high */}
                <div className="absolute inset-0 flex">
                    <div className="h-full" style={{ width: '33%', background: 'rgba(239,68,68,0.06)' }} />
                    <div className="h-full" style={{ width: '34%', background: 'rgba(251,191,36,0.06)' }} />
                    <div className="h-full" style={{ width: '33%', background: 'rgba(16,185,129,0.06)' }} />
                </div>
                {/* Your score bar */}
                <div className="absolute top-1 bottom-1 left-0 rounded-sm transition-all duration-700"
                    style={{ width: `${(value / maxVal) * 100}%`, background: `linear-gradient(90deg, ${color}60, ${color})` }} />
                {/* National average marker */}
                <div className="absolute top-0 bottom-0 w-[3px] rounded-full"
                    style={{ left: `${(natAvg / maxVal) * 100}%`, background: 'rgba(255,255,255,0.6)' }}>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[6px] font-bold text-white/30 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        Nacional
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="text-white/20">0</span>
                <span className="text-white/30">Tuyo: <span className="font-bold" style={{ color }}>{value.toFixed(1)}</span> · Nacional: {natAvg.toFixed(1)}</span>
                <span className="text-white/20">{maxVal}</span>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
// Main view (prod + demo landing)
// ═══════════════════════════════════════════
export function CoordinadorComparativaView({
    useCoordinadorData = useCoordinadorDataHook,
    embedDemo = false,
}: {
    useCoordinadorData?: UseCoordinadorDataFn;
    embedDemo?: boolean;
}) {
    const layout = useCoordinadorPanelLayout(embedDemo);
    const {
        myInstitution: inst,
        allInstitutions,
        cohortStudents,
        availableSimulations,
        currentSimulation,
        loading,
        error,
    } = useCoordinadorData();
    const [viewMode, setViewMode] = useState<'charts' | 'heatmap'>('charts');
    const benchmarkCtx = useBenchmarkContext(inst);

    const cursoRowsCount = useMemo(
        () => buildCursoRows(cohortStudents || []).length,
        [cohortStudents],
    );
    const showCursoComparativa =
        !isIndividualInstitution(inst?.name) &&
        !String(inst?.name || '').toUpperCase().includes('TODAS') &&
        cursoRowsCount >= 2;

    const analytics = useMemo(() => {
        if (!inst || allInstitutions.length === 0) return null;

        const instData = allInstitutions.map((i, idx) => ({
            name: i.name,
            avg: i.avg,
            students: i.students.length,
            color: INST_COLORS[idx % INST_COLORS.length],
            isMine: i.name === inst.name || (inst.name.includes('TODAS') && idx === 0),
            subjectAvgs: Object.fromEntries(i.subjectStats.map(s => [s.key, s.avg])),
            tasaAprobacion: i.tasaAprobacion,
        }));

        const subjectRankings = MATERIAS.map(m => {
            const natAvg = NATIONAL_STATS.areas[m.natKey as keyof typeof NATIONAL_STATS.areas]?.mean || 50;
            const myScore = inst.subjectStats.find(s => s.key === m.key)?.avg || 0;
            const delta = myScore - natAvg;
            const pct = estimatePercentile(m.natKey as keyof typeof NATIONAL_STATS.areas, myScore);
            return { ...m, natAvg, myScore, delta, pct };
        });

        const globalSorted = [...instData].sort((a, b) => b.avg - a.avg);
        const myGlobalIdx = globalSorted.findIndex(i => i.isMine);
        const myGlobalRank = myGlobalIdx >= 0 ? myGlobalIdx + 1 : 1;

        const bestSubject = [...subjectRankings].sort((a, b) => b.delta - a.delta)[0];
        const worstSubject = [...subjectRankings].sort((a, b) => a.delta - b.delta)[0];

        return { instData, subjectRankings, globalSorted, myGlobalRank, bestSubject, worstSubject };
    }, [inst, allInstitutions]);

    if (loading) return <LoadingState message="Cargando comparativa institucional…" />;
    if (error || !inst || !analytics) {
        return (
            <ErrorState
                message="No fue posible cargar la comparativa"
                detail={error || 'Sin datos disponibles para comparar.'}
            />
        );
    }

    const { instData, subjectRankings, globalSorted, myGlobalRank, bestSubject, worstSubject } = analytics;
    const myName = instData.find(i => i.isMine)?.name || inst.name;

    return (
        <div
            data-coordinator-theme
            className={`${layout.comparativaRootClass ?? ''} ${layout.pagePaddingClass} max-w-7xl mx-auto space-y-5 min-w-0`.trim()}
        >
            {/* ═══ HEADER ═══ */}
            <div
                className="flex flex-col md:flex-row md:items-end justify-between gap-4"
                data-coord-tour={TourAnchors.comparativaHeader}
            >
                <div>
                    <p className="text-xs font-bold tracking-[3px] uppercase mb-2" style={{ color: 'rgba(6,182,212,0.75)' }}>
                        Comparativa entre instituciones
                    </p>
                    <h1 className="text-2xl font-black coord-text-head tracking-tight">Evolución y ranking</h1>
                    <p className="text-sm coord-text-muted mt-0.5">
                        Puntaje global frente al promedio nacional e instituciones seleccionadas · {inst.students.length} estudiantes
                    </p>
                </div>
                <div
                    className="coord-tab-bar"
                    role="tablist"
                    aria-label="Vista de comparativa"
                    data-coord-tour={TourAnchors.comparativaFilters}
                >
                    <button
                        type="button"
                        role="tab"
                        aria-selected={viewMode === 'charts'}
                        data-active={viewMode === 'charts'}
                        onClick={() => setViewMode('charts')}
                        className="coord-tab-item"
                    >
                        Gráficas
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={viewMode === 'heatmap'}
                        data-active={viewMode === 'heatmap'}
                        onClick={() => setViewMode('heatmap')}
                        className="coord-tab-item"
                    >
                        Heatmap
                    </button>
                </div>
            </div>

            {/* ═══ KPI STRIP (Stitch glass chips) ═══ */}
            <div
                className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-9"
                data-coord-tour={TourAnchors.comparativaKpis}
            >
                <div
                    className="min-w-0 rounded-xl px-3.5 py-3"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">Ranking simulacro</div>
                    <div className="flex min-w-0 items-baseline gap-2">
                        <span className="text-2xl font-black text-white">#{myGlobalRank}</span>
                        <span className="truncate text-[11px] text-white/35">de {globalSorted.length}</span>
                    </div>
                </div>
                <div
                    className="min-w-0 rounded-xl px-3.5 py-3"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
                    title={humanPercentileShort(estimatePercentile('Global', inst.avg))}
                >
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">Colegios superados</div>
                    <div className="text-2xl font-black tabular-nums text-cyan-300">
                        {estimatePercentile('Global', inst.avg)}%
                    </div>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-white/40">
                        {humanPercentileShort(estimatePercentile('Global', inst.avg))}
                    </p>
                </div>
                <div
                    className="min-w-0 rounded-xl px-3.5 py-3"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">Pos. departamental</div>
                    <div className="flex min-w-0 items-baseline gap-2">
                        <span className="text-2xl font-black text-white">
                            {benchmarkCtx.departmentTotal > 0 ? `#${benchmarkCtx.departmentPosition}` : '—'}
                        </span>
                        <span className="truncate text-[11px] text-white/35" title={benchmarkCtx.territoryLabel}>
                            {benchmarkCtx.departmentTotal > 0
                                ? `de ${benchmarkCtx.departmentTotal}`
                                : benchmarkCtx.territoryLabel}
                        </span>
                    </div>
                </div>
                <div
                    className="min-w-0 rounded-xl px-3.5 py-3"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">Delta vs nacional</div>
                    <div className="flex min-w-0 items-baseline gap-2">
                        <span className={`text-2xl font-black tabular-nums ${inst.avg - NATIONAL_STATS.global.mean >= 0 ? 'text-cyan-300' : 'text-rose-300'}`}>
                            {inst.avg - NATIONAL_STATS.global.mean >= 0 ? '+' : ''}
                            {(inst.avg - NATIONAL_STATS.global.mean).toFixed(0)}
                        </span>
                        <span className="text-[11px] text-white/35">pts</span>
                    </div>
                </div>
                {subjectRankings.map(sr => (
                    <div
                        key={sr.key}
                        className="min-w-0 rounded-xl px-3 py-3"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: `${sr.color}99` }}>{sr.short}</div>
                        <div className="flex min-w-0 items-baseline gap-1.5">
                            <span className="text-lg font-black tabular-nums" style={{ color: sr.color }}>{sr.myScore.toFixed(0)}</span>
                            <span className={`text-[11px] font-bold tabular-nums ${sr.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {sr.delta >= 0 ? '↑' : '↓'}{Math.abs(sr.delta).toFixed(1)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div data-coord-tour={TourAnchors.comparativaContext}>
            <BenchmarkContextPanel
                inst={inst}
                variant="compact"
                simulacroInstitutionCount={allInstitutions.length}
                context={benchmarkCtx}
            />
            </div>

            {viewMode === 'charts' ? (
                <>
                    {/* ═══ 1. EVOLUCIÓN MULTI-IE ═══ */}
                    <Section accent="#06b6d4" tourAnchor={TourAnchors.comparativaLollipop}>
                        <InstitutionEvolutionPanel
                            myName={myName}
                            availableSimulations={availableSimulations}
                            currentSimulation={currentSimulation}
                        />
                    </Section>

                    {/* ═══ 2. Comparativa por curso (debajo de evolución) ═══ */}
                    {showCursoComparativa ? (
                        <Section
                            tourAnchor={TourAnchors.comparativaRadar}
                            title="Comparativa por Curso"
                            description="Promedio global y por área de cada curso/grupo de tu institución (datos PIFA). Solo se muestra cuando hay más de un curso con estudiantes en este simulacro. Usa el filtro Grado / Curso del encabezado para acotar la cohorte."
                            accent="#06b6d4"
                        >
                            <CursoComparativaPanel students={cohortStudents || []} />
                        </Section>
                    ) : (
                        <Section
                            tourAnchor={TourAnchors.comparativaBullets}
                            title="Posición Nacional por Competencia"
                            description="Tu puntaje (barra de color) contra el promedio nacional (marcador blanco). Rangos: bajo (rojo), medio (amarillo), alto (verde)."
                            accent="#10b981"
                        >
                            <div className="mx-auto w-full max-w-3xl space-y-1">
                                {subjectRankings.map((sr) => (
                                    <BulletChart
                                        key={sr.key}
                                        label={sr.label}
                                        value={sr.myScore}
                                        pct={sr.pct}
                                        color={sr.color}
                                        natAvg={sr.natAvg}
                                    />
                                ))}
                                <div className="mt-2 border-t border-white/[0.04] pt-2">
                                    <BulletChart
                                        label="Puntaje Global (÷5)"
                                        value={inst.avg / 5}
                                        pct={estimatePercentile('Global', inst.avg)}
                                        color="#8b5cf6"
                                        natAvg={NATIONAL_STATS.global.mean / 5}
                                    />
                                </div>
                            </div>
                        </Section>
                    )}

                    {/* ═══ 3. GROUPED COLUMNS ═══ */}
                    <Section
                        tourAnchor={TourAnchors.comparativaSubjectChart}
                        title="Rendimiento Comparativo por Competencia"
                        description="Un solo gráfico que muestra todas las materias lado a lado para cada institución. La línea punteada horizontal en cada grupo representa el promedio nacional ICFES de esa materia. Pasa el cursor sobre cada barra para ver el puntaje exacto."
                        accent="#3b82f6">
                        <GroupedColumnChart institutions={instData} myName={myName} />
                        <InstitutionLegend items={instData} />
                    </Section>

                    {/* ═══ APPROVAL RATE ═══ */}
                    <Section
                        tourAnchor={TourAnchors.comparativaApproval}
                        title="Tasa de Aprobación Institucional"
                        description="Porcentaje de estudiantes que superan los 250 puntos globales (criterio de aprobación, prom. nacional). Los colores indican: verde ≥70%, cyan ≥50%, amarillo ≥30%, rojo <30%. Compara qué tan lejos estás de tu competencia."
                        accent="#10b981">
                        <div className="space-y-2.5">
                                {[...instData].sort((a, b) => b.tasaAprobacion - a.tasaAprobacion).map((d, i) => {
                                    const barColor = d.tasaAprobacion >= 70
                                        ? 'linear-gradient(90deg, #059669, #10b981)'
                                        : d.tasaAprobacion >= 50 ? 'linear-gradient(90deg, #0e7490, #06b6d4)'
                                            : d.tasaAprobacion >= 30 ? 'linear-gradient(90deg, #b45309, #f59e0b)'
                                                : 'linear-gradient(90deg, #b91c1c, #ef4444)';
                                    const textColor = d.tasaAprobacion >= 70 ? '#10b981'
                                        : d.tasaAprobacion >= 50 ? '#06b6d4'
                                            : d.tasaAprobacion >= 30 ? '#f59e0b'
                                                : '#ef4444';
                                    const isMine = d.isMine;
                                    return (
                                        <div key={d.name} className={`rounded-lg py-2.5 px-3 space-y-2 ${isMine ? 'bg-white/[0.04] border border-white/[0.08]' : 'hover:bg-white/[0.02]'} transition-all`}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-2 min-w-0 flex-1">
                                                    <span className="text-xs font-bold text-white/25 shrink-0 pt-0.5 w-5">{i + 1}</span>
                                                    <span className={`text-[11px] font-bold leading-snug break-words ${isMine ? 'text-purple-300' : 'text-white/70'}`}>
                                                        {isMine ? 'Tú · ' : ''}{d.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 text-right">
                                                    <span className="text-xs font-black" style={{ color: textColor }}>
                                                        {d.tasaAprobacion}%
                                                    </span>
                                                    <span className="text-[11px] text-white/30 whitespace-nowrap">{d.students} est.</span>
                                                </div>
                                            </div>
                                            <div className="h-6 rounded-lg overflow-hidden relative ml-7" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                <div className="h-full rounded-lg transition-all duration-700"
                                                    style={{
                                                        width: `${Math.max(d.tasaAprobacion, 2)}%`,
                                                        background: barColor,
                                                        boxShadow: isMine ? '0 0 12px rgba(16,185,129,0.3)' : 'none',
                                                    }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                    </Section>
                </>
            ) : (
                /* ═══ HEATMAP TABLE ═══ */
                <Section
                    tourAnchor={TourAnchors.comparativaHeatmap}
                    title="Mapa de Calor — Rendimiento por Materia"
                    description="Tabla comparativa completa. Los colores más intensos indican mejores puntajes. La fila del promedio nacional sirve como referencia. Las celdas con borde indican tu institución."
                    accent="#f59e0b">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr>
                                    <th className="text-left py-3 px-3 text-[11px] font-bold text-white/30 uppercase tracking-wider">#</th>
                                    <th className="text-left py-3 px-3 text-[11px] font-bold text-white/30 uppercase tracking-wider">Institución</th>
                                    {MATERIAS.map(m => (
                                        <th key={m.key} className="text-center py-3 px-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: `${m.color}80` }}>{m.short}</th>
                                    ))}
                                    <th className="text-center py-3 px-3 text-[11px] font-bold text-white/50 uppercase tracking-wider">Global</th>
                                    <th className="text-center py-3 px-3 text-[11px] font-bold text-white/30 uppercase tracking-wider">Aprob.</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    <td className="py-2.5 px-3 text-white/20">—</td>
                                    <td className="py-2.5 px-3 text-white/30 font-semibold italic text-xs">Promedio Nacional ICFES</td>
                                    {MATERIAS.map(m => (
                                        <td key={m.key} className="text-center py-2.5 px-2 text-white/30 font-mono text-xs">
                                            {(NATIONAL_STATS.areas[m.natKey as keyof typeof NATIONAL_STATS.areas]?.mean || 0).toFixed(1)}
                                        </td>
                                    ))}
                                    <td className="text-center py-2.5 px-3 text-white/30 font-mono text-xs">{NATIONAL_STATS.global.mean.toFixed(0)}</td>
                                    <td className="text-center py-2.5 px-3 text-white/20 text-xs">—</td>
                                </tr>
                                {globalSorted.map((d, idx) => {
                                    const isMine = d.isMine;
                                    return (
                                        <tr key={d.name} className={`border-b border-white/[0.03] transition-colors ${isMine ? 'bg-purple-500/[0.06]' : 'hover:bg-white/[0.02]'}`}>
                                            <td className="py-2.5 px-3"><span className={`text-xs font-bold ${idx < 3 ? 'text-amber-400' : 'text-white/25'}`}>{idx + 1}</span></td>
                                            <td className="py-2.5 px-3">
                                                <span className={`text-[11px] font-bold ${isMine ? 'text-purple-300' : 'text-white/60'}`}>{isMine ? `Tú · ${d.name}` : d.name}</span>
                                                <span className="text-[11px] text-white/20 ml-1">({d.students})</span>
                                            </td>
                                            {MATERIAS.map(m => {
                                                const score = d.subjectAvgs[m.key] || 0;
                                                const natAvg = NATIONAL_STATS.areas[m.natKey as keyof typeof NATIONAL_STATS.areas]?.mean || 50;
                                                const delta = score - natAvg;
                                                const intensity = Math.min(score / 80, 1);
                                                return (
                                                    <td key={m.key} className="text-center py-2.5 px-2">
                                                        <span className="inline-block px-2 py-1 rounded-md text-xs font-bold"
                                                            style={{
                                                                background: score > 0 ? `${m.color}${Math.round(intensity * 30).toString(16).padStart(2, '0')}` : 'transparent',
                                                                color: score > 0 ? (score >= natAvg ? '#fff' : 'rgba(255,255,255,0.6)') : 'rgba(255,255,255,0.15)',
                                                                border: isMine && score > 0 ? `1px solid ${m.color}50` : '1px solid transparent',
                                                            }}>
                                                            {score > 0 ? score.toFixed(1) : '—'}
                                                        </span>
                                                        {score > 0 ? (
                                                            <span className={`mt-0.5 block text-[9px] font-bold tabular-nums ${delta >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                                                                {delta >= 0 ? '+' : ''}{delta.toFixed(1)} vs nal.
                                                            </span>
                                                        ) : null}
                                                    </td>
                                                );
                                            })}
                                            <td className="text-center py-2.5 px-3"><span className={`text-xs font-black ${isMine ? 'text-white' : 'text-white/80'}`}>{d.avg}</span></td>
                                            <td className="text-center py-2.5 px-3">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${d.tasaAprobacion >= 70 ? 'bg-emerald-500/15 text-emerald-400' : d.tasaAprobacion >= 50 ? 'bg-cyan-500/15 text-cyan-400' : d.tasaAprobacion >= 30 ? 'bg-amber-500/15 text-amber-400' : 'bg-rose-500/15 text-rose-400'}`}>
                                                    {d.tasaAprobacion}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Section>
            )}

            {/* ═══ ACTION-ORIENTED INSIGHTS ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-emerald-500/[0.04] border border-emerald-500/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
                            <CoordIcon icon={CoordIcons.Award} size={16} className="text-emerald-300" />
                        </span>
                        <span className="text-xs font-bold text-emerald-300">Mayor Fortaleza</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                        <span className="font-bold" style={{ color: bestSubject.color }}>{bestSubject.label}</span> es tu materia más cercana al nacional:{' '}
                        <span className={`font-bold ${bestSubject.delta >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {bestSubject.delta >= 0 ? '+' : ''}{bestSubject.delta.toFixed(1)} pts
                        </span>. <PercentilValue value={bestSubject.pct} size="xs" className="inline-flex" style={{ color: 'rgba(255,255,255,0.7)' }} />.
                        <span className="text-white/30 block mt-1">→ {bestSubject.delta >= 0 ? 'Mantén las estrategias actuales.' : 'Es tu mejor competencia; refuérzala para superar el promedio nacional.'}</span>
                    </p>
                </div>
                <div className="bg-amber-500/[0.04] border border-amber-500/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
                            <CoordIcon icon={CoordIcons.Target} size={16} className="text-amber-300" />
                        </span>
                        <span className="text-xs font-bold text-amber-300">Área de Oportunidad</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                        <span className="font-bold" style={{ color: worstSubject.color }}>{worstSubject.label}</span> está{' '}
                        <span className={`font-bold ${worstSubject.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {worstSubject.delta >= 0 ? '+' : ''}{worstSubject.delta.toFixed(1)} pts
                        </span> vs nacional.
                        <span className="text-white/30 block mt-1">→ Prioriza refuerzo académico en esta competencia.</span>
                    </p>
                </div>
                <div className="bg-purple-500/[0.04] border border-purple-500/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 ring-1 ring-purple-500/20">
                            <CoordIcon icon={CoordIcons.BarChart3} size={16} className="text-purple-300" />
                        </span>
                        <span className="text-xs font-bold text-purple-300">Resumen Ejecutivo</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                        Posición <span className="font-bold text-purple-300">#{myGlobalRank}</span> de {globalSorted.length}.
                        Promedio <span className="font-bold text-white/70">{inst.avg}</span>/500.
                        Aprobación <span className="font-bold text-white/70">{inst.tasaAprobacion}%</span>.
                        <span className="text-white/30 block mt-1">→ {inst.tasaAprobacion >= 60 ? 'Buen rendimiento general.' : inst.tasaAprobacion >= 40 ? 'Hay oportunidad de mejora significativa.' : 'Se recomienda intervención urgente.'}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
