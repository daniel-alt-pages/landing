'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCoordEmbed } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-coordinador/context/CoordEmbedProvider';
import { isDemoCoordinadorRoute, parseDemoCoordinadorTab } from './demoRoutePaths';

/** Aplica la pestaña desde la URL al embed (la URL se actualiza en los controles de navegación). */
export function DemoCoordRouteSync() {
  const pathname = usePathname();
  const { setActiveTab } = useCoordEmbed();

  useEffect(() => {
    if (!isDemoCoordinadorRoute(pathname)) return;
    setActiveTab(parseDemoCoordinadorTab(pathname));
  }, [pathname, setActiveTab]);

  return null;
}
