'use client';

import type { CSSProperties } from 'react';
import { Zap } from 'lucide-react';
import StreakFlameIcon from '../../../components/StreakFlameIcon';
import { useCourseTheme } from '../../../hooks/useCourseTheme';
import {
  streakTier,
  streakTierBadgeSurfaceClass,
} from '../lib/seguimientoStreakUi';
import { STREAK_MULTIPLIER_DAY_THRESHOLD } from '../../../lib/courseAttendancePoints';

type RankingStreakBadgeProps = {
  dayStreak: number;
  size?: 'sm' | 'md';
  /** URL opcional del SVG (Prismic u otro CDN). */
  flameSrc?: string;
};

function badgeGradient(tier: ReturnType<typeof streakTier>): string {
  if (tier >= 7) return 'linear-gradient(135deg, #818CF8, #6366F1, #818CF8, #A5B4FC)';
  if (tier >= 6) return 'linear-gradient(135deg, #FB7185, #F43F5E, #FB923C, #FDA4AF)';
  if (tier >= 3) return 'linear-gradient(135deg, #CD7F32, #F97316, #FDBA74, #E8A849)';
  if (tier >= 1) return 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700, #FFEC8B)';
  return 'linear-gradient(135deg, #C0C0C0, #E8E8E8, #A8A8A8, #D4D4D4)';
}

export default function RankingStreakBadge({
  dayStreak,
  size = 'md',
  flameSrc,
}: RankingStreakBadgeProps) {
  const { dark } = useCourseTheme();
  const tier = streakTier(dayStreak);
  const surface = streakTierBadgeSurfaceClass(tier, dark);

  const frame = size === 'sm' ? 'h-11 w-[4.5rem]' : 'h-12 w-20';
  const flameBox = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10';
  const flamePx = size === 'sm' ? 34 : 38;
  const numberBox = size === 'sm' ? 'h-7 min-w-8 px-1.5 text-sm' : 'h-8 min-w-9 px-2 text-base';
  const zapSize = size === 'sm' ? 'h-4 w-4' : 'h-[1.125rem] w-[1.125rem]';
  const zapIconSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';
  const gradient = badgeGradient(tier);
  const glowStyle: CSSProperties = {
    backgroundImage: gradient,
    backgroundSize: '300% 300%',
    animation: 'liquidShift 3s ease infinite',
    filter: 'blur(10px)',
    opacity: tier > 0 ? 0.3 : 0.1,
  };
  const numberStyle: CSSProperties = {
    backgroundImage: gradient,
    backgroundSize: '300% 300%',
    animation: 'liquidShift 3s ease infinite',
    textShadow: tier > 0 ? '0 1px 2px rgba(0,0,0,0.5)' : undefined,
  };

  return (
    <div
      className={`relative flex ${frame} shrink-0 items-center justify-center overflow-visible`}
      aria-label={`Racha de ${dayStreak} día${dayStreak === 1 ? '' : 's'}`}
    >
      <div className="pointer-events-none absolute inset-x-1 bottom-1 top-2 rounded-2xl" style={glowStyle} />
      <div className={`relative flex h-full w-full items-center justify-between gap-1 rounded-2xl px-1.5 ${surface}`}>
        <span className={`relative flex ${flameBox} shrink-0 items-center justify-center`}>
          <StreakFlameIcon
            dayStreak={dayStreak}
            tier={tier}
            src={flameSrc}
            size={flamePx}
            className="h-full w-full"
          />
        </span>
        <span
          className={`z-[1] inline-flex ${numberBox} items-center justify-center rounded-xl border border-white/60 font-black leading-none text-white shadow-lg tabular-nums ring-1 ring-black/5`}
          style={numberStyle}
        >
          {dayStreak}
        </span>
        {dayStreak >= STREAK_MULTIPLIER_DAY_THRESHOLD ? (
          <span
            className={`absolute right-0 top-0 z-[2] flex ${zapSize} translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full shadow-sm ${
              dark ? 'bg-violet-500 text-white' : 'bg-[var(--course-accent)] text-white'
            }`}
          >
            <Zap className={zapIconSize} aria-hidden />
          </span>
        ) : null}
      </div>
    </div>
  );
}
