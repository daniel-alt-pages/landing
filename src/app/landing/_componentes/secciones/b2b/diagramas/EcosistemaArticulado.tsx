'use client';

import { useRef } from 'react';
import { B2B_ECOSISTEMA_L13 as E, B2B_NOMBRE_ACTOR } from '../../../../_contenido/b2b/portafolio';
import { useTrazos } from '../base/useTrazos';
import { IconoActor, type Actor } from './IconosActores';

/*
 * Lámina 13. Lienzo ≥1200: viewBox 1000×620 y cajas en % del mismo lienzo (misma proporción,
 * por eso el SVG y el HTML coinciden). Cajas (x, y, ancho, alto):
 * estudiante 370,0,260,140 · sg 370,215,260,170 · docentes 0,225,240,150
 * familias 760,225,240,150 · directivos 330,470,340,150
 */
const CAJAS: Record<Actor, [number, number, number, number]> = {
  estudiante: [370, 0, 260, 140],
  sg: [370, 215, 260, 170],
  docentes: [0, 225, 240, 150],
  familias: [760, 225, 240, 150],
  directivos: [330, 470, 340, 150],
};

type Flecha = { d: string; punta: string; rojo: boolean; x: number; y: number; label: string };
// La punta es un triángulo cerrado en el extremo de llegada.
const up = (x: number, y: number) => `M${x} ${y} l-7 12 h14 Z`;
const down = (x: number, y: number) => `M${x} ${y} l-7 -12 h14 Z`;
const left = (x: number, y: number) => `M${x} ${y} l12 -7 v14 Z`;
const right = (x: number, y: number) => `M${x} ${y} l-12 -7 v14 Z`;

const FLECHAS: Flecha[] = [
  { d: 'M500 215 V152', punta: up(500, 141), rojo: true, x: 500, y: 180, label: E.relaciones[0].label },
  { d: 'M370 300 H253', punta: left(241, 300), rojo: true, x: 305, y: 300, label: E.relaciones[1].label },
  { d: 'M630 300 H747', punta: right(759, 300), rojo: true, x: 695, y: 300, label: E.relaciones[2].label },
  { d: 'M500 385 V458', punta: down(500, 469), rojo: true, x: 500, y: 427, label: E.relaciones[3].label },
  { d: 'M120 225 V70 H357', punta: right(369, 70), rojo: false, x: 240, y: 70, label: E.relaciones[4].label },
  { d: 'M880 225 V70 H643', punta: left(631, 70), rojo: false, x: 760, y: 70, label: E.relaciones[5].label },
  { d: 'M330 560 H120 V387', punta: up(120, 376), rojo: false, x: 230, y: 560, label: E.relaciones[6].label },
  { d: 'M670 560 H880 V387', punta: up(880, 376), rojo: false, x: 770, y: 560, label: E.relaciones[7].label },
];

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

function Caja({ id }: { id: Actor }) {
  const a = E.actores[id];
  const [x, y, w, h] = CAJAS[id];
  return (
    <article
      className={`sg-eco-caja is-${id}`}
      style={{ ['--x' as string]: pct(x, 1000), ['--y' as string]: pct(y, 620), ['--w' as string]: pct(w, 1000), ['--h' as string]: pct(h, 620) }}
    >
      <span className="sg-eco-ico"><IconoActor actor={id} /></span>
      <h5>{a.title}</h5>
      <p className="sg-eco-sub">{a.sub}</p>
      {a.text.map((t) => <p key={t}>{t}</p>)}
    </article>
  );
}

function Tramo({ clase, i }: { clase: string; i: number }) {
  const rel = E.relaciones[i];
  return (
    <div className={`sg-eco-tramo ${clase}`} aria-hidden="true">
      <svg viewBox="0 0 24 48" width="24" height="48">
        <path data-trazo pathLength={1} d="M12 46 V12" />
        <path data-punta className="is-punta" d="M12 2 l-7 12 h14 Z" />
      </svg>
      <span>{rel.label}</span>
    </div>
  );
}

export function EcosistemaArticulado() {
  const ref = useRef<HTMLDivElement>(null);
  useTrazos(ref);
  return (
    <div className="sg-eco" id="ecosistema" ref={ref}>
      <p className="sg-eco-eyebrow">{E.eyebrow}</p>
      <h4 className="sg-eco-titulo"><span>{E.acento}</span>{E.titulo.slice(E.acento.length)}</h4>
      <p className="sg-eco-lead">{E.lead}</p>
      <figure className="sg-eco-fig" aria-labelledby="sg-eco-cap">
        <figcaption id="sg-eco-cap" className="ag-b2b-sr">
          Diagrama del ecosistema: el estudiante en el centro; SEAMOSGENIOS envía a cada actor y los directivos respaldan a docentes y familias. La lista de relaciones está debajo.
        </figcaption>
        <div className="sg-eco-scroll" tabIndex={0} role="region" aria-label="Diagrama del ecosistema (desplazable horizontalmente)">
        <div className="sg-eco-lienzo">
          <svg className="sg-eco-svg" viewBox="0 0 1000 620" aria-hidden="true" focusable="false">
            {FLECHAS.map((f) => (
              <g key={f.label} className={f.rojo ? 'is-rojo' : 'is-negro'}>
                <path data-trazo pathLength={1} d={f.d} />
                <path data-punta className="is-punta" d={f.punta} />
              </g>
            ))}
          </svg>
          {FLECHAS.map((f) => (
            <span
              key={f.label}
              data-punta
              aria-hidden="true"
              className={`sg-eco-rotulo ${f.rojo ? 'is-rojo' : ''}`}
              style={{ left: pct(f.x, 1000), top: pct(f.y, 620) }}
            >
              {f.label}
            </span>
          ))}
          <Caja id="docentes" />
          <Caja id="familias" />
          <Caja id="estudiante" />
          <Tramo clase="is-est" i={0} />
          <Caja id="sg" />
          <Tramo clase="is-doc" i={1} />
          <Tramo clase="is-fam" i={2} />
          <Tramo clase="is-dir" i={3} />
          <Caja id="directivos" />
        </div>
        </div>
      </figure>
      <ul className="sg-eco-lista" aria-label="Relaciones del ecosistema">
        {E.relaciones.map((r) => (
          <li key={r.label} className={r.de === 'sg' ? 'is-rojo' : ''}>
            <strong>{r.label}</strong>
            <span>
              {B2B_NOMBRE_ACTOR[r.de]}
              <svg viewBox="0 0 24 12" width="24" height="12" aria-hidden="true"><path d="M1 6h18M15 1l7 5-7 5" /></svg>
              <span className="ag-b2b-sr"> hacia </span>
              {B2B_NOMBRE_ACTOR[r.a]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
