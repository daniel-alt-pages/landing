'use client';

import { useEffect, type RefObject } from 'react';
import { inView } from 'motion';

/**
 * Dibuja los conectores al entrar en pantalla. Sin JS (SSR) y con prefers-reduced-motion
 * los trazos quedan completos. Trazos: [data-trazo] con pathLength="1". Puntas y rótulos: [data-punta].
 * El ocultado y el dibujo se hacen con clases + transiciones CSS (b2b-diagramas-v2.css), no con
 * estilos inline animados: en SVG Motion animaba atributos y el estilo inline (offset 1 / opacity 0)
 * ganaba, así que las flechas nunca aparecían. Si el diagrama está en una pestaña oculta
 * (display:none, rect 0×0) se espera a que entre en vista al mostrarse.
 */
export function useTrazos(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const raiz = ref.current;
    if (!raiz || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = raiz.getBoundingClientRect();
    if (r.height > 0 && r.top < window.innerHeight && r.bottom > 0) return; // ya visible
    raiz.querySelectorAll<HTMLElement | SVGElement>('[data-trazo]').forEach((t, i) => t.style.setProperty('--i', String(i)));
    raiz.querySelectorAll<HTMLElement | SVGElement>('[data-punta]').forEach((p, i) => p.style.setProperty('--i', String(i)));
    raiz.classList.add('is-trazos-ocultos');
    const parar = inView(raiz, () => {
      requestAnimationFrame(() => raiz.classList.add('is-trazos-on'));
      return undefined;
    }, { amount: 0.2 });
    return () => {
      parar();
      raiz.classList.remove('is-trazos-ocultos', 'is-trazos-on');
    };
  }, [ref]);
}
