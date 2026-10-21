/** Cuántas posiciones del ranking se muestran antes de la fila del usuario. */
export const RANKING_TOP_VISIBLE = 15;

/** Formato legible para brecha de puntos (p. ej. minutos con multiplicador). */
export function formatRankingPointsGap(gap: number): string {
  if (Number.isInteger(gap)) return String(gap);
  const rounded = Math.round(gap * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** Tarjeta superior del podio (avatar + puntos). */
export function seguimientoPodiumCardClass(rank: number, dark: boolean): string {
  if (dark) {
    if (rank === 1) return 'border-amber-400/40 bg-amber-500/10 shadow-[0_8px_32px_-8px_rgba(251,191,36,0.35)]';
    if (rank === 2) return 'border-slate-300/35 bg-slate-400/10 shadow-[0_6px_24px_-8px_rgba(148,163,184,0.25)]';
    if (rank === 3) return 'border-orange-400/35 bg-orange-500/10 shadow-[0_6px_24px_-8px_rgba(251,146,60,0.2)]';
    return 'border-[var(--course-border)] bg-[var(--course-surface)]';
  }
  if (rank === 1) return 'border-amber-400/60 bg-white shadow-[0_10px_40px_-12px_rgba(245,158,11,0.45)]';
  if (rank === 2) return 'border-slate-300/80 bg-white shadow-[0_8px_28px_-10px_rgba(100,116,139,0.25)]';
  if (rank === 3) return 'border-orange-300/70 bg-white shadow-[0_8px_28px_-10px_rgba(249,115,22,0.22)]';
  return 'border-[var(--course-border)] bg-[var(--course-surface)]';
}

/** Bloque escalón del podio (debajo del avatar). */
export function seguimientoPodiumStepClass(rank: number, dark: boolean): string {
  if (dark) {
    if (rank === 1)
      return 'from-amber-300 via-amber-500 to-amber-700 text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_20px_-4px_rgba(251,191,36,0.45)]';
    if (rank === 2)
      return 'from-slate-200 via-slate-400 to-slate-600 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_5px_16px_-4px_rgba(148,163,184,0.35)]';
    if (rank === 3)
      return 'from-orange-300 via-orange-500 to-orange-700 text-orange-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_5px_16px_-4px_rgba(249,115,22,0.35)]';
    return 'from-[var(--course-surface-muted)] to-[var(--course-surface)] text-[var(--course-text)]';
  }
  if (rank === 1)
    return 'from-amber-200 via-amber-400 to-amber-600 text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_8px_24px_-6px_rgba(245,158,11,0.5)]';
  if (rank === 2)
    return 'from-slate-200 via-slate-400 to-slate-500 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_6px_20px_-6px_rgba(100,116,139,0.35)]';
  if (rank === 3)
    return 'from-orange-200 via-orange-400 to-orange-600 text-orange-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_20px_-6px_rgba(249,115,22,0.35)]';
  return 'from-[var(--course-surface-muted)] to-[var(--course-border)] text-[var(--course-text)]';
}

export function seguimientoPodiumGlowClass(dark: boolean): string {
  return dark
    ? 'bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(251,191,36,0.22),transparent_70%)]'
    : 'bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(245,158,11,0.18),transparent_70%)]';
}

export function seguimientoTabClass(active: boolean, dark: boolean): string {
  const base = 'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--course-accent)]/50';
  if (active) {
    return `${base} bg-[var(--course-surface)] text-[var(--course-text)] shadow-sm ring-1 ${
      dark ? 'ring-white/15' : 'ring-[var(--course-border-strong,var(--course-border))]'
    }`;
  }
  return `${base} text-[var(--course-text-muted)] hover:bg-[var(--course-surface-muted)]/60 hover:text-[var(--course-text)]`;
}

export function seguimientoStreakIconClass(dark: boolean): string {
  return dark ? 'text-orange-400' : 'text-orange-600';
}

export function seguimientoHeaderAccentClass(dark: boolean): string {
  return dark ? 'text-violet-300' : 'text-violet-700';
}

/** Medalla de puesto — estilo ranking simulacro, adaptado al tema curso. */
export function courseRankingMedalClass(rank: number, dark: boolean): string {
  if (rank === 1) {
    return dark
      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 shadow-amber-500/30'
      : 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow-amber-400/40';
  }
  if (rank === 2) {
    return dark
      ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900'
      : 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800';
  }
  if (rank === 3) {
    return dark
      ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
      : 'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950';
  }
  return dark
    ? 'bg-[var(--course-surface-muted)] text-[var(--course-text-muted)] border border-white/10'
    : 'bg-[var(--course-surface-muted)] text-[var(--course-text-muted)] border border-[var(--course-border)]';
}

export function seguimientoRankingRowClass(isCurrentUser: boolean, dark: boolean): string {
  if (isCurrentUser) {
    return dark
      ? 'border-[var(--course-accent)]/50 bg-[var(--course-accent)]/15 ring-1 ring-[var(--course-accent)]/25'
      : 'border-[var(--course-accent)]/60 bg-[var(--course-accent)]/12 ring-1 ring-[var(--course-accent)]/30';
  }
  return dark
    ? 'border-[var(--course-border)] bg-[var(--course-surface)] hover:bg-[var(--course-surface-muted)]'
    : 'border-[var(--course-border)] bg-[var(--course-surface)] hover:border-[var(--course-border-strong,var(--course-border))] hover:bg-[var(--course-surface-muted)]';
}
