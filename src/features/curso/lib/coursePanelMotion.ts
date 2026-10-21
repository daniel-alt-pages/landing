import type { Transition, Variants } from 'motion/react';

/** Resorte panel curso — sin filter (Safari/Firefox OK). */
export const COURSE_PANEL_SPRING: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.82,
};

export const COURSE_PANEL_EASE: Transition = {
  duration: 0.55,
  ease: [0.32, 0.72, 0, 1],
};

export const coursePanelSectionVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.992 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.996 },
};

export const coursePanelStaggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};

export const coursePanelStaggerItem: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: COURSE_PANEL_SPRING,
  },
};

export function coursePanelInViewMotion(reduceMotion: boolean | null, delay = 0) {
  if (reduceMotion) {
    return {
      initial: false as const,
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: 0.01 },
    };
  }
  return {
    initial: { opacity: 0, y: 12, scale: 0.985 },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    viewport: { once: true, amount: 0.25 },
    transition: { ...COURSE_PANEL_SPRING, delay },
  };
}

export function coursePanelTapScale(reduceMotion: boolean | null) {
  return reduceMotion ? undefined : { scale: 0.98 };
}

export const coursePanelSectionTransition = COURSE_PANEL_SPRING;

/** Backdrop modal — solo opacity (cross-browser). */
export const coursePanelModalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Panel modal — slide-up móvil / scale suave desktop. */
export const coursePanelModalPanelVariants: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: COURSE_PANEL_SPRING,
  },
  exit: {
    opacity: 0,
    y: 18,
    scale: 0.98,
    transition: { duration: 0.28, ease: [0.4, 0, 1, 1] },
  },
};

export function coursePanelModalTransition(reduceMotion: boolean | null): Transition {
  return reduceMotion ? { duration: 0.01 } : COURSE_PANEL_SPRING;
}
