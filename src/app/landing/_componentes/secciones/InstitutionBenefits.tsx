import Image from 'next/image';
import { BENEFICIOS_INSTITUCION } from '../../_contenido/beneficios';
import { PROGRAMAS_IMAGENES } from '../../_contenido/programas';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';

const TITULOS = ['Puntaje', 'Método', 'Visibilidad', 'Docentes'] as const;

export function InstitutionBenefits() {
  const rows = BENEFICIOS_INSTITUCION.filas;
  const destacados = TITULOS.map((titulo, index) => ({ titulo, texto: rows[index].despues }));
  return (
    <Section id="beneficios" tone="grey" label="beneficios-title">
      <div className="ag-benefit-split">
        <Image
          className="ag-program-photo"
          src={PROGRAMAS_IMAGENES.panel.src}
          alt={PROGRAMAS_IMAGENES.panel.alt}
          width={PROGRAMAS_IMAGENES.panel.width}
          height={PROGRAMAS_IMAGENES.panel.height}
        />
        <div>
          <DisplayTitle
            id="beneficios-title"
            lines={[{ text: BENEFICIOS_INSTITUCION.title[0] }, { text: BENEFICIOS_INSTITUCION.title[1], accent: true }]}
          />
          <Lead>{BENEFICIOS_INSTITUCION.lead}</Lead>
          <ul className="ag-benefit-list">
            {destacados.map((item) => (
              <li key={item.titulo}>
                <h3 className="ag-h3">{item.titulo}</h3>
                <p>{item.texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <details className="ag-more">
        <summary>Ver el antes y el después</summary>
        <div className="ag-only-desktop ag-table-wrap">
          <table className="ag-table">
            <caption className="ag-sr">{BENEFICIOS_INSTITUCION.lead}</caption>
            <thead>
              <tr>
                {BENEFICIOS_INSTITUCION.columns.map((column) => (
                  <th key={column} scope="col">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.antes}>
                  <td>{row.antes}</td>
                  <td className="ag-col-despues">{row.despues}</td>
                  <td className="ag-col-impacto">{row.impacto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ag-only-mobile">
          {rows.map((row) => (
            <article key={row.antes} className="ag-card" style={{ marginBottom: 12 }}>
              <p>
                <strong>Antes.</strong> {row.antes}
              </p>
              <p>
                <strong>Con SeamosGenios.</strong> {row.despues}
              </p>
              <p className="ag-delta">
                <strong>Impacto.</strong> {row.impacto}
              </p>
            </article>
          ))}
        </div>
      </details>
      <p className="ag-h3" style={{ marginTop: 20 }}>
        {BENEFICIOS_INSTITUCION.cierre}
      </p>
    </Section>
  );
}
