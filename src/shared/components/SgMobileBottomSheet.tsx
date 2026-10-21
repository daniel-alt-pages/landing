'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion, type Transition, type Variants } from 'motion/react';

type SgMobileBottomSheetProps = {
  onClose: () => void;
  ariaLabelledBy?: string;
  children: ReactNode;
  /** Legacy: las modales móviles ahora cubren el nav inferior para evitar huecos visuales. */
  reserveBottomNav?: boolean;
  zIndexClass?: string;
  panelClassName?: string;
  backdropClassName?: string;
  maxWidthClass?: string;
  /** Envuelve el portal (p. ej. `course-panel dark`) para tokens CSS fuera del panel. */
  scopeClassName?: string;
};

const SHEET_SPRING: Transition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.82 };

const sheetBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const sheetPanelVariants: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: SHEET_SPRING },
  exit: { opacity: 0, y: 18, scale: 0.98, transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } },
};

/**
 * Bottom sheet en móvil, centrado en sm+.
 * Portal a document.body para evitar stacking contexts del panel curso.
 */
export default function SgMobileBottomSheet({
  onClose,
  ariaLabelledBy,
  children,
  zIndexClass = 'z-[120]',
  panelClassName = '',
  backdropClassName = 'bg-black/45 backdrop-blur-[2px]',
  maxWidthClass = 'sm:max-w-lg',
  scopeClassName = '',
}: SgMobileBottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0.01 } : SHEET_SPRING;

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`${scopeClassName} fixed inset-0 ${zIndexClass} flex items-end sm:items-center justify-center p-0 sm:p-4`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
    >
      <motion.button
        type="button"
        className={`absolute inset-0 ${backdropClassName}`}
        aria-label="Cerrar"
        onPointerDown={(e) => {
          // ponytail: pointerdown evita ghost-click que reabre la fila debajo al desmontar
          e.preventDefault();
          onClose();
        }}
        data-course-motion
        initial="hidden"
        animate="visible"
        variants={sheetBackdropVariants}
        transition={transition}
      />
      <motion.div
        data-course-motion
        initial="hidden"
        animate="visible"
        variants={sheetPanelVariants}
        transition={transition}
        className={`relative z-[1] flex h-dvh max-h-dvh w-full min-h-0 flex-col rounded-none shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:rounded-2xl ${maxWidthClass} ${panelClassName}`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 justify-center pt-2 pb-1 sm:hidden" aria-hidden>
          <div className="h-1 w-9 rounded-full bg-current opacity-20" />
        </div>
        {children}
      </motion.div>
    </div>,
    document.body,
  );
}
