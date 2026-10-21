import { STREAK_MULTIPLIER_DAY_THRESHOLD } from '../../../lib/courseAttendancePoints';

/** Días en los que sube el color de la llama (50 = tier máximo). */
export const STREAK_FLAME_MILESTONES = [5, 10, 20, 30, 40, 50] as const;

export type StreakTier = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Nivel visual de la llama según días de racha perfecta. */
export function streakTier(dayStreak: number): StreakTier {
  if (dayStreak <= 0) return 0;
  let tier = 1;
  for (const milestone of STREAK_FLAME_MILESTONES) {
    if (dayStreak >= milestone) tier += 1;
    else break;
  }
  return Math.min(tier, 7) as StreakTier;
}

export function streakTierFlameClass(tier: StreakTier, dark: boolean): string {
  switch (tier) {
    case 0:
      return dark ? 'text-cyan-200/75' : 'text-cyan-600';
    case 1:
      return dark ? 'text-amber-300' : 'text-amber-500';
    case 2:
      return dark ? 'text-amber-400' : 'text-amber-600';
    case 3:
      return dark ? 'text-orange-400' : 'text-orange-500';
    case 4:
      return dark ? 'text-orange-500' : 'text-orange-600';
    case 5:
      return dark
        ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.45)]'
        : 'text-orange-600 drop-shadow-[0_0_4px_rgba(249,115,22,0.35)]';
    case 6:
      return dark
        ? 'text-rose-400 drop-shadow-[0_0_9px_rgba(244,63,94,0.4)]'
        : 'text-rose-600 drop-shadow-[0_0_6px_rgba(244,63,94,0.35)]';
    case 7:
      return dark ? 'text-violet-300' : 'text-[var(--course-accent)]';
    default:
      return dark ? 'text-white/35' : 'text-[var(--course-text-muted)]';
  }
}

export function streakTierBorderClass(tier: StreakTier, dark: boolean): string {
  switch (tier) {
    case 0:
      return dark
        ? 'border-cyan-200/30 shadow-[0_0_0_1px_rgba(125,211,252,0.12)]'
        : 'border-cyan-200/85 shadow-sm shadow-cyan-100/70';
    case 1:
      return dark ? 'border-amber-400/55' : 'border-amber-400/70';
    case 2:
      return dark ? 'border-amber-400/60' : 'border-amber-500/75';
    case 3:
      return dark ? 'border-orange-400/60' : 'border-orange-400/75';
    case 4:
      return dark ? 'border-orange-400/65' : 'border-orange-500/80';
    case 5:
      return dark
        ? 'border-orange-500/70 shadow-[0_0_0_1px_rgba(249,115,22,0.25)]'
        : 'border-orange-500/80 shadow-sm shadow-orange-200/50';
    case 6:
      return dark
        ? 'border-rose-400/70 shadow-[0_0_0_1px_rgba(244,63,94,0.25)]'
        : 'border-rose-500/75 shadow-sm shadow-rose-200/45';
    case 7:
      return dark
        ? 'border-violet-400/65 shadow-[0_0_0_1px_rgba(139,92,246,0.3)]'
        : 'border-[var(--course-accent)]/70 shadow-sm shadow-violet-200/60';
    default:
      return dark ? 'border-white/12' : 'border-[var(--course-border)]';
  }
}

export function streakTierBadgeSurfaceClass(tier: StreakTier, dark: boolean): string {
  switch (tier) {
    case 0:
      return dark
        ? 'bg-cyan-300/10 text-cyan-100 ring-1 ring-cyan-200/20'
        : 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200/70';
    case 1:
      return dark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700';
    case 2:
      return dark ? 'bg-amber-500/22 text-amber-300' : 'bg-amber-100 text-amber-800';
    case 3:
      return dark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700';
    case 4:
      return dark ? 'bg-orange-500/22 text-orange-300' : 'bg-orange-100 text-orange-800';
    case 5:
      return dark ? 'bg-orange-500/25 text-orange-300' : 'bg-orange-100 text-orange-800';
    case 6:
      return dark ? 'bg-rose-500/22 text-rose-300' : 'bg-rose-100 text-rose-800';
    case 7:
      return dark ? 'bg-violet-500/25 text-violet-200' : 'bg-[var(--course-accent)]/12 text-[var(--course-accent)]';
    default:
      return dark ? 'bg-white/8 text-white/40' : 'bg-[var(--course-surface-muted)]';
  }
}

