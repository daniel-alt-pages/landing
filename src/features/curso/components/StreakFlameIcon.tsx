'use client';

import { useCourseTheme } from '../hooks/useCourseTheme';
import {
  streakTier,
  streakTierSvgVisualClass,
  type StreakTier,
} from '../pages/seguimiento/lib/seguimientoStreakUi';

/** Llama de racha — WebP local con alpha. */
export const STREAK_FLAME_SVG_PATH = '/curso/icons/racha.webp';

type StreakFlameIconProps = {
  /** Días de racha perfecta; si se pasa `tier`, se ignora. */
  dayStreak?: number;
  /** Tier visual directo (0–7). Milestones: 5, 10, 20, 30, 40, 50 días. */
  tier?: StreakTier;
  /** URL del SVG (ej. media Prismic). Los tiers CSS siguen aplicando sobre `<img>`. */
  src?: string;
  className?: string;
  size?: number;
};

/**
 * Icono de llama del asset `fuego de racha/racha.svg`.
 * Tiers progresivos en días 5, 10, 20, 30, 40, 50 (máximo en 50+).
 */
export default function StreakFlameIcon({
  dayStreak = 0,
  tier: tierProp,
  src,
  className = '',
  size = 56,
}: StreakFlameIconProps) {
  const { dark } = useCourseTheme();
  const tier = tierProp ?? streakTier(dayStreak);
  const imageSrc = src?.trim() || STREAK_FLAME_SVG_PATH;
  const visual = streakTierSvgVisualClass(tier, dark);
  const motionClass = tier === 0 ? 'streak-motion-ice' : 'streak-motion-fire';

  return (
    <span
      className={`streak-motion ${motionClass} shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG remoto o estático con gradientes embebidos */}
      <img
        src={imageSrc}
        alt=""
        width={size}
        height={size}
        className={`h-full w-full object-contain ${visual}`}
      />
      <style jsx>{`
        .streak-motion {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          isolation: isolate;
        }

        .streak-motion::before {
          content: '';
          position: absolute;
          inset: 14%;
          z-index: -1;
          border-radius: 9999px;
          filter: blur(8px);
          opacity: 0.55;
          transform: translateZ(0);
        }

        .streak-motion-fire::before {
          background: radial-gradient(circle, rgba(251, 191, 36, 0.72), rgba(249, 115, 22, 0.18) 58%, transparent 72%);
          animation: streak-fire-glow 1.8s ease-in-out infinite;
        }

        .streak-motion-fire img {
          animation: streak-fire-flicker 1.45s ease-in-out infinite;
        }

        .streak-motion-ice::before {
          background: radial-gradient(circle, rgba(186, 230, 253, 0.9), rgba(34, 211, 238, 0.2) 58%, transparent 74%);
          animation: streak-ice-glow 2.8s ease-in-out infinite;
        }

        .streak-motion-ice img {
          animation: streak-ice-breathe 2.8s ease-in-out infinite;
        }

        @keyframes streak-fire-flicker {
          0%,
          100% {
            transform: translateY(0) scale(1);
          }
          45% {
            transform: translateY(-1px) scale(1.035) rotate(-1deg);
          }
          72% {
            transform: translateY(0.5px) scale(0.985) rotate(1deg);
          }
        }

        @keyframes streak-fire-glow {
          0%,
          100% {
            opacity: 0.42;
            transform: scale(0.92);
          }
          50% {
            opacity: 0.72;
            transform: scale(1.08);
          }
        }

        @keyframes streak-ice-breathe {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.035);
          }
        }

        @keyframes streak-ice-glow {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(0.94);
          }
          50% {
            opacity: 0.82;
            transform: scale(1.12);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .streak-motion::before,
          .streak-motion img {
            animation: none !important;
          }
        }
      `}</style>
    </span>
  );
}
