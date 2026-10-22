'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

/**
 * Botón «Agregar al carrito» con micro-interacción:
 * el texto sale hacia arriba, un carrito cruza el botón con un paquete que cae dentro,
 * aparece «¡Agregado!» con un check y vuelve al estado normal.
 * Solo transform/opacity. Con prefers-reduced-motion: cambio de texto sin movimiento.
 * El vuelo de la miniatura al header (volarAlCarrito) lo dispara onAdd, en paralelo.
 */
type Fase = 'idle' | 'cruza' | 'listo';

const EASE = [0.16, 1, 0.3, 1] as const;

function Carrito() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2.5 3.5h2.2l2.4 11.1a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2l1.6-6.7H6" />
      <circle cx="9.5" cy="20" r="1.3" />
      <circle cx="17" cy="20" r="1.3" />
    </svg>
  );
}

export function AddToCartButton({ className, disabled, onAdd, children }: {
  className?: string;
  disabled?: boolean;
  onAdd: () => void;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const [fase, setFase] = useState<Fase>('idle');
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  function click() {
    if (fase !== 'idle' || disabled) return;
    onAdd();
    setFase(reduce ? 'listo' : 'cruza');
    if (!reduce) timers.current.push(window.setTimeout(() => setFase('listo'), 750));
    timers.current.push(window.setTimeout(() => setFase('idle'), reduce ? 1400 : 1950));
  }

  const busy = fase !== 'idle';
  return (
    <button
      type="button"
      className={`${className || ''} ag-atc`}
      data-fase={fase}
      disabled={disabled && !busy}
      aria-disabled={busy || undefined}
      onClick={click}
    >
      <span className="ag-atc-stage">
        <AnimatePresence mode="popLayout" initial={false}>
          {fase === 'idle' ? (
            <motion.span key="label" className="ag-atc-label"
              initial={reduce ? { opacity: 0 } : { y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { y: -14, opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE }}>
              {children}
            </motion.span>
          ) : null}
          {fase === 'cruza' ? (
            <motion.span key="cart" className="ag-atc-cart" aria-hidden
              initial={{ x: '-140%', opacity: 0 }}
              animate={{ x: ['-140%', '0%', '0%', '160%'], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 0.75, times: [0, 0.35, 0.6, 1], ease: EASE }}>
              <motion.span className="ag-atc-box"
                initial={{ y: -16, opacity: 0, scale: 0.6 }}
                animate={{ y: [-16, -16, 2], opacity: [0, 1, 1], scale: [0.6, 1, 0.9] }}
                transition={{ duration: 0.45, times: [0, 0.4, 1], ease: 'easeIn' }} />
              <Carrito />
            </motion.span>
          ) : null}
          {fase === 'listo' ? (
            <motion.span key="ok" className="ag-atc-label" role="status"
              initial={reduce ? { opacity: 0 } : { y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { y: -14, opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, ease: EASE }} />
              </svg>
              ¡Agregado!
            </motion.span>
          ) : null}
        </AnimatePresence>
      </span>
    </button>
  );
}
