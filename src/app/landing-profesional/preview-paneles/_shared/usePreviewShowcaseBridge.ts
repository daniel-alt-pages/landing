'use client';

import { useCallback, useEffect } from 'react';
import { useShowcaseEmbed } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/context/ShowcaseEmbedProvider';

/** Sincroniza preview embebido con el tour (tabs, sim) sin router ni login. */
export function usePreviewShowcaseBridge(options: {
  simulacroActual: string | null;
  setSimulacroActual: (sim: string) => void;
  onSimChange?: (sim: string) => void | Promise<void>;
}) {
  const embed = useShowcaseEmbed();

  useEffect(() => {
    if (!embed.active) return;
    const next = embed.activeSim;
    if (!next || next === options.simulacroActual) return;
    options.setSimulacroActual(next);
    void options.onSimChange?.(next);
  }, [embed.active, embed.activeSim, options.simulacroActual, options.setSimulacroActual, options.onSimChange]);

  const navigateToShowcase = useCallback(
    (path: string) => {
      if (!embed.active) return false;
      embed.navigateTo(path);
      return true;
    },
    [embed],
  );

  return { isShowcaseEmbed: embed.active, navigateToShowcase, goBackShowcase: embed.goBack };
}
