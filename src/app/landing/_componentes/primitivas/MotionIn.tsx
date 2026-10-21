'use client';

import { animate, inView } from 'motion';
import { useEffect, useRef, type ReactNode } from 'react';

const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * Entrada sutil con Motion: opacidad + translateY(8px), 280 ms, ease-out fuerte.
 * - Sin JS el contenido se ve: solo `.js .ag-mi` empieza en opacidad 0 (clase puesta en <head>).
 * - Con prefers-reduced-motion no hay desplazamiento ni ocultamiento (CSS + chequeo aquí).
 * - `delay` en ms permite el escalonado de 40-60 ms entre hermanos.
 */
export function MotionIn({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
  onMount = false,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'li';
  onMount?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.opacity = '1';
      return undefined;
    }
    const run = () => {
      animate(el, { opacity: [0, 1], transform: ['translateY(8px)', 'translateY(0px)'] }, { duration: 0.28, ease: EASE, delay: delay / 1000 });
    };
    if (onMount) { run(); return undefined; }
    return inView(el, () => { run(); }, { margin: '0px 0px -60px 0px' });
  }, [delay, onMount]);
  const cls = ['ag-mi', className].filter(Boolean).join(' ');
  return Tag === 'li'
    ? <li ref={(n) => { ref.current = n; }} className={cls}>{children}</li>
    : <div ref={(n) => { ref.current = n; }} className={cls}>{children}</div>;
}
