const RECOVERY_PREFIX = 'sg-panel-recovery:';

export function panelRecoveryKey(pathname: string): string {
  return `${RECOVERY_PREFIX}${pathname || '/'}`;
}

export function hasPanelRecoveryAttempted(pathname: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(panelRecoveryKey(pathname)) === '1';
  } catch {
    return false;
  }
}

export function markPanelRecoveryAttempted(pathname: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(panelRecoveryKey(pathname), '1');
  } catch {
    /* ignore */
  }
}

export function clearPanelRecoveryForPath(pathname: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(panelRecoveryKey(pathname));
  } catch {
    /* ignore */
  }
}

/** Indicadores de pantalla bloqueada (loading boundary Next o spinners internos marcados). */
export function isPanelLikelyStuck(): boolean {
  if (typeof document === 'undefined') return false;

  if (document.querySelector('[data-sg-route-loading="true"]')) return true;

  return Boolean(document.querySelector('[data-sg-panel-stuck="true"]'));
}
