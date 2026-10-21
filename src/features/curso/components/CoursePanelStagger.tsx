'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { coursePanelStaggerContainer, coursePanelStaggerItem } from '../lib/coursePanelMotion';

type CoursePanelStaggerProps = {
  children: ReactNode;
  className?: string;
};

/** Grid/list con entrada escalonada (opacity + translate, cross-browser). */
export function CoursePanelStagger({ children, className = '' }: CoursePanelStaggerProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      data-course-motion
      className={className}
      variants={coursePanelStaggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.08 }}
    >
      {children}
    </motion.div>
  );
}

type CoursePanelStaggerItemProps = {
  children: ReactNode;
  className?: string;
};

export function CoursePanelStaggerItem({ children, className = '' }: CoursePanelStaggerItemProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div data-course-motion variants={coursePanelStaggerItem} className={className}>
      {children}
    </motion.div>
  );
}
