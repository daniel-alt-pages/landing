'use client';

import { memo, useContext, useEffect, useRef, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import { isDemoCoordinadorRoute } from '@/app/demo/_shared/demoRoutePaths';
import { MethodShowcase3DActiveContext } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/carrusel-3d/MethodShowcase3DCarousel';
import { ShowcaseEmbedScaler } from '../../demo-panel-estudiante/components/ShowcaseEmbedScaler';
import { useCoordEmbed, CoordEmbedProvider } from '../context/CoordEmbedProvider';
import { useCoordTabAutoCycle } from '../hooks/useCoordTabAutoCycle';
import { ShowcaseCoordinadorShell } from '../shell/ShowcaseCoordinadorShell';
import { useShowcaseTourPhaseOptional } from '../../context/ShowcaseTourPhaseContext';
import {
  ShowcaseSlotLayoutProvider,
  useObservedShowcaseSlotRef,
  useShowcaseSlotLayout,
} from '../../demo-panel-estudiante/context/ShowcaseSlotLayoutContext';
import type { ShowcaseTourSectionMeta } from '../../demo-panel-estudiante/tour/tour-config';
import type { CoordTab } from '../tour/tour-config';
import { PlatformCoordTabNavigator } from './PlatformCoordTabNavigator';
import { ShowcaseCoordMobileNav } from './ShowcaseCoordMobileNav';

const ShowcaseCoordinadorShellMemo = memo(ShowcaseCoordinadorShell);

type CoordPanelBrowseDemoProps = {
  className?: string;
  interactive?: boolean;
  platformCoordTab?: CoordTab | null;
  fillViewport?: boolean;
};

export function CoordPanelBrowseDemo({
  className = '',
  interactive = false,
  platformCoordTab = null,
  fillViewport = false,
}: CoordPanelBrowseDemoProps) {
  const pathname = usePathname();
  const maskDocumentIds = isDemoCoordinadorRoute(pathname);

  return (
    <CoordEmbedProvider maskDocumentIds={maskDocumentIds}>
      <CoordPanelBrowseDemoInner
        className={className}
        interactive={interactive}
        platformCoordTab={platformCoordTab}
        fillViewport={fillViewport}
      />
    </CoordEmbedProvider>
  );
}

function CoordPanelBrowseDemoInner({
  className = '',
  interactive = false,
  platformCoordTab = null,
  fillViewport = false,
}: CoordPanelBrowseDemoProps) {
  const { slotRef, slotWidth } = useObservedShowcaseSlotRef();

  return (
    <ShowcaseSlotLayoutProvider slotWidth={slotWidth} active>
      <CoordPanelBrowseDemoSlot
        slotRef={slotRef}
        className={className}
        interactive={interactive}
        platformCoordTab={platformCoordTab}
        fillViewport={fillViewport}
      />
    </ShowcaseSlotLayoutProvider>
  );
}

function CoordPanelBrowseDemoSlot({
  slotRef,
  className = '',
  interactive = false,
  platformCoordTab = null,
  fillViewport = false,
}: CoordPanelBrowseDemoProps & {
  slotRef: (node: HTMLDivElement | null) => void;
}) {
  const tourFromCarousel = Boolean(useContext(MethodShowcase3DActiveContext));
  const tourActive = tourFromCarousel && !interactive;
  const contentRef = useRef<HTMLDivElement>(null);
  const { phase } = useCoordTabAutoCycle({ isActive: tourActive });
  const setTourPhase = useShowcaseTourPhaseOptional()?.setTourPhase;
  const { activeTab } = useCoordEmbed();
  const lastSyncedPhaseIdRef = useRef<string | null>(null);
  const { compactLayout, compactNative, compactTabletZoom } = useShowcaseSlotLayout();
  const scalerMode = fillViewport || compactNative ? 'fluid-native' : 'fluid-scale';

  useEffect(() => {
    if (!setTourPhase) return;

    const syncId = phase ? `coord:${phase.id}` : null;
    if (lastSyncedPhaseIdRef.current === syncId) return;
    lastSyncedPhaseIdRef.current = syncId;

    if (!phase) {
      setTourPhase(null);
      return;
    }

    setTourPhase({
      id: `coord:${phase.id}`,
      kind: phase.kind === 'hold' ? 'hold' : phase.kind === 'reset' ? 'reset' : 'tail',
      title: phase.title,
      description: phase.description,
      tab: null,
    });
  }, [phase, setTourPhase]);

  return (
    <div
      ref={slotRef}
      className={`landing-showcase-student-slot landing-showcase-coord-slot ${fillViewport ? 'landing-showcase-student-slot--fill' : ''} ${className}`.trim()}
      data-no-carousel-drag
      data-showcase-autoscroll={tourActive ? 'on' : 'off'}
      data-showcase-interactive={interactive ? 'on' : 'off'}
      data-showcase-compact-layout={compactLayout ? 'on' : 'off'}
      data-showcase-compact-native={compactNative ? 'on' : 'off'}
      data-showcase-scaler-mode={scalerMode}
      data-showcase-compact-zoom={compactTabletZoom > 1 ? String(compactTabletZoom) : undefined}
      data-showcase-coord-active-tab={activeTab}
      style={
        compactTabletZoom > 1
          ? ({ '--showcase-compact-zoom': String(compactTabletZoom) } as CSSProperties)
          : undefined
      }
      onWheel={tourActive ? (e) => e.stopPropagation() : undefined}
      onTouchMove={tourActive ? (e) => e.stopPropagation() : undefined}
    >
      <div
        className={`showcase-embed-stage showcase-embed-stage--fluid ${fillViewport ? 'showcase-embed-stage--fill' : 'showcase-embed-stage--native-scroll'}`}
      >
        {platformCoordTab ? <PlatformCoordTabNavigator tab={platformCoordTab} /> : null}
        <div className="showcase-embed-scroll-viewport showcase-embed-scroll-viewport--native-scroll">
          <div className="showcase-embed-scroll-sizer">
            <ShowcaseEmbedScaler contentRef={contentRef} mode={scalerMode} interactive={interactive}>
              <ShowcaseCoordinadorShellMemo interactive={interactive} />
            </ShowcaseEmbedScaler>
          </div>
        </div>
        {compactLayout ? <ShowcaseCoordMobileNav /> : null}
      </div>
    </div>
  );
}
