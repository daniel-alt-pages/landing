import { ACCESO_LABEL, CATALOGO, COMPARTIDO, type Acceso } from '../../_contenido/programas';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';

function AccesoBadge({ value }: { value: Acceso | null }) {
  if (!value) return <span className="ag-acceso ag-acceso-no">No aplica</span>;
  return <span className={`ag-acceso ag-acceso-${value}`}>{ACCESO_LABEL[value]}</span>;
}

export function SimulacroCatalog() {
  return (
    <Section id="simulacros" tone="paper" label="simulacros-title">
      <DisplayTitle id="simulacros-title" lines={[{ text: 'Qué prueba ve' }, { text: 'cada grupo', accent: true }]} />
      <Lead>{COMPARTIDO.texto}</Lead>
      <div className="ag-only-desktop ag-table-wrap">
        <table className="ag-table">
          <caption className="ag-sr">{COMPARTIDO.titulo}</caption>
          <thead>
            <tr>
              <th scope="col">Semana</th>
              <th scope="col">Código</th>
              <th scope="col">Simulacro</th>
              <th scope="col">Intensivo</th>
              <th scope="col">Vacacional</th>
              <th scope="col">Abierto</th>
            </tr>
          </thead>
          <tbody>
            {CATALOGO.map((item) => (
              <tr key={item.codigo}>
                <td>{item.semana}</td>
                <td>{item.codigo}</td>
                <th scope="row">{item.nombre}</th>
                <td>
                  <AccesoBadge value={item.intensivo} />
                </td>
                <td>
                  <AccesoBadge value={item.vacacional} />
                </td>
                <td>
                  <AccesoBadge value={item.abierto} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ag-only-mobile ag-catalog-cards">
        {CATALOGO.map((item) => (
          <article key={item.codigo} className="ag-card">
            <p className="ag-eyebrow">{item.codigo}</p>
            <h3 className="ag-h3">{item.nombre}</h3>
            <p>{item.semana}</p>
            <ul className="ag-acceso-list">
              <li>
                Intensivo <AccesoBadge value={item.intensivo} />
              </li>
              <li>
                Vacacional <AccesoBadge value={item.vacacional} />
              </li>
              <li>
                Abierto <AccesoBadge value={item.abierto} />
              </li>
            </ul>
          </article>
        ))}
      </div>
    </Section>
  );
}
