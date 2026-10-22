'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';

/**
 * Etapa 04 · Analizar: las 3 vistas del informe como pestañas reales (tablist/tab/tabpanel, flechas, Inicio y Fin).
 * El contenido de cada vista es ilustrativo y va marcado con la etiqueta visible EJEMPLO: no hay cifras reales.
 * «Ver alertas N3» es la acción principal (abre el Nivel 3 en la sección 05); «Benchmark» queda dentro de «Más».
 */
const VISTAS = [
  {
    id: 'global',
    label: 'Global y por área',
    texto: 'Muestra el puntaje global en la escala de 0 a 500 y el desglose en las 5 áreas, para ver de un vistazo dónde está cada una.',
    filas: ['Puntaje global de la institución', 'Matemáticas', 'Lectura crítica', 'Ciencias naturales', 'Sociales y ciudadanas', 'Inglés'],
  },
  {
    id: 'cohorte',
    label: 'Por cohorte',
    texto: 'Compara los grupos de un mismo grado (por ejemplo, 11A frente a 11B) con su media y su dispersión.',
    filas: ['Grupo A: media y dispersión', 'Grupo B: media y dispersión', 'Grupo C: media y dispersión'],
  },
  {
    id: 'historico',
    label: 'Histórico',
    texto: 'Cuando la institución tiene pruebas anteriores, ubica cada corte en una línea de tiempo para ver la evolución.',
    filas: ['Corte anterior', 'Corte actual', 'Variación entre cortes'],
  },
] as const;

type VistaId = (typeof VISTAS)[number]['id'];

function Ejemplo() {
  return <span className="s5-ejemplo">Ejemplo</span>;
}

export function InformeAnalizar() {
  const base = useId();
  const [vista, setVista] = useState<VistaId>('global');
  const [mas, setMas] = useState(false);
  const [bench, setBench] = useState(false);
  const tabs = useRef<Record<string, HTMLButtonElement | null>>({});

  const teclado = (event: KeyboardEvent<HTMLDivElement>) => {
    const i = VISTAS.findIndex((v) => v.id === vista);
    let j = -1;
    if (event.key === 'ArrowRight') j = (i + 1) % VISTAS.length;
    else if (event.key === 'ArrowLeft') j = (i - 1 + VISTAS.length) % VISTAS.length;
    else if (event.key === 'Home') j = 0;
    else if (event.key === 'End') j = VISTAS.length - 1;
    if (j < 0) return;
    event.preventDefault();
    setVista(VISTAS[j].id);
    tabs.current[VISTAS[j].id]?.focus();
  };

  return (
    <section className="s5-informe" aria-labelledby={`${base}-t`}>
      <div className="s5-informe-cab">
        <span className="s5-informe-n" aria-hidden="true">04</span>
        <div>
          <p className="s5-informe-k">Analizar · Inteligencia institucional</p>
          <h3 id={`${base}-t`} className="s5-informe-t">Qué trae el informe</h3>
        </div>
      </div>

      <div className="s5-tabs" role="tablist" aria-label="Vistas del informe" onKeyDown={teclado}>
        {VISTAS.map((v) => (
          <button
            key={v.id}
            ref={(el) => { tabs.current[v.id] = el; }}
            type="button"
            role="tab"
            id={`${base}-tab-${v.id}`}
            aria-selected={vista === v.id}
            aria-controls={`${base}-panel-${v.id}`}
            tabIndex={vista === v.id ? 0 : -1}
            onClick={() => setVista(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {VISTAS.map((v) => (
        <div
          key={v.id}
          className="s5-panel"
          role="tabpanel"
          id={`${base}-panel-${v.id}`}
          aria-labelledby={`${base}-tab-${v.id}`}
          tabIndex={0}
          hidden={vista !== v.id}
        >
          <h4>{v.label} <Ejemplo /></h4>
          <p>{v.texto}</p>
          <ul className="s5-filas" aria-label={`Vista de ejemplo: ${v.label}`}>
            {v.filas.map((f, k) => (
              <li key={f}><span>{f}</span><span className="s5-barra" style={{ ['--w' as string]: `${[72, 58, 64, 50, 68, 44][k]}%` }} aria-hidden="true" /></li>
            ))}
          </ul>
          <p className="s5-nota">Barras ilustrativas, sin datos reales: el informe de su institución trae sus propias cifras.</p>
        </div>
      ))}

      <div className="s5-acciones">
        <a className="s5-btn is-primario" href="#n3">Ver alertas N3</a>
        <div className="s5-mas">
          <button type="button" className="s5-btn" aria-expanded={mas} aria-controls={`${base}-mas`} onClick={() => setMas((m) => !m)}
            onKeyDown={(e) => { if (e.key === 'Escape') setMas(false); }}>
            Más <span aria-hidden="true">▾</span>
          </button>
          <div id={`${base}-mas`} className="s5-mas-lista" hidden={!mas} onKeyDown={(e) => { if (e.key === 'Escape') setMas(false); }}>
            <button type="button" aria-pressed={bench} onClick={() => { setBench((b) => !b); setMas(false); }}>Benchmark</button>
          </div>
        </div>
      </div>
      {bench && (
        <div className="s5-panel s5-bench">
          <h4>Benchmark <Ejemplo /></h4>
          <p>Ubica a su institución frente a otras instituciones que trabajan con SEAMOSGENIOS y frente a los datos públicos históricos del ICFES. Vista ilustrativa, sin cifras reales.</p>
        </div>
      )}
    </section>
  );
}
