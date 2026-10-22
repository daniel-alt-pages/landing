'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { B2B_N1, B2B_N2, B2B_N3 } from '../../../_contenido/b2b/programa';
import { DatoB2b } from './base/DatoB2b';
import { Plegable } from './base/Plegable';
import { SeccionB2b } from './base/SeccionB2b';
import { RutaSvg } from './diagramas/RutaSvg';
import { EcosistemaArticulado } from './diagramas/EcosistemaArticulado';
import { Alertas, CapasPilares, CicloAnual, Reuniones, SemestralAnual } from './diagramas/Portafolio';

const NIVELES = ['n1', 'n2', 'n3'] as const;
type NivelId = (typeof NIVELES)[number];
const ETIQUETAS: Record<NivelId, string> = { n1: 'Nivel 1', n2: 'Nivel 2', n3: 'Nivel 3' };

function esNivel(id: string): id is NivelId {
  return NIVELES.includes(id as NivelId);
}

function Panel1() {
  return (
    <div id="n1">
      <h3>Evaluación institucional tipo Saber 11</h3>
      <RutaSvg etiqueta="Etapas del Nivel 1" pasos={B2B_N1.etapas.map((paso) => ({ title: paso.title, text: paso.sub }))} />
      <div className="ag-b2b-datos">
        <DatoB2b cifra="0–500" linea="Escala del puntaje global" />
        <DatoB2b cifra="5 áreas" linea="Matemáticas, lectura, ciencias, sociales e inglés" />
        <DatoB2b cifra="1,5 a 2 h" linea="Socialización con directivos" />
      </div>
      <Plegable titulo="Propósito del simulacro" cuenta="3 usos">
        <ul className="ag-b2b-lista">
          {B2B_N1.propositos.map((item) => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}
        </ul>
      </Plegable>
      <Plegable titulo="Modalidad de aplicación" cuenta="Digital o física">
        <p>{B2B_N1.modalidad}</p>
        <p>{B2B_N1.aclaracion}</p>
      </Plegable>
    </div>
  );
}

const RECIBE = { estudiante: { label: 'Estudiante', items: B2B_N2.estudiante }, institucion: { label: 'Institución', items: B2B_N2.institucion } } as const;
type RecibeId = keyof typeof RECIBE;

/** Columna lateral del Nivel 2: «Qué recibe» con pestañas Estudiante / Institución. */
function QueRecibe() {
  const [quien, setQuien] = useState<RecibeId>('estudiante');
  const ids = Object.keys(RECIBE) as RecibeId[];
  const teclado = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const sig = event.key === 'Home' ? ids[0] : event.key === 'End' ? ids[ids.length - 1] : ids[(ids.indexOf(quien) + 1) % ids.length];
    setQuien(sig);
    document.getElementById(`n2-recibe-tab-${sig}`)?.focus();
  };
  return (
    <aside className="s5-recibe" aria-labelledby="n2-recibe-t">
      <h4 id="n2-recibe-t" className="s5-k">Qué recibe</h4>
      <div className="s5-tabs is-llenas" role="tablist" aria-label="Qué recibe cada uno" onKeyDown={teclado}>
        {ids.map((id) => (
          <button key={id} type="button" role="tab" id={`n2-recibe-tab-${id}`} aria-selected={quien === id}
            aria-controls={`n2-recibe-panel-${id}`} tabIndex={quien === id ? 0 : -1} onClick={() => setQuien(id)}>
            {RECIBE[id].label}
          </button>
        ))}
      </div>
      {ids.map((id) => (
        <ul key={id} className="s5-recibe-lista" role="tabpanel" id={`n2-recibe-panel-${id}`} aria-labelledby={`n2-recibe-tab-${id}`} hidden={quien !== id}>
          {RECIBE[id].items.map((item) => <li key={item.title}><strong>{item.title}</strong><span>{item.text}</span></li>)}
        </ul>
      ))}
    </aside>
  );
}

function Panel2() {
  return (
    <div id="n2">
      <p className="s5-viene"><span>Viene del Nivel 1:</span> <strong>Analizar</strong> <span aria-hidden="true">→</span> detección de brechas y preguntas críticas</p>
      <div className="s5-n2">
        <div className="s5-n2-main">
          <h3>Los resultados de cada área deciden la formación</h3>
          <div className="ag-b2b-datos">
            <DatoB2b cifra="6 pasos" linea="Del simulacro al informe" />
            <DatoB2b cifra="1 prueba" linea="Verifica si hubo avance" />
          </div>
          <ol className="s5-pasos" aria-label="Ruta del Nivel 2">
            {B2B_N2.pasos.map((p) => (
              <li key={p.n}><span aria-hidden="true">{p.n}</span><div><strong>{p.title}</strong><p>{p.text}</p></div></li>
            ))}
          </ol>
        </div>
        <div className="s5-n2-side">
          <QueRecibe />
          <div className="s5-metodo ag-pf">
            <Plegable titulo="Metodología: el ciclo de corrección" cuenta="6 momentos">
              <ol className="ag-pf-cadena">{B2B_N2.ciclo.map((x) => <li key={x}>{x}</li>)}</ol>
              <ul className="ag-pf-checks">{B2B_N2.metodo.map((x) => <li key={x}>{x}</li>)}</ul>
            </Plegable>
          </div>
        </div>
      </div>
      <p className="ag-pf-nota s5-addon"><strong>Complemento.</strong> {B2B_N2.addon}</p>
    </div>
  );
}

