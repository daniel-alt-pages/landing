'use client';

import { showcaseDomIds } from '../constants/dom-ids';
import { SHOWCASE_EMBEDDED } from '../data/embedded-student';
import { useShowcaseEmbed } from '../context/ShowcaseEmbedProvider';
import type { ShowcaseDashboardTab } from '../types/showcase.types';

const TAB_ITEMS: { tab: ShowcaseDashboardTab; id: string; label: string }[] = [
  { tab: 'dashboard', id: showcaseDomIds.navDashboard, label: 'Inicio' },
  { tab: 'metricas', id: showcaseDomIds.navMetricas, label: 'Métricas' },
  { tab: 'respuestas', id: showcaseDomIds.navRespuestas, label: 'Análisis' },
  { tab: 'ranking', id: showcaseDomIds.navRanking, label: 'Ranking' },
];

/**
 * Nav fija para embed en viewport estrecho: conserva IDs del tour autoclic.
 */
export function ShowcaseStudentNav() {
  const embed = useShowcaseEmbed();
  const { activeTab, activeSim, selectSim } = embed;

  const goTab = (tab: ShowcaseDashboardTab) => {
    if (tab === 'dashboard') embed.openDashboard();
    else if (tab === 'metricas') embed.openMetricas();
    else if (tab === 'respuestas') embed.openRespuestas();
    else if (tab === 'ranking') embed.openRanking();
  };

  return (
    <header
      className="showcase-student-nav shrink-0 border-b border-slate-200/90 bg-white/95 backdrop-blur-md"
      data-showcase-compact-nav
    >
      <div className="showcase-student-nav__sims flex items-center gap-1 overflow-x-auto px-2 py-1.5 border-b border-slate-100/90">
        {SHOWCASE_EMBEDDED.simulacros.map((sim) => (
          <button
            key={sim}
            id={showcaseDomIds.simTab(sim)}
            type="button"
            data-sim={sim}
            onClick={() => selectSim(sim)}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-extrabold tracking-wide transition-colors ${
              activeSim === sim
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
            }`}
          >
            {sim.replace('SG11-', '#')}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 px-1.5 py-1">
        {activeTab !== 'dashboard' ? (
          <button
            id={showcaseDomIds.navBack}
            type="button"
            onClick={() => embed.goBack()}
            className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-white"
            aria-label="Volver"
          >
            ←
          </button>
        ) : null}

        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto rounded-xl bg-slate-100/90 p-0.5">
          {TAB_ITEMS.map(({ tab, id, label }) => (
            <button
              key={tab}
              id={id}
              type="button"
              onClick={() => goTab(tab)}
              className={`shrink-0 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all sm:px-2.5 sm:text-[11px] ${
                activeTab === tab
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-indigo-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
