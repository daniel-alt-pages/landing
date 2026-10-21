import {
  SHOWCASE_TOUR_SECTION_CATALOG,
  type ShowcaseTourSectionMeta,
} from './tour-config';
import { getShowcaseTourTimeline } from './tour-timeline';
import { TOUR_HOVER_LEAD_MS } from './tour-interaction';

/** Fase narrativa activa en un instante del ciclo (para caption y debug). */
export function resolveShowcaseTourPhase(
  elapsed: number,
  compactTour = false,
): ShowcaseTourSectionMeta {
  const t = getShowcaseTourTimeline(compactTour);

  if (elapsed < t.T_RESET_END) return SHOWCASE_TOUR_SECTION_CATALOG.reset;
  if (elapsed < t.T_DASHBOARD_END) {
    if (elapsed < t.T_DASH_SCROLL_CLAVES_END) return SHOWCASE_TOUR_SECTION_CATALOG.scrollDashboardClaves;
    if (elapsed < t.T_DASH_VER_RANKING_CLICK) return SHOWCASE_TOUR_SECTION_CATALOG.clickDashboardVerRanking;
    return SHOWCASE_TOUR_SECTION_CATALOG.scrollDashboardToTop;
  }
  if (elapsed < t.T_RANKING_END) {
    if (elapsed < t.T_RANK_SCROLL_MID_END) return SHOWCASE_TOUR_SECTION_CATALOG.scrollRankingMid;
    if (elapsed < t.T_RANK_BACK_CLICK) return SHOWCASE_TOUR_SECTION_CATALOG.scrollRankingToTop;
    return SHOWCASE_TOUR_SECTION_CATALOG.clickRankingBack;
  }
  if (elapsed < t.T_RESP_NAV_END) return SHOWCASE_TOUR_SECTION_CATALOG.clickNavRespuestas;
  if (elapsed < t.T_RESPUESTAS_END) {
    if (elapsed < t.T_RESP_SCROLL_END) return SHOWCASE_TOUR_SECTION_CATALOG.scrollAnalisisFull;
    if (elapsed < t.T_RESP_REPASAR_CLICK) return SHOWCASE_TOUR_SECTION_CATALOG.clickAnalisisLogros;
    if (elapsed < t.T_RESP_DEMO_QUESTION_CLICK) return SHOWCASE_TOUR_SECTION_CATALOG.clickAnalisisRepasar;
    if (elapsed < t.T_RESP_DEMO_DETAIL_END) return SHOWCASE_TOUR_SECTION_CATALOG.detailPreguntaLogro;
    if (elapsed < t.T_RESP_QUESTION_CLICK - TOUR_HOVER_LEAD_MS) {
      return SHOWCASE_TOUR_SECTION_CATALOG.clickAnalisisMaterias;
    }
    return SHOWCASE_TOUR_SECTION_CATALOG.detailPreguntaIngles;
  }
  if (elapsed < t.T_MET_NAV_END) {
    if (elapsed < t.T_ANAL_BACK_CLICK + 400) return SHOWCASE_TOUR_SECTION_CATALOG.clickNavBack;
    return SHOWCASE_TOUR_SECTION_CATALOG.clickNavMetricas;
  }
  if (elapsed < t.T_METRICAS_END) {
    if (elapsed < t.T_MET_SCROLL_END) return SHOWCASE_TOUR_SECTION_CATALOG.scrollMetricasFull;
    if (elapsed < t.T_MET_BACK_CLICK) return SHOWCASE_TOUR_SECTION_CATALOG.scrollMetricasToTop;
    return SHOWCASE_TOUR_SECTION_CATALOG.clickNavBack;
  }
  if (elapsed < t.T_TAIL_END) return SHOWCASE_TOUR_SECTION_CATALOG.cierreCiclo;

  return SHOWCASE_TOUR_SECTION_CATALOG.reset;
}

export { getShowcaseTourTimeline } from './tour-timeline';
