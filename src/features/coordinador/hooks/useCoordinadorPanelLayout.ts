'use client';

import type { CSSProperties } from 'react';
import { useShowcaseSlotLayout } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/context/ShowcaseSlotLayoutContext';

export const COORD_SIDEBAR_WIDTH_PROD = 260;
export const COORD_SIDEBAR_WIDTH_EMBED = 220;

/**
 * Layout compartido producción + demo landing.
 * - Demo embed: sidebar 220px, clases showcase, drawer alineado a `--coord-sidebar-width`.
 * - Slot estrecho: `compactLayout` activa reglas en `landing-profesional.css`.
 */
export function useCoordinadorPanelLayout(embedDemo = false) {
  const { compactLayout, compactNative } = useShowcaseSlotLayout();

  const sidebarWidthPx = embedDemo ? COORD_SIDEBAR_WIDTH_EMBED : COORD_SIDEBAR_WIDTH_PROD;

  return {
    embedDemo,
    compactLayout,
    compactNative,
    sidebarWidthPx,
    shellStyle: { '--coord-sidebar-width': `${sidebarWidthPx}px` } as CSSProperties,
    mainMarginClass: embedDemo
      ? compactLayout
        ? 'ml-0 pb-20 min-h-0'
        : 'ml-[var(--coord-sidebar-width,220px)] pb-14 min-h-0'
      : 'lg:ml-[var(--coord-sidebar-width,260px)] pb-20 lg:pb-0',
    pagePaddingClass: compactLayout ? 'p-4 sm:p-5' : 'p-6 lg:p-8',
    analisisRootClass: embedDemo
      ? `showcase-coord-analisis-root${compactLayout ? ' showcase-compact-layout' : ''}`
      : undefined,
    dashboardRootClass: embedDemo
      ? `showcase-coord-dashboard-root${compactLayout ? ' showcase-compact-layout' : ''}`
      : undefined,
    estudiantesRootClass: embedDemo
      ? `showcase-coord-estudiantes-root${compactLayout ? ' showcase-compact-layout' : ''}`
      : undefined,
    respuestasRootClass: embedDemo
      ? `showcase-coord-respuestas-root${compactLayout ? ' showcase-compact-layout' : ''}`
      : undefined,
    comparativaRootClass: embedDemo
      ? `showcase-coord-comparativa-root${compactLayout ? ' showcase-compact-layout' : ''}`
      : undefined,
    historicoRootClass: embedDemo
      ? `showcase-coord-historico-root${compactLayout ? ' showcase-compact-layout' : ''}`
      : undefined,
    pensumRootClass: embedDemo
      ? `showcase-coord-pensum-root${compactLayout ? ' showcase-compact-layout' : ''}`
      : undefined,
    desempenoRootClass: embedDemo
      ? `showcase-coord-desempeno-root${compactLayout ? ' showcase-compact-layout' : ''}`
      : undefined,
    drawerInsetClass: embedDemo
      ? 'left-[var(--coord-sidebar-width,220px)]'
      : 'max-lg:inset-0 lg:left-[var(--coord-sidebar-width,260px)]',
  };
}
