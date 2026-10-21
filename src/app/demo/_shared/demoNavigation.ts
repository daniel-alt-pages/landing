import {
  DEMO_COORDINADOR_BASE,
  DEMO_ESTUDIANTE_BASE,
  demoCoordinadorPath,
  demoEstudiantePath,
  isDemoCoordinadorRoute,
  isDemoEstudianteRoute,
} from './demoRoutePaths';

const STUDENT_PROD_BASE = '/estudiante';
const COORD_PROD_BASE = '/coordinador';

/** Convierte ruta productiva estudiante → demo (p. ej. `/estudiante/dashboard` → `/demo/estudiante/dashboard`). */
export function toDemoEstudiantePath(prodPath: string): string {
  if (prodPath.startsWith(DEMO_ESTUDIANTE_BASE)) return prodPath;
  if (!prodPath.startsWith(STUDENT_PROD_BASE)) return prodPath;
  const suffix = prodPath.slice(STUDENT_PROD_BASE.length) || '';
  if (suffix === '' || suffix === '/') return DEMO_ESTUDIANTE_BASE;
  const navId = suffix.replace(/^\//, '').split('/')[0];
  return demoEstudiantePath(navId);
}

/** Convierte ruta productiva coordinador → demo. */
export function toDemoCoordinadorPath(prodPath: string): string {
  if (prodPath.startsWith(DEMO_COORDINADOR_BASE)) return prodPath;
  if (!prodPath.startsWith(COORD_PROD_BASE)) return prodPath;
  const suffix = prodPath.slice(COORD_PROD_BASE.length).replace(/^\//, '');
  if (!suffix) return DEMO_COORDINADOR_BASE;
  const tab = suffix.split('/')[0];
  return demoCoordinadorPath(tab as Parameters<typeof demoCoordinadorPath>[0]);
}

/** Resuelve href interno según contexto demo o producción. */
export function resolveStudentPanelPath(prodPath: string, pathname: string | null): string {
  return isDemoEstudianteRoute(pathname) ? toDemoEstudiantePath(prodPath) : prodPath;
}

export function resolveCoordinatorPanelPath(prodPath: string, pathname: string | null): string {
  return isDemoCoordinadorRoute(pathname) ? toDemoCoordinadorPath(prodPath) : prodPath;
}

export { isDemoEstudianteRoute, isDemoCoordinadorRoute };
