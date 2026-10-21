'use client';

import { createContext, useContext, type ReactNode } from 'react';

const ShowcaseTourHighlightContext = createContext<string | null>(null);

export function ShowcaseTourHighlightProvider({
  highlightId,
  children,
}: {
  highlightId: string | null;
  children: ReactNode;
}) {
  return (
    <ShowcaseTourHighlightContext.Provider value={highlightId}>
      {children}
    </ShowcaseTourHighlightContext.Provider>
  );
}

export function useShowcaseTourHighlight() {
  return useContext(ShowcaseTourHighlightContext);
}
