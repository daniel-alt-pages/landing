import { bootstrapDemoStudentSession } from '@/app/demo/_shared/bootstrapDemoStudentSession';
import { isDemoEstudianteRoute } from '@/app/demo/_shared/demoRoutePaths';
import { bootstrapPreviewStudentSession } from '@/app/landing-profesional/preview-paneles/_shared/bootstrapPreviewStudentSession';
import { isLandingShowcaseContext } from '@/lib/demoDataSource';

/** Siembra sesión mock antes de leer localStorage (landing showcase / demo). */
export function ensureEstudianteSessionBootstrap(pathname?: string | null): void {
  if (typeof window === 'undefined') return;
  if (isLandingShowcaseContext()) {
    bootstrapPreviewStudentSession();
    return;
  }
  const path = pathname ?? window.location.pathname;
  if (isDemoEstudianteRoute(path)) {
    bootstrapDemoStudentSession();
  }
}
