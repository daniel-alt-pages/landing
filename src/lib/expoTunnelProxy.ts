/**
 * El túnel entra por Next (:3010) y reescribe /login y /api hacia Expo (:8081).
 * El navegador manda Origin del host público. Expo solo acepta localhost y
 * responde 500 HTML. El cliente lo muestra como «no se pudo conectar».
 * Next es el proxy: Expo debe ver la petición como local, sin ese Origin.
 */

const EXPO_PROXY_PREFIXES = ['/login', '/api', '/__katex'];

export function isExpoDevProxyPath(pathname: string, platform: string | null): boolean {
  if (platform === 'web') return true;
  const path = pathname || '/';
  return EXPO_PROXY_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function headersForExpoProxy(source: Headers): Headers {
  const headers = new Headers(source);
  headers.delete('origin');
  return headers;
}
