'use client';

import { useState } from 'react';

export function LineaTiempo({
  marcas,
}: {
  marcas: readonly { n: string; cuando: string; horas: string; points: readonly string[] }[];
}) {
  const [activa, setActiva] = useState(0);
  const marca = marcas[activa];
  return (
    <div className="ag-b2b-tiempo">
      <ol aria-label="Cortes con rectoría">
        {marcas.map((item, index) => (
          <li key={item.n}>
            <button type="button" aria-pressed={activa === index} onClick={() => setActiva(index)}>
              <span>{item.n}</span>
              {item.cuando}
            </button>
          </li>
        ))}
      </ol>
      <article>
        <h3>{marca.cuando}</h3>
        <p>{marca.horas}</p>
        <ul>
          {marca.points.map((punto) => <li key={punto}>{punto}</li>)}
        </ul>
      </article>
    </div>
  );
}
