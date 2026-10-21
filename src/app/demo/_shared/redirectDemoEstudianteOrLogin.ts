import { redirect } from 'next/navigation';
import { DEMO_ESTUDIANTE_BASE } from './demoRoutePaths';

/** Redirect canónico a demo estudiante (login desactivado en fork experimental). */
export function redirectDemoEstudianteOrLogin(subpath?: string): never {
  const path = subpath ? `${DEMO_ESTUDIANTE_BASE}/${subpath}` : DEMO_ESTUDIANTE_BASE;
  redirect(path);
}
