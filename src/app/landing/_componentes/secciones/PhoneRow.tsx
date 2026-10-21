'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PANTALLAS } from '../../_contenido/pantallas';
import { PhoneFrame } from '../primitivas/PhoneFrame';

export function PhoneRow() {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const last = PANTALLAS.length - 1;

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

  function go(next: number) {
    const node = scroller.current;
    const card = node?.querySelectorAll<HTMLElement>('.ag-phone-card')[next];
    if (!node || !card) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.scrollTo({ left: card.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
  }

  return (
    <div className="ag-phone-carousel">
      <div className="ag-phone-stage">
        <button type="button" className="ag-phone-nav is-prev" aria-label="Pantalla anterior" disabled={index === 0} onClick={() => go(index - 1)}>
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
        <button type="button" className="ag-phone-nav is-next" aria-label="Pantalla siguiente" disabled={index === last} onClick={() => go(index + 1)}>
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
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  );
}
