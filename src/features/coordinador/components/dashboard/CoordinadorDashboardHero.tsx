'use client';
import { TrendingUp } from 'lucide-react';
import type { InstitutionMetrics } from '@features/coordinador/hooks/useCoordinadorData';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import PremiumGlassCard from '@shared/components/premium/PremiumGlassCard';
import {
    APROBACION_UMBRAL,
    aprobadosDisplay,
    cohortTotal,
    nivelDesempenoRows,
} from '@features/coordinador/lib/globalScoreStats';

/** Hero Stitch: puntaje global + chips + distribución por nivel. */
export default function CoordinadorDashboardHero({ inst }: { inst: InstitutionMetrics }) {
    const total = cohortTotal(inst.students);
    const aprobados = aprobadosDisplay(inst.tasaAprobacion, total);
    const levelRows = nivelDesempenoRows(inst);

    return (
        <PremiumGlassCard
            padding="sm"
            className="coord-hero-spotlight relative group h-full min-h-0 sm:min-h-[280px] lg:min-h-[320px] flex flex-col"
        >
            <div className="coord-hero-glow" aria-hidden />
            <div className="relative z-10 flex flex-col gap-5 flex-1">
                <div
                    data-coord-tour={TourAnchors.dashboardHeroScore}
                    className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
                >
                    <div className="min-w-0">
                        <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-1.5">
                            Puntaje global promedio
                        </p>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-indigo-300 via-white to-indigo-300 bg-clip-text text-transparent leading-none tabular-nums">
                                {Math.round(inst.avg)}
                            </span>
                            <span className="text-lg font-bold text-white/50">de 500 puntos</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end shrink-0">
                        <span className="coord-pill coord-pill-accent inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full bg-indigo-500/15 text-indigo-200 border border-indigo-500/25">
                            <TrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden />
                            {inst.tasaAprobacion.toFixed(0)}% aprobación
                        </span>
                        <span className="coord-pill inline-flex items-center text-[11px] font-semibold px-2.5 py-1.5 rounded-full bg-white/[0.06] text-white/70 border border-white/[0.08]">
                            Mediana{' '}
                            <strong className="text-white/90 ml-1 tabular-nums">{Math.round(inst.median)}</strong>
                        </span>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest">
                            Distribución por nivel de desempeño
                        </p>
                        <p className="text-[10px] text-white/40 tabular-nums shrink-0">{total} evaluados</p>
                    </div>
                    <div
                        data-coord-tour={TourAnchors.dashboardHeroLevels}
                        className="flex h-2.5 sm:h-3 rounded-full overflow-hidden gap-px bg-white/[0.04]"
                        role="img"
                        aria-label="Distribución por nivel de desempeño"
                    >
                        {levelRows.map((n) =>
                            n.pct > 0 ? (
                                <div
                                    key={n.key}
                                    className={`${n.barClass} h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                                    style={{ width: `${n.pct}%`, minWidth: n.pct > 0 ? '4px' : 0 }}
                                    title={`${n.label} (${n.rangeLabel}): ${n.count} (${n.pct}%)`}
                                />
                            ) : null,
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                    {levelRows.map((n) => (
                        <div
                            key={n.key}
                            className="rounded-lg p-3 sm:p-3.5 border border-white/[0.06] flex flex-col gap-2.5"
                            style={{ background: `${n.color}08` }}
                        >
                            <div className="space-y-1 min-w-0">
                                <span
                                    className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide leading-tight block"
                                    style={{ color: n.color }}
                                >
                                    {n.label}
                                </span>
                                <p className="text-xl sm:text-2xl font-black text-white tabular-nums leading-none">
                                    {n.count}
                                </p>
                                <p className="text-[9px] text-white/40 leading-snug">{n.rangeLabel}</p>
                            </div>
                            <div className="mt-auto pt-0.5">
                                <div className="w-full bg-white/[0.06] rounded-full h-1.5 mb-1.5">
                                    <div
                                        className={`${n.barClass} h-1.5 rounded-full transition-all duration-500`}
                                        style={{ width: `${n.pct}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-white/45 tabular-nums">{n.pct}% del grupo</p>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="text-[11px] text-white/40 leading-snug border-t border-white/[0.06] pt-3 mt-auto">
                    {total} estudiantes evaluados · {aprobados} en umbral de aprobación (≥ {APROBACION_UMBRAL} puntos).
                </p>
            </div>
        </PremiumGlassCard>
    );
}
