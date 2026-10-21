'use client';

import { MethodShowcase3DActiveContext } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/carrusel-3d/MethodShowcase3DCarousel';
import { memo, useCallback, useContext, useEffect, useRef, type CSSProperties } from 'react';
import { useShowcaseTourPhaseOptional } from '../../context/ShowcaseTourPhaseContext';
import { SHOWCASE_EMBEDDED } from '../data/embedded-student';
import { ShowcaseEmbedProvider, useShowcaseEmbed } from '../context/ShowcaseEmbedProvider';
import {
  ShowcaseSlotLayoutProvider,
  useObservedShowcaseSlotRef,
  useShowcaseSlotLayout,
} from '../context/ShowcaseSlotLayoutContext';
import { ShowcaseTourHighlightProvider } from '../context/ShowcaseTourHighlightContext';
import { useShowcaseAutoScroll, SHOWCASE_SCROLL_CYCLE_MS } from '../hooks/useShowcaseAutoScroll';
import { ShowcaseEmbedScaler } from './ShowcaseEmbedScaler';
import { ShowcaseStudentDashboard } from './ShowcaseStudentDashboard';
import { ShowcaseVirtualCursor } from './ShowcaseVirtualCursor';
import { PlatformStoryNavigator } from './PlatformStoryNavigator';
import { ShowcaseStudentMobileNav } from './ShowcaseStudentMobileNav';

const ShowcaseStudentDashboardMemo = memo(ShowcaseStudentDashboard);

type StudentPanelBrowseDemoProps = {
  className?: string;
  /** Sin tour autoclic: el visitante usa el panel con clics reales. */
  interactive?: boolean;
  /** Vista inicial al abrir desde #plataforma. */
  platformStoryIndex?: number | null;
  /** Ocupa todo el alto del contenedor (overlay pantalla completa). */
  fillViewport?: boolean;
};

export function StudentPanelBrowseDemo({
  className = '',
  interactive = false,
  platformStoryIndex = null,
  fillViewport = false,
}: StudentPanelBrowseDemoProps) {
  return (
    <ShowcaseEmbedProvider embedded={SHOWCASE_EMBEDDED}>
      <StudentPanelBrowseDemoInner
        className={className}
        interactive={interactive}
        platformStoryIndex={platformStoryIndex}
        fillViewport={fillViewport}
      />
    </ShowcaseEmbedProvider>
  );
}

function StudentPanelBrowseDemoInner({
  className = '',
  interactive = false,
  platformStoryIndex = null,
  fillViewport = false,
}: StudentPanelBrowseDemoProps) {
  const { slotRef, slotWidth } = useObservedShowcaseSlotRef();

  return (
    <ShowcaseSlotLayoutProvider slotWidth={slotWidth}>
      <StudentPanelBrowseDemoSlot
        slotRef={slotRef}
        className={className}
        interactive={interactive}
        platformStoryIndex={platformStoryIndex}
        fillViewport={fillViewport}
      />
    </ShowcaseSlotLayoutProvider>
  );
}

function StudentPanelBrowseDemoSlot({
  slotRef,
  className = '',
  interactive = false,
  platformStoryIndex = null,
  fillViewport = false,
}: StudentPanelBrowseDemoProps & {
  slotRef: (node: HTMLDivElement | null) => void;
}) {
  const tourFromCarousel = Boolean(useContext(MethodShowcase3DActiveContext));
  const tourActive = tourFromCarousel && !interactive;
  const { registerOverlayRoot, registerScrollViewport } = useShowcaseEmbed();
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollSizerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const setOverlayRef = useCallback(
    (node: HTMLDivElement | null) => {
      registerOverlayRoot(node);
    },
    [registerOverlayRoot],
  );

  const setScrollViewportRef = useCallback(
    (node: HTMLDivElement | null) => {
      stageRef.current = node;
      registerScrollViewport(node);
    },
    [registerScrollViewport],
  );

  const { compactLayout, compactNative, compactTabletZoom } = useShowcaseSlotLayout();
  const scalerMode =
    fillViewport || compactNative ? 'fluid-native' : 'fluid-scale';
  const { highlightId, tourPhase } = useShowcaseAutoScroll({
    isActive: tourActive,
    stageRef,
    scrollSizerRef,
    contentRef,
    cursorRef,
    compactTour: compactNative,
  });
  const setTourPhase = useShowcaseTourPhaseOptional()?.setTourPhase;
  const lastSyncedTourPhaseIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!setTourPhase) return;
    const syncId = tourPhase?.id ?? null;
    if (lastSyncedTourPhaseIdRef.current === syncId) return;
    lastSyncedTourPhaseIdRef.current = syncId;
    setTourPhase(tourPhase);
  }, [tourPhase, setTourPhase]);

  return (
    <ShowcaseTourHighlightProvider highlightId={tourActive ? highlightId : null}>
      <div
        ref={slotRef}
        className={`landing-showcase-student-slot ${fillViewport ? 'landing-showcase-student-slot--fill' : ''} ${className}`.trim()}
        data-no-carousel-drag
        data-showcase-autoscroll={tourActive ? 'on' : 'off'}
        data-showcase-interactive={interactive ? 'on' : 'off'}
        data-showcase-compact-layout={compactLayout ? 'on' : 'off'}
        data-showcase-compact-native={compactNative ? 'on' : 'off'}
        data-showcase-scaler-mode={scalerMode}
        data-showcase-compact-zoom={compactTabletZoom > 1 ? String(compactTabletZoom) : undefined}
        style={
          compactTabletZoom > 1
            ? ({ '--showcase-compact-zoom': String(compactTabletZoom) } as CSSProperties)
            : undefined
        }
      >
        <div
          className={`showcase-embed-stage showcase-embed-stage--fluid ${fillViewport ? 'showcase-embed-stage--fill' : 'showcase-embed-stage--framed'}`}
        >
          {platformStoryIndex != null ? (
            <PlatformStoryNavigator storyIndex={platformStoryIndex} />
          ) : null}
          <div
            ref={setScrollViewportRef}
            className="showcase-embed-scroll-viewport showcase-embed-scroll-viewport--native-scroll"
            data-showcase-scroll-viewport
          >
            <div ref={scrollSizerRef} className="showcase-embed-scroll-sizer">
              <ShowcaseEmbedScaler contentRef={contentRef} mode={scalerMode} interactive={interactive}>
                <ShowcaseStudentDashboardMemo interactive={interactive} />
              </ShowcaseEmbedScaler>
            </div>
          </div>
          <div
            ref={setOverlayRef}
            className="showcase-embed-overlay-root"
            data-showcase-overlay-root
          />
          {tourActive ? <ShowcaseVirtualCursor cursorRef={cursorRef} /> : null}
          {compactLayout || interactive ? <ShowcaseStudentMobileNav /> : null}
        </div>
      </div>
    </ShowcaseTourHighlightProvider>
  );
}

export const SHOWCASE_PANEL_DEMO_MS = SHOWCASE_SCROLL_CYCLE_MS;
