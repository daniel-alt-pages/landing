'use client';

import { usePathname, useRouter } from 'next/navigation';
import StudentMobileNav from '@/components/StudentMobileNav';
import {
  demoEstudiantePath,
  demoNavIdFromShowcaseTab,
  isDemoEstudianteRoute,
} from '@/app/demo/_shared/demoRoutePaths';
import { showcaseDomIds } from '../constants/dom-ids';
import { useShowcaseEmbed } from '../context/ShowcaseEmbedProvider';
import { studentNavIdFromTab, studentTabFromNavId } from '../student-embed-navigation';

const NAV_ORDER = ['dashboard', 'estadisticas', 'analisis', 'ranking', 'perfil'] as const;

const NAV_BUTTON_IDS: Record<(typeof NAV_ORDER)[number], string> = {
  dashboard: showcaseDomIds.navDashboard,
  estadisticas: showcaseDomIds.navMetricas,
  analisis: showcaseDomIds.navRespuestas,
  ranking: showcaseDomIds.navRanking,
  perfil: showcaseDomIds.navPerfil,
};

/** Barra inferior de producción (`stn-bar`) en el panel estudiante embebido. */
export function ShowcaseStudentMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const ctx = useShowcaseEmbed();
  const activeNavId = studentNavIdFromTab(ctx.activeTab);
  const activeIndex = Math.max(0, NAV_ORDER.indexOf(activeNavId as (typeof NAV_ORDER)[number]));

  const onNavigate = (navId: string) => {
    const tab = studentTabFromNavId(navId);
    if (tab === 'dashboard') ctx.openDashboard();
    else if (tab === 'metricas') ctx.openMetricas();
    else if (tab === 'respuestas') ctx.openRespuestas();
    else if (tab === 'ranking') ctx.openRanking();
    else if (tab === 'perfil') ctx.openPerfil();
    if (isDemoEstudianteRoute(pathname)) {
      router.replace(demoEstudiantePath(navId));
    }
  };

  return (
    <StudentMobileNav
      embed={{
        activeIndex,
        onNavigate,
        buttonId: (id) => NAV_BUTTON_IDS[id as (typeof NAV_ORDER)[number]],
        anchored: true,
      }}
    />
  );
}
