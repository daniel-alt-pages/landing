'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import {
    ChevronDown,
    ExternalLink,
    MapPin,
    Sparkles,
    Target,
    Trophy,
    Users,
} from 'lucide-react';
import type { InstitutionMetrics } from '@features/coordinador/hooks/coordinadorTypes';
import {
    useBenchmarkContext,
    type BenchmarkContextData,
} from '@features/coordinador/hooks/useBenchmarkContext';
import { estimatePercentile } from '@features/benchmark/lib/nationalData';
import {
    humanDepartmentBeatPct,
    humanGoalMessage,
    humanPercentileHeadline,
    humanPercentileShort,
    percentileColor,
    prioritizeBenchmarkGoals,
} from '@features/benchmark/lib/benchmarkContextHelpers';

export type BenchmarkContextPanelProps = {
    inst: InstitutionMetrics;
    variant?: 'compact' | 'full';
    simulacroInstitutionCount?: number;
    context?: BenchmarkContextData;
    className?: string;
};

function InsightCard({
    accent,
    icon: Icon,
    title,
    children,
}: {
    accent: string;
    icon: typeof MapPin;
    title: string;
    children: ReactNode;
}) {
    return (
        <section
            className="rounded-2xl border border-white/[0.08] bg-[#111827]/80 p-5"
            style={{ boxShadow: `inset 0 1px 0 0 ${accent}22` }}
        >
            <div className="mb-4 flex items-center gap-2.5">
                <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: `${accent}18`, color: accent }}
                >
                    <Icon className="h-4.5 w-4.5" />
                </span>
                <h4 className="text-sm font-bold leading-snug text-white">{title}</h4>
            </div>
            {children}
        </section>
    );
}

function GoalToneClasses(tone: 'good' | 'progress' | 'focus') {
    if (tone === 'good') return 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-100';
    if (tone === 'progress') return 'border-indigo-500/25 bg-indigo-500/[0.08] text-indigo-100';
    return 'border-amber-500/25 bg-amber-500/[0.08] text-amber-100';
}

