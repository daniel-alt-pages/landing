'use client';

import { showcaseDomIds } from '../constants/dom-ids';
import { useShowcaseEmbed } from '../context/ShowcaseEmbedProvider';
import { useShowcaseTourHighlight } from '../context/ShowcaseTourHighlightContext';
import { showcaseTourHighlightClass } from '../context/showcaseTourHighlightClass';
import type { ShowcaseDashboardStats } from '../types/showcase.types';

type Props = { stats: ShowcaseDashboardStats; variant?: 'light' | 'dark' };

export function ShowcaseStudentNav({ stats, variant = 'dark' }: Props) {
  const isLight = variant === 'light';
  const { embedded, nombre } = stats;
  const { estudiante, simulacros } = embedded;
  const ip = estudiante.informacion_personal;

  const { active, activeSim, activeTab, selectSim, navigateTo } = useShowcaseEmbed();
  const tourHighlightId = useShowcaseTourHighlight();
  const inShowcaseEmbed = active;

  const navActive = isLight
    ? 'border-indigo-200 bg-white text-indigo-600 shadow-sm'
    : 'border-violet-500/20 bg-violet-500/10 text-violet-400 shadow-inner';
  const navIdle = isLight
    ? 'border-transparent text-slate-500 hover:bg-white hover:text-indigo-600'
    : 'border-transparent text-white/40 hover:text-white/60';

  return (
    <header
      className={
        isLight
          ? 'sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md'
          : 'sticky top-0 z-50 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl'
      }
    >
      <div
        className={`mx-auto flex max-w-[1600px] flex-row items-center gap-2 px-3 sm:px-5 ${
          inShowcaseEmbed ? 'h-14 w-full justify-end' : 'h-20 justify-between gap-3'
        }`}
      >
        {/* Nombre e ID — solo fuera del embed; en demo vive en header de Inicio */}
        {!inShowcaseEmbed ? (
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-lg ${
              isLight
                ? 'bg-indigo-600 shadow-indigo-500/30'
                : 'bg-gradient-to-br from-violet-600 to-indigo-600 shadow-violet-500/20'
            }`}
          >
            SG
          </div>
          <div className="min-w-0">
            <h1
              className={`student-name truncate text-lg font-black tracking-tight ${isLight ? 'text-slate-800' : 'text-white'}`}
            >
              {nombre}
            </h1>
            <p
              className={`truncate text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-white/30'}`}
            >
              CC {ip.numero_identificacion}
            </p>
          </div>

          <button
            id={showcaseDomIds.navPerfil}
            onClick={() => navigateTo('/estudiante/perfil')}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-200 border ${showcaseTourHighlightClass(showcaseDomIds.navPerfil, tourHighlightId)} ${
              activeTab === 'perfil' ? navActive : navIdle
            }`}
          >
            Perfil
          </button>
        </div>
        ) : null}

        {/* Simulacros Tabs (ocultos en embed: datos demo solo para SG11-19) */}
        {simulacros.length > 1 && !inShowcaseEmbed ? (
          <div className="relative shrink-0 group">
            {!inShowcaseEmbed ? (
              <div
                className={`absolute -inset-0.5 rounded-2xl blur transition duration-500 ${
                  isLight
                    ? 'animate-pulse bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-25'
                    : 'bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 opacity-15'
                }`}
              />
            ) : null}
            <div
              className={`relative flex items-center gap-2 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md ${
                isLight
                  ? 'border border-indigo-100 bg-white/95 shadow-indigo-500/10'
                  : 'border border-white/5 bg-[#0a0e17]/80'
              }`}
            >
              <div
                className={`ml-0.5 flex h-8 w-8 items-center justify-center rounded-xl shadow-lg ${
                  isLight
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                    : 'border border-white/5 bg-white/5'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 ${isLight ? 'text-white' : 'text-white/60'}`}
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
              <div
                className={`flex items-center gap-1 rounded-xl p-0.5 ${isLight ? 'bg-slate-100' : 'bg-white/[0.02]'}`}
              >
                {simulacros.map((sim) => {
                  const isActive = activeSim === sim;
                  const tabId = showcaseDomIds.simTab(sim);
                  return (
                    <button
                      key={sim}
                      id={tabId}
                      onClick={() => selectSim(sim)}
                      className={`relative whitespace-nowrap rounded-lg font-black uppercase tracking-wider transition-all duration-200 ${showcaseTourHighlightClass(tabId, tourHighlightId)} ${
                        inShowcaseEmbed ? 'px-2 py-1 text-[9px]' : 'px-3 py-1.5 text-[10.5px]'
                      } ${
                        isActive
                          ? isLight
                            ? `${inShowcaseEmbed ? '' : 'scale-[1.02] '}bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30`
                            : `${inShowcaseEmbed ? 'ring-1 ring-violet-400/50 ' : 'scale-[1.02] '}bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/40 border border-violet-400/20`
                          : isLight
                            ? 'border border-transparent text-slate-500 hover:bg-white hover:text-indigo-600'
                            : 'border border-transparent text-white/40 hover:text-white/60'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full border border-white bg-emerald-400 shadow-sm" />
                      )}
                      {sim}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* Navegación y Perfil */}
        <div className="flex shrink-0 items-center gap-3">
          {/* Inicio · Métricas · Respuestas */}
          <div
            className={`flex rounded-2xl p-1 ${isLight ? 'border border-slate-200 bg-slate-100' : 'border border-white/5 bg-white/[0.03]'}`}
          >
            <button
              id={showcaseDomIds.navDashboard}
              onClick={() => navigateTo('/estudiante/dashboard')}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-200 border ${showcaseTourHighlightClass(showcaseDomIds.navDashboard, tourHighlightId)} ${
                activeTab === 'dashboard' ? navActive : navIdle
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Inicio
            </button>
            <button
              id={showcaseDomIds.navMetricas}
              onClick={() => navigateTo('/estudiante/estadisticas')}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-200 border ${showcaseTourHighlightClass(showcaseDomIds.navMetricas, tourHighlightId)} ${
                activeTab === 'metricas' ? navActive : navIdle
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Métricas
            </button>
            <button
              id={showcaseDomIds.navRespuestas}
              onClick={() => navigateTo('/estudiante/analisis')}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-200 border ${showcaseTourHighlightClass(showcaseDomIds.navRespuestas, tourHighlightId)} ${
                activeTab === 'respuestas' ? navActive : navIdle
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              Análisis
            </button>
            <button
              id={showcaseDomIds.navRanking}
              onClick={() => navigateTo('/estudiante/ranking')}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-200 border ${showcaseTourHighlightClass(showcaseDomIds.navRanking, tourHighlightId)} ${
                activeTab === 'ranking' ? navActive : navIdle
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6m12 0h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22m10-8.34V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"
                />
              </svg>
              Ranking
            </button>
            {!inShowcaseEmbed ? (
              <button
                id={showcaseDomIds.navPerfil}
                onClick={() => navigateTo('/estudiante/perfil')}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-200 border ${showcaseTourHighlightClass(showcaseDomIds.navPerfil, tourHighlightId)} ${
                  activeTab === 'perfil' ? navActive : navIdle
                }`}
              >
                Perfil
              </button>
            ) : null}
          </div>

          {!inShowcaseEmbed ? (
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${
                isLight
                  ? 'border border-slate-200 bg-slate-100 text-slate-500'
                  : 'border border-white/5 bg-white/[0.03] text-white/50 hover:text-white/80'
              }`}
            >
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </span>
          ) : null}

          {/* Botón Salir */}
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${
              isLight
                ? 'border border-rose-200 bg-rose-50 text-rose-500'
                : 'border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
            }`}
          >
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
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </span>
        </div>
      </div>
    </header>
  );
}
