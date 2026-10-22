'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Entrada escalonada con IntersectionObserver. Sin JS o con reduced-motion, todo visible. */
export function RevealGrid({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    // Lo que ya está en pantalla al hidratar se queda visible (sin parpadeo).
    const items = Array.from(el.querySelectorAll<HTMLElement>('.pm-item'));
    const pendientes = items.filter((item) => {
      const r = item.getBoundingClientRect();
      const visible = r.top < window.innerHeight && r.bottom > 0;
      if (visible) item.classList.add('is-in');
      return !visible;
    });
    if (pendientes.length === 0) return undefined;
    el.classList.add('pm-reveal');
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
    );
    pendientes.forEach((item) => io.observe(item));
    return () => io.disconnect();
  }, []);
  return <ul ref={ref} className="pm-grid">{children}</ul>;
}
