/** Sincroniza el chrome del documento con la landing (evita flash del tema del resto de la app). */

export const COTIZ_LANDING_THEME_LS_KEY = 'landing-profesional-theme';

export function applyCotizLandingDocumentChrome(tone: 'dark' | 'light') {
  if (typeof document === 'undefined') return;
  const bg = tone === 'light' ? '#f3f4f6' : '#07111f';
  const fg = tone === 'light' ? '#0f172a' : '#fafafa';
  document.documentElement.setAttribute('data-cotiz-landing-active', 'true');
  document.documentElement.style.backgroundColor = bg;
  document.documentElement.style.color = fg;
  const b = document.body;
  if (b) {
    b.style.backgroundColor = bg;
    b.style.color = fg;
  }
}

export function resetCotizLandingDocumentChrome() {
  if (typeof document === 'undefined') return;
  document.documentElement.removeAttribute('data-cotiz-landing-active');
  document.documentElement.style.backgroundColor = '';
  document.documentElement.style.color = '';
  const b = document.body;
  if (b) {
    b.style.backgroundColor = '';
    b.style.color = '';
  }
}
