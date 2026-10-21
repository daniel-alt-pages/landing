/** Clase contenedor para que `--course-*` resuelva claro/oscuro fuera del árbol `.course-panel` (portales). */
export function courseThemeScopeClass(dark: boolean): string {
  return dark ? 'course-panel isolate dark' : 'course-panel isolate';
}
