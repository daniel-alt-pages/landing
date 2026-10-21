'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState, type KeyboardEvent } from 'react';
import { B2B_N1, B2B_N2, B2B_N3 } from '../../../_contenido/b2b/programa';
import { DatoB2b } from './base/DatoB2b';
import { Plegable } from './base/Plegable';
import { SeccionB2b } from './base/SeccionB2b';
import { TablaONivel } from './base/TablaONivel';
import { CicloSvg } from './diagramas/CicloSvg';
import { CurvaT0T2 } from './diagramas/CurvaT0T2';
import { DobleY } from './diagramas/DobleY';
import { LineaTiempo } from './diagramas/LineaTiempo';
import { RutaSvg } from './diagramas/RutaSvg';
import { Semaforo } from './diagramas/Semaforo';

const NIVELES = ['n1', 'n2', 'n3'] as const;
type NivelId = (typeof NIVELES)[number];
const ETIQUETAS: Record<NivelId, string> = { n1: 'Nivel 1', n2: 'Nivel 2', n3: 'Nivel 3' };

function esNivel(id: string): id is NivelId {
  return NIVELES.includes(id as NivelId);
}

function Panel1() {
  return (
    <div id="n1">
      <h3>Evaluación institucional</h3>
      <RutaSvg etiqueta="Etapas del Nivel 1" pasos={B2B_N1.etapas.map((paso) => ({ title: paso.title, text: paso.sub }))} />
      <div className="ag-b2b-datos">
        <DatoB2b valor="0–500" linea="Escala del puntaje global" />
        <DatoB2b valor="5 áreas" linea="Matemáticas, lectura, ciencias, sociales e inglés" />
        <DatoB2b valor="1,5 a 2 h" linea="Socialización con directivos" />
      </div>
      <DobleY alumno={B2B_N1.doble.alumno.slice(0, 4)} directivo={B2B_N1.doble.directivo.slice(0, 4)} />
      <Plegable titulo="Propósito del simulacro" cuenta="3 usos">
        <ul className="ag-b2b-lista">
          {B2B_N1.propositos.map((item) => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}
        </ul>
      </Plegable>
      <Plegable titulo="Modalidad y lectura completa" cuenta="Dos públicos">
        <p>{B2B_N1.modalidad}</p>
        <p>{B2B_N1.aclaracion}</p>
        <DobleY alumno={B2B_N1.doble.alumno} directivo={B2B_N1.doble.directivo} />
      </Plegable>
    </div>
  );
}

function Panel2() {
  return (
    <div id="n2">
      <h3>Los resultados deciden la formación</h3>
      <RutaSvg etiqueta="Ruta del Nivel 2" pasos={B2B_N2.pasos} />
      <div className="ag-b2b-datos">
        <DatoB2b valor="20 h" linea="Clases en vivo sobre los errores" />
        <DatoB2b valor="6 pasos" linea="Del simulacro al informe" />
        <DatoB2b valor="1 prueba" linea="Verifica si hubo avance" />
      </div>
      <div className="ag-b2b-dos">
        <article>
          <h3>Estudiantes</h3>
          <ul className="ag-b2b-lista">{B2B_N2.estudiante.slice(0, 3).map((item) => <li key={item.title}>{item.title}</li>)}</ul>
        </article>
        <article>
          <h3>Institución</h3>
          <ul className="ag-b2b-lista">{B2B_N2.institucion.slice(0, 3).map((item) => <li key={item.title}>{item.title}</li>)}</ul>
        </article>
      </div>
      <Plegable titulo="Método" cuenta="4 principios">
        <ul className="ag-b2b-lista">{B2B_N2.metodo.map((item) => <li key={item}>{item}</li>)}</ul>
      </Plegable>
      <Plegable titulo="Ciclo de aula" cuenta="6 pasos">
        <ol className="ag-b2b-lista">{B2B_N2.ciclo.map((item) => <li key={item}>{item}</li>)}</ol>
      </Plegable>
      <Plegable titulo="Ampliar horas" cuenta="+20, +30 o +50">
        <p>{B2B_N2.addon}</p>
        <ul className="ag-b2b-lista">
          {B2B_N2.estudiante.map((item) => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}
          {B2B_N2.institucion.map((item) => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}
        </ul>
      </Plegable>
    </div>
  );
}

function Panel3() {
  return (
    <div id="n3">
      <h3>Programa institucional integral</h3>
      <CicloSvg pasos={B2B_N3.ciclo} centro="50 h de refuerzo entre calendarios." />
      <Semaforo />
      <div className="ag-b2b-datos">
        <DatoB2b valor="426 h" linea="Experiencia del estudiante, no solo clase" />
        <DatoB2b valor="6 cortes" linea="Reuniones con rectoría por calendario" />
        <DatoB2b valor="4 actores" linea="Estudiante, familia, docente y directivo" />
      </div>
      <ol className="ag-b2b-capas">
        {B2B_N3.capas.map((capa) => (
          <li key={capa.n}><strong>{capa.title}</strong></li>
        ))}
      </ol>
      <LineaTiempo marcas={B2B_N3.reuniones} />
      <Plegable titulo="Familias, directivos y docentes" cuenta="3 frentes">
        {B2B_N3.pilares.map((pilar) => (
          <div key={pilar.title}>
            <h3>{pilar.title}</h3>
            <ul className="ag-b2b-lista">{pilar.points.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        ))}
      </Plegable>
      <Plegable titulo="Alertas y acta" cuenta="5 tipos">
        <ul className="ag-b2b-lista">{B2B_N3.alertas.map((item) => <li key={item.title}><strong>{item.title}.</strong> {item.text}</li>)}</ul>
        <p>{B2B_N3.escalamiento}</p>
        <ul className="ag-b2b-lista">{B2B_N3.severidad.map((item) => <li key={item}>{item}</li>)}</ul>
        <ul className="ag-b2b-lista">{B2B_N3.acta.map((item) => <li key={item}>{item}</li>)}</ul>
      </Plegable>
      <Plegable titulo="Semestral o anual" cuenta="8 componentes">
        <TablaONivel caption="Modalidad semestral y anual" headers={B2B_N3.modalidadHeaders} rows={B2B_N3.modalidad} />
        <p>{B2B_N3.modalidadLead}</p>
      </Plegable>
      <Plegable titulo="Refuerzo y verificación" cuenta="T0, T1 y T2">
        <ul className="ag-b2b-lista">{B2B_N3.refuerzo.map((item) => <li key={item}>{item}</li>)}</ul>
        <p>{B2B_N3.medicion}</p>
        <CurvaT0T2 />
      </Plegable>
    </div>
  );
}

const PANELES = { n1: Panel1, n2: Panel2, n3: Panel3 } as const;

export function B2bPrograma() {
  const [activo, setActivo] = useState<NivelId>('n1');
  const reducir = useReducedMotion();

  useEffect(() => {
    const abrir = () => {
      const id = window.location.hash.replace('#', '');
      if (!esNivel(id)) return;
      setActivo(id);
    };
    abrir();
    window.addEventListener('hashchange', abrir);
    return () => window.removeEventListener('hashchange', abrir);
  }, []);

  useEffect(() => {
    if (window.location.hash.replace('#', '') !== activo) return;
    document.getElementById(activo)?.scrollIntoView({ block: 'start' });
  }, [activo]);

  const Panel = PANELES[activo];

  const mover = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const index = NIVELES.indexOf(activo);
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const siguiente = NIVELES[(index + delta + NIVELES.length) % NIVELES.length];
    window.history.pushState(null, '', `#${siguiente}`);
    setActivo(siguiente);
    document.getElementById(`b2b-nivel-${siguiente}`)?.focus();
  };

  return (
    <SeccionB2b
      id="programa"
      tone="grey"
      numero="04"
      pregunta="¿Qué pasa en cada nivel?"
      titulo="La ruta de cada nivel"
      acento="cada nivel"
      bajada="Mide, interviene o sostiene la mejora."
    >
      <div className="ag-b2b-tabs" role="tablist" aria-label="Ir a un nivel" onKeyDown={mover}>
        {NIVELES.map((id) => (
          <a
            key={id}
            id={`b2b-nivel-${id}`}
            href={`#${id}`}
            role="tab"
            aria-selected={activo === id}
            tabIndex={activo === id ? 0 : -1}
            onClick={(event) => {
              event.preventDefault();
              window.history.pushState(null, '', `#${id}`);
              setActivo(id);
            }}
          >
            {ETIQUETAS[id]}
          </a>
        ))}
      </div>
      <motion.div
        key={activo}
        initial={reducir ? false : { opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <Panel />
      </motion.div>
    </SeccionB2b>
  );
}
