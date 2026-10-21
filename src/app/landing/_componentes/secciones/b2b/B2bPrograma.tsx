'use client';

import { useEffect, useState, type KeyboardEvent } from 'react';
import { B2B_N1, B2B_N2, B2B_N3 } from '../../../_contenido/b2b/programa';
import { DatoB2b } from './base/DatoB2b';
import { Plegable } from './base/Plegable';
import { SeccionB2b } from './base/SeccionB2b';
import { RutaSvg } from './diagramas/RutaSvg';
import { EcosistemaArticulado } from './diagramas/EcosistemaArticulado';
import { Alertas, CapasPilares, CicloAnual, DobleImpacto, EntregablesN2, Reuniones, SemestralAnual } from './diagramas/Portafolio';

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
      <DobleImpacto />
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
      <EntregablesN2 />
    </div>
  );
}

function Panel3() {
  return (
    <div id="n3">
      <h3>Programa institucional integral</h3>
      <div className="ag-b2b-datos">
        <DatoB2b valor="426 h" linea="Experiencia del estudiante, no solo clase" />
        <DatoB2b valor="6 cortes" linea="Reuniones con rectoría por calendario" />
        <DatoB2b valor="4 actores" linea="Estudiante, familia, docente y directivo" />
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

export function B2bPrograma() {
  const [activo, setActivo] = useState<NivelId>('n1');

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
            aria-controls={`b2b-panel-${id}`}
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
    </SeccionB2b>
  );
}
