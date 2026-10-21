'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import DevToolsGuard from '@/components/DevToolsGuard';
import StudentMobileNav from '@/components/StudentMobileNav';
import { ShowcaseEmbedProvider } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/context/ShowcaseEmbedProvider';
import { SHOWCASE_EMBEDDED } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/data/embedded-student';
import { PREVIEW_STUDENT_APELLIDOS, PREVIEW_STUDENT_ID, PREVIEW_STUDENT_NOMBRES } from '@/app/landing-profesional/preview-paneles/_data/seeds/constants';
import { DemoStudentRouteSync } from '@/app/demo/_shared/DemoStudentRouteSync';
import { demoEstudiantePath, parseDemoEstudianteNavId } from '@/app/demo/_shared/demoRoutePaths';
import { bootstrapDemoStudentSession } from '@features/simulacro/lib/studentDemoAwareService';

const NAV_IDS = ['dashboard', 'estadisticas', 'analisis', 'ranking', 'perfil'] as const;

export default function DemoEstudianteClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    bootstrapDemoStudentSession(
      PREVIEW_STUDENT_ID,
      `${PREVIEW_STUDENT_NOMBRES} ${PREVIEW_STUDENT_APELLIDOS}`.trim(),
    );
  }, []);

  const navId = parseDemoEstudianteNavId(pathname ?? '');
  const activeIndex = Math.max(0, NAV_IDS.indexOf(navId as (typeof NAV_IDS)[number]));

  return (
    <ShowcaseEmbedProvider embedded={SHOWCASE_EMBEDDED}>
      <DemoStudentRouteSync />
      <DevToolsGuard />
      <div className="min-h-screen bg-slate-50" data-demo-student-shell>
        {children}
      </div>
      <StudentMobileNav
        embed={{
          activeIndex,
          onNavigate: (id) => router.push(demoEstudiantePath(id)),
        }}
      />
    </ShowcaseEmbedProvider>
  );
}