/** Clases visuales para el SVG de racha (opacity, sombra, tinte por tier). */
export function streakTierSvgVisualClass(tier: StreakTier, dark: boolean): string {
  switch (tier) {
    case 0:
      return dark
        ? 'opacity-80 hue-rotate-[180deg] saturate-150 brightness-125 drop-shadow-[0_0_8px_rgba(125,211,252,0.45)]'
        : 'opacity-85 hue-rotate-[185deg] saturate-140 brightness-110 drop-shadow-[0_0_6px_rgba(14,165,233,0.25)]';
    case 1:
      return 'opacity-95';
    case 2:
      return dark ? 'saturate-110 hue-rotate-[6deg]' : 'saturate-105 hue-rotate-[5deg]';
    case 3:
      return dark ? 'saturate-115 hue-rotate-[12deg]' : 'saturate-110 hue-rotate-[10deg]';
    case 4:
      return dark
        ? 'drop-shadow-[0_0_6px_rgba(249,115,22,0.45)] saturate-120 hue-rotate-[18deg]'
        : 'drop-shadow-[0_0_4px_rgba(249,115,22,0.35)] saturate-115 hue-rotate-[15deg]';
    case 5:
      return dark
        ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.55)] saturate-125 hue-rotate-[24deg]'
        : 'drop-shadow-[0_0_6px_rgba(249,115,22,0.45)] saturate-120 hue-rotate-[20deg]';
    case 6:
      return dark
        ? 'drop-shadow-[0_0_9px_rgba(244,63,94,0.5)] hue-rotate-[15deg] saturate-130'
        : 'drop-shadow-[0_0_7px_rgba(244,63,94,0.4)] hue-rotate-[10deg] saturate-125';
    case 7:
      return dark
        ? 'drop-shadow-[0_0_10px_rgba(167,139,250,0.55)] hue-rotate-[210deg]'
        : 'drop-shadow-[0_0_8px_rgba(124,58,237,0.35)] hue-rotate-[200deg] saturate-125';
    default:
      return dark ? 'opacity-35 grayscale' : 'opacity-40 grayscale';
  }
}

/** Pill del número en badge pequeño (ranking). */
export function streakTierBadgeNumberClass(tier: StreakTier, dark: boolean): string {
  const base =
    'min-w-[1.125rem] rounded-full px-1 py-0.5 text-center font-black tabular-nums leading-none shadow-sm ring-1';
  switch (tier) {
    case 0:
      return `${base} ${
        dark
          ? 'bg-cyan-200/18 text-cyan-50 ring-cyan-100/25 shadow-cyan-200/20'
          : 'bg-white text-cyan-700 ring-cyan-200/80 shadow-cyan-100/80'
      }`;
    case 1:
      return `${base} bg-amber-600 text-white ring-amber-300/60 shadow-amber-500/40`;
    case 2:
      return `${base} bg-amber-600 text-white ring-amber-200/65 shadow-amber-500/42`;
    case 3:
      return `${base} bg-orange-600 text-white ring-orange-300/60 shadow-orange-500/45`;
    case 4:
      return `${base} bg-orange-600 text-white ring-orange-300/65 shadow-orange-500/48`;
    case 5:
      return `${base} bg-orange-600 text-white ring-orange-200/70 shadow-md shadow-orange-500/50`;
    case 6:
      return `${base} bg-rose-600 text-white ring-rose-300/65 shadow-md shadow-rose-500/45`;
    case 7:
      return `${base} ${
        dark
          ? 'bg-violet-600 text-white ring-violet-300/60 shadow-violet-500/45'
          : 'bg-[var(--course-accent)] text-white ring-violet-200/70 shadow-md shadow-violet-500/35'
      }`;
    default:
      return base;
  }
}

