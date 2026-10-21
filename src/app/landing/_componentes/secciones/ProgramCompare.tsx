import { COMPARATIVA, PROGRAMAS } from '../../_contenido/programas';
import { Pending } from '../primitivas/bits';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';

export function ProgramCompare() {
  return (
    <Section id="comparar" tone="grey" label="comparar-title">
      <DisplayTitle id="comparar-title" lines={[{ text: 'Dos ritmos' }, { text: 'un mismo examen', accent: true }]} />
      <Lead>El intensivo construye la base. El vacacional corrige en corto. Las horas en vivo sostienen la diferencia.</Lead>
      <div className="ag-grid-2" style={{ marginTop: 28 }}>
        {COMPARATIVA.map((programa) => (
          <article key={programa.id} className="ag-card ag-compare-card">
            <p className="ag-eyebrow">{programa.semanas}</p>
            <h3 className="ag-h3">{programa.titulo}</h3>
            <p className="ag-compare-hours">{programa.enVivo}</p>
            <p>{programa.enfoque}</p>
            <p>
              <strong>Para quién.</strong> {programa.audiencia}
            </p>
            <ul className="ag-compare-points">
              {programa.puntos.map((punto) => (
                <li key={punto}>{punto}</li>
              ))}
            </ul>
            <Pending note={PROGRAMAS.confirmar} block>
              <ul className="ag-hour-list">
                {programa.barras.map((barra) => (
                  <li key={barra.label}>
                    <span>{barra.label}</span>
                    <span>{barra.horas} h</span>
                    <span className="ag-hour-track">
                      <span className="ag-hour-fill" style={{ width: `${Math.round((barra.horas / programa.total) * 100)}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
              <p className="ag-footnote">{programa.extra}</p>
            </Pending>
          </article>
        ))}
      </div>
    </Section>
  );
}
