'use client';

import { showcaseDomIds } from '../../constants/dom-ids';
import { useShowcaseEmbed } from '../../context/ShowcaseEmbedProvider';
import type { ShowcaseDashboardStats } from '../../types/showcase.types';

type Props = { stats: ShowcaseDashboardStats };

const KPI_BORDER: Record<string, string> = {
  amber: 'border-amber-500/30 from-amber-500/20 to-orange-500/10',
  blue: 'border-blue-500/30 from-blue-500/20 to-cyan-500/10',
  emerald: 'border-emerald-500/30 from-emerald-500/20 to-green-500/10',
  rose: 'border-rose-500/30 from-rose-500/20 to-red-500/10',
  purple: 'border-purple-500/30 from-purple-500/20 to-violet-500/10',
};

const KPI_TEXT: Record<string, string> = {
  amber: 'text-amber-400',
  blue: 'text-blue-400',
  emerald: 'text-emerald-400',
  rose: 'text-rose-400',
  purple: 'text-purple-400',
};

function initials(nombres: string, apellidos: string) {
  return `${nombres?.charAt(0) ?? ''}${apellidos?.charAt(0) ?? ''}`.toUpperCase();
}

/** Ranking — réplica estática de `/estudiante/ranking`. */
export function ShowcaseRankingPanel({ stats }: Props) {
  const { activeSim } = useShowcaseEmbed();
  const { embedded, activeSimScore, activeSimPercentil } = stats;
  const { rankingInfo } = embedded;
  const vsPromedio = activeSimScore - rankingInfo.avgGlobal;
  const top = rankingInfo.top5 ?? [];

  const kpis = [
    {
      label: 'Tu Posición',
      value: `#${rankingInfo.puesto}`,
      sub: `de ${rankingInfo.total} estudiantes`,
      accent: 'amber' as const,
    },
    { label: 'Tu Puntaje', value: String(activeSimScore), sub: 'puntos globales', accent: 'blue' as const },
    {
      label: 'vs Promedio',
      value: `${vsPromedio >= 0 ? '+' : ''}${vsPromedio}`,
      sub: `Promedio: ${rankingInfo.avgGlobal}`,
      accent: vsPromedio >= 0 ? ('emerald' as const) : ('rose' as const),
    },
    { label: 'Percentil', value: `${activeSimPercentil}%`, sub: 'mejor que el resto', accent: 'purple' as const },
  ];

  return (
    <div id={showcaseDomIds.sectionRanking} className="space-y-6">
      <header className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden>
            <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Ranking General</h2>
          <p className="text-sm text-white/50">
            Simulacro: <span className="font-bold text-cyan-400">{activeSim}</span>
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-2xl border bg-gradient-to-br p-5 backdrop-blur-xl ${KPI_BORDER[kpi.accent]}`}
          >
            <span className={`text-xs font-bold uppercase tracking-wider ${KPI_TEXT[kpi.accent]}`}>
              {kpi.label}
            </span>
            <p className="mt-1 text-4xl font-black text-white">{kpi.value}</p>
            <p className="mt-1 text-xs text-white/50">{kpi.sub}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-6 shadow-2xl backdrop-blur-xl">
        <h3 className="mb-4 text-lg font-black text-white">Top estudiantes</h3>
        <div className="space-y-2">
          {top.map((est: (typeof top)[number], idx: number) => {
            const ip = est.informacion_personal;
            const name = `${ip.nombres} ${ip.apellidos}`.trim();
            return (
              <div
                key={ip.numero_identificacion ?? String(idx)}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-900/40 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-sm font-black text-white/70">
                    {idx + 1}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600/30 text-xs font-bold text-violet-200">
                    {initials(ip.nombres, ip.apellidos)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{name}</p>
                    <p className="text-[10px] text-white/40">{ip.institucion}</p>
                  </div>
                </div>
                <p className="text-xl font-black text-cyan-400">{est.puntaje_global}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
