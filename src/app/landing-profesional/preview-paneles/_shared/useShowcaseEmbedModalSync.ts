'use client';

import { useEffect } from 'react';
import { useShowcaseEmbed } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/context/ShowcaseEmbedProvider';

/** Sincroniza modales de Métricas con el tour embebido (un solo overlay a la vez). */
export function useShowcaseMetricasModalSync(
  setShowRankingModal: (open: boolean) => void,
  setShowAreaModal: (area: string | null) => void,
  setShowGroupStatsModal: (open: boolean) => void,
) {
  const embed = useShowcaseEmbed();

  useEffect(() => {
    if (!embed.active) return;

    const closeAll = () => {
      setShowRankingModal(false);
      setShowAreaModal(null);
      setShowGroupStatsModal(false);
    };

    if (embed.activeTab !== 'metricas') {
      closeAll();
      return;
    }

    const modal = embed.activeModal;
    closeAll();

    if (!modal) return;

    if (modal.kind === 'metricasRanking') setShowRankingModal(true);
    else if (modal.kind === 'metricasArea') setShowAreaModal(modal.areaKey);
    else if (modal.kind === 'metricasGroup') setShowGroupStatsModal(true);
  }, [
    embed.active,
    embed.activeTab,
    embed.activeModal,
    setShowRankingModal,
    setShowAreaModal,
    setShowGroupStatsModal,
  ]);
}
