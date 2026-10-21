export const LEGAL_SLUGS = Object.freeze([
  'terminos',
  'privacidad',
  'cookies',
  'reembolsos',
  'acceso',
  'contacto',
]);

export const LEGAL_ALIASES = Object.freeze({
  'privacy-policy': 'privacidad',
  'politica-de-privacidad': 'privacidad',
  'cookie-policy': 'cookies',
  'politica-de-cookies': 'cookies',
  'refund-policy': 'reembolsos',
  'politica-de-reembolso': 'reembolsos',
  'politica-de-reembolsos': 'reembolsos',
  'terms-of-service': 'terminos',
  'terminos-del-servicio': 'terminos',
  'terminos-y-condiciones': 'terminos',
  'shipping-policy': 'acceso',
  envio: 'acceso',
  'politica-de-envio': 'acceso',
  'contact-information': 'contacto',
  'informacion-de-contacto': 'contacto',
});

const PREFIXES = ['/legal', '/politicas', '/policies'];

export function resolveLegalSlug(raw) {
  const key = String(raw || '').trim().toLowerCase();
  if (!key) return '';
  if (LEGAL_SLUGS.includes(key)) return key;
  return LEGAL_ALIASES[key] || '';
}

export function buildLegalPath(slug) {
  const id = resolveLegalSlug(slug);
  return id ? `/legal/${id}` : '/legal';
}

/**
 * @param {string} [pathname]
 * @returns {{ slug: string, path: string } | null}
 */
export function parseLegalPath(pathname) {
  let path = String(pathname || '').toLowerCase();
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  for (const prefix of PREFIXES) {
    if (path === prefix) return { slug: '', path: '/legal' };
    if (path.startsWith(`${prefix}/`)) {
      const raw = path.slice(prefix.length + 1).split('/')[0];
      const slug = resolveLegalSlug(raw);
      return { slug, path: slug ? `/legal/${slug}` : '/legal' };
    }
  }
  return null;
}
