import { B2B_N1 } from '../../../_contenido/b2b/programa';
import { SeccionB2b } from './base/SeccionB2b';

/**
 * Etapas del Nivel 1 (propuesta UIUX.md §1): las 5 etapas siempre abiertas, sin desbloqueo.
 * 1440: 5 columnas de 208 px (gap 40) unidas por una línea SVG de 1,5 px. 390: línea de tiempo a la izquierda.
 */
export function B2bPasos() {
  const etapas = B2B_N1.etapas;
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
      <div className="et8">
        <svg className="et8-linea" viewBox="0 0 1200 2" preserveAspectRatio="none" aria-hidden="true">
          <path d="M104 1H1096" vectorEffect="non-scaling-stroke" />
        </svg>
        <ol className="et8-etapas">
          {etapas.map((e) => (
            <li key={e.n} className="et8-etapa">
              <span className="et8-n" aria-hidden="true">{e.n}</span>
              <h3 className="et8-t">{e.title}</h3>
              <p className="et8-sub">{e.sub}</p>
              <ul className="et8-puntos">{e.points.map((p) => <li key={p}>{p}</li>)}</ul>
            </li>
          ))}
        </ol>
      </div>
    </SeccionB2b>
  );
}
