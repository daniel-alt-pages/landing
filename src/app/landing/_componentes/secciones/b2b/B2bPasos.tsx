'use client';

import { useState } from 'react';
import { B2B_N1 } from '../../../_contenido/b2b/programa';
import { SeccionB2b } from './base/SeccionB2b';

/**
 * Paso a paso gamificado (sobrio, B2B): progreso «Paso X de N» y desbloqueo secuencial.
 * Contenido: etapas del Nivel 1 (programa.ts). Los títulos de todas las etapas siempre son visibles;
 * «Ver todas las etapas» abre el detalle completo sin recorrerlo.
 */
export function B2bPasos() {
  const etapas = B2B_N1.etapas;
  const total = etapas.length;
  const [hechos, setHechos] = useState(0);
  const todo = hechos >= total;

  return (
    <SeccionB2b
      id="paso-a-paso"
      tone="white"
      numero="02"
      pregunta="¿Cómo se aplica?"
      titulo="Etapas del Nivel 1"
      acento="Nivel 1"
      bajada={B2B_N1.flujo}
    >
      <div className="b2p-prog">
        <span aria-live="polite">{todo ? `${total} de ${total} etapas` : `Paso ${hechos + 1} de ${total}`}</span>
        <div className="b2p-barra" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={hechos} aria-label="Avance del recorrido">
          <i style={{ transform: `scaleX(${hechos / total})` }} />
        </div>
        {!todo && <button type="button" className="b2p-link" onClick={() => setHechos(total)}>Ver todas las etapas</button>}
      </div>
      <ol className="b2p-pasos">
        {etapas.map((e, i) => {
          const estado = i < hechos ? 'hecho' : i === hechos ? 'activo' : 'bloqueado';
          return (
            <li key={e.n} className="b2p-paso" data-estado={estado}>
              <span className="b2p-n" aria-hidden="true">{estado === 'hecho' ? '✓' : e.n}</span>
              <div>
                <h3>{e.title}</h3>
                <p className="b2p-sub">{e.sub}</p>
                {estado !== 'bloqueado' ? (
                  <ul>{e.points.map((p) => <li key={p}>{p}</li>)}</ul>
                ) : (
                  <p className="b2p-lock">Se desbloquea al completar el paso {i}</p>
                )}
                {estado === 'activo' && (
                  <button type="button" className="b2p-sig" onClick={() => setHechos((h) => h + 1)}>
                    {i === total - 1 ? 'Finalizar recorrido' : 'Siguiente paso'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {todo && <p className="b2p-fin"><a className="ag-b2b-btn" href="#solicitar-reunion">Agendar reunión</a></p>}
    </SeccionB2b>
  );
}
