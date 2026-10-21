'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CONTACTO } from '../../_contenido/contacto';
import { track } from '../../_lib/analytics';
import { buildWaUrl, WA_TEXT } from '../../_lib/whatsapp';

export function WhatsAppFab() {
  const pathname = usePathname();
  const ref = useRef<HTMLAnchorElement>(null);
  const [inContact, setInContact] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const target = document.getElementById('contacto');
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setInContact(Boolean(entry?.isIntersecting)), { threshold: 0.2 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [pathname]);

  // Oculta la burbuja mientras su caja (con margen) caería sobre texto o controles.
  // Reaparece en cuanto queda sobre espacio libre (márgenes, fondos, separaciones).
  useEffect(() => {
    const fab = ref.current;
    if (!fab) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      if (document.activeElement === fab) return setBlocked(false);
      setBlocked(fabCollides(fab));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
    const t = window.setInterval(schedule, 300);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      mo.disconnect();
      window.clearInterval(t);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  const hidden = inContact || blocked;

  return (
    <a
      ref={ref}
      className="ag-fab"
      data-hidden={hidden ? 'true' : undefined}
      aria-hidden={hidden ? true : undefined}
      tabIndex={hidden ? -1 : undefined}
      href={buildWaUrl(CONTACTO.whatsappB2B, WA_TEXT.fab)}
      aria-label="Escribir por WhatsApp"
      onClick={() => track('click_whatsapp', { source: 'fab' })}
    >
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <path
          fill="currentColor"
          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
        />
      </svg>
    </a>
  );
}

const INTERACTIVE = 'a,button,input,select,textarea,label,summary,[role="button"],[tabindex]';
const PAD = 8;

function fabCollides(fab: HTMLElement): boolean {
  const r = fab.getBoundingClientRect();
  if (!r.width) return false;
  const box = { l: r.left - PAD, t: r.top - PAD, r: r.right + PAD, b: r.bottom + PAD };
  const hit = (a: DOMRect) =>
    a.width > 0 && a.height > 0 && a.right > box.l && a.left < box.r && a.bottom > box.t && a.top < box.b;
  const seen = new Set<Element>();
  const N = 5;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const x = box.l + ((box.r - box.l) * i) / (N - 1);
      const y = box.t + ((box.b - box.t) * j) / (N - 1);
      for (const el of document.elementsFromPoint(x, y)) {
        if (el === fab || fab.contains(el) || seen.has(el)) continue;
        seen.add(el);
        if (el === document.body || el === document.documentElement) continue;
        // Contenido en movimiento continuo (muros de testimonios, marquees): su texto
        // pasaría por debajo entre comprobaciones, así que se trata como ocupado.
        if (el.getAnimations?.().some((a) => a.playState === 'running' && isInfinite(a))) return true;
        if (el.matches(INTERACTIVE) && hit(el.getBoundingClientRect())) return true;
        for (const n of Array.from(el.childNodes)) {
          if (n.nodeType !== 3 || !n.textContent?.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(n);
          for (const a of Array.from(range.getClientRects())) if (hit(a)) return true;
        }
      }
    }
  }
  return false;
}

function isInfinite(a: Animation): boolean {
  const t = a.effect?.getTiming();
  return t?.iterations === Infinity;
}