/** Número grande (WeeklyStreakCard). */
export function streakTierDisplayNumberClass(tier: StreakTier, dark: boolean): string {
  switch (tier) {
    case 0:
      return dark
        ? 'text-cyan-100 drop-shadow-[0_2px_14px_rgba(125,211,252,0.35)]'
        : 'bg-gradient-to-b from-cyan-500 to-sky-700 bg-clip-text text-transparent drop-shadow-sm';
    case 1:
      return dark
        ? 'text-amber-300 drop-shadow-[0_2px_12px_rgba(251,191,36,0.45)]'
        : 'bg-gradient-to-b from-amber-500 to-orange-600 bg-clip-text text-transparent drop-shadow-sm';
    case 2:
      return dark
        ? 'text-amber-400 drop-shadow-[0_2px_13px_rgba(251,191,36,0.48)]'
        : 'bg-gradient-to-b from-amber-500 to-orange-600 bg-clip-text text-transparent drop-shadow-sm';
    case 3:
      return dark
        ? 'text-orange-400 drop-shadow-[0_2px_14px_rgba(249,115,22,0.5)]'
        : 'bg-gradient-to-b from-orange-500 to-orange-700 bg-clip-text text-transparent drop-shadow-sm';
    case 4:
      return dark
        ? 'text-orange-500 drop-shadow-[0_2px_15px_rgba(249,115,22,0.52)]'
        : 'bg-gradient-to-b from-orange-500 to-orange-700 bg-clip-text text-transparent drop-shadow-md';
    case 5:
      return dark
        ? 'text-orange-500 drop-shadow-[0_2px_16px_rgba(249,115,22,0.55)]'
        : 'bg-gradient-to-b from-orange-500 to-red-600 bg-clip-text text-transparent drop-shadow-md';
    case 6:
      return dark
        ? 'text-rose-400 drop-shadow-[0_2px_16px_rgba(244,63,94,0.52)]'
        : 'bg-gradient-to-b from-rose-500 to-orange-600 bg-clip-text text-transparent drop-shadow-md';
    case 7:
      return dark
        ? 'text-violet-300 drop-shadow-[0_2px_16px_rgba(167,139,250,0.55)]'
        : 'bg-gradient-to-b from-violet-500 to-[var(--course-accent)] bg-clip-text text-transparent drop-shadow-md';
    default:
      return dark ? 'text-white/40' : 'text-[var(--course-text-muted)]';
  }
}

export function streakTierHeroFlameClass(tier: StreakTier): string {
  switch (tier) {
    case 0:
      return 'text-cyan-100';
    case 1:
      return 'text-amber-300';
    case 2:
      return 'text-amber-300';
    case 3:
      return 'text-orange-300';
    case 4:
      return 'text-orange-300';
    case 5:
      return 'text-orange-400';
    case 6:
      return 'text-rose-300';
    case 7:
      return 'text-violet-200';
    default:
      return 'text-white/50';
  }
}

export function streakContextMessage(
  dayStreak: number,
  todayPending: boolean,
): string {
  if (dayStreak >= STREAK_MULTIPLIER_DAY_THRESHOLD) {
    return '¡Multiplicador 2× activo! Cada minuto en vivo vale doble mientras mantengas la racha.';
  }
  if (dayStreak > 0 && todayPending) {
    return `Asiste hoy para extender tu racha de ${dayStreak} día${dayStreak === 1 ? '' : 's'}.`;
  }
  if (dayStreak > 0) {
    const remaining = STREAK_MULTIPLIER_DAY_THRESHOLD - dayStreak;
    return `Estás a ${remaining} día${remaining === 1 ? '' : 's'} del multiplicador 2× en puntos.`;
  }
  return 'Asiste hoy mínimo 1 h por clase para iniciar tu racha.';
}
