'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCourseTheme } from '../hooks/useCourseTheme';
import { courseThemeScopeClass } from '../lib/courseThemeScope';
import {
  coursePanelModalBackdropVariants,
  coursePanelModalPanelVariants,
  coursePanelModalTransition,
} from '../lib/coursePanelMotion';

type CoursePanelModalShellProps = {
  open: boolean;
  onClose: () => void;
  ariaLabelledBy?: string;
  ariaLabel?: string;
  zIndexClass?: string;
  backdropClassName?: string;
  panelClassName?: string;
  align?: 'bottom' | 'center';
  children: ReactNode;
};

/** Modal del panel curso con enter/exit animado (opacity + transform). */
export default function CoursePanelModalShell({
  open,
  onClose,
  ariaLabelledBy,
  ariaLabel,
  zIndexClass = 'z-[70]',
  backdropClassName = 'bg-black/45',
  panelClassName = '',
  align = 'bottom',
  children,
}: CoursePanelModalShellProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { dark } = useCourseTheme();
  const reduceMotion = useReducedMotion();
  const transition = coursePanelModalTransition(reduceMotion);
  const alignClass =
    align === 'center'
      ? 'items-center justify-center p-4'
      : 'items-end justify-center p-0 sm:items-center sm:p-4';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="course-panel-modal"
          data-course-motion
          className={`${courseThemeScopeClass(dark)} fixed inset-0 ${zIndexClass} flex ${alignClass}`}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="presentation"
        >
          <motion.button
            type="button"
            aria-label="Cerrar"
            className={`absolute inset-0 ${backdropClassName}`}
            variants={coursePanelModalBackdropVariants}
            transition={transition}
            onClick={onClose}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={ariaLabelledBy}
            aria-label={ariaLabel}
            tabIndex={-1}
            data-course-motion
            variants={coursePanelModalPanelVariants}
            transition={transition}
            className={`relative z-[1] ${panelClassName}`}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
