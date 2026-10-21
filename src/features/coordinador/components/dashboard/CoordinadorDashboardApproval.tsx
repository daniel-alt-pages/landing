'use client';

import { UserCheck, Users } from 'lucide-react';
import { TourAnchors } from '@features/coordinador/lib/tourAnchors';
import { APROBACION_UMBRAL, approvalQualityLabel } from '@features/coordinador/lib/globalScoreStats';
import PremiumGlassCard from '@shared/components/premium/PremiumGlassCard';

const THRESHOLD_CHIPS = [
    { min: 70, label: 'Excelente', dot: 'bg-emerald-400' },
    { min: 50, label: 'Bueno', dot: 'bg-cyan-400' },
    { min: 30, label: 'Regular', dot: 'bg-amber-400' },
] as const;

/** Anillo de aprobación — patrón Stitch «Aprobación General». */
export default function CoordinadorDashboardApproval({
    value,
    approvedCount,
    evaluatedCount,
}: {
    value: number;
    approvedCount: number;
    evaluatedCount: number;
}) {
    const pct = Math.min(Math.max(value, 0), 100);
    const R = 62;
    const SW = 10;
    const size = 148;
    const center = size / 2;
    const C = 2 * Math.PI * R;
    const filled = (pct / 100) * C;
    const gap = C - filled;
    const t = approvalQualityLabel(pct);
    const ratioPct = evaluatedCount > 0 ? (approvedCount / evaluatedCount) * 100 : 0;

    return (
        <PremiumGlassCard
            data-coord-tour={TourAnchors.dashboardHeroApproval}
            padding="sm"
            className="relative flex flex-col h-full min-h-[320px] overflow-hidden"
        >
            <div
                className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full blur-3xl opacity-35"
                style={{ background: t.color }}
                aria-hidden
            />
            <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent"
                aria-hidden
            />

            <div className="relative z-10 flex flex-col flex-1 gap-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-white/65 text-[11px] font-bold uppercase tracking-widest">
                            Aprobación general
                        </p>
                        <p className="text-[10px] text-white/50 mt-1 tabular-nums">
                            Umbral ≥ {APROBACION_UMBRAL} pts global
                        </p>
                    </div>
                    <div
                        className="px-2.5 py-1 rounded-full shrink-0"
                        style={{ background: t.bg, border: `1px solid ${t.border}` }}
                    >
                        <span className={`text-[11px] font-bold ${t.textClass}`}>{t.label}</span>
                    </div>
                </div>

                <div className="flex justify-center py-0.5">
                    <div className="relative shrink-0">
                        <svg
                            width={size}
                            height={size}
                            viewBox={`0 0 ${size} ${size}`}
                            role="img"
                            aria-label={`Tasa de aprobación ${pct.toFixed(1)} por ciento`}
                        >
                            <circle
                                cx={center}
                                cy={center}
                                r={R}
                                fill="none"
                                stroke="rgba(255,255,255,0.07)"
                                strokeWidth={SW}
                            />
                            <circle
                                cx={center}
                                cy={center}
                                r={R}
                                fill="none"
                                stroke={t.color}
                                strokeWidth={SW}
                                strokeLinecap="round"
                                strokeDasharray={`${filled} ${gap}`}
                                transform={`rotate(-90 ${center} ${center})`}
                                className="transition-all duration-700 ease-out motion-reduce:transition-none"
                                style={{ filter: `drop-shadow(0 0 10px ${t.color}55)` }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-[2rem] font-black tabular-nums leading-none ${t.textClass}`}>
                                {pct.toFixed(1)}
                            </span>
                            <span className="text-xs font-bold text-white/45 -mt-0.5">%</span>
                        </div>
                    </div>
                </div>

                <div className="mt-auto space-y-3">
                    <div
                        className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden"
                        role="progressbar"
                        aria-valuenow={Math.round(ratioPct)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${approvedCount} de ${evaluatedCount} estudiantes aprobados`}
                    >
                        <div
                            className="h-full rounded-full transition-all duration-700 ease-out motion-reduce:transition-none"
                            style={{ width: `${ratioPct}%`, background: t.color }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <div
                            className="rounded-xl border px-3 py-2.5 flex items-center gap-2.5 min-w-0"
                            style={{ borderColor: `${t.border}`, background: 'rgba(255,255,255,0.02)' }}
                        >
                            <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                style={{ background: t.bg, border: `1px solid ${t.border}` }}
                            >
                                <UserCheck className={`h-4 w-4 ${t.textClass}`} aria-hidden />
                            </div>
                            <div className="min-w-0">
                                <div className="text-xl font-black text-white tabular-nums leading-none">
                                    {approvedCount}
                                </div>
                                <div className="text-[10px] text-white/60 font-semibold mt-0.5 truncate">
                                    Aprobados
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 flex items-center gap-2.5 min-w-0">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08]">
                                <Users className="h-4 w-4 text-white/55" aria-hidden />
                            </div>
                            <div className="min-w-0">
                                <div className="text-xl font-black text-white tabular-nums leading-none">
                                    {evaluatedCount}
                                </div>
                                <div className="text-[10px] text-white/60 font-semibold mt-0.5 truncate">
                                    Evaluados
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2.5 border-t border-white/[0.06] space-y-2">
                        <p className="text-[11px] text-white/55 leading-relaxed">
                            Estudiantes con puntaje global de {APROBACION_UMBRAL} puntos o más, sobre el total
                            evaluado.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {THRESHOLD_CHIPS.map((chip) => (
                                <span
                                    key={chip.label}
                                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-white/55"
                                >
                                    <span className={`h-1.5 w-1.5 rounded-full ${chip.dot}`} aria-hidden />
                                    ≥{chip.min}% {chip.label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </PremiumGlassCard>
    );
}
