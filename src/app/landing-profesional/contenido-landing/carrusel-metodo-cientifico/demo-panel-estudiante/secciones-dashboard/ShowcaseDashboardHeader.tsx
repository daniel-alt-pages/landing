'use client';

import type { ShowcaseDashboardStats } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/useShowcaseDashboardStats';

type Props = { stats: ShowcaseDashboardStats };

export function ShowcaseDashboardHeader({ stats }: Props) {
  const { embedded, nombre } = stats;
  const { estudiante, simulacroActual, simulacros } = embedded;
  const ip = estudiante.informacion_personal;
  return (
<header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
  <div className="mx-auto flex h-20 max-w-[1600px] flex-row items-center justify-between gap-3 px-5">
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
        SG
      </div>
      <div className="min-w-0">
        <h1 className="student-name truncate text-2xl font-bold tracking-tight text-slate-800">
          {nombre}
        </h1>
        <p className="truncate text-sm font-semibold uppercase tracking-widest text-slate-400">
          {ip.numero_identificacion}
        </p>
      </div>
    </div>

    {simulacros.length > 1 && (
      <div className="relative shrink-0 group">
        <div className="absolute -inset-0.5 animate-pulse rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-25 blur transition duration-500 group-hover:opacity-50" />
        <div className="relative flex items-center gap-2.5 rounded-2xl border border-indigo-100 bg-white/95 p-1.5 shadow-xl shadow-indigo-500/10 backdrop-blur-md">
          <div className="ml-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-0.5">
            {simulacros.map((sim) => (
              <span
                key={sim}
                className={`relative whitespace-nowrap rounded-lg px-4 py-2 text-xs font-extrabold ${
                  simulacroActual === sim
                    ? 'scale-[1.02] bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/40'
                    : 'text-slate-500'
                }`}
              >
                {simulacroActual === sim && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-white bg-emerald-400 shadow-sm" />
                )}
                {sim}
              </span>
            ))}
          </div>
        </div>
      </div>
    )}

    <div className="flex shrink-0 items-center gap-3">
      <div className="flex rounded-2xl bg-slate-100 p-1">
        <span className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
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
          Métricas
        </span>
        <span className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          Respuestas
        </span>
      </div>
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </span>
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      </span>
    </div>
  </div>
</header>

  );
}
