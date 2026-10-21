'use client';

import { useEffect, type RefObject } from 'react';
import { animate, inView } from 'motion';

/**
 * Dibuja los conectores al entrar en pantalla. Sin JS (SSR) y con prefers-reduced-motion
 * los trazos quedan completos: el estado oculto solo se aplica dentro del efecto.
 * Trazos: [data-trazo] con pathLength="1". Puntas y rótulos: [data-punta].
 */
export function useTrazos(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const raiz = ref.current;
    if (!raiz || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const trazos = Array.from(raiz.querySelectorAll<SVGElement>('[data-trazo]'));
    const puntas = Array.from(raiz.querySelectorAll<SVGElement | HTMLElement>('[data-punta]'));
    const r = raiz.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return; // ya visible: no ocultar lo que se está leyendo
    trazos.forEach((t) => { t.style.strokeDasharray = '1'; t.style.strokeDashoffset = '1'; });
    puntas.forEach((p) => { p.style.opacity = '0'; });
    const parar = inView(raiz, () => {
      trazos.forEach((t, i) => {
        animate(t, { strokeDashoffset: [1, 0] }, { duration: 0.7, delay: 0.08 * i, ease: [0.77, 0, 0.175, 1] });
      });
      puntas.forEach((p, i) => {
        animate(p, { opacity: [0, 1] }, { duration: 0.25, delay: 0.6 + 0.04 * i, ease: [0.23, 1, 0.32, 1] });
      });
      return undefined;
    }, { amount: 0.2 });
    return () => {
      parar();
      trazos.forEach((t) => { t.style.strokeDasharray = ''; t.style.strokeDashoffset = ''; });
      puntas.forEach((p) => { p.style.opacity = ''; });
    };
  }, [ref]);
}
