import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { DEMO_COORDINADOR_DATA_OPTIONS } from '@features/coordinador/hooks/coordinadorDataOptions';
import {
  DEMO_COORDINADOR_BASE,
  DEMO_ESTUDIANTE_BASE,
  isDemoCoordinadorRoute,
  isDemoEstudianteRoute,
} from '@/app/demo/_shared/demoRoutePaths';
import { revokeDemoCoordinadorAccess } from '@/app/demo/_shared/demoCoordinadorAccess';

export const DEMO_ESTUDIANTE_HOME = DEMO_ESTUDIANTE_BASE;
export const DEMO_COORDINADOR_HOME = DEMO_COORDINADOR_BASE;

export function isDemoEstudianteSubRoute(pathname: string | null): boolean {
  if (!pathname || !isDemoEstudianteRoute(pathname)) return false;
  return pathname !== DEMO_ESTUDIANTE_HOME;
}

export function isDemoCoordinadorSubRoute(pathname: string | null): boolean {
  if (!pathname || !isDemoCoordinadorRoute(pathname)) return false;
  return pathname !== DEMO_COORDINADOR_HOME && pathname !== `${DEMO_COORDINADOR_HOME}/`;
}

export function exitDemoEstudianteSession(router: AppRouterInstance): void {
  try {
    sessionStorage.removeItem('demo_mode');
    sessionStorage.removeItem('demo_student_bootstrapped');
    sessionStorage.removeItem('welcome_shown');
  } catch {
    /* private mode */
  }
  localStorage.removeItem('student_id');
  localStorage.removeItem('student_name');
  localStorage.removeItem('student_data');
  localStorage.removeItem('simulacro_selected');
  router.replace('/login');
}

export function exitDemoCoordinadorSession(router: AppRouterInstance): void {
  revokeDemoCoordinadorAccess();
  const keys = DEMO_COORDINADOR_DATA_OPTIONS.storageKeys!;
  try {
    sessionStorage.removeItem('demo_mode');
  } catch {
    /* private mode */
  }
  localStorage.removeItem(keys.institution);
  localStorage.removeItem(keys.selectedInstitution);
  localStorage.removeItem(keys.selectedSimulation);
  localStorage.removeItem('coordinator_institution');
  localStorage.removeItem('coordinator_email');
  localStorage.removeItem('coordinator_selected_institution');
  localStorage.removeItem('coordinator_selected_simulation');
  router.replace('/login');
}
