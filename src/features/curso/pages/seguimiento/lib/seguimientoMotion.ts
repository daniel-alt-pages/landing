import type { Transition, Variants } from 'motion/react';

/** Resorte tipo iOS — respuesta rápida, poco rebote. */
export const SEGUIMIENTO_APPLE_SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 480,
  damping: 36,
  mass: 0.78,
};

/** Resorte suave — entradas de lista y tarjetas. */
export const SEGUIMIENTO_APPLE_SPRING_SOFT: Transition = {
  type: 'spring',
  stiffness: 340,
  damping: 34,
  mass: 0.92,
};

/** Curva Apple estándar (ease-out prolongado). */
export const SEGUIMIENTO_APPLE_EASE: Transition = {
  duration: 0.62,
  ease: [0.32, 0.72, 0, 1],
};

export const rankingPillVariants: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.94, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, y: 18, scale: 0.96, filter: 'blur(6px)' },
};

export const rankingExpandedCardVariants: Variants = {
  hidden: { opacity: 0, y: 36, scale: 0.93, filter: 'blur(10px)' },
  partial: { opacity: 0.9, y: 12, scale: 0.98, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
};

export const rankingExpandedBlockVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...SEGUIMIENTO_APPLE_SPRING_SOFT },
  },
};

export const rankingExpandedContainerVariants: Variants = {
  hidden: {},
  partial: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.06 } },
};

export function rankingListRowMotion(index: number, reduceMotion: boolean | null) {
  if (reduceMotion) {
    return {
      initial: false as const,
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: 0.01 },
    };
  }
  return {
    initial: { opacity: 0, y: 16, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: {
      ...SEGUIMIENTO_APPLE_SPRING_SOFT,
      delay: Math.min(index * 0.04, 0.4),
    },
  };
}

export function rankingProgressTransition(reduceMotion: boolean | null): Transition {
  return reduceMotion ? { duration: 0.01 } : { ...SEGUIMIENTO_APPLE_EASE, delay: 0.18 };
}

export function rankingTapScale(reduceMotion: boolean | null) {
  return reduceMotion ? undefined : { scale: 0.97 };
}

export function rankingHoverLift(reduceMotion: boolean | null) {
  return reduceMotion ? undefined : { scale: 1.012, y: -1 };
}
