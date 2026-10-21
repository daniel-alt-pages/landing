'use client';

import RadarChart from '@features/estudiante/components/RadarChart';
import { useShowcaseEmbed } from '../../context/ShowcaseEmbedProvider';
import { showcaseDomIds } from '../../constants/dom-ids';
import { SHOWCASE_MATERIAS } from '../../constants/materias';
import type { ShowcaseDashboardStats } from '../../types/showcase.types';

type Props = { stats: ShowcaseDashboardStats };

const MATERIA_SHORT: Record<string, string> = {
  'lectura crítica': 'LEC',
  matemáticas: 'MAT',
  'sociales y ciudadanas': 'SOC',
  'ciencias naturales': 'NAT',
  inglés: 'ING',
};

const MATERIA_GRADIENT: Record<string, string> = {
  'lectura crítica': 'from-pink-500 to-rose-600',
  matemáticas: 'from-blue-500 to-indigo-600',
  'sociales y ciudadanas': 'from-amber-500 to-orange-600',
  'ciencias naturales': 'from-emerald-500 to-teal-600',
  inglés: 'from-violet-500 to-purple-600',
};

function PercentRing({ value, size = 140 }: { value: number; size?: number }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#pctGrad)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="pctGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-white">{value}%</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300">Percentil</span>
      </div>
    </div>
  );
}

