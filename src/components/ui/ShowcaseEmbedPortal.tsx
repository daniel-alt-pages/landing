'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useShowcaseEmbed } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/context/ShowcaseEmbedProvider';

/**
 * Portal al overlay del stage showcase (centro del contenedor 16:9).
 * Fuera del embed → `document.body`.
 */
export function ShowcaseEmbedPortal({ children }: { children: ReactNode }) {
  const embed = useShowcaseEmbed();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const target =
    embed.active && embed.overlayRootEl ? embed.overlayRootEl : document.body;

  return createPortal(children, target);
}
