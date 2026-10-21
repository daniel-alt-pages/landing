/** Sesión demo `/demo/coordinador` — solo tras enlace con token AES válido. */

export const DEMO_COORD_ACCESS_SESSION_KEY = 'demo_coord_access_granted_v1';

export function isDemoCoordinadorAccessGranted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(DEMO_COORD_ACCESS_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function grantDemoCoordinadorAccess(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(DEMO_COORD_ACCESS_SESSION_KEY, '1');
  } catch {
    /* ignore quota / private mode */
  }
}

export function revokeDemoCoordinadorAccess(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(DEMO_COORD_ACCESS_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
