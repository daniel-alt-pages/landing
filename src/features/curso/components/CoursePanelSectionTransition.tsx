'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  coursePanelSectionTransition,
  coursePanelSectionVariants,
} from '../lib/coursePanelMotion';

type CoursePanelSectionTransitionProps = {
  sectionKey: string;
  children: ReactNode;
  className?: string;
};

/** Transición entre tabs del panel curso (opacity + translate, cross-browser). */
export default function CoursePanelSectionTransition({
  sectionKey,
  children,
  className = '',
}: CoursePanelSectionTransitionProps) {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0.01 } : coursePanelSectionTransition;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sectionKey}
        data-course-motion
        variants={coursePanelSectionVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={transition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
