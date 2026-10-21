'use client';

import type { ReactNode } from 'react';
import type { AreaInsight } from '@features/coordinador/lib/executiveModel';
import { AlertTriangle, CheckCircle2, ClipboardList, RefreshCw, Users } from 'lucide-react';

function SustainCard({
    icon,
    title,
    body,
}: {
    icon: ReactNode;
    title: string;
    body: string;
}) {
    return (
        <div
            className="rounded-xl p-4"
            style={{
                background: 'rgba(52, 211, 153, 0.06)',
                border: '1px solid rgba(52, 211, 153, 0.22)',
            }}
        >
            <div className="flex items-start gap-3">
                <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{
                        color: '#34d399',
                        background: 'rgba(52, 211, 153, 0.12)',
                        border: '1px solid rgba(52, 211, 153, 0.28)',
                    }}
                >
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold" style={{ color: 'var(--coord-text-primary)' }}>
                        {title}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--coord-text-secondary)' }}>
                        {body}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function PrioritiesClearPanel({
    hasPerformanceData,
    fortalezas,
    areasAligned,
}: {
    hasPerformanceData: boolean;
    fortalezas: AreaInsight[];
    areasAligned: AreaInsight[];
}) {
    if (!hasPerformanceData) {
        return (
            <div
                className="rounded-xl px-4 py-5 text-center"
                style={{
                    background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(255,255,255,0.025))',
                    border: '1px solid rgba(251,191,36,0.3)',
                }}
                role="status"
            >
                <div
                    className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                        color: '#fbbf24',
                        background: 'rgba(251,191,36,0.18)',
                        border: '1px solid rgba(251,191,36,0.35)',
                    }}
                >
                    <AlertTriangle size={18} />
                </div>
                <div className="text-sm font-black" style={{ color: 'var(--coord-text-primary)' }}>
                    Datos insuficientes para priorizar
                </div>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed" style={{ color: 'var(--coord-text-tertiary)' }}>
                    No hay puntajes válidos por área para concluir buen desempeño. Revisa la carga del simulacro antes
                    de interpretar este bloque.
                </p>
            </div>
        );
    }

    const lead = fortalezas[0]?.name ?? areasAligned[0]?.name ?? 'tus mejores áreas';
    const second = fortalezas[1]?.name;
    const alignedCount = areasAligned.length;

    return (
        <div className="space-y-2.5" role="status">
            <div
                className="rounded-xl p-4"
                style={{
                    background: 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(99,102,241,0.05))',
                    border: '1px solid rgba(52, 211, 153, 0.28)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
            >
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{
                            color: '#34d399',
                            background: 'rgba(52, 211, 153, 0.16)',
                            border: '1px solid rgba(52, 211, 153, 0.32)',
                        }}
                    >
                        <CheckCircle2 size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p
                            className="text-[10px] font-bold uppercase tracking-widest mb-1"
                            style={{ color: '#34d399' }}
                        >
                            Sin áreas críticas
                        </p>
                        <h4 className="text-sm font-black" style={{ color: 'var(--coord-text-primary)' }}>
                            Institución al día frente al referente nacional
                        </h4>
                        <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: 'var(--coord-text-secondary)' }}>
                            {alignedCount > 0
                                ? `${alignedCount} área${alignedCount === 1 ? '' : 's'} en nivel nacional o por encima. Enfócate en sostener lo que ya funciona.`
                                : 'Todas las áreas evaluadas están al nivel del referente nacional o por encima.'}
                        </p>
                    </div>
                </div>
            </div>

            <SustainCard
                icon={<ClipboardList size={16} />}
                title="Documentar buenas prácticas"
                body={`Registra qué estrategias están funcionando en ${lead}${second ? ` y ${second}` : ''} para replicarlas con otros grupos.`}
            />

            <SustainCard
                icon={<RefreshCw size={16} />}
                title="Monitorear el próximo corte"
                body="Compara este simulacro con el siguiente para detectar caídas tempranas antes de que se conviertan en brechas."
            />

            <SustainCard
                icon={<Users size={16} />}
                title="Socializar con el equipo docente"
                body="Comparte estos resultados en consejo de área y acuerda metas de sostenimiento, no solo de recuperación."
            />
        </div>
    );
}
