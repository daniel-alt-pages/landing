export const CONTACTO = {
  // Oficial con WhatsApp: +57 305 299 0900 (confirmado por Daniel, 21-oct-2026).
  whatsappB2B: '573052990900',
  telefonoB2BVisible: '+57 305 299 0900',
  telefonoB2BAlterno: '+57 304 235 9048',
  whatsappEstudiantes: '573008871908',
  whatsappEstudiantesVisible: '+57 300 887 1908',
  canalWhatsApp: '',
  bookingUrl: process.env.NEXT_PUBLIC_ALIANZA_BOOKING_URL ?? '',
  leadsUrl: process.env.NEXT_PUBLIC_ALIANZA_LEADS_URL ?? '',
  ga4Id: process.env.NEXT_PUBLIC_GA4_ID ?? '',
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '',
  web: 'https://seamosgenios.org',
  redes: {
    instagram: 'https://www.instagram.com/seamosgenios/',
    instagramHandle: '@seamosgenios',
    tiktok: 'https://www.tiktok.com/@seamosgenios',
    tiktokHandle: '@seamosgenios',
    facebook: 'https://www.facebook.com/SeamosGeniosCO',
    facebookHandle: 'SeamosGeniosCO',
  },
  confirmar:
    'Confirmar si 304 235 9048 sigue activo o se retira, la URL del canal de WhatsApp y que cada handle corresponde a esa red.',
} as const;

const LOCAL_APP_LOGIN = 'http://localhost:8081/login';
const APP_DEV_PORT = '8081';
const LANDING_DEV_PORT = '3010';
/** App pública. El sitio de la alianza (Vercel) no tiene /login: lo redirige a la landing. */
const PUBLIC_APP_ORIGIN = 'https://app.seamosgenios.org';

/** Hosts que sirven solo la landing (alianza.seamosgenios.org, previews de Vercel). */
function isLandingOnlyHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === 'app.seamosgenios.org') return false;
  return host === 'seamosgenios.org' || host.endsWith('.seamosgenios.org') || host.endsWith('.vercel.app');
}

function isLoopback(hostname: string) {
  const host = hostname.toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
}

/** IP de red (Wi-Fi, Ethernet, VPN privada). No es el loopback del teléfono. */
function isPrivateLanHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (host.endsWith('.local')) return true;
  const parts = host.split('.');
  if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part))) return false;
  const [a, b] = parts.map(Number);
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

/** Vacío en un sitio público: Chrome pide permiso si la página llama a 127.0.0.1. */
export function programasUrl(
  pageHost = typeof window === 'undefined' ? '' : window.location.hostname,
  apiBase = process.env.NEXT_PUBLIC_EDUGENIOS_API_URL || 'http://127.0.0.1:5000',
) {
  const base = apiBase.trim().replace(/\/$/, '');
  if (!base) return '';
  try {
    if (isLoopback(new URL(base).hostname) && !isLoopback(pageHost)) return '';
  } catch {
    return '';
  }
  return `${base}/api/programas`;
}

export function tiendaLandingUrl(
  pageHost = typeof window === 'undefined' ? '' : window.location.hostname,
  apiBase = process.env.NEXT_PUBLIC_EDUGENIOS_API_URL || 'http://127.0.0.1:5000',
) {
  const programas = programasUrl(pageHost, apiBase);
  return programas ? programas.replace(/\/api\/programas$/, '/api/tienda/landing') : '';
}

function isTunnelHost(hostname: string) {
  return /(\.|^)(trycloudflare\.com|ngrok-free\.app|ngrok\.io|ngrok\.app|exp\.direct)$/.test(hostname);
}

function configuredProductOrigin() {
  const raw = (process.env.NEXT_PUBLIC_EDUGENIOS_WEB_ORIGIN || '').trim().replace(/\/$/, '');
  if (!raw) return '';
  try {
    return new URL(raw).origin;
  } catch {
    return '';
  }
}

/**
 * Login de la app EduGenios (Expo), no del hosting de reportes.
 * El host es el de la página: localhost, 127.0.0.1, la IP de la red o el servidor.
 * Un NEXT_PUBLIC_EDUGENIOS_WEB_ORIGIN de localhost no pisa una visita por IP.
 * En alianza.seamosgenios.org (o un preview de Vercel) va a https://app.seamosgenios.org/login.
 * La landing de desarrollo (:3010) abre la app en el mismo host, puerto 8081.
 */
export function platformLoginUrl(pageHost = '') {
  const loc = typeof globalThis.window !== 'undefined' ? globalThis.window.location : null;
  const host = (pageHost || loc?.hostname || '').toLowerCase();
  if (isLandingOnlyHost(host)) return `${PUBLIC_APP_ORIGIN}/login`;

  const configured = configuredProductOrigin();
  if (configured) {
    try {
      const cfgHost = new URL(configured).hostname.toLowerCase();
      const sameHost = !host || cfgHost === host;
      const loopbackPinOnLan = isLoopback(cfgHost) && host && !isLoopback(host);
      if (sameHost && !loopbackPinOnLan) return `${configured}/login`;
    } catch {
      /* origen mal formado: se resuelve con el host de la página */
    }
  }

  if (isTunnelHost(host)) {
    const origin = loc && loc.hostname.toLowerCase() === host ? loc.origin : `https://${host}`;
    return `${origin.replace(/\/$/, '')}/login`;
  }

  const onThisPage = !!loc && (!pageHost || pageHost.toLowerCase() === loc.hostname.toLowerCase());
  if (onThisPage && loc.port === LANDING_DEV_PORT) {
    return `${loc.protocol}//${loc.hostname}:${APP_DEV_PORT}/login`;
  }
  if (onThisPage && loc.port !== LANDING_DEV_PORT) {
    return `${loc.origin}/login`;
  }

  if (isLoopback(host) || isPrivateLanHost(host)) {
    const name = host === '::1' || host === '[::1]' ? 'localhost' : host;
    return `http://${name}:${APP_DEV_PORT}/login`;
  }
  if (host) return `https://${host}/login`;
  return LOCAL_APP_LOGIN;
}

/** Origen de la app EduGenios (Expo), el mismo criterio que el login. */
export function platformAppUrl(pageHost = '') {
  return platformLoginUrl(pageHost).replace(/\/login\/?$/, '') || 'http://localhost:8081';
}
