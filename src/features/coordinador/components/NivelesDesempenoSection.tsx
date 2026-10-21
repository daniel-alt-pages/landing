'use client';

import { useMemo } from 'react';
import type { InstitutionMetrics } from '@features/coordinador/hooks/useCoordinadorData';
import CoordCard from '@features/coordinador/components/ui/CoordCard';
import KpiTile from '@features/coordinador/components/ui/KpiTile';
import SectionHeader from '@features/coordinador/components/ui/SectionHeader';
import {
    APROBACION_UMBRAL,
    aprobadosDisplay,
    cohortTotal,
    nivelDesempenoRows,
    scoreRangeRows,
} from '@features/coordinador/lib/globalScoreStats';
import { BarChart3, Trophy } from 'lucide-react';

export interface NivelesDesempenoSectionProps {
    inst: InstitutionMetrics;
}

const LEVEL_BAR_COLORS: Record<string, string> = {
    superior: '#10b981',
    alto: '#6366f1',
    medio: '#f59e0b',
    bajo: '#ef4444',
};

export default function NivelesDesempenoSection({ inst }: NivelesDesempenoSectionProps) {
    const computed = useMemo(() => {
        const total = cohortTotal(inst.students);
        const rows = nivelDesempenoRows(inst);
        const modal = [...rows].sort((a, b) => b.count - a.count)[0] ?? null;
        const ranges = scoreRangeRows(inst.distribucion);
        const rangeMax = Math.max(...ranges.map((r) => r.count), 1);
        const aprobados = aprobadosDisplay(inst.tasaAprobacion, total);
        const noAprobados = Math.max(0, total - aprobados);

        return { total, rows, modal, ranges, rangeMax, aprobados, noAprobados };
    }, [inst]);

    return (
        <CoordCard stripe="indigo">
            <SectionHeader
                title="Niveles de desempeño (ICFES)"
                description="Distribución por umbrales fijos (Superior ≥400 · Alto ≥325 · Medio ≥250 · Bajo <250) y histograma por rangos de puntaje (0–500)."
                accent="var(--coord-accent)"
                icon={<BarChart3 size={16} />}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <KpiTile label="Cohorte" value={computed.total} sub="estudiantes en el informe" tone="neutral" />
                <KpiTile
                    label="Nivel modal"
                    value={computed.modal ? computed.modal.label : '—'}
                    sub={computed.modal?.rangeLabel}
                    tone="info"
                    icon={<Trophy size={14} />}
                />
                <KpiTile
                    label="Aprobados"
                    value={computed.aprobados}
                    sub={`≥${APROBACION_UMBRAL} pts global`}
                    tone="accent"
                />
                <KpiTile
                    label="Tasa aprobación"
                    value={`${inst.tasaAprobacion}%`}
                    sub={`${computed.noAprobados} sin umbral`}
                    tone="neutral"
                />
            </div>

            <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest coord-text-body px-0.5">
                        Por nivel ICFES · % sobre cohorte ({computed.total})
                    </p>
                    {computed.rows.map((r) => (
                        <div
                            key={r.key}
                            className="rounded-xl border border-[var(--coord-border)] bg-[var(--coord-trace-bg)] px-3 py-2.5"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold coord-text-head">{r.label}</div>
                                    <div className="text-xs coord-text-body">
                                        {r.rangeLabel} · {r.count} estudiantes · {r.pct}% del grupo
                                    </div>
                                </div>
                                <div className="w-[38%] max-w-[220px] shrink-0">
                                    <div
                                        className="h-2 rounded-full overflow-hidden"
                                        style={{ background: 'var(--coord-trace-bg-strong)' }}
                                    >
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(100, Math.max(0, r.pct))}%`,
                                                background: r.color,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest coord-text-body px-0.5 mb-2">
                        Histograma por rangos de puntaje (solo puntajes &gt; 0)
                    </p>
                    <div className="rounded-xl border border-[var(--coord-border)] bg-[var(--coord-trace-bg)] p-3">
                        <div className="flex items-end gap-1 h-[120px]">
                            {computed.ranges.map((row) => {
                                const h = row.count > 0 ? Math.max(8, (row.count / computed.rangeMax) * 100) : 0;
                                const color = LEVEL_BAR_COLORS[row.level];
                                const belowApproval = !row.aprobado;
                                return (
                                    <div
                                        key={row.range}
                                        className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1 h-full"
                                        title={`${row.range}: ${row.count} estudiantes`}
                                    >
                                        {row.count > 0 && (
                                            <span className="text-[9px] font-bold tabular-nums text-white/90">
                                                {row.count}
                                            </span>
                                        )}
                                        <div
                                            className="w-full rounded-t-sm transition-all duration-300"
                                            style={{
                                                height: `${h}%`,
                                                background: color,
                                                opacity: belowApproval ? 0.72 : 1,
                                                boxShadow: belowApproval
                                                    ? undefined
                                                    : `0 0 8px ${color}55`,
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-2 grid grid-cols-9 gap-1">
                            {computed.ranges.map((row) => (
                                <span
                                    key={`${row.range}-lbl`}
                                    className="text-[8px] sm:text-[9px] text-center leading-tight coord-text-body truncate"
                                    title={row.range}
                                >
                                    {row.range.replace('-', '–')}
                                </span>
                            ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3 text-[10px] coord-text-body border-t border-[var(--coord-divider)] pt-2">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-sm bg-red-500/70" />
                                &lt;{APROBACION_UMBRAL} pts (sin aprobar)
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-sm bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                                ≥{APROBACION_UMBRAL} pts (aprobado)
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <p className="mt-3 text-[10px] leading-relaxed coord-text-muted px-0.5">
                Umbrales alineados con el hero y la estadística descriptiva: niveles sobre{' '}
                <strong className="coord-text-head">{computed.total}</strong> estudiantes de la cohorte; histograma y
                aprobación sobre quienes tienen puntaje global &gt; 0.
            </p>
        </CoordCard>
    );
}
