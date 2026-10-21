'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Aparición al hacer scroll. Sin JS, el contenido se ve completo. */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    root.classList.add('ag-reveal-on');
    const seen = new WeakSet<HTMLElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    );
    const watch = (target: HTMLElement) => {
      if (seen.has(target) || target.classList.contains('is-in')) return;
      seen.add(target);
      const rect = target.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) target.classList.add('is-in');
      else observer.observe(target);
    };
    const scan = () => {
      document.querySelectorAll<HTMLElement>('.alianza-root .ag-section > .ag-wrap').forEach((target) => {
        // La tienda vive en un Client Component con Suspense. Marcarla aquí, antes de
        // que hidrate, deja `is-in` en el HTML del servidor y React avisa. El CSS ya
        // la muestra sin esa clase.
        if (target.parentElement?.classList.contains('ag-store')) return;
        watch(target);
      });
    };
    scan();
    const added = new MutationObserver(scan);
    added.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      added.disconnect();
    };
  }, [pathname]);

  return null;
}
