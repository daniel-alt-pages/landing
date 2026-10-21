'use client';

import type { ReactNode, RefObject } from 'react';
import { SHOWCASE_FRAME_WIDTH } from '../viewport/showcaseViewport';

type ShowcaseEmbedScalerProps = {
  contentRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  /**
   * `fluid-scale`: marco 1280px + scale CSS (desktop / slot ancho).
   * `fluid-native`: ancho 100% del slot, sin scale (móvil compacto).
   * `scaled`: carrusel legacy.
   */
  mode?: 'fluid-scale' | 'fluid-native' | 'scaled';
  /** Clics reales del visitante (#plataforma pantalla completa). */
  interactive?: boolean;
};

/**
 * Contenedor del panel embebido.
 * `fluid-native` = responsivo real; `fluid-scale` = miniatura 1280 escalada.
 */
export function ShowcaseEmbedScaler({
  contentRef,
  children,
  mode = 'fluid-scale',
  interactive = false,
}: ShowcaseEmbedScalerProps) {
  const pointerClass = interactive ? 'pointer-events-auto select-text' : 'pointer-events-none select-none';
  if (mode === 'scaled') {
    return (
      <div
        ref={contentRef}
        className={`showcase-embed-scaler showcase-embed-scaler--scaled ${pointerClass}`}
        style={{ width: SHOWCASE_FRAME_WIDTH }}
      >
        {children}
      </div>
    );
  }

  const isNative = mode === 'fluid-native';

  return (
    <div
      ref={contentRef}
      className={
        isNative
          ? `showcase-embed-scaler showcase-embed-scaler--compact-native ${pointerClass}`
          : `showcase-embed-scaler showcase-embed-scaler--fluid ${pointerClass}`
      }
      style={{ width: isNative ? '100%' : SHOWCASE_FRAME_WIDTH }}
    >
      {children}
    </div>
  );
}
