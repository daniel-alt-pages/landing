import { B2B_SIMULACROS } from '../../../../_contenido/b2b/servicio';

const CHIPS = ['Global y por área', 'Percentiles', 'Preguntas críticas', 'Por cohorte', 'Histórico', 'Alertas N3', 'Benchmark'];
const RESULTADO = 5; // índice de «Resultado»: los chips son lo que trae ese paso

/** Proceso de 7 pasos (De la prueba al resultado) con línea SVG de progreso y los chips agrupados bajo el paso 6. */
export function ProcesoInforme() {
  const pasos = B2B_SIMULACROS.rows.map((f) => f[0]);
  const n = pasos.length;
  const x = (i: number) => ((i + 0.5) / n) * 100;
  return (
    <div className="pro7">
      <svg className="pro7-linea is-h" viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true">
        <path className="pro7-base" d={`M${x(0)} 2H${x(n - 1)}`} />
        <path className="pro7-prog" d={`M${x(0)} 2H${x(RESULTADO)}`} pathLength={1} />
      </svg>
      <ol className="pro7-pasos" aria-label="De la prueba al resultado">
        {pasos.map((t, i) => (
          <li key={t} className="pro7-paso" data-resultado={i === RESULTADO || undefined} style={{ gridColumn: i + 1 }}>
            <span className="pro7-n" aria-hidden="true">{i + 1}</span>
            <strong>{t}</strong>
          </li>
        ))}
        <li className="pro7-informe">
          <svg className="pro7-con" viewBox="0 0 10 40" preserveAspectRatio="none" aria-hidden="true"><path d="M5 0V40" vectorEffect="non-scaling-stroke" /></svg>
          <p className="pro7-sub">Qué recibe en el informe</p>
          <ul className="pro7-chips">{CHIPS.map((c) => <li key={c}>{c}</li>)}</ul>
        </li>
      </ol>
    </div>
  );
}
