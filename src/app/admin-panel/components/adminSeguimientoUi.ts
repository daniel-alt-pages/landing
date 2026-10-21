import { seguimientoTabClass } from '@features/curso/pages/seguimiento/lib/seguimientoUi';

export { seguimientoTabClass as adminSeguimientoTabClass };

export function adminSeguimientoInputClass(): string {
  return 'w-full rounded-xl border border-[var(--course-border)] bg-[var(--course-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--course-text)] placeholder:text-[var(--course-text-muted)] transition focus:outline-none focus:ring-2 focus:ring-[var(--course-accent)]/40 focus:border-[var(--course-accent)]/30';
}

export function adminSeguimientoSelectClass(): string {
  return 'rounded-xl border border-[var(--course-border)] bg-[var(--course-surface)] px-3 py-2.5 text-sm text-[var(--course-text)] focus:outline-none focus:ring-2 focus:ring-[var(--course-accent)]/40 shrink-0';
}

export function adminSeguimientoPanelClass(): string {
  return 'rounded-2xl border border-[var(--course-border)] bg-[var(--course-surface)]/80 overflow-hidden shadow-sm';
}

export function adminSeguimientoRateClass(rate: number): string {
  if (rate >= 0.8) return 'text-emerald-400';
  if (rate >= 0.5) return 'text-amber-400';
  return 'text-rose-400';
}

export function adminSeguimientoGhostButtonClass(): string {
  return 'inline-flex items-center gap-2 rounded-xl border border-[var(--course-border)] px-3 py-2 text-sm font-medium text-[var(--course-text-muted)] transition hover:bg-[var(--course-surface-muted)]/60 hover:text-[var(--course-text)] disabled:opacity-40';
}

export function adminSeguimientoPrimaryButtonClass(): string {
  return 'inline-flex items-center gap-2 rounded-xl bg-[var(--course-accent)] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40';
}

export function adminSeguimientoIconButtonClass(): string {
  return 'rounded-lg border border-[var(--course-border)] p-2 text-[var(--course-text-muted)] transition hover:bg-[var(--course-surface-muted)]/60 hover:text-[var(--course-text)] disabled:opacity-30 active:scale-95';
}

export function adminSeguimientoRowClass(active = false): string {
  const base =
    'border-t border-[var(--course-border)] transition-all duration-150 cursor-pointer';
  if (active) {
    return `${base} bg-[var(--course-accent)]/12 ring-1 ring-inset ring-[var(--course-accent)]/30`;
  }
  return `${base} hover:bg-[var(--course-surface-muted)]/45 active:bg-[var(--course-surface-muted)]/60`;
}

export function adminSeguimientoTabGroupClass(): string {
  return 'flex flex-wrap gap-1 rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)]/30 p-1';
}

export function adminSeguimientoMenuClass(): string {
  return 'absolute right-0 z-20 mt-1 w-52 rounded-xl border border-[var(--course-border)] bg-[var(--course-surface)] py-1 shadow-xl shadow-black/30';
}

export function adminSeguimientoMenuItemClass(): string {
  return 'block w-full px-3 py-2.5 text-left text-sm text-[var(--course-text-muted)] transition hover:bg-[var(--course-surface-muted)]/60 hover:text-[var(--course-text)]';
}
