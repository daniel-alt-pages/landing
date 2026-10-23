'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ALBUMES } from '../../_contenido/albumes';

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

const corto = (titulo: string) => titulo.replace(/^Álbum Calendario /, '').replace(' · Parte ', ' P');
const nombre = (alt: string) => alt.split(/,| \d/)[0].replace(/^Tarjeta de /, '');

export function AlbumesCarousel() {
  const [a, setA] = useState(0);
  const [p, setP] = useState(0);
  const [pausa, setPausa] = useState(false);
  const reduced = useReducedMotion();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const thumbs = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ x: number; id: number } | null>(null);
  const moved = useRef(false);
  const album = ALBUMES[a];
  const total = album.fotos.length;
  const n = ALBUMES.length;

  const irAlbum = (k: number, foco = false) => {
    const v = (k + n) % n;
    setA(v);
    setP(0);
    if (foco) tabs.current[v]?.focus();
  };
  const irFoto = (k: number) => setP((k + total) % total);

  useEffect(() => {
    if (reduced || pausa || total < 2) return;
    const t = window.setInterval(() => setP((i) => (i + 1) % total), 1500);
    return () => window.clearInterval(t);
  }, [reduced, pausa, total, a]);

  useEffect(() => {
    const box = thumbs.current;
    const el = box?.children[p] as HTMLElement | undefined;
    if (box && el) box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: reduced ? 'auto' : 'smooth' });
  }, [p, a, reduced]);

  const onTabKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); irAlbum(a + 1, true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); irAlbum(a - 1, true); }
    else if (e.key === 'Home') { e.preventDefault(); irAlbum(0, true); }
    else if (e.key === 'End') { e.preventDefault(); irAlbum(n - 1, true); }
  };
  const onFotoKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); irFoto(p + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); irFoto(p - 1); }
  };
  const down = (e: PointerEvent) => { drag.current = { x: e.clientX, id: e.pointerId }; moved.current = false; };
  const move = (e: PointerEvent) => { if (drag.current && Math.abs(e.clientX - drag.current.x) > 8) moved.current = true; };
  const up = (e: PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    drag.current = null;
    if (Math.abs(dx) > 40) irFoto(dx < 0 ? p + 1 : p - 1);
  };

  const actual = album.fotos[p];
  return (
    <div
      className="ag-alb"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Álbumes de puntajes"
      onMouseEnter={() => setPausa(true)}
      onMouseLeave={() => setPausa(false)}
      onFocus={() => setPausa(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setPausa(false); }}
    >
      <div className="ag-alb-tabs" role="tablist" aria-label="Elegir álbum" onKeyDown={onTabKey}>
        {ALBUMES.map((al, k) => (
          <button
            key={al.id}
            ref={(el) => { tabs.current[k] = el; }}
            type="button"
            role="tab"
            id={`alb-tab-${al.id}`}
            aria-selected={k === a}
            aria-controls="alb-panel"
            tabIndex={k === a ? 0 : -1}
            className="ag-alb-tab"
            onClick={() => irAlbum(k)}
          >
            {corto(al.titulo)}
          </button>
        ))}
      </div>
      <div id="alb-panel" role="tabpanel" aria-labelledby={`alb-tab-${album.id}`} className="ag-alb-panel">
        <div
          className="ag-alb-stage"
          tabIndex={0}
          aria-label={`${album.titulo}. Use las flechas izquierda y derecha para cambiar de foto.`}
          onKeyDown={onFotoKey}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={() => { drag.current = null; }}
        >
          <a
            className="ag-alb-link"
            href={album.url}
            target="_blank"
            rel="noopener noreferrer"
            draggable={false}
            aria-label={`Ver ${album.titulo} en Instagram (se abre en una pestaña nueva). Foto actual: ${actual.alt}`}
            onClick={(e) => { if (moved.current) { e.preventDefault(); moved.current = false; } }}
          >
            <img className="ag-alb-img" src={actual.src} alt={actual.alt} width={1080} height={1350} draggable={false} decoding="async" />
          </a>
          {total > 1 ? (
            <>
              <button type="button" className="ag-alb-btn ag-alb-prev" aria-label="Foto anterior" onClick={() => irFoto(p - 1)}>‹</button>
              <button type="button" className="ag-alb-btn ag-alb-next" aria-label="Foto siguiente" onClick={() => irFoto(p + 1)}>›</button>
            </>
          ) : null}
        </div>
        <p className="ag-alb-caption" aria-live={reduced || pausa ? 'polite' : 'off'}>
          <strong>{nombre(actual.alt)}</strong> <span>· {p + 1} / {total}</span>
        </p>
        {total > 1 ? (
          <div className="ag-alb-dots" aria-label="Fotos del álbum">
            {album.fotos.map((f, k) => (
              <button key={f.src} type="button" className="ag-alb-dot" aria-label={`Foto ${k + 1}: ${nombre(f.alt)}`} aria-current={k === p ? 'true' : undefined} onClick={() => irFoto(k)}>
                <span />
              </button>
            ))}
          </div>
        ) : null}
        {total > 1 ? (
          <div className="ag-alb-thumbs" ref={thumbs} aria-label="Ir a un estudiante">
            {album.fotos.map((f, k) => (
              <button key={f.src} type="button" className="ag-alb-thumb" aria-current={k === p ? 'true' : undefined} onClick={() => irFoto(k)}>
                <img src={f.src} alt="" width={64} height={80} loading="lazy" decoding="async" />
                <span>{nombre(f.alt)}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
