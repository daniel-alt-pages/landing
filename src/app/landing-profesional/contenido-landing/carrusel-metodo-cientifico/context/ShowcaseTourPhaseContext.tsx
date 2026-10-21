'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ShowcaseTourSectionMeta } from '../demo-panel-estudiante/tour/tour-config';

type ShowcaseTourPhaseContextValue = {
  tourPhase: ShowcaseTourSectionMeta | null;
  setTourPhase: (phase: ShowcaseTourSectionMeta | null) => void;
  isTourActive: boolean;
  setTourActive: (active: boolean) => void;
};

const ShowcaseTourPhaseContext = createContext<ShowcaseTourPhaseContextValue | null>(null);

export function ShowcaseTourPhaseProvider({ children }: { children: ReactNode }) {
  const [tourPhase, setTourPhaseState] = useState<ShowcaseTourSectionMeta | null>(null);
  const [isTourActive, setTourActive] = useState(false);

  const setTourPhase = useCallback((next: ShowcaseTourSectionMeta | null) => {
    setTourPhaseState((prev) => {
      if (prev?.id === next?.id && prev?.title === next?.title && prev?.description === next?.description) {
        return prev;
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ tourPhase, setTourPhase, isTourActive, setTourActive }),
    [tourPhase, isTourActive, setTourPhase],
  );

  return (
    <ShowcaseTourPhaseContext.Provider value={value}>{children}</ShowcaseTourPhaseContext.Provider>
  );
}

export function useShowcaseTourPhase() {
  const ctx = useContext(ShowcaseTourPhaseContext);
  if (!ctx) {
    throw new Error('useShowcaseTourPhase debe usarse dentro de ShowcaseTourPhaseProvider');
  }
  return ctx;
}

export function useShowcaseTourPhaseOptional() {
  return useContext(ShowcaseTourPhaseContext);
}