/** Métricas — réplica estática de `/estudiante/estadisticas` para el embed. */
export function ShowcaseMetricasPanel({ stats }: Props) {
  const { activeSim } = useShowcaseEmbed();
  const {
    embedded,
    activeSimScore,
    activeSimPuesto,
    activeSimTotal,
    activeSimPercentil,
    porcentajeGlobal,
    totalCorrectas,
    totalPreguntas,
    activeSimPuntajes,
    activeSimSubjectRankings,
    diffPromedio,
  } = stats;
  const { rankingInfo, groupStats } = embedded;

  const entries = SHOWCASE_MATERIAS.map((m) => ({
    ...m,
    short: MATERIA_SHORT[m.key] ?? m.label.slice(0, 3).toUpperCase(),
    gradient: MATERIA_GRADIENT[m.key] ?? 'from-violet-500 to-indigo-600',
    puntaje: activeSimPuntajes[m.key]?.puntaje ?? 0,
    ranking: activeSimSubjectRankings[m.key] ?? 0,
    promedioGrupo: groupStats.promediosPorMateria[m.key] ?? 0,
  })).sort((a, b) => b.puntaje - a.puntaje);

  const mejor = entries[0];
  const peor = entries[entries.length - 1];
  const brecha = mejor && peor ? mejor.puntaje - peor.puntaje : 0;
  const superados = rankingInfo.total - rankingInfo.puesto;
  const vsPromedio = activeSimScore - groupStats.promedio;

  const radarData = entries.map((m) => ({
    label: m.short,
    value: m.puntaje,
    maxValue: 100,
  }));

  const markerLeft = Math.min(
    97,
    Math.max(3, ((activeSimScore - groupStats.min) / (groupStats.max - groupStats.min)) * 100),
  );

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section id={showcaseDomIds.sectionMetricas}>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-6 w-2 rounded-full bg-violet-500 shadow-[0_0_10px_#8b5cf6]" />
          <div>
            <h2 className="text-lg font-bold text-white">Métricas de Desempeño</h2>
            <p className="text-xs text-slate-400">
              {activeSim} · {stats.nombre.split(' ')[0]}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-indigo-600/15 to-purple-600/20 p-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-violet-300">
              Tu Puntaje Global
            </p>
            <p
              className="text-7xl font-black tracking-tight text-white"
              style={{ textShadow: '0 0 40px rgba(139,92,246,0.45)' }}
            >
              {activeSimScore}
            </p>
            <p className="text-lg text-slate-400">/ 500 puntos</p>
            <div className="mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-slate-800/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400"
                style={{ width: `${(activeSimScore / 500) * 100}%` }}
              />
            </div>
            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                vsPromedio >= 0
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {vsPromedio >= 0 ? '↑' : '↓'} {Math.abs(vsPromedio)} pts vs promedio
            </span>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-white/5 bg-[#1A1B2E] p-4">
              <p className="text-xs text-slate-400">Posición</p>
              <p className="text-4xl font-black text-white">
                #{activeSimPuesto}
                <span className="text-lg font-normal text-slate-500"> / {activeSimTotal}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#1A1B2E] p-4">
              <p className="text-xs text-slate-400">Efectividad</p>
              <p className="text-4xl font-black text-cyan-400">{porcentajeGlobal}%</p>
              <p className="mt-1 text-[10px] text-slate-500">
                {totalCorrectas} de {totalPreguntas} correctas
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <PercentRing value={activeSimPercentil || 92} size={150} />
        </div>
      </section>

      {/* Tu rendimiento */}
      <section className="rounded-3xl border border-white/5 bg-[#131420] p-5">
        <h3 className="text-base font-bold text-white">Tu Rendimiento</h3>
        <p className="mb-4 text-[10px] text-slate-400">Posición relativa al grupo</p>
        <div className="relative mb-8 px-1 py-4">
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-[#0F1018] ring-1 ring-white/10">
            <div className="flex h-full w-full">
              <div className="h-full flex-1 bg-gradient-to-r from-rose-900 to-rose-600" />
              <div className="h-full flex-1 bg-gradient-to-r from-amber-700 to-amber-500" />
              <div className="h-full flex-1 bg-gradient-to-r from-emerald-700 to-emerald-500" />
              <div className="h-full flex-1 bg-gradient-to-r from-cyan-700 to-cyan-500" />
            </div>
          </div>
          <div
            className="absolute top-6 flex flex-col items-center"
            style={{ left: `${markerLeft}%`, transform: 'translateX(-50%)' }}
          >
            <span className="rounded-lg bg-violet-600 px-2 py-1 text-[10px] font-black text-white">
              {activeSimScore} PTS
            </span>
            <div className="mt-1 h-8 w-0.5 bg-gradient-to-b from-violet-400 to-transparent" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/5 bg-[#1A1B2E] p-3 text-center">
            <p className="text-[9px] font-bold uppercase text-slate-500">Tu Puntaje</p>
            <p className="text-xl font-black text-white">{activeSimScore}</p>
          </div>
          <div className="rounded-2xl border border-violet-500/30 bg-violet-900/30 p-3 text-center">
            <p className="text-[9px] font-bold uppercase text-violet-300">Percentil</p>
            <p className="text-xl font-black text-white">{activeSimPercentil}%</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#1A1B2E] p-3 text-center">
            <p className="text-[9px] font-bold uppercase text-slate-500">Superaste a</p>
            <p className="text-xl font-black text-emerald-400">{superados}</p>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section id={showcaseDomIds.sectionMetricasArea} className="rounded-3xl border border-white/5 bg-[#131420] p-5">
        <h3 className="mb-4 text-base font-bold text-white">Skills & Competencias</h3>
        <div className="grid grid-cols-2 gap-3">
          {entries.map((m) => {
            const nivel =
              m.puntaje >= 75
                ? 'Experto'
                : m.puntaje >= 60
                  ? 'Avanzado'
                  : m.puntaje >= 45
                    ? 'Intermedio'
                    : 'Básico';
            return (
              <div
                key={m.key}
                className="rounded-2xl border border-white/5 bg-[#1A1B2E] p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${m.gradient} text-[10px] font-black text-white`}
                    >
                      {m.short}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{m.label}</p>
                      <p className="text-[9px] text-slate-500">#{m.ranking} · {nivel}</p>
                    </div>
                  </div>
                  <span className="text-xl font-black" style={{ color: m.color }}>
                    {m.puntaje}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${m.puntaje}%`,
                      background: `linear-gradient(90deg, ${m.color}99, ${m.color})`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Fortalezas */}
      <section
        id={showcaseDomIds.sectionMetricasFortalezas}
        className="grid grid-cols-2 gap-4"
      >
        {mejor && (
          <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 p-5">
            <p className="text-xs font-bold uppercase text-emerald-400">Tu Fortaleza</p>
            <p className="text-lg font-bold text-white">{mejor.label}</p>
            <p className="mt-2 text-5xl font-black text-emerald-400">{mejor.puntaje}</p>
            <p className="mt-1 text-[10px] text-emerald-400/70">Ranking #{mejor.ranking}</p>
          </div>
        )}
        {peor && (
          <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-600/20 to-orange-600/20 p-5">
            <p className="text-xs font-bold uppercase text-amber-400">Área de Mejora</p>
            <p className="text-lg font-bold text-white">{peor.label}</p>
            <p className="mt-2 text-5xl font-black text-amber-400">{peor.puntaje}</p>
            <p className="mt-1 text-[10px] text-amber-400/70">Brecha {brecha} pts vs mejor área</p>
          </div>
        )}
      </section>

      {/* Perfil + evolución */}
      <section id={showcaseDomIds.sectionMetricasPerfil} className="grid grid-cols-2 gap-6">
        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 via-[#131420] to-indigo-950 p-6">
          <h3 className="mb-1 text-base font-bold text-white">Perfil por Área</h3>
          <p className="mb-4 text-[10px] text-slate-400">Tu radar de competencias</p>
          <div className="flex justify-center">
            <RadarChart data={radarData} size={260} showLabels />
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-[#131420] p-6">
          <h3 className="mb-1 text-base font-bold text-white">Desglose por Área</h3>
          <p className="mb-4 text-[10px] text-slate-400">Puntaje vs promedio del grupo</p>
          <div className="space-y-3">
            {entries.map((m) => {
              const diff = m.puntaje - m.promedioGrupo;
              return (
                <div key={m.key} className="rounded-xl border border-white/5 bg-slate-900/40 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-slate-300">{m.label}</span>
                    <span className="text-lg font-black text-white">{m.puntaje}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${m.puntaje}%`, backgroundColor: m.color }}
                    />
                  </div>
                  <p
                    className={`mt-1 text-[10px] font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}
                  >
                    {diff >= 0 ? '+' : ''}
                    {diff} vs prom. {m.promedioGrupo}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Grupo */}
      <section
        id={showcaseDomIds.sectionMetricasGrupo}
        className="rounded-3xl border border-white/5 bg-slate-800/30 p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Estadísticas del Grupo</h3>
          <span className="text-xs text-violet-400">{groupStats.total} estudiantes</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Promedio', value: groupStats.promedio, color: 'text-blue-400' },
            { label: 'Mediana', value: groupStats.mediana, color: 'text-violet-400' },
            { label: 'P75', value: groupStats.p75, color: 'text-emerald-400' },
            { label: 'P90', value: groupStats.p90, color: 'text-amber-400' },
            { label: 'P25', value: groupStats.p25, color: 'text-slate-400' },
            { label: 'P10', value: groupStats.p10, color: 'text-slate-400' },
            { label: 'D.E.', value: groupStats.desviacion, color: 'text-pink-400' },
            {
              label: 'vs tú',
              value: diffPromedio >= 0 ? `+${diffPromedio}%` : `${diffPromedio}%`,
              color: diffPromedio >= 0 ? 'text-emerald-400' : 'text-rose-400',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/5 bg-slate-900/50 p-3 text-center"
            >
              <span className="text-[10px] uppercase tracking-wider text-slate-500">
                {stat.label}
              </span>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
