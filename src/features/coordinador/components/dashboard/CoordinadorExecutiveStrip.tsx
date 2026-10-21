'use client';

import { AlertTriangle, Globe2, ShieldAlert, Users } from 'lucide-react';
import type { InstitutionMetrics } from '@features/coordinador/hooks/useCoordinadorData';
import type { SessionImpactMetrics } from '@features/coordinador/lib/sessionMetrics';
import { NATIONAL_STATS } from '@features/benchmark/lib/nationalData';

export function CoordinadorExecutiveStrip({
    inst,
    sessionImpact,
    onViewPartial,
}: {
    inst: InstitutionMetrics;
    sessionImpact?: SessionImpactMetrics;
    onViewPartial?: () => void;
}) {
    const natMean = Math.round(NATIONAL_STATS.global.mean);
    const gap = Math.round(inst.avg - natMean);
    const atRisk = inst.students.filter(s => (Number(s.puntaje_global) || 0) < 300).length;
    const coveragePct = sessionImpact ? Math.round(sessionImpact.coverageRate * 100) : null;

    return (
        <section
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 coord-stagger-in"
            aria-label="Indicadores ejecutivos"
        >
            <Tile
                icon={Globe2}
                label="Brecha vs nacional"
                value={`${gap >= 0 ? '+' : ''}${gap}`}
                sub={`Institución ${Math.round(inst.avg)} · Nacional ${natMean}`}
                accent={gap >= 0 ? 'text-emerald-300' : 'text-rose-300'}
            />
            <Tile
                icon={ShieldAlert}
                label="En riesgo (<300)"
                value={String(atRisk)}
                sub={`${inst.students.length ? Math.round((atRisk / inst.students.length) * 100) : 0}% del cohorte`}
                accent="text-amber-300"
            />
            <Tile
                icon={Users}
                label="Aprobación"
                value={`${inst.tasaAprobacion.toFixed(0)}%`}
                sub={`Mediana ${Math.round(inst.median)} pts`}
                accent="text-indigo-300"
            />
            <button
                type="button"
                onClick={sessionImpact?.partialCount ? onViewPartial : undefined}
                className={`rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-colors ${
                    sessionImpact?.partialCount ? 'hover:bg-violet-500/10 cursor-pointer' : 'cursor-default'
                }`}
            >
                <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-violet-300" aria-hidden />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                        Cobertura sesiones
                    </span>
                </div>
                <div className="text-2xl font-black text-white">
                    {coveragePct != null ? `${coveragePct}%` : '—'}
                </div>
                <p className="text-[11px] text-white/40 mt-1">
                    {sessionImpact?.partialCount
                        ? `${sessionImpact.partialCount} parciales · clic para ver`
                        : 'S1+S2 completas en el cohorte'}
                </p>
            </button>
        </section>
    );
}

function Tile({
    icon: Icon,
    label,
    value,
    sub,
    accent,
}: {
    icon: typeof Globe2;
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
