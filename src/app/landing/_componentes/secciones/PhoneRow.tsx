'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PANTALLAS } from '../../_contenido/pantallas';
import { PhoneFrame } from '../primitivas/PhoneFrame';

export function PhoneRow() {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const last = PANTALLAS.length - 1;
  const [hold, setHold] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reset, setReset] = useState(0);
  const indexRef = useRef(0);
  indexRef.current = index;

  // v1.0.27: avance automático cada 5 s en bucle. Se pausa con hover/foco y con la pestaña oculta;
  // no avanza con prefers-reduced-motion ni cuando las tres pantallas ya caben a la vez.
  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (hold || hidden) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const node = scroller.current;
    if (!node || node.scrollWidth - node.clientWidth < 8) return undefined;
    const t = window.setTimeout(() => go(indexRef.current >= last ? 0 : indexRef.current + 1), 5000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, hold, hidden, reset, last]);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return undefined;
    const measure = () => {
      const cards = [...node.querySelectorAll<HTMLElement>('.ag-phone-card')];
      if (!cards.length) return;
      const left = node.scrollLeft;
      let next = 0;
      let best = Number.POSITIVE_INFINITY;
      cards.forEach((card, i) => {
        const dist = Math.abs(card.offsetLeft - left);
        if (dist < best) {
          best = dist;
          next = i;
        }
      });
      setIndex(next);
    };
    measure();
    node.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      node.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, []);

  function nav(next: number) {
    setReset((n) => n + 1);
    go(next);
  }

  function go(next: number) {
    const node = scroller.current;
    const card = node?.querySelectorAll<HTMLElement>('.ag-phone-card')[next];
    if (!node || !card) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.scrollTo({ left: card.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
  }

  return (
    <div
      className="ag-phone-carousel"
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHold(true); }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHold(false); }}
      onFocus={() => setHold(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHold(false); }}
    >
      <div className="ag-phone-stage">
        <button type="button" className="ag-phone-nav is-prev" aria-label="Pantalla anterior" disabled={index === 0} onClick={() => nav(index - 1)}>
          <ChevronLeft size={20} aria-hidden />
        </button>
        <div className="ag-phone-row ag-phone-row-3" ref={scroller}>
          {PANTALLAS.map((pantalla) => (
            <article key={pantalla.id} className="ag-phone-card">
              <PhoneFrame src={pantalla.src} alt={pantalla.alt} />
              <h3 className="ag-h3">{pantalla.titulo}</h3>
              <p>{pantalla.texto}</p>
            </article>
          ))}
        </div>
        <button type="button" className="ag-phone-nav is-next" aria-label="Pantalla siguiente" disabled={index === last} onClick={() => nav(index + 1)}>
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>
      <div className="ag-phone-dots">
        {PANTALLAS.map((pantalla, i) => (
          <button
            key={pantalla.id}
            type="button"
            aria-label={pantalla.titulo}
            aria-current={i === index ? 'true' : undefined}
            onClick={() => nav(i)}
          />
        ))}
      </div>
    </div>
  );
}
