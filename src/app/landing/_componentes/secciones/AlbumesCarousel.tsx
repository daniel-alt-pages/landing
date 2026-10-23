'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ALBUMES } from '../../_contenido/albumes';

function useMedia(q: string) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const update = () => setM(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [q]);
  return m;
}

const corto = (titulo: string) => titulo.replace(/^Álbum /, '');
const nombre = (alt: string) => alt.split(/,| \d/)[0].replace(/^Tarjeta de /, '');
const puntaje = (alt: string) => /(\d{3})\/500/.exec(alt)?.[1] ?? null;

/** Álbumes de puntajes: pestañas por álbum, pista de tarjetas y barra de progreso (sin contador numérico). */
export function AlbumesCarousel() {
  const [a, setA] = useState(0);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const ancho = useMedia('(min-width: 701px)');
  const uid = useId().replace(/:/g, '');
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const drag = useRef<{ x: number; id: number } | null>(null);
  const moved = useRef(false);
  const n = ALBUMES.length;
  const album = ALBUMES[a];
  const total = album.fotos.length;
  const maxI = Math.max(0, total - (ancho ? 2 : 1));
  const pos = Math.min(i, maxI);

  const irAlbum = (k: number, foco = false, alFinal = false) => {
    const v = (k + n) % n;
    if (foco) tabs.current[v]?.focus();
    if (v === a) return;
    setDir(k > a ? 1 : -1);
    setA(v);
    setI(alFinal ? Math.max(0, ALBUMES[v].fotos.length - (ancho ? 2 : 1)) : 0);
  };
  /** Avanza tarjeta a tarjeta; al llegar al borde pasa al álbum vecino. */
  const paso = (d: 1 | -1) => {
    if (d > 0) { if (pos < maxI) setI(pos + 1); else { setDir(1); irAlbum(a + 1); } }
    else if (pos > 0) setI(pos - 1);
    else { setDir(-1); irAlbum(a - 1, false, true); }
  };

  useEffect(() => {
    const tab = tabs.current[a];
    const row = tab?.parentElement;
    if (tab && row && row.scrollWidth > row.clientWidth) row.scrollTo({ left: tab.offsetLeft - row.clientWidth / 2 + tab.clientWidth / 2, behavior: reduced ? 'auto' : 'smooth' });
  }, [a, reduced]);

  const onTabKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); irAlbum(a + 1, true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); irAlbum(a - 1, true); }
    else if (e.key === 'Home') { e.preventDefault(); irAlbum(0, true); }
    else if (e.key === 'End') { e.preventDefault(); irAlbum(n - 1, true); }
  };
  const onPanelKey = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); irAlbum(a + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); irAlbum(a - 1); }
  };
  const down = (e: PointerEvent) => { drag.current = { x: e.clientX, id: e.pointerId }; moved.current = false; };
  const move = (e: PointerEvent) => { if (drag.current && Math.abs(e.clientX - drag.current.x) > 8) moved.current = true; };
  const up = (e: PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    drag.current = null;
    if (Math.abs(dx) > 40) paso(dx < 0 ? 1 : -1);
  };

  const progreso = maxI === 0 ? 1 : (pos + 1) / (maxI + 1);
  return (
    <div className="ag-alb" role="region" aria-roledescription="carrusel" aria-label="Álbumes de puntajes">
      <div className="ag-alb-tabs" role="tablist" aria-label="Elegir álbum" onKeyDown={onTabKey}>
        {ALBUMES.map((al, k) => (
          <button
            key={al.id}
            ref={(el) => { tabs.current[k] = el; }}
            type="button"
            role="tab"
            id={`${uid}-alb-tab-${al.id}`}
            aria-selected={k === a}
            aria-controls={`${uid}-alb-panel`}
            tabIndex={k === a ? 0 : -1}
            className="ag-alb-tab"
            onClick={() => irAlbum(k)}
          >
            {corto(al.titulo)}
          </button>
        ))}
      </div>
      <div
        id={`${uid}-alb-panel`}
        role="tabpanel"
        aria-labelledby={`${uid}-alb-tab-${album.id}`}
        tabIndex={0}
        onKeyDown={onPanelKey}
        className="ag-alb-panel"
      >
        <div key={album.id} className={`ag-alb-anim ${dir > 0 ? 'is-next' : 'is-prev'}`}>
          <div
            className="ag-alb-vp"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={() => { drag.current = null; }}
            onClickCapture={(e) => { if (moved.current) { e.preventDefault(); e.stopPropagation(); moved.current = false; } }}
          >
            <ul className="ag-alb-track" style={{ ['--i' as string]: pos }}>
              {album.fotos.map((f, k) => {
                const visible = k >= pos && k < pos + (ancho ? 3 : 2);
                const pts = puntaje(f.alt);
                return (
                  <li key={f.src} className="ag-alb-card" role="group" aria-roledescription="tarjeta" aria-label={`${k + 1} de ${total}`} aria-hidden={visible ? undefined : true}>
                    <img src={f.src} alt={f.alt} width={1080} height={1350} draggable={false} loading={k < 3 ? undefined : 'lazy'} decoding="async" />
                    <div className="ag-alb-card-txt" aria-hidden="true">
                      <p className="ag-alb-nombre">{nombre(f.alt)}</p>
                      {pts ? <p className="ag-alb-pts">{pts}<small>/500</small></p> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="ag-alb-bot">
          <div className="ag-alb-bar" aria-hidden="true"><i style={{ transform: `scaleX(${progreso})` }} /></div>
          <button type="button" className="ag-alb-btn" aria-label="Anterior" onClick={() => paso(-1)}>‹</button>
          <button type="button" className="ag-alb-btn" aria-label="Siguiente" onClick={() => paso(1)}>›</button>
        </div>
        <a className="ag-alb-ig" href={album.url} target="_blank" rel="noopener noreferrer">
          Ver álbum en Instagram <span aria-hidden="true">↗</span><span className="ag-ig-sr"> (se abre en una pestaña nueva)</span>
        </a>
      </div>
    </div>
  );
}
