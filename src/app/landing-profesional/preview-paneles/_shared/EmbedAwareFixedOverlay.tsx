'use client';

import type { ReactNode } from 'react';
import { ShowcaseEmbedPortal } from '@/components/ui/ShowcaseEmbedPortal';
import { useShowcaseEmbed } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/context/ShowcaseEmbedProvider';

/**
 * Overlays del preview en showcase: portal al overlay del slot + `absolute`
 * (centro del contenedor). Fuera del embed, `fixed` en viewport.
 */
export function EmbedAwareFixedOverlay({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) {
  const embed = useShowcaseEmbed();
  if (!open) return null;

  const inShowcase = embed.active && Boolean(embed.overlayRootEl);
  const shellClass = inShowcase
    ? 'showcase-embed-fixed-overlay absolute inset-0 z-[1]'
    : 'showcase-embed-fixed-overlay fixed inset-0 z-[100]';

  const shell = <div className={shellClass}>{children}</div>;

  if (inShowcase) {
    return <ShowcaseEmbedPortal>{shell}</ShowcaseEmbedPortal>;
  }

  return shell;
}
