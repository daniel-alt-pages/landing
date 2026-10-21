'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getLandingAnimationTier,
  getLandingFrameIntervalMs,
  isDocumentHidden,
} from '@/app/landing-profesional/contenido-landing/utilidades/landingAnimationTier';
import { useCoordEmbed } from '../context/CoordEmbedProvider';
import { resolveCoordPhase, SHOWCASE_COORD_PANEL_DEMO_MS } from '../tour/tour-timeline';
import type { CoordTourPhaseMeta } from '../tour/tour-config';

/**
 * Auto-cycle de tabs del coordinador. Reproduce `COORD_TIMELINE` mientras
 * `isActive` esté en true y respeta `prefers-reduced-motion`.
 */
export function useCoordTabAutoCycle({ isActive }: { isActive: boolean }) {
  const { activeTab, setActiveTab } = useCoordEmbed();
  const [phase, setPhase] = useState<CoordTourPhaseMeta | null>(null);
  const lastTabRef = useRef(activeTab);
  const lastPhaseIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isActive) {
      lastPhaseIdRef.current = null;
      setPhase(null);
      return undefined;
    }

    const frameIntervalMs = getLandingFrameIntervalMs(getLandingAnimationTier());
    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let start: number | null = null;
    let lastTickAt = 0;

    const tick = (now: number) => {
      if (isDocumentHidden()) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (lastTickAt > 0 && now - lastTickAt < frameIntervalMs) {
        raf = requestAnimationFrame(tick);
        return;
      }
      lastTickAt = now;

      if (start === null) start = now;
      const elapsed = reducedMotion ? 0 : now - start;
      const nextPhase = resolveCoordPhase(elapsed);
      if (lastPhaseIdRef.current !== nextPhase.id) {
        lastPhaseIdRef.current = nextPhase.id;
        setPhase(nextPhase);
      }
      if (nextPhase.tab !== lastTabRef.current) {
        lastTabRef.current = nextPhase.tab;
        setActiveTab(nextPhase.tab);
      }

      if (!reducedMotion) raf = requestAnimationFrame(tick);
    };

    if (reducedMotion) {
      tick(performance.now());
    } else {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [isActive, setActiveTab]);

  return { phase, cycleMs: SHOWCASE_COORD_PANEL_DEMO_MS };
}
