import { isDeployedClientBuild } from '@/lib/deploy-env';

/** Pantalla completa tipo F11 para demos / presentaciones. */

export function isPresentationFocusActive(): boolean {
  if (typeof document === 'undefined') return false;
  return Boolean(document.fullscreenElement);
}

export async function enterPresentationFocus(
  target: HTMLElement = document.documentElement,
): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  if (document.fullscreenElement) return true;

  const request =
    target.requestFullscreen?.bind(target) ??
    (target as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> })
      .webkitRequestFullscreen?.bind(target);

  if (!request) return false;

  try {
    await request();
    return Boolean(document.fullscreenElement);
  } catch {
    return false;
  }
}

export async function exitPresentationFocus(): Promise<void> {
  if (typeof document === 'undefined' || !document.fullscreenElement) return;
  try {
    await document.exitFullscreen();
  } catch {
    /* ignore */
  }
}

/** Rutas de login/activación: nunca auto-fullscreen (evita popup OAuth). */
const LOGIN_FLOW_ROUTE_PREFIXES = [
  '/login',
  '/acceso',
  '/activar-estudiante',
] as const;

/** Paneles reales: no se fuerza pantalla completa. Deben abrir directo a resultados. */
export const AUTO_PRESENTATION_FOCUS_PANEL_ROUTES = [] as const;

const PRESENTATION_ROUTE_PREFIXES = [
  '/demo',
  '/d/c',
  '/acceso-demo',
  '/landing-profesional',
] as const;

export const PANEL_PRESENTATION_FOCUS_EVENT = 'sg-panel-presentation-focus';

const PANEL_FOCUS_PENDING_KEY = 'sg-panel-presentation-focus-pending';
const PANEL_FOCUS_DISABLED_KEY = 'sg-panel-presentation-focus-disabled';

let panelFocusPendingMemory = false;

export function isPanelPresentationFocusDisabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(PANEL_FOCUS_DISABLED_KEY) === '1';
  } catch {
    return false;
  }
}

export function disablePanelPresentationFocus(): void {
  if (typeof window === 'undefined') return;
  clearPanelPresentationFocusPending();
  try {
    localStorage.setItem(PANEL_FOCUS_DISABLED_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function enablePanelPresentationFocus(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PANEL_FOCUS_DISABLED_KEY);
  } catch {
    /* ignore */
  }
}

/** Legacy no-op: el panel ya no fuerza pantalla completa al entrar. */
export function beginPanelPresentationFocusFromGesture(): void {
  clearPanelPresentationFocusPending();
}

/** Legacy no-op: no guardar pendientes que puedan bloquear interacción móvil. */
export function markPanelPresentationFocusPending(): void {
  clearPanelPresentationFocusPending();
}

export function isPanelPresentationFocusPending(): boolean {
  if (panelFocusPendingMemory) return true;
  try {
    return sessionStorage.getItem(PANEL_FOCUS_PENDING_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearPanelPresentationFocusPending(): void {
  panelFocusPendingMemory = false;
  try {
    sessionStorage.removeItem(PANEL_FOCUS_PENDING_KEY);
  } catch {
    /* ignore */
  }
}

/** Legacy no-op: los paneles cargan directamente sin overlay ni tap-to-enter. */
export function requestPanelPresentationFocus(): void {
  clearPanelPresentationFocusPending();
}

export function isLoginFlowRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return LOGIN_FLOW_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isAutoPresentationFocusPanelRoute(pathname: string | null): boolean {
  void pathname;
  return false;
}

/** Alias usado por bootstrap/gate del panel autenticado. */
export function isPanelPresentationRoute(pathname: string | null): boolean {
  return isAutoPresentationFocusPanelRoute(pathname);
}

/** Rutas donde se activa foco presentación sin env extra. */
export function isPresentationFocusRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  if (isLoginFlowRoute(pathname)) return false;
  return PRESENTATION_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function shouldBootstrapPresentationFocus(pathname: string | null): boolean {
  if (isLoginFlowRoute(pathname)) return false;
  if (isPanelPresentationFocusDisabled()) return false;

  const flag = process.env.NEXT_PUBLIC_PRESENTATION_FOCUS?.trim().toLowerCase();
  if (flag === 'false' || flag === '0' || flag === 'off') return false;

  // Panel estudiante/coordinador: sin auto-F11 para no bloquear móviles.
  if (isAutoPresentationFocusPanelRoute(pathname)) return false;

  if (process.env.NODE_ENV !== 'production') return false;
  if (!isDeployedClientBuild) return false;
  if (flag === 'all') return true;
  return isPresentationFocusRoute(pathname);
}
