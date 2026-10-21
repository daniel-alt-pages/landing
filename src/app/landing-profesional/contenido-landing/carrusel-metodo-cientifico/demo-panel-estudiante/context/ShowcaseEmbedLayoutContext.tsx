'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  measureShowcaseEmbedLayout,
  measureShowcaseEmbedLayoutSplit,
  type ShowcaseEmbedLayout,
  type ShowcaseScaleMode,
} from '../viewport/measure-embed-layout';
import {
  SHOWCASE_DASHBOARD_LOGICAL_HEIGHT,
  SHOWCASE_FRAME_HEIGHT,
  SHOWCASE_FRAME_WIDTH,
} from '../viewport/showcaseViewport';

const defaultLayout: ShowcaseEmbedLayout = {
  scale: 0,
  scaleX: 0,
  scaleY: 0,
  stageWidth: 0,
  stageHeight: 0,
  clipHeight: SHOWCASE_FRAME_HEIGHT,
  clipWidth: SHOWCASE_FRAME_WIDTH,
  logicalContentHeight: SHOWCASE_DASHBOARD_LOGICAL_HEIGHT,
  maxPan: 0,
  version: 0,
};

type LayoutCtx = {
  layout: ShowcaseEmbedLayout;
  publishLayout: (
    stage: HTMLElement,
    scaler: HTMLElement,
    dashboard: HTMLElement | null,
    scaleMode: ShowcaseScaleMode,
    probe?: HTMLElement | null,
  ) => void;
};

const ShowcaseEmbedLayoutContext = createContext<LayoutCtx | null>(null);

export function ShowcaseEmbedLayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState(defaultLayout);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const publishLayout = useCallback(
    (
      stage: HTMLElement,
      scaler: HTMLElement,
      dashboard: HTMLElement | null,
      scaleMode: ShowcaseScaleMode,
      probe?: HTMLElement | null,
    ) => {
      const next =
        probe instanceof HTMLElement
          ? measureShowcaseEmbedLayoutSplit(stage, scaler, dashboard, probe)
          : measureShowcaseEmbedLayout(stage, scaler, dashboard, scaleMode);
      if (next.scale <= 0.02) return;

      const prev = layoutRef.current;
      const isFirst = prev.version === 0;
      const scaleDelta = Math.abs(next.scale - prev.scale);
      const sizeDelta =
        Math.abs(next.stageWidth - prev.stageWidth) +
        Math.abs(next.stageHeight - prev.stageHeight);
      const logicalDelta = Math.abs(next.logicalContentHeight - prev.logicalContentHeight);

      const isSplitProbe = probe instanceof HTMLElement;
      if (
        !isFirst &&
        scaleDelta < 0.008 &&
        (!isSplitProbe || sizeDelta < 2) &&
        logicalDelta < 80
      ) {
        return;
      }

      layoutRef.current = next;
      setLayout(next);
    },
    [],
  );

  const value = useMemo(() => ({ layout, publishLayout }), [layout, publishLayout]);

  return (
    <ShowcaseEmbedLayoutContext.Provider value={value}>{children}</ShowcaseEmbedLayoutContext.Provider>
  );
}

export function useShowcaseEmbedLayout() {
  const ctx = useContext(ShowcaseEmbedLayoutContext);
  return ctx?.layout ?? defaultLayout;
}

export function usePublishShowcaseEmbedLayout() {
  const ctx = useContext(ShowcaseEmbedLayoutContext);
  return ctx?.publishLayout ?? (() => {});
}