function Panel3() {
  return (
    <div id="n3">
      <h3>Programa institucional integral</h3>
      <div className="ag-b2b-datos">
        <DatoB2b cifra="6 cortes" linea="Reuniones con rectoría por calendario" />
        <DatoB2b cifra="4 actores" linea="Estudiante, familia, docente y directivo" />
      </div>
      <EcosistemaArticulado />
      <CapasPilares />
      <Reuniones />
      <Alertas />
      <SemestralAnual />
      <CicloAnual />
    </div>
  );
}

const PANELES = { n1: Panel1, n2: Panel2, n3: Panel3 } as const;

/**
 * Pestañas de nivel (button role=tab). Al cambiar de nivel no hay salto: se usa history.replaceState (sin pushState
 * ni scrollIntoView) y se reserva la altura del panel anterior (min-height) para que la página no se encoja bajo el lector.
 * Solo se desplaza cuando el nivel llega por un enlace con hash (#n1, #n2, #n3), al cargar o por hashchange.
 */
export function B2bPrograma() {
  const [activo, setActivo] = useState<NivelId>('n1');
  const caja = useRef<HTMLDivElement>(null);
  const desdeHash = useRef(false);

  useEffect(() => {
    const abrir = () => {
      const id = window.location.hash.replace('#', '');
      if (!esNivel(id)) return;
      desdeHash.current = true;
      setActivo(id);
    };
    abrir();
    window.addEventListener('hashchange', abrir);
    return () => window.removeEventListener('hashchange', abrir);
  }, []);

  useEffect(() => {
    if (!desdeHash.current) return;
    desdeHash.current = false;
    if (caja.current) caja.current.style.minHeight = '';
    document.getElementById(activo)?.scrollIntoView({ block: 'start' });
  }, [activo]);

  const elegir = (id: NivelId) => {
    if (id === activo) return;
    const el = caja.current;
    // Reserva la altura visible del panel que se deja (hasta un alto de pantalla) para que el contenido no salte.
    if (el) el.style.minHeight = `${Math.min(el.offsetHeight, window.innerHeight)}px`;
    window.history.replaceState(window.history.state, '', `#${id}`);
    setActivo(id);
  };

  const mover = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = NIVELES.indexOf(activo);
    const siguiente = event.key === 'Home' ? NIVELES[0] : event.key === 'End' ? NIVELES[NIVELES.length - 1]
      : NIVELES[(index + (event.key === 'ArrowRight' ? 1 : -1) + NIVELES.length) % NIVELES.length];
    elegir(siguiente);
    document.getElementById(`b2b-nivel-${siguiente}`)?.focus({ preventScroll: true });
  };

  return (
    <SeccionB2b
      id="programa"
      tone="grey"
      numero="05"
      pregunta="¿Qué pasa en cada nivel?"
      titulo="Qué pasa en cada nivel, del simulacro al informe"
      acento="cada nivel"
      bajada="Mide, interviene o sostiene la mejora."
    >
      <div className="ag-b2b-tabs s5-niveles-tabs" role="tablist" aria-label="Ir a un nivel" onKeyDown={mover}>
        {NIVELES.map((id) => (
          <button
            key={id}
            type="button"
            id={`b2b-nivel-${id}`}
            role="tab"
            aria-selected={activo === id}
            aria-controls={`b2b-panel-${id}`}
            tabIndex={activo === id ? 0 : -1}
            onClick={() => elegir(id)}
          >
            {ETIQUETAS[id]}
          </button>
        ))}
      </div>
      <div ref={caja} className="s5-niveles">
        {NIVELES.map((id) => {
          const Panel = PANELES[id];
          return (
            <div
              key={id}
              className="ag-b2b-nivel"
              role="tabpanel"
              id={`b2b-panel-${id}`}
              aria-labelledby={`b2b-nivel-${id}`}
              data-activo={activo === id ? 'true' : 'false'}
            >
              <Panel />
            </div>
          );
        })}
      </div>
    </SeccionB2b>
  );
}
