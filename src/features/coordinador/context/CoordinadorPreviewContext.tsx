'use client';

import { createContext, type ReactNode, useContext } from 'react';
import type { CoordinadorData } from '@features/coordinador/hooks/useCoordinadorData';

/** Cuando está definido, `useCoordinadorData()` devuelve estos datos (cotización / embed sin Firestore). */
export const CoordinadorPreviewContext = createContext<CoordinadorData | undefined>(undefined);

export function useCoordinadorPreviewInjected(): CoordinadorData | undefined {
  return useContext(CoordinadorPreviewContext);
}

export function CoordinadorPreviewProvider({
  value,
  children,
}: {
  value: CoordinadorData;
  children: ReactNode;
}) {
  return <CoordinadorPreviewContext.Provider value={value}>{children}</CoordinadorPreviewContext.Provider>;
}
