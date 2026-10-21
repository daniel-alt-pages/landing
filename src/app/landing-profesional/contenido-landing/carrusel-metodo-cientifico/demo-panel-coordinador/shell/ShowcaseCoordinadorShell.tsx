'use client';

import PreviewCoordinadorDashboard from '@/app/landing-profesional/preview-paneles/coordinador/dashboard';
import PreviewCoordinadorPensum from '@/app/landing-profesional/preview-paneles/coordinador/pensum';
import PreviewCoordinadorDesempeno from '@/app/landing-profesional/preview-paneles/coordinador/desempeno';
import PreviewCoordinadorEstudiantes from '@/app/landing-profesional/preview-paneles/coordinador/estudiantes';
import PreviewCoordinadorAnalisis from '@/app/landing-profesional/preview-paneles/coordinador/analisis';
import PreviewCoordinadorComparativa from '@/app/landing-profesional/preview-paneles/coordinador/comparativa';
import PreviewCoordinadorHistorico from '@/app/landing-profesional/preview-paneles/coordinador/historico';
import PreviewCoordinadorShell from '@/app/landing-profesional/preview-paneles/coordinador/PreviewCoordinadorShell';
import { SHOWCASE_FRAME_WIDTH } from '../../demo-panel-estudiante/viewport/showcaseViewport';
import { useShowcaseSlotLayout } from '../../demo-panel-estudiante/context/ShowcaseSlotLayoutContext';
import { useCoordEmbed } from '../context/CoordEmbedProvider';

/**
 * Marco del panel coordinador embebido en el showcase.
 *
 * Renderiza las copias aisladas (`preview-paneles/coordinador/*`) y elige la
 * subruta según `activeTab`. Cero auth, cero Firestore.
 */
type ShowcaseCoordinadorShellProps = {
  interactive?: boolean;
};

export function ShowcaseCoordinadorShell({ interactive = false }: ShowcaseCoordinadorShellProps) {
  const { activeTab } = useCoordEmbed();
  const { compactNative, compactLayout } = useShowcaseSlotLayout();

  const page =
    activeTab === 'pensum' ? (
      <PreviewCoordinadorPensum />
    ) : activeTab === 'desempeno' ? (
      <PreviewCoordinadorDesempeno />
    ) : activeTab === 'estudiantes' ? (
      <PreviewCoordinadorEstudiantes />
    ) : activeTab === 'analisis' ? (
      <PreviewCoordinadorAnalisis />
    ) : activeTab === 'comparativa' ? (
      <PreviewCoordinadorComparativa />
    ) : activeTab === 'historico' ? (
      <PreviewCoordinadorHistorico />
    ) : (
      <PreviewCoordinadorDashboard />
    );

  return (
    <div
      className={`showcase-real-app-frame showcase-real-app-frame--fluid relative overflow-visible bg-[#07080d] shadow-2xl ${interactive ? 'select-text' : 'select-none'} ${compactLayout ? 'showcase-compact-layout' : ''}`}
      style={{ width: compactNative ? '100%' : SHOWCASE_FRAME_WIDTH, minHeight: 'min-content' }}
      data-showcase-interactive={interactive ? 'on' : 'off'}
    >
      <PreviewCoordinadorShell>{page}</PreviewCoordinadorShell>
    </div>
  );
}
