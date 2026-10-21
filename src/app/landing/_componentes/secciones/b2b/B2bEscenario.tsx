'use client';

import { useState } from 'react';
import { B2B_MODULOS_VISIBLES, B2B_PLATAFORMA } from '../../../_contenido/b2b/servicio';

const ROLES = [
  {
    id: 'directivo' as const,
    label: 'Rectoría',
    path: 'plataforma / rectoría',
    lead: 'Vista de la institución y de los grupos.',
    image: '/landing/pantallas/coordinador.webp',
    alt: 'Ejemplo del panel de rectoría con el promedio del grupo y las áreas.',
    column: 3,
  },
  {
    id: 'estudiante' as const,
    label: 'Estudiante',
    path: 'plataforma / estudiante',
    lead: 'Avance, clases y resultados de la persona.',
    image: '/landing/pantallas/estudiante.webp',
    alt: 'Ejemplo de la vista del estudiante en la plataforma.',
    column: 1,
  },
  {
    id: 'docente' as const,
    label: 'Docente',
    path: 'plataforma / docente',
    lead: 'La información del grupo, con los permisos del docente.',
    image: '/landing/pantallas/desafios.webp',
    alt: 'Ejemplo de práctica y desafíos en la plataforma.',
    column: 3,
  },
  {
    id: 'familia' as const,
    label: 'Familia',
    path: 'plataforma / familia',
    lead: 'Consulta del avance. Esquema, no una captura real.',
    image: '',
    alt: '',
    column: 2,
  },
];

export function B2bEscenario() {
  const [activo, setActivo] = useState<(typeof ROLES)[number]['id']>('directivo');
  const rol = ROLES.find((item) => item.id === activo) ?? ROLES[0];
  const visibles = B2B_PLATAFORMA.rows.filter((fila) => (B2B_MODULOS_VISIBLES as readonly string[]).includes(fila[0]));

  return (
    <div className="ag-b2b-escenario">
      <div className="ag-b2b-visor">
        <div className="ag-b2b-tabs" role="tablist" aria-label="Vista según el rol">
          {ROLES.map((item, index) => (
            <button key={item.id} type="button" role="tab" aria-selected={activo === item.id} onClick={() => setActivo(item.id)}>
              {index + 1}. {item.label}
            </button>
          ))}
        </div>
        <p className="ag-b2b-path">{rol.path}</p>
        <div className={rol.image ? 'ag-b2b-visor-cuerpo has-shot' : 'ag-b2b-visor-cuerpo'}>
          {rol.image ? <img src={rol.image} alt={rol.alt} /> : (
            <svg className="ag-b2b-esquema" viewBox="0 0 280 180" role="img" aria-label="Esquema del tablero familiar: avance, asistencia y una alerta.">
              <rect x="12" y="16" width="256" height="148" rx="16" />
              <text x="28" y="48">Avance del estudiante</text>
              <rect x="28" y="64" width="180" height="10" rx="5" />
              <text x="28" y="104">Asistencia</text>
              <text x="28" y="140">Alerta</text>
            </svg>
          )}
          <div>
            <p>{rol.lead}</p>
            <ul>
              {visibles.map((fila) => (
                <li key={fila[0]}>
                  <strong>{fila[0]}</strong>
                  <span>{fila[rol.column]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
