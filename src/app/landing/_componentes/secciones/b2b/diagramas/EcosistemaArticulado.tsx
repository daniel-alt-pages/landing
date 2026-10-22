'use client';

import { useEffect, useRef } from 'react';
import { B2B_ECOSISTEMA_L13 as E, B2B_NOMBRE_ACTOR } from '../../../../_contenido/b2b/portafolio';
import { useTrazos } from '../base/useTrazos';
import { IconoActor, type Actor } from './IconosActores';

/*
 * Lámina 13 (v3). Cajas HTML en CSS grid y conectores en celdas propias de la retícula
 * (b2b-diagramas-v2.css): sin viewBox que escale el texto y sin rótulos sobre las cajas.
 * Rojas: SEAMOSGENIOS → cada actor. Grises: Docentes/Familias → Estudiante, Directivos → Docentes/Familias.
 */
function Caja({ id }: { id: Actor }) {
  const a = E.actores[id];
  return (
    <article className={`sg-eco-caja is-${id}`}>
      <span className="sg-eco-ico"><IconoActor actor={id} /></span>
      <h5>{a.title}</h5>
      <p>{a.sub}</p>
    </article>
  );
}

function Con({ clase, i }: { clase: string; i: number }) {
  return (
    <div className={`sg-eco-con ${clase}`} aria-hidden="true" data-punta>
      <i className="ln" />
      <i className="pt" />
      <span className="rt">{E.relaciones[i].label}</span>
    </div>
  );
}

function Lienzo({ cruz = false }: { cruz?: boolean }) {
  return (
    <div className={`sg-eco-lienzo${cruz ? ' is-cruz' : ''}`}>
      <Caja id="estudiante" />
      <Con clase="is-v is-est" i={0} />
      <Caja id="sg" />
      <Caja id="docentes" />
      <Con clase="is-h is-doc" i={1} />
      <Con clase="is-h is-der is-fam" i={2} />
      <Caja id="familias" />
      <Con clase="is-v is-abajo is-dir" i={3} />
      <Caja id="directivos" />
      <Con clase="is-negro is-bucle is-arriba is-ltl" i={4} />
      <Con clase="is-negro is-bucle is-arriba is-espejo is-ltr" i={5} />
      <Con clase="is-negro is-bucle is-abajo-b is-lbl" i={6} />
      <Con clase="is-negro is-bucle is-abajo-b is-espejo is-lbr" i={7} />
    </div>
  );
}

export function EcosistemaArticulado() {
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dlgRef = useRef<HTMLDialogElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const abrir = () => { const d = dlgRef.current; if (!d) return; document.documentElement.style.overflow = 'hidden'; d.showModal(); };
  const cerrar = () => dlgRef.current?.close();
  const alCerrar = () => { document.documentElement.style.overflow = ''; btnRef.current?.focus(); };
  useTrazos(ref);
  // Enfocable y nombrado como región solo cuando de verdad hay desplazamiento horizontal.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const sync = () => {
      if (el.scrollWidth > el.clientWidth + 1) {
        el.tabIndex = 0; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Diagrama del ecosistema, desplazable en horizontal');
      } else {
        el.removeAttribute('tabindex'); el.removeAttribute('role'); el.removeAttribute('aria-label');
      }
    };
    sync();
    const ro = new ResizeObserver(sync); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="sg-eco" id="ecosistema" ref={ref}>
      <p className="sg-eco-eyebrow">{E.eyebrow}</p>
      <h4 className="sg-eco-titulo"><span>{E.acento}</span>{E.titulo.slice(E.acento.length)}</h4>
      <p className="sg-eco-lead">{E.lead}</p>
      <figure className="sg-eco-fig" aria-label="Diagrama del ecosistema: el estudiante en el centro; SEAMOSGENIOS envía a cada actor y los directivos respaldan a docentes y familias. Las relaciones se listan a continuación.">
        <div className="sg-eco-scroll" ref={scrollRef}>
          <Lienzo />
        </div>
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
        <button type="button" ref={btnRef} className="sg-eco-ampliar" onClick={abrir} aria-haspopup="dialog">Ampliar diagrama</button>
        <dialog ref={dlgRef} className="sg-eco-dialog" aria-modal="true" aria-labelledby="sg-eco-dlg-t" onClose={alCerrar}>
          <div className="sg-eco-dlg-barra">
            <h2 id="sg-eco-dlg-t">El ecosistema articulado de los 4 actores</h2>
            <button type="button" className="sg-eco-cerrar" onClick={cerrar} aria-label="Cerrar" autoFocus>
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
            </button>
          </div>
          <p className="sg-eco-dlg-pista">Pellizque para ampliar y desplácese para recorrer el diagrama.</p>
          <div className="sg-eco-dlg-area" role="img" aria-label="Diagrama del ecosistema en tamaño completo; las relaciones se listan en la página.">
            <Lienzo cruz />
          </div>
        </dialog>
      </figure>
    </div>
  );
}
