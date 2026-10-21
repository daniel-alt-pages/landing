'use client';

import { useMemo } from 'react';
import { BookOpen, KeyRound, Layers, TrendingUp } from 'lucide-react';
import {
    clavesForMateria,
    groupClavesBySesion,
    type SimulacroClaveItem,
} from '@features/coordinador/lib/clavesFromEstadisticas';
import { formatAreaDisplayName } from '@features/coordinador/lib/analisis/materias';
import { icfesAreaRgba } from '@features/coordinador/lib/icfesAreaColors';
import { aciertoTone } from '@features/estudiante/pages/dashboard/lib/answerKeySessions';
import type { SimulacionEstadisticas } from '@features/simulacro/lib/firestoreService';
import { CoordCard, EmptyState, KpiTile } from '@features/coordinador/components/ui';

type SimulacroClavesGridProps = {
    stats: SimulacionEstadisticas;
    materiaKey: string;
    accentColor: string;
    simulationId: string;
};

const SESION_ACCENT: Record<string, { color: string; label: string }> = {
    S1: { color: '#a78bfa', label: 'Sesión 1' },
    S2: { color: '#38bdf8', label: 'Sesión 2' },
};

const TONE_BG: Record<string, string> = {
    high: 'rgba(52, 211, 153, 0.08)',
    mid: 'rgba(251, 191, 36, 0.08)',
    low: 'rgba(251, 113, 133, 0.08)',
};

function resolveToneKey(pct: number): 'high' | 'mid' | 'low' {
    if (pct >= 70) return 'high';
    if (pct >= 45) return 'mid';
    return 'low';
}

function computeAreaStats(items: SimulacroClaveItem[]) {
    if (items.length === 0) {
        return { total: 0, avg: 0, high: 0, mid: 0, low: 0 };
    }
    let sum = 0;
    let high = 0;
    let mid = 0;
    let low = 0;
    for (const item of items) {
        sum += item.porcentaje_acierto;
        const key = resolveToneKey(item.porcentaje_acierto);
        if (key === 'high') high += 1;
        else if (key === 'mid') mid += 1;
        else low += 1;
    }
    return {
        total: items.length,
        avg: Math.round(sum / items.length),
        high,
        mid,
        low,
    };
}

function ClavesLegend() {
    const items = [
        { label: 'Alto acierto', sub: '≥ 70%', bar: 'bg-emerald-400', text: 'text-emerald-300' },
        { label: 'Medio', sub: '45–69%', bar: 'bg-amber-400', text: 'text-amber-300' },
        { label: 'Bajo acierto', sub: '< 45%', bar: 'bg-rose-400', text: 'text-rose-300' },
    ] as const;

    return (
        <div
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 sm:px-4"
            aria-label="Leyenda de acierto grupal"
        >
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                Acierto grupal
            </span>
            {items.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-2">
                    <span className="flex h-1.5 w-8 overflow-hidden rounded-full bg-white/10">
                        <span className={`h-full w-full rounded-full ${item.bar}`} />
                    </span>
                    <span className={`text-[11px] font-semibold ${item.text}`}>{item.label}</span>
                    <span className="hidden text-[10px] text-white/35 sm:inline">{item.sub}</span>
                </span>
            ))}
        </div>
    );
}

