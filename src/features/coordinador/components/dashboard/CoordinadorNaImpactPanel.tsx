'use client';

import type { SessionImpactMetrics } from '@features/coordinador/lib/sessionMetrics';
import { Activity, AlertTriangle, CheckCircle2, Users, type LucideIcon } from 'lucide-react';

const T = {
    card: 'rounded-xl border border-white/[0.08] bg-[#111827]/90 backdrop-blur-md',
};

export function CoordinadorNaImpactPanel({
    metrics,
    onViewPartial,
}: {
    metrics: SessionImpactMetrics;
    onViewPartial?: () => void;
}) {
    const coveragePct = Math.round(metrics.coverageRate * 100);
    const partialPct = Math.round(metrics.partialRate * 100);

    return (
        <section className={`${T.card} p-5 md:p-6 coord-stagger-in`} aria-label="Impacto N/A por sesiones">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-violet-300/90">
                        Cobertura de sesiones
                    </p>
                    <h3 className="text-lg font-black text-white mt-1">Impacto N/A en el cohorte</h3>
                    <p className="text-xs text-white/50 mt-1 max-w-xl">
                        Estudiantes con solo S1 o S2 reciben N/A en la sesión faltante. El puntaje sigue
                        penalizado, pero aquí separas ausencia de dificultad académica.
                    </p>
                </div>
                {metrics.partialCount > 0 && onViewPartial && (
                    <button
                        type="button"
                        onClick={onViewPartial}
                        className="coord-btn-secondary text-xs px-3 py-2 rounded-lg"
                    >
                        Ver parciales
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricTile
                    icon={CheckCircle2}
                    label="Completos S1+S2"
                    value={`${metrics.completeSessions}`}
                    sub={`${coveragePct}% del cohorte`}
                    accent="text-emerald-400"
                />
                <MetricTile
                    icon={AlertTriangle}
                    label="Parciales"
                    value={`${metrics.partialCount}`}
                    sub={`${partialPct}% · S1=${metrics.onlyS1} · S2=${metrics.onlyS2}`}
                    accent="text-violet-300"
                />
                <MetricTile
                    icon={Activity}
                    label="Respuestas N/A"
                    value={`${metrics.sessionMissingAnswerCount}`}
                    sub="Sesión no presentada"
                    accent="text-amber-300"
                />
                <MetricTile
                    icon={Users}
                    label="Sin respuesta"
                    value={`${metrics.blankAnswerCount}`}
                    sub="En sesión presentada"
                    accent="text-sky-300"
                />
            </div>
        </section>
    );
}

function MetricTile({
    icon: Icon,
    label,
    value,
    sub,
    accent,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    sub: string;
    accent: string;
}) {
    return (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${accent}`} aria-hidden />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">{label}</span>
            </div>
            <div className="text-2xl font-black text-white">{value}</div>
            <p className="text-[11px] text-white/40 mt-1">{sub}</p>
        </div>
    );
}
