import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { headersForExpoProxy, isExpoDevProxyPath } from './lib/expoTunnelProxy';

/**
 * Post-parity gate (ADR-00011 / Ola 6).
 * Producto canónico = Expo :8081 + local-api.
 * Next :3010 = landing + referencia visual.
 *
 * Set NEXT_PUBLIC_REPORTS_OPERATIONAL=1 only to browse legacy SG report routes locally.
 */
const OPERATIONAL_PREFIXES = [
  '/estudiante',
  '/coordinador',
  '/admin-panel',
  '/admin',
  '/demo',
  '/acceso-demo',
  '/d/c',
  '/debug-dashboard',
];

function isOperationalPath(pathname: string): boolean {
  return OPERATIONAL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const operational =
    process.env.NEXT_PUBLIC_REPORTS_OPERATIONAL === '1' ||
    process.env.REPORTS_OPERATIONAL === '1';

  if (!operational && isOperationalPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/landing-profesional';
    url.searchParams.set('ref', 'reports-retired');
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if (process.env.NODE_ENV === 'development' && isExpoDevProxyPath(pathname, request.nextUrl.searchParams.get('platform'))) {
    return NextResponse.next({
      request: { headers: headersForExpoProxy(request.headers) },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/estudiante/:path*',
    '/coordinador/:path*',
    '/admin-panel/:path*',
    '/admin/:path*',
    '/demo/:path*',
    '/acceso-demo/:path*',
    '/d/c/:path*',
    '/debug-dashboard/:path*',
    '/login',
    '/login/:path*',
    '/api/:path*',
    '/__katex',
    '/__katex/:path*',
    '/((?!_next|landing).*)',
  ],
};
