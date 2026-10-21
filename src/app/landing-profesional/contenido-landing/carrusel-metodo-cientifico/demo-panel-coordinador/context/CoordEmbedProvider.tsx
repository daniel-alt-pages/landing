'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { CoordTab } from '../tour/tour-config';

type CoordEmbedValue = {
  /** Demo embebida en landing/login: navegación sin router. */
  embedDemo: boolean;
  /** Solo `/demo/coordinador`: ocultar documentos en UI (no aplica a `/coordinador` prod). */
  maskDocumentIds: boolean;
  activeTab: CoordTab;
  setActiveTab: (tab: CoordTab) => void;
};

const CoordEmbedContext = createContext<CoordEmbedValue>({
  embedDemo: false,
  maskDocumentIds: false,
  activeTab: 'resumen',
  setActiveTab: () => {},
});

export function useCoordEmbed() {
  return useContext(CoordEmbedContext);
}

export function CoordEmbedProvider({
  children,
  maskDocumentIds = false,
}: {
  children: ReactNode;
  /** Activar solo en ruta `/demo/coordinador` (ver CoordPanelBrowseDemo). */
  maskDocumentIds?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<CoordTab>('resumen');

  return (
    <CoordEmbedContext.Provider
      value={{ embedDemo: true, maskDocumentIds, activeTab, setActiveTab }}
    >
      {children}
    </CoordEmbedContext.Provider>
  );
}
