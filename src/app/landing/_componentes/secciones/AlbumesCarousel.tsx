'use client';

import { useEffect, useRef, useState } from 'react';
import { ALBUMES, type Album } from '../../_contenido/albumes';

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

function AlbumFotos({ album, activo, reduced }: { album: Album; activo: boolean; reduced: boolean }) {
  const [foto, setFoto] = useState(0);
  const [pausa, setPausa] = useState(false);
  const total = album.fotos.length;
  useEffect(() => {
    if (!activo || reduced || pausa || total < 2) return;
    const t = window.setInterval(() => setFoto((i) => (i + 1) % total), 1500);
    return () => window.clearInterval(t);
  }, [activo, reduced, pausa, total]);
  const actual = album.fotos[foto];
  return (
    <div
      className="ag-alb-fotos"
      onMouseEnter={() => setPausa(true)}
      onMouseLeave={() => setPausa(false)}
      onFocus={() => setPausa(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setPausa(false); }}
    >
      <a
        className="ag-alb-link"
        href={album.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Ver ${album.titulo} en Instagram (se abre en una pestaña nueva). Foto actual: ${actual.alt}`}
        tabIndex={activo ? 0 : -1}
      >
        <img className="ag-alb-img" src={actual.src} alt={actual.alt} width={1080} height={1350} loading="lazy" decoding="async" />
      </a>
      {total > 1 ? (
        <div className="ag-alb-fotos-nav">
          <button type="button" className="ag-alb-btn" tabIndex={activo ? 0 : -1} aria-label="Foto anterior" onClick={() => setFoto((i) => (i - 1 + total) % total)}>‹</button>
          <span aria-live={reduced || pausa ? 'polite' : 'off'}>{foto + 1} / {total}</span>
          <button type="button" className="ag-alb-btn" tabIndex={activo ? 0 : -1} aria-label="Foto siguiente" onClick={() => setFoto((i) => (i + 1) % total)}>›</button>
        </div>
      ) : null}
    </div>
  );
}

export function AlbumesCarousel() {
  const [i, setI] = useState(0);
  const reduced = useReducedMotion();
  const startX = useRef<number | null>(null);
  const n = ALBUMES.length;
  const go = (d: number) => setI((v) => (v + d + n) % n);
  return (
    <div
      className="ag-alb"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Álbumes de puntajes"
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(-1);
        if (e.key === 'ArrowRight') go(1);
      }}
      onTouchStart={(e) => { startX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (startX.current === null) return;
        const dx = e.changedTouches[0].clientX - startX.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        startX.current = null;
      }}
    >
      <div className="ag-alb-head">
        <button type="button" className="ag-alb-btn" aria-label="Álbum anterior" onClick={() => go(-1)}>‹</button>
        <p className="ag-alb-title" aria-live="polite">
          <span className="ag-eyebrow">{i + 1} / {n}</span>
          <strong className="ag-h3">{ALBUMES[i].titulo}</strong>
        </p>
        <button type="button" className="ag-alb-btn" aria-label="Álbum siguiente" onClick={() => go(1)}>›</button>
      </div>
      <div className="ag-alb-viewport">
        <div className="ag-alb-track" style={{ transform: `translateX(-${i * 100}%)` }}>
          {ALBUMES.map((album, k) => (
            <div key={album.id} className="ag-alb-slide" role="group" aria-roledescription="álbum" aria-label={`${k + 1} de ${n}: ${album.titulo}`} aria-hidden={k !== i}>
              <AlbumFotos album={album} activo={k === i} reduced={reduced} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