export default function BenchmarkContextPanel({
    inst,
    variant = 'full',
    simulacroInstitutionCount,
    context: contextProp,
    className = '',
}: BenchmarkContextPanelProps) {
    const internalCtx = useBenchmarkContext(contextProp ? null : inst);
    const ctx = contextProp ?? internalCtx;
    const isCompact = variant === 'compact';
    const [showAllGoals, setShowAllGoals] = useState(false);

    const globalPct = estimatePercentile('Global', inst.avg);
    const globalColor = percentileColor(globalPct);

    const priorityGoals = useMemo(
        () => prioritizeBenchmarkGoals(ctx.goals, isCompact ? 2 : 3),
        [ctx.goals, isCompact],
    );
    const extraGoals = ctx.goals.filter((g) => !priorityGoals.includes(g));

    const locationLabel = ctx.municipalityLabel
        ? `${ctx.municipalityLabel}, ${ctx.territoryLabel}`
        : ctx.territoryLabel;

    const deptHeadline =
        ctx.departmentTotal > 0
            ? `Puesto ${ctx.departmentPosition} de ${ctx.departmentTotal} en ${ctx.territoryLabel}`
            : `Ubicación: ${locationLabel}`;

    return (
        <div className={`space-y-5 ${className}`}>
            {/* Titular — lo primero que debe leer un coordinador */}
            <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/15 via-[#111827] to-cyan-500/10 p-5 sm:p-6">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-300/80">
                    Resumen en 10 segundos
                </p>
                <h3 className="mt-2 text-xl font-black leading-tight text-white sm:text-2xl">
                    {humanPercentileHeadline(globalPct)}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">
                    {inst.name} · puntaje global{' '}
                    <span className="font-bold text-white">{inst.avg}</span> ·{' '}
                    {humanPercentileShort(globalPct).toLowerCase()}.
                    {ctx.departmentTotal > 0 ? (
                        <>
                            {' '}
                            En tu departamento:{' '}
                            <span className="font-semibold text-cyan-200">{deptHeadline.toLowerCase()}</span>.
                        </>
                    ) : null}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
                        style={{ background: `${globalColor}22`, color: globalColor }}
                    >
                        Nacional · top {100 - globalPct}% aprox.
                    </span>
                    {ctx.departmentTotal > 0 ? (
                        <span className="inline-flex items-center rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-200">
                            {humanDepartmentBeatPct(ctx.departmentPctSuperior)}
                        </span>
                    ) : null}
                    {ctx.evaluatedCount > 0 && ctx.evaluatedCount < 30 ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-200">
                            <Users className="h-3.5 w-3.5" />
                            {ctx.evaluatedCount} estudiantes — muestra pequeña
                        </span>
                    ) : null}
                </div>
            </div>

            <div className={`grid gap-4 ${isCompact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
                {/* Departamento */}
                <InsightCard accent="#06b6d4" icon={MapPin} title="¿Cómo vas en tu departamento?">
                    {ctx.loading ? (
                        <p className="text-sm text-white/45">Calculando posición local…</p>
                    ) : ctx.departmentTotal > 0 ? (
                        <>
                            <p className="text-3xl font-black tabular-nums text-cyan-300">
                                #{ctx.departmentPosition}
                                <span className="ml-1 text-base font-bold text-white/40">
                                    / {ctx.departmentTotal}
                                </span>
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-white/70">
                                {humanDepartmentBeatPct(ctx.departmentPctSuperior)} según resultados ICFES 2025.
                            </p>
                            <p className="mt-1 text-xs text-white/45">{locationLabel}</p>
                            {!isCompact && ctx.topDepartmentSchools.length > 0 ? (
                                <details className="mt-4 group">
                                    <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-bold text-cyan-300/90 hover:text-cyan-200">
                                        Ver colegios líderes del departamento
                                        <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
                                    </summary>
                                    <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1">
                                        {ctx.topDepartmentSchools.slice(0, 5).map((school, idx) => (
                                            <li
                                                key={`${school.codigo}-${idx}`}
                                                className="flex items-start justify-between gap-2 rounded-lg bg-white/[0.03] px-2.5 py-2 text-xs"
                                            >
                                                <span className="min-w-0 text-white/70" title={school.colegio}>
                                                    {idx + 1}. {school.colegio}
                                                </span>
                                                <span className="shrink-0 font-bold text-white">{school.promedio.toFixed(1)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </details>
                            ) : null}
                        </>
                    ) : (
                        <p className="text-sm leading-relaxed text-white/55">
                            Aún no tenemos departamento confirmado para esta institución. Cuando lo registres,
                            aparecerá el ranking local aquí.
                        </p>
                    )}
                </InsightCard>

                {/* Similares */}
                <InsightCard accent="#a78bfa" icon={Sparkles} title="¿Quién tiene un puntaje parecido?">
                    {ctx.loading ? (
                        <p className="text-sm text-white/45">Buscando referentes…</p>
                    ) : ctx.similarSchools.length > 0 ? (
                        <>
                            <p className="text-sm text-white/70">
                                Colegios con puntaje ICFES cercano a tu promedio de áreas (
                                <span className="font-bold text-white">{ctx.areaPromedio.toFixed(1)}</span>
                                ), priorizando {ctx.territoryLabel}.
                            </p>
                            <ul className="mt-3 space-y-2">
                                {ctx.similarSchools.slice(0, isCompact ? 2 : 3).map((school) => (
                                    <li
                                        key={school.codigo}
                                        className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
                                    >
                                        <p className="truncate text-sm font-semibold text-white/85" title={school.colegio}>
                                            {school.colegio}
                                        </p>
                                        <p className="text-xs text-white/45">
                                            {school.departamento} · ICFES {school.promedio.toFixed(1)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <p className="text-sm text-white/55">Referentes no disponibles en este momento.</p>
                    )}
                </InsightCard>

                {/* Metas */}
                <InsightCard accent="#34d399" icon={Target} title="¿Qué conviene mejorar primero?">
                    <p className="mb-3 text-sm text-white/60">
                        Cuántos puntos faltan para llegar al promedio nacional o al top 25%.
                    </p>
                    <ul className="space-y-2.5">
                        {priorityGoals.map((goal) => {
                            const msg = humanGoalMessage(goal);
                            return (
                                <li
                                    key={goal.label}
                                    className={`rounded-xl border px-3 py-2.5 ${GoalToneClasses(msg.tone)}`}
                                >
                                    <p className="text-sm font-bold leading-snug">{msg.headline}</p>
                                    <p className="mt-0.5 text-xs opacity-80">{msg.sub}</p>
                                </li>
                            );
                        })}
                    </ul>
                    {!isCompact && extraGoals.length > 0 ? (
                        <>
                            <button
                                type="button"
                                onClick={() => setShowAllGoals((v) => !v)}
                                className="mt-3 flex items-center gap-1 text-xs font-bold text-emerald-300/90 hover:text-emerald-200"
                            >
                                {showAllGoals ? 'Ocultar detalle por materia' : 'Ver todas las materias'}
                                <ChevronDown className={`h-3.5 w-3.5 transition ${showAllGoals ? 'rotate-180' : ''}`} />
                            </button>
                            {showAllGoals ? (
                                <ul className="mt-2 max-h-44 space-y-2 overflow-y-auto pr-1">
                                    {extraGoals.map((goal) => {
                                        const msg = humanGoalMessage(goal);
                                        return (
                                            <li key={goal.label} className="rounded-lg bg-white/[0.03] px-2.5 py-2 text-xs text-white/70">
                                                <span className="font-bold text-white/90">{goal.label}:</span> {msg.headline}
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : null}
                        </>
                    ) : null}
                </InsightCard>
            </div>

            {/* Pie simple */}
            <div className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-relaxed text-white/45">
                    Comparación con ranking ICFES Saber 11° 2025. El simulacro SG no reemplaza la prueba oficial.
                </p>
                <div className="flex flex-wrap gap-2">
                    {simulacroInstitutionCount && simulacroInstitutionCount > 1 ? (
                        <Link
                            href="/coordinador/comparativa"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/15 px-3 py-2 text-xs font-bold text-purple-200 ring-1 ring-purple-500/25 transition hover:bg-purple-500/25"
                        >
                            <Trophy className="h-3.5 w-3.5" />
                            Comparar con otras IE del simulacro
                        </Link>
                    ) : null}
                    <a
                        href="https://miltonochoa.com.co/web/index.php/2025/11/01/ranking-de-colegios-por-departamentos-2025-calendario-a/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/15 px-3 py-2 text-xs font-bold text-indigo-200 ring-1 ring-indigo-500/25 transition hover:bg-indigo-500/25"
                    >
                        Ver ranking oficial
                        <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                </div>
            </div>
        </div>
    );
}
