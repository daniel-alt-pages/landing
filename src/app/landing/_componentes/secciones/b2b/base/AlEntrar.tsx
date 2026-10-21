'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Revela al entrar en pantalla. Sin JS (SSR) el contenido queda visible: los estados ocultos
 * solo aplican con `.is-armed`, que se agrega al montar. Umbral 0 + rootMargin para que
 * bloques más altos que la pantalla también se activen.
 */
export function AlEntrar({ className = '', children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<'ssr' | 'armed' | 'in'>('ssr');

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      setEstado('in');
      return;
    }
    setEstado('armed');
    const observador = new IntersectionObserver(([entrada]) => {
      if (!entrada?.isIntersecting) return;
      setEstado('in');
      observador.disconnect();
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    observador.observe(nodo);
    const respaldo = window.setTimeout(() => {
      const r = nodo.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) setEstado('in');
    }, 1200);
    return () => { observador.disconnect(); window.clearTimeout(respaldo); };
  }, []);

  const clase = estado === 'ssr' ? '' : estado === 'armed' ? ' is-armed' : ' is-armed is-in';
  return <div ref={ref} className={`${className}${clase}`}>{children}</div>;
}
