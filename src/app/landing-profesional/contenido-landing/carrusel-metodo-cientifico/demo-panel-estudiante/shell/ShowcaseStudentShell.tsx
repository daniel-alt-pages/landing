'use client';

import PreviewEstudianteAnalisis from '@/app/landing-profesional/preview-paneles/estudiante/analisis';
import PreviewEstudianteDashboard from '@/app/landing-profesional/preview-paneles/estudiante/dashboard';
import PreviewEstudianteEstadisticas from '@/app/landing-profesional/preview-paneles/estudiante/estadisticas';
import PreviewEstudiantePerfil from '@/app/landing-profesional/preview-paneles/estudiante/perfil';
import PreviewEstudianteRanking from '@/app/landing-profesional/preview-paneles/estudiante/ranking';
import PreviewEstudianteSelector from '@/app/landing-profesional/preview-paneles/estudiante/selector';
import { SHOWCASE_DASHBOARD_CLASS } from '../constants/dom-ids';
import { useShowcaseSlotLayout } from '../context/ShowcaseSlotLayoutContext';
import { useShowcaseEmbed } from '../context/ShowcaseEmbedProvider';
import { SHOWCASE_FRAME_WIDTH } from '../viewport/showcaseViewport';

function frameStyle(compactNative: boolean): { width: number | string; minHeight: string } {
  return {
    width: compactNative ? '100%' : SHOWCASE_FRAME_WIDTH,
    minHeight: 'min-content',
  };
}

/**
 * Marco del panel estudiante embebido en el showcase.
 *
 * Renderiza copias aisladas (`preview-paneles/estudiante/*`) en lugar de las
 * páginas reales `/app/estudiante/*` para evitar exponer auth o Firestore.
 */
type ShowcaseStudentShellProps = {
  interactive?: boolean;
};

export function ShowcaseStudentShell({ interactive = false }: ShowcaseStudentShellProps) {
  const { activeScreen, activeTab, activeSim } = useShowcaseEmbed();
  const { compactLayout, compactNative, slotWidth } = useShowcaseSlotLayout();
  const scoreHeroMinimal =
    compactNative || (compactLayout && slotWidth > 0 && slotWidth <= 620);
  const selectClass = interactive ? 'select-text' : 'select-none';

  if (activeScreen === 'selector') {
    return (
      <div
        className={`${SHOWCASE_DASHBOARD_CLASS} showcase-real-app-frame showcase-real-app-frame--fluid relative ${selectClass} overflow-visible border border-white/10 bg-[#07080d] shadow-2xl`}
        style={frameStyle(false)}
      >
        <PreviewEstudianteSelector />
      </div>
    );
  }

  const page =
    activeTab === 'metricas' ? (
      <PreviewEstudianteEstadisticas />
    ) : activeTab === 'respuestas' ? (
      <PreviewEstudianteAnalisis />
    ) : activeTab === 'ranking' ? (
      <PreviewEstudianteRanking />
    ) : activeTab === 'perfil' ? (
      <PreviewEstudiantePerfil />
    ) : (
      <PreviewEstudianteDashboard />
    );

  return (
    <div
      className={`${SHOWCASE_DASHBOARD_CLASS} showcase-real-app-frame showcase-real-app-frame--fluid relative flex min-h-0 flex-col ${selectClass} overflow-visible border border-slate-200/80 bg-slate-50 shadow-2xl ${compactLayout ? 'showcase-compact-layout' : ''}`}
      style={frameStyle(compactNative)}
      key={`${activeTab}-${activeSim}-${compactNative ? 'native' : 'scale'}`}
      data-showcase-compact-layout={compactLayout ? 'on' : 'off'}
      data-showcase-compact-native={compactNative ? 'on' : 'off'}
      data-showcase-score-hero-minimal={scoreHeroMinimal ? 'on' : undefined}
      data-showcase-interactive={interactive ? 'on' : 'off'}
    >
      <div className="showcase-student-shell__page min-h-0 min-w-0 flex-1">{page}</div>
    </div>
  );
}
