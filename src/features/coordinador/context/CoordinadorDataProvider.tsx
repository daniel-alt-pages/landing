'use client';

import { createContext, useContext, type ReactNode } from 'react';
import {
  DEFAULT_COORDINADOR_DATA_OPTIONS,
  type CoordinadorDataOptions,
} from '@features/coordinador/hooks/coordinadorDataOptions';
import { useCoordinadorData, type CoordinadorData } from '@features/coordinador/hooks/useCoordinadorData';

const CoordinadorDataContext = createContext<CoordinadorData | null>(null);

export function CoordinadorDataProvider({
  children,
  options,
}: {
  children: ReactNode;
  options?: CoordinadorDataOptions;
}) {
  const value = useCoordinadorData({ ...DEFAULT_COORDINADOR_DATA_OPTIONS, ...options });
  return (
    <CoordinadorDataContext.Provider value={value}>{children}</CoordinadorDataContext.Provider>
  );
}

/** Hook estable entre pestañas del panel demo (misma instancia que el provider). */
export function useCoordinadorDataFromContext(): CoordinadorData {
  const ctx = useContext(CoordinadorDataContext);
  if (!ctx) {
    throw new Error('useCoordinadorDataFromContext requiere <CoordinadorDataProvider>.');
  }
  return ctx;
}
