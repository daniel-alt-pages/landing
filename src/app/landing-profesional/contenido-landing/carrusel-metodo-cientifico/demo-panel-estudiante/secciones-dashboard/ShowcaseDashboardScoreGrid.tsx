'use client';

import AnimateIn from '@shared/components/animations/AnimateIn';
import TextAnimation from '@shared/components/animations/TextAnimation';
import type { ShowcaseDashboardStats } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/useShowcaseDashboardStats';

type Props = { stats: ShowcaseDashboardStats };

export function ShowcaseDashboardScoreGrid({ stats }: Props) {
  const { embedded, nivel, totalCorrectas, totalPreguntas, porcentajeGlobal, superados, percentil, diffPromedio } = stats;
  const { estudiante, simulacroActual, simulacros, rankingInfo, subjectTops } = embedded;
  return (
  <section className="grid grid-cols-3 gap-6">
    <AnimateIn type="scaleUp" duration={0.8}>
      <div className="group relative min-h-[320px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 text-white shadow-2xl transition-all hover:shadow-indigo-500/20">
        <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-indigo-500/30 blur-[80px] transition-colors duration-500 group-hover:bg-indigo-400/40" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-purple-500/10 blur-[60px]" />

        <div className="relative z-10 flex h-full flex-col justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 backdrop-blur-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 text-yellow-400"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-semibold tracking-wide text-yellow-100">
                {simulacroActual} FINALIZADO
              </span>
            </div>
            <div className="mb-2 flex items-center gap-2 opacity-80">
              <span className="h-4 w-1 rounded-full bg-indigo-400" />
              <TextAnimation
                text="Puntaje Global"
                as="p"
                classname="text-sm font-bold uppercase tracking-widest text-indigo-200"
                delay={0.2}
              />
            </div>
            <h2 className="score-number text-8xl font-black leading-none tracking-tighter text-white">
              {estudiante.puntaje_global}
            </h2>
            <TextAnimation
              text="de 500 posibles"
              as="p"
              classname="mt-1 text-xl font-medium text-indigo-300"
              delay={0.6}
            />
            {superados > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-md">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.166 2.621v.858A47.077 47.077 0 003.07.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm font-bold text-amber-300">
                  Superaste a {superados} Geniesitos
                </span>
              </div>
            )}
          </div>
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-md">
            <span className="text-2xl drop-shadow-lg filter">{nivel.icon}</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase leading-tight tracking-wider text-indigo-200">
                Nivel de Desempeño
              </span>
              <span className={`text-sm font-black tracking-wide ${nivel.color}`}>
                {nivel.text}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AnimateIn>

    <div className="col-span-2 flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-6">
        <AnimateIn type="fadeRight" delay={0.2}>
          <div className="flex flex-col justify-between rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              {diffPromedio !== null && (
                <span
                  className={`rounded-lg px-3 py-1 text-xs font-bold ${
                    diffPromedio >= 0
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-red-50 text-red-500'
                  }`}
                >
                  {diffPromedio >= 0 ? '+' : ''}
                  {diffPromedio}% vs promedio
                </span>
              )}
            </div>
            <div>
              <p className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-400">
                Aciertos Totales
              </p>
              <p className="text-5xl font-black tracking-tight text-slate-800">
                {totalCorrectas}{' '}
                <span className="text-xl font-medium text-slate-400">/ {totalPreguntas}</span>
              </p>
            </div>
          </div>
        </AnimateIn>

        <AnimateIn type="fadeRight" delay={0.35}>
          <div className="flex flex-col justify-between rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <span className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                Efectividad <span className="opacity-50">?</span>
              </span>
            </div>
            <div>
              <p className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-400">
                Porcentaje
              </p>
              <p className="text-5xl font-black tracking-tight text-slate-800">
                {porcentajeGlobal}%
              </p>
            </div>
          </div>
        </AnimateIn>
      </div>

      <AnimateIn type="flipUp" delay={0.5}>
        <div className="rounded-[2rem] border border-purple-100/80 bg-gradient-to-br from-purple-50 via-white to-indigo-50/30 p-6 shadow-sm transition-all hover:shadow-lg">
          <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:gap-6">
            <div className="group flex flex-shrink-0 items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-2.5 text-white shadow-lg shadow-purple-500/25">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-purple-500/70">
                  Posición Global
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-4xl font-black tracking-tighter text-purple-900"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}
                  >
                    #{rankingInfo.puesto}
                  </span>
                  <span className="text-xs font-bold text-purple-300">/ {rankingInfo.total}</span>
                </div>
              </div>
              {percentil > 0 && (
                <div className="flex items-center rounded-lg border border-purple-200/50 bg-purple-100/80 px-2.5 py-1">
                  <span className="text-[9px] font-black text-purple-600">P{percentil}%</span>
                </div>
              )}
              <span className="ml-auto rounded-full border border-purple-100 bg-white px-3 py-1.5 text-[10px] font-bold text-purple-500 shadow-sm xl:ml-0">
                Ver Ranking →
              </span>
            </div>

            {subjectTops.length > 0 && (
              <>
                <div className="hidden w-px self-stretch bg-gradient-to-b from-transparent via-purple-200 to-transparent xl:block" />
                <div className="hidden min-w-0 flex-1 items-stretch gap-2 xl:flex">
                  {subjectTops.map((st) => (
                    <div
                      key={st.materia}
                      className="relative min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-100 bg-white p-3 text-center"
                    >
                      <div
                        className="absolute left-0 right-0 top-0 h-0.5 opacity-60"
                        style={{ backgroundColor: st.color }}
                      />
                      <p className="mb-1 truncate text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        {st.label}
                      </p>
                      <span
                        className="block text-lg font-black leading-none tracking-tight"
                        style={{ color: st.color }}
                      >
                        #{st.miPuesto}
                      </span>
                      <span className="text-[8px] font-medium text-slate-300">de {st.total}</span>
                      <p className="mt-0.5 text-[9px] font-semibold text-slate-400">
                        {st.miPuntaje} pts
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </AnimateIn>

      <AnimateIn type="blurIn" delay={0.6}>
        <section className="cursor-default rounded-[2rem] border border-indigo-500/20 bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <TextAnimation
                  text="Perfil por Área & Evolución"
                  as="h3"
                  classname="text-base font-bold text-white"
                  delay={0.1}
                />
                <TextAnimation
                  text="Radar de competencias, tendencia entre simulacros y análisis detallado"
                  as="p"
                  classname="text-xs text-slate-400"
                  delay={0.3}
                  staggerDelay={0.02}
                />
              </div>
            </div>
            <svg
              className="h-5 w-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </section>
      </AnimateIn>
    </div>
  </section>

  );
}
