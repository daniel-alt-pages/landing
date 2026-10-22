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

/** Hosts que sirven solo la landing (seamosgenios.org, previews de Vercel, GitHub Pages). */
function isLandingOnlyHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === 'app.seamosgenios.org') return false;
  return (
    host === 'seamosgenios.org' ||
    host.endsWith('.seamosgenios.org') ||
    host.endsWith('.vercel.app') ||
    // GitHub Pages (daniel-alt-pages.github.io/landing) no tiene /login.
    host.endsWith('.github.io')
  );
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
 * Login de la plataforma (Daniel, 21-oct-2026): siempre https://app.seamosgenios.org/login,
 * en cualquier host (también en local). La landing pública es seamosgenios.org.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function platformLoginUrl(_pageHost = '') {
  return `${PUBLIC_APP_ORIGIN}/login`;
}

/** Origen de la app EduGenios (Expo), el mismo criterio que el login. */
export function platformAppUrl(pageHost = '') {
  return platformLoginUrl(pageHost).replace(/\/login\/?$/, '');
}
