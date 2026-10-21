/** localhost / 127.0.0.1 — features solo dev (Excel export, scoring shadow, etc.). */
export function isLocalDevHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}
