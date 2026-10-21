export const DEMO_RETURN_HREF_KEY = 'demo_return_href';

/** Guarda la URL a la que volver al cerrar la demo (login, landing, etc.). */
export function rememberDemoReturnHref(href: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(DEMO_RETURN_HREF_KEY, href);
}

/** Lee y borra la URL de retorno; si no hay, usa `fallback`. */
export function consumeDemoReturnHref(fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const stored = sessionStorage.getItem(DEMO_RETURN_HREF_KEY);
  sessionStorage.removeItem(DEMO_RETURN_HREF_KEY);
  return stored || fallback;
}

/** Sale de la demo con navegación fiable (export estático + App Router). */
export function navigateAwayFromDemo(target: string): void {
  if (typeof window === 'undefined') return;
  const normalized = target.startsWith('/') ? target : `/${target}`;
  try {
    const path = window.location.pathname;
    if (path === normalized || path === `${normalized}/`) {
      return;
    }
  } catch {
    /* ignore */
  }
  window.location.assign(normalized);
}
