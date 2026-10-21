'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  SHOWCASE_COMPACT_MOBILE_ZOOM,
  SHOWCASE_COMPACT_NATIVE_RESPONSIVE,
  SHOWCASE_MOBILE_COMPACT_LAYOUT_ENABLED,
} from '../constants/showcase-feature-flags';
import { useShowcaseEmbed } from './ShowcaseEmbedProvider';
import { resolveShowcaseMobileZoom } from '../viewport/resolve-mobile-zoom';
import {
  SHOWCASE_EMBED_MOBILE_MAX_WIDTH,
  SHOWCASE_EMBED_TABLET_MAX_WIDTH,
} from '../viewport/showcaseViewport';

export type ShowcaseSlotLayoutValue = {
  slotWidth: number;
  compactLayout: boolean;
  compactNative: boolean;
  compactTabletZoom: number;
};

const ShowcaseSlotLayoutContext = createContext<ShowcaseSlotLayoutValue | null>(null);

function useViewportNarrow(active: boolean): boolean {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    if (!SHOWCASE_MOBILE_COMPACT_LAYOUT_ENABLED || !active) {
      setNarrow(false);
      return undefined;
    }

    const mq = window.matchMedia(
      `(max-width: ${SHOWCASE_EMBED_TABLET_MAX_WIDTH}px)`,
    );
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [active]);

  return narrow;
}

/**
 * Layout nativo + zoom CSS solo móvil (≤639px).
 * Tablet/desktop (p. ej. 971px en split) → panel 16:9 `fluid-scale`, sin zoom.
 */
function isShowcaseMobileNativeSlot(slotWidth: number): boolean {
  const w = slotWidth > 0 ? slotWidth : 0;
  return w > 0 && w <= SHOWCASE_EMBED_MOBILE_MAX_WIDTH;
}

/** Mide el ancho real del slot (container), no solo el viewport. */
export function useObservedShowcaseSlotRef() {
  const roRef = useRef<ResizeObserver | null>(null);
  const [slotWidth, setSlotWidth] = useState(0);

  const slotRef = useCallback((node: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    roRef.current = null;
    if (!node) {
      setSlotWidth(0);
      return;
    }
    const sync = () => {
      const w = node.getBoundingClientRect().width;
      if (w > 0) setSlotWidth(w);
    };
    sync();
    const ro = new ResizeObserver(() => sync());
    ro.observe(node);
    roRef.current = ro;
  }, []);

  useEffect(() => () => roRef.current?.disconnect(), []);

  return { slotRef, slotWidth };
}

function computeSlotLayout(
  slotWidth: number,
  viewportNarrow: boolean,
  active: boolean,
): ShowcaseSlotLayoutValue {
  const effectiveWidth =
    slotWidth > 0 ? slotWidth : viewportNarrow ? SHOWCASE_EMBED_TABLET_MAX_WIDTH : 1280;

  const compactLayout =
    SHOWCASE_MOBILE_COMPACT_LAYOUT_ENABLED &&
    active &&
    effectiveWidth <= SHOWCASE_EMBED_TABLET_MAX_WIDTH;

  const mobileNative = isShowcaseMobileNativeSlot(effectiveWidth);

  /** Nativo + zoom solo ≤639px; tablet (640–1023) y desktop usan 16:9 escalado. */
  const compactNative =
    compactLayout && SHOWCASE_COMPACT_NATIVE_RESPONSIVE && mobileNative;

  const compactTabletZoom = compactNative
    ? resolveShowcaseMobileZoom(effectiveWidth)
    : 1;

  return {
    slotWidth: effectiveWidth,
    compactLayout,
    compactNative,
    compactTabletZoom,
  };
}

export function ShowcaseSlotLayoutProvider({
  slotWidth,
  children,
  active: activeOverride,
}: {
  slotWidth: number;
  children: ReactNode;
  active?: boolean;
}) {
  const { active } = useShowcaseEmbed();
  const layoutActive = activeOverride ?? active;
  const viewportNarrow = useViewportNarrow(layoutActive);

  const value = useMemo(
    () => computeSlotLayout(slotWidth, viewportNarrow, layoutActive),
    [layoutActive, slotWidth, viewportNarrow],
  );

  return (
    <ShowcaseSlotLayoutContext.Provider value={value}>
      {children}
    </ShowcaseSlotLayoutContext.Provider>
  );
}

export function useShowcaseSlotLayout(): ShowcaseSlotLayoutValue {
  const ctx = useContext(ShowcaseSlotLayoutContext);
  if (!ctx) {
    return {
      slotWidth: 0,
      compactLayout: false,
      compactNative: false,
      compactTabletZoom: 1,
    };
  }
  return ctx;
}

export function useShowcaseCompactLayout(): boolean {
  return useShowcaseSlotLayout().compactLayout;
}

export function useShowcaseCompactNativeResponsive(): boolean {
  return useShowcaseSlotLayout().compactNative;
}

export function useShowcaseCompactTabletZoom(): number {
  return useShowcaseSlotLayout().compactTabletZoom;
}
