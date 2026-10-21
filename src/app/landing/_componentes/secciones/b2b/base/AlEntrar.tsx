'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export function AlEntrar({ className = '', children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const observador = new IntersectionObserver(([entrada]) => {
      if (!entrada?.isIntersecting) return;
      setVisible(true);
      observador.disconnect();
    }, { threshold: 0.35 });
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  return <div ref={ref} className={`${className}${visible ? ' is-in' : ''}`}>{children}</div>;
}
