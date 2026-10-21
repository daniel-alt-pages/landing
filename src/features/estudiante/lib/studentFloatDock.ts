/**
 * Dock fijo inferior para pills del panel estudiante (PIFA + ¿Cómo se calcula?).
 * Ambos portalean aquí → layout adaptable sin pelear posiciones fixed.
 */
export const STUDENT_FLOAT_DOCK_ID = 'sg-student-float-dock';

const DOCK_CLASS = [
  'fixed z-[96] pointer-events-none',
  'inset-x-0 px-3',
  /* Móvil: sobre nav inferior — PIFA izq / score der (ml-auto en score) */
  'bottom-[calc(var(--recordings-area-nav-lift,0px)+4.5rem+env(safe-area-inset-bottom,0px)+0.35rem)]',
  'flex flex-row flex-wrap items-end gap-2',
  'justify-start',
  /* Desktop: esquina inferior derecha */
  'lg:inset-x-auto lg:left-auto lg:right-6 lg:bottom-6',
  'lg:w-auto lg:max-w-[min(calc(100vw-3rem),36rem)] lg:justify-end',
].join(' ');

/** Crea (una vez) el dock en body. Idempotente. */
export function ensureStudentFloatDock(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  let el = document.getElementById(STUDENT_FLOAT_DOCK_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = STUDENT_FLOAT_DOCK_ID;
    el.setAttribute('data-student-float-dock', '');
    el.className = DOCK_CLASS;
    document.body.appendChild(el);
  }
  return el;
}
