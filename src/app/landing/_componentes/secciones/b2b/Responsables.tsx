'use client';

import { useState } from 'react';
import { B2B_GOBIERNO } from '../../../_contenido/b2b/servicio';

const VERBOS = ['Presta', 'Facilita', 'Participa', 'Acompaña', 'Decide'] as const;

export function Responsables() {
  const [activo, setActivo] = useState(0);
  const parte = B2B_GOBIERNO.partes[activo];

  return (
    <>
      <div className="ag-b2b-verbos" role="tablist" aria-label="Quién responde">
        {B2B_GOBIERNO.partes.map((item, index) => (
          <button
            key={item.title}
            type="button"
            role="tab"
            aria-selected={activo === index}
            className={activo === index ? 'is-on' : undefined}
            onClick={() => setActivo(index)}
          >
            <strong>{VERBOS[index]}</strong>
            <span>{item.title}</span>
          </button>
        ))}
      </div>
      <p className="ag-b2b-verbo-texto">{parte.text}</p>
      <ol className="ag-b2b-equipo">
        {B2B_GOBIERNO.roles.map(([rol, texto]) => (
          <li key={rol}><strong>{rol}</strong><span>{texto}</span></li>
        ))}
      </ol>
    </>
  );
}
