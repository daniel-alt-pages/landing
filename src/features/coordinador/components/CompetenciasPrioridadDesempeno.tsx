'use client';



import { AlertOctagon } from 'lucide-react';

import type { AreaDiagnostico } from '@features/coordinador/lib/referencePerformanceDependencies';

import {
    flattenUrgentCompetencies,
    labelPrioridadCompetencia,
    PRIORIDAD_COMPETENCIA_TITLE,
} from '@features/coordinador/lib/competencyDominanceStats';

import CoordCard from '@features/coordinador/components/ui/CoordCard';

import SectionHeader from '@features/coordinador/components/ui/SectionHeader';

import { GlowBar, ESTADO_DOMINIO_UI } from '@features/coordinador/components/ui/coordVisualPrimitives';



export default function CompetenciasPrioridadDesempeno({

    diagnosticos,

}: {

    diagnosticos: AreaDiagnostico[];

}) {

    const urgentes = flattenUrgentCompetencies(

        diagnosticos.map(d => ({ areaNombre: d.areaNombre, competencias: d.competencias })),

        6

    );



    if (!urgentes.length) return null;



    return (

        <CoordCard stripe="rose" className="mt-5">

            <SectionHeader

                title="Prioridad por competencias (ICFES)"

                description="Ordenadas por dominio estimado y peso en la prueba · integrado al plan de desempeño."

                accent="#fb7185"

                icon={<AlertOctagon size={16} />}

            />

            <div className="mt-4 overflow-x-auto -mx-1 px-1">

                <table className="w-full min-w-[520px] text-left border-collapse">

                    <thead>

                        <tr className="text-[10px] font-bold uppercase tracking-wider coord-text-muted border-b" style={{ borderColor: 'var(--coord-border)' }}>

                            <th className="py-2 pr-3 min-w-[5.5rem]" title={PRIORIDAD_COMPETENCIA_TITLE}>
                                Prioridad
                            </th>

                            <th className="py-2 pr-3">Área</th>

                            <th className="py-2 pr-3">Competencia</th>

                            <th className="py-2 pr-3">Dominio</th>

                            <th className="py-2 text-right">Tramo</th>

                        </tr>

                    </thead>

                    <tbody>

                        {urgentes.map(u => {

                            const area = diagnosticos.find(d => d.areaNombre === u.area);

                            const cfg = ESTADO_DOMINIO_UI[u.estado];

                            return (

                                <tr

                                    key={`${u.area}-${u.competenciaId}`}

                                    className="border-b transition-colors hover:bg-white/[0.02]"

                                    style={{ borderColor: 'var(--coord-border)' }}

                                >

                                    <td
                                        className="py-3 pr-3 text-xs font-semibold tabular-nums whitespace-nowrap"
                                        style={{ color: cfg.color }}
                                        title={PRIORIDAD_COMPETENCIA_TITLE}
                                    >
                                        {labelPrioridadCompetencia(u.prioridad)}
                                    </td>

                                    <td className="py-3 pr-3 text-xs coord-text-muted">{u.area}</td>

                                    <td className="py-3 pr-3 text-xs font-semibold coord-text-head max-w-[220px]">

                                        {u.competenciaNombre}

                                    </td>

                                    <td className="py-3 pr-3 min-w-[120px]">

                                        <div className="flex items-center gap-2">

                                            <span className="text-sm font-black tabular-nums w-10" style={{ color: cfg.color }}>

                                                {u.dominioPct}%

                                            </span>

                                            <div className="flex-1 min-w-[72px]">

                                                <GlowBar pctVal={u.dominioPct} color={cfg.color} height={6} />

                                            </div>

                                        </div>

                                    </td>

                                    <td className="py-3 text-right text-[11px] coord-text-muted tabular-nums">

                                        {area?.progresoEnRangoPct ?? '—'}%

                                    </td>

                                </tr>

                            );

                        })}

                    </tbody>

                </table>

            </div>

        </CoordCard>

    );

}

