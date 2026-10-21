'use client';

import { useRef } from 'react';
import { B2B_MODULOS_VISIBLES, B2B_PLATAFORMA } from '../../../../_contenido/b2b/servicio';
import { useTrazos } from '../base/useTrazos';
import { IconoActor, type Actor } from './IconosActores';

/** Columna de B2B_PLATAFORMA.rows que ve cada rol (1 estudiante, 2 familia, 3 docente o directivo). */
const ROLES: { id: Actor; area: string; nombre: string; ruta: string; lead: string; col: 1 | 2 | 3 }[] = [
  { id: 'directivos', area: 'dir', nombre: 'Rectoría', ruta: 'plataforma / rectoría', lead: 'Vista de la institución y de los grupos.', col: 3 },
  { id: 'docentes', area: 'doc', nombre: 'Docente', ruta: 'plataforma / docente', lead: 'La información del grupo, con los permisos del docente.', col: 3 },
  { id: 'estudiante', area: 'est', nombre: 'Estudiante', ruta: 'plataforma / estudiante', lead: 'Avance, clases y resultados de la persona.', col: 1 },
  { id: 'familias', area: 'fam', nombre: 'Familia', ruta: 'plataforma / familia', lead: 'Consulta del avance.', col: 2 },
];

function Conector({ area }: { area: string }) {
  // Dos trazos: horizontal (≥768) y vertical (<768); CSS muestra el que corresponde.
  return (
    <div className={`sg-roles-con is-${area}`} aria-hidden="true">
      <svg className="is-h" viewBox="0 0 100 10" preserveAspectRatio="none"><path data-trazo pathLength={1} d="M0 5 H100" vectorEffect="non-scaling-stroke" /></svg>
      <svg className="is-v" viewBox="0 0 10 100" preserveAspectRatio="none"><path data-trazo pathLength={1} d="M5 0 V100" vectorEffect="non-scaling-stroke" /></svg>
      <span className="sg-roles-nodo" data-punta />
    </div>
  );
}

export function CuatroRoles() {
  const ref = useRef<HTMLDivElement>(null);
  useTrazos(ref);
  const filas = B2B_PLATAFORMA.rows.filter((f) => (B2B_MODULOS_VISIBLES as readonly string[]).includes(f[0]));
  return (
    <figure className="sg-roles" id="cuatro-roles" ref={ref} aria-labelledby="sg-roles-cap">
      <figcaption id="sg-roles-cap" className="sg-roles-cap">
        El mismo dato del estudiante, cuatro vistas según el rol. Cada rol ve solo lo que le corresponde.
      </figcaption>
      <div className="sg-roles-grid">
        {ROLES.map((r) => (
          <article key={r.id} className={`sg-roles-card is-${r.area}`}>
            <header>
              <span className="sg-roles-ico"><IconoActor actor={r.id} /></span>
              <div>
                <h3>{r.nombre}</h3>
                <p className="sg-roles-ruta">{r.ruta}</p>
              </div>
            </header>
            <p>{r.lead}</p>
            <dl>
              {filas.map((f) => (
                <div key={f[0]}><dt>{f[0]}</dt><dd>{f[r.col]}</dd></div>
              ))}
            </dl>
          </article>
        ))}
        <Conector area="dir" />
        <Conector area="doc" />
        <Conector area="fam" />
      </div>
    </figure>
  );
}
