'use client';

import { showcaseDomIds } from '../../constants/dom-ids';
import type { ShowcaseDashboardStats } from '../../types/showcase.types';
import { ShowcaseMetricasScoreGrid } from '../metricas/ShowcaseMetricasScoreGrid';
import { ShowcaseDashboardBanner } from './ShowcaseDashboardBanner';
import { ShowcaseDashboardMateriasSection } from './ShowcaseDashboardMateriasSection';

type Props = { stats: ShowcaseDashboardStats };

/** Inicio — `/estudiante/dashboard`: puntaje/ranking → banner → resultados por área. */
export function ShowcaseDashboardPanel({ stats }: Props) {
  return (
    <div id={showcaseDomIds.sectionDashboard} className="space-y-5 sm:space-y-9">
      <ShowcaseMetricasScoreGrid stats={stats} mode="dashboard" />
      <ShowcaseDashboardBanner />
      <ShowcaseDashboardMateriasSection stats={stats} />
    </div>
  );
}
