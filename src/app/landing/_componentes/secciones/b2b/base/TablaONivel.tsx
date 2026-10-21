'use client';

import { useState, type KeyboardEvent } from 'react';
import { marcaEntregable, type MarcaEntrega } from '../../../../_contenido/b2b/servicio';

function Punto({ marca }: { marca: MarcaEntrega }) {
  const nombre = marca === 'si' ? 'Incluido' : marca === 'no' ? 'No aplica' : 'Parcial';
  return <span className={`ag-b2b-punto is-${marca}`} role="img" aria-label={nombre} />;
}

export function TablaONivel({
  caption,
  headers,
  rows,
  puntos = false,
}: {
  caption: string;
  headers: readonly string[];
  rows: readonly (readonly string[])[];
  puntos?: boolean;
}) {
  const columnas = headers.slice(1);
  const [columna, setColumna] = useState(columnas.length - 1);
  const mover = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    setColumna((actual) => (actual + delta + columnas.length) % columnas.length);
  };

  return (
    <div className="ag-b2b-tabla">
      <div className="ag-table-wrap ag-b2b-solo-ancho">
        <table className="ag-table">
          <caption>{caption}</caption>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={header} scope="col" className={index === headers.length - 1 ? 'is-ultimo' : undefined}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((fila) => (
              <tr key={fila[0]}>
                <th scope="row">{fila[0]}</th>
                {fila.slice(1).map((celda, index) => (
                  <td key={`${fila[0]}-${index}`} className={index === fila.length - 2 ? 'is-ultimo' : undefined}>
                    {puntos ? <Punto marca={marcaEntregable(celda)} /> : celda}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {puntos ? (
        <p className="ag-b2b-leyenda ag-b2b-solo-ancho">
          <span className="ag-b2b-punto is-si" /> Incluido
          <span className="ag-b2b-punto is-parcial" /> Parcial
          <span className="ag-b2b-punto is-no" /> No aplica
        </p>
      ) : null}
      <div className="ag-b2b-solo-estrecho">
        <div className="ag-b2b-tabs" role="tablist" aria-label={caption} onKeyDown={mover}>
          {columnas.map((nombre, index) => (
            <button key={nombre} type="button" role="tab" aria-selected={columna === index} onClick={() => setColumna(index)}>
              {nombre}
            </button>
          ))}
        </div>
        <ul className="ag-b2b-filas">
          {rows.map((fila) => (
            <li key={fila[0]}>
              <strong>{fila[0]}</strong>
              <span>{fila[columna + 1]}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