function ClaveCell({
    item,
    accentColor,
    index,
}: {
    item: SimulacroClaveItem;
    accentColor: string;
    index: number;
}) {
    const tone = aciertoTone(item.porcentaje_acierto);
    const toneKey = resolveToneKey(item.porcentaje_acierto);
    const pct = Math.round(item.porcentaje_acierto);

    return (
        <div
            role="listitem"
            aria-label={`Pregunta ${item.numero}, clave ${item.respuesta_correcta}, ${pct}% acierto grupal`}
            className="coord-clave-cell group relative rounded-xl border border-white/[0.07] px-1.5 py-2.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            style={{
                background: TONE_BG[toneKey],
                animationDelay: `${Math.min(index * 18, 360)}ms`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
            title={`Pregunta ${item.numero} · ${pct}% acierto grupal`}
        >
            <p
                className="text-[8px] font-bold tabular-nums leading-tight tracking-wide text-white/40 sm:text-[9px]"
            >
                #{item.numero}
            </p>

            <div
                className="mx-auto mt-1.5 flex h-9 w-9 items-center justify-center rounded-full border text-lg font-black leading-none tracking-tight transition-transform duration-200 group-hover:scale-105 sm:h-10 sm:w-10 sm:text-xl"
                style={{
                    color: accentColor,
                    borderColor: `${accentColor}55`,
                    background: `linear-gradient(145deg, ${accentColor}22, ${accentColor}08)`,
                    boxShadow: `0 4px 16px ${accentColor}25, inset 0 1px 0 rgba(255,255,255,0.12)`,
                }}
            >
                {item.respuesta_correcta}
            </div>

            <div className="mx-auto mt-2 h-1 w-[78%] overflow-hidden rounded-full bg-white/10">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${tone.bar}`}
                    style={{
                        width: `${Math.min(100, Math.max(4, item.porcentaje_acierto))}%`,
                    }}
                />
            </div>
            <p className={`mt-1 text-[9px] font-bold tabular-nums ${tone.text}`}>{pct}%</p>
        </div>
    );
}

export default function SimulacroClavesGrid({
    stats,
    materiaKey,
    accentColor,
    simulationId,
}: SimulacroClavesGridProps) {
    const items = clavesForMateria(stats, materiaKey);
    const groups = groupClavesBySesion(items);
    const materiaLabel = formatAreaDisplayName(materiaKey);
    const areaStats = useMemo(() => computeAreaStats(items), [items]);

    if (items.length === 0) {
        return (
            <EmptyState
                title="Sin claves para esta materia"
                body="Este simulacro no tiene respuestas correctas publicadas para el área seleccionada."
            />
        );
    }

    const avgTone =
        areaStats.avg >= 70 ? 'success' : areaStats.avg >= 45 ? 'warning' : 'danger';

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiTile
                    label="Preguntas"
                    value={areaStats.total}
                    sub={`${groups.length} sesión${groups.length !== 1 ? 'es' : ''}`}
                    icon={<BookOpen className="h-3.5 w-3.5" />}
                    tone="info"
                />
                <KpiTile
                    label="Acierto promedio"
                    value={`${areaStats.avg}%`}
                    sub="Del grupo en el simulacro"
                    icon={<TrendingUp className="h-3.5 w-3.5" />}
                    tone={avgTone}
                />
                <KpiTile
                    label="Alto acierto"
                    value={areaStats.high}
                    sub="Preguntas ≥ 70%"
                    tone="success"
                />
                <KpiTile
                    label="Dificultad alta"
                    value={areaStats.low}
                    sub="Preguntas < 45%"
                    tone="danger"
                />
            </div>

            <CoordCard
                stripe="brand"
                padding="none"
                className="overflow-hidden"
                style={{
                    borderColor: `${accentColor}30`,
                    boxShadow: `0 24px 80px rgba(0,0,0,0.45), 0 0 0 1px ${accentColor}15, inset 0 1px 0 rgba(255,255,255,0.06)`,
                }}
            >
                <header
                    className="relative overflow-hidden border-b px-4 py-4 sm:px-6 sm:py-5"
                    style={{
                        borderColor: `${accentColor}22`,
                        background: `linear-gradient(135deg, ${icfesAreaRgba(materiaKey, 0.18)} 0%, transparent 55%)`,
                    }}
                >
                    <div
                        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl"
                        style={{ background: `${accentColor}22` }}
                    />
                    <div className="relative flex flex-wrap items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3.5">
                            <div
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white shadow-xl"
                                style={{
                                    background: `linear-gradient(145deg, ${accentColor}, ${accentColor}cc)`,
                                    boxShadow: `0 10px 28px ${accentColor}45`,
                                }}
                            >
                                {materiaLabel.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <h2 className="truncate text-base font-extrabold tracking-tight text-white sm:text-lg">
                                    {materiaLabel}
                                </h2>
                                <p
                                    className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-medium"
                                    style={{ color: `${accentColor}cc` }}
                                >
                                    <span>{simulationId}</span>
                                    <span className="text-white/25">·</span>
                                    <span className="inline-flex items-center gap-1">
                                        <Layers className="h-3 w-3" aria-hidden />
                                        {areaStats.total} preguntas
                                    </span>
                                </p>
                            </div>
                        </div>
                        <ClavesLegend />
                    </div>
                </header>

                <div className="space-y-6 p-4 sm:p-6">
                    {groups.map((group) => {
                        const sesionMeta = SESION_ACCENT[group.sesionKey] ?? {
                            color: accentColor,
                            label: group.label,
                        };
                        const sesionNum = group.sesionKey === 'S2' ? 2 : 1;
                        let cellIndex = 0;

                        return (
                            <section
                                key={group.sesionKey}
                                className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.015]"
                                style={{
                                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                                }}
                            >
                                <div
                                    className="flex flex-wrap items-center gap-3 border-b px-4 py-3 sm:px-5"
                                    style={{
                                        borderColor: `${sesionMeta.color}20`,
                                        background: `linear-gradient(90deg, ${sesionMeta.color}14, transparent 70%)`,
                                    }}
                                >
                                    <div
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white"
                                        style={{
                                            background: sesionMeta.color,
                                            boxShadow: `0 6px 18px ${sesionMeta.color}40`,
                                        }}
                                    >
                                        S{sesionNum}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold uppercase tracking-widest text-white/90">
                                            {sesionMeta.label}
                                        </p>
                                        <p className="text-[10px] font-medium text-white/45">
                                            {group.items.length} preguntas en esta sesión
                                        </p>
                                    </div>
                                    <div
                                        className="hidden h-px flex-1 bg-gradient-to-r from-white/10 to-transparent sm:block"
                                        aria-hidden
                                    />
                                </div>

                                <div
                                    role="list"
                                    aria-label={`Claves ${sesionMeta.label}`}
                                    className="coord-claves-grid grid grid-cols-4 gap-2 p-3 sm:grid-cols-6 sm:gap-2.5 sm:p-4 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12"
                                >
                                    {group.items.map((item) => {
                                        const idx = cellIndex++;
                                        return (
                                            <ClaveCell
                                                key={item.numero}
                                                item={item}
                                                accentColor={accentColor}
                                                index={idx}
                                            />
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>

                <footer className="border-t border-white/10 bg-white/[0.02] px-4 py-3.5 text-center sm:px-6">
                    <p className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-medium text-white/45">
                        <KeyRound className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Claves oficiales del simulacro · las barras indican el % de acierto del grupo
                    </p>
                </footer>
            </CoordCard>
        </div>
    );
}
