'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useShowcaseEmbed } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/context/ShowcaseEmbedProvider';
import type { ShowcaseDashboardTab } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/types/showcase.types';
import {
  demoEstudiantePath,
  isDemoEstudianteNavBlocked,
  isDemoEstudianteRoute,
  parseDemoEstudianteNavId,
  showcaseTabFromDemoNavId,
} from './demoRoutePaths';

function openShowcaseTab(
  openDashboard: () => void,
  openMetricas: () => void,
  openRespuestas: (materia?: string | null) => void,
  openRanking: () => void,
  openPerfil: () => void,
  tab: ShowcaseDashboardTab,
) {
  if (tab === 'dashboard') openDashboard();
  else if (tab === 'metricas') openMetricas();
  else if (tab === 'respuestas') openRespuestas();
  else if (tab === 'ranking') openRanking();
  else if (tab === 'perfil') openPerfil();
}

/** Aplica la pestaña desde la URL al embed (la URL se actualiza en la barra móvil y navegación interna). */
export function DemoStudentRouteSync() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeTab, openDashboard, openMetricas, openRespuestas, openRanking, openPerfil } =
    useShowcaseEmbed();

  useEffect(() => {
    if (!isDemoEstudianteRoute(pathname)) return;
    const navId = parseDemoEstudianteNavId(pathname ?? '');
    if (isDemoEstudianteNavBlocked(navId)) {
      router.replace(demoEstudiantePath('dashboard'));
      return;
    }
    const tab = showcaseTabFromDemoNavId(navId);
    if (tab === activeTab) return;
    openShowcaseTab(openDashboard, openMetricas, openRespuestas, openRanking, openPerfil, tab);
  }, [
    pathname,
    activeTab,
    openDashboard,
    openMetricas,
    openRespuestas,
    openRanking,
    openPerfil,
    router,
  ]);

  return null;
}
