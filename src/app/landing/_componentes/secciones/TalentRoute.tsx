import { RUTA } from '../../_contenido/ruta';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';

export function TalentRoute() {
  return (
    <Section id="ruta" tone="black" label="ruta-title">
      <DisplayTitle id="ruta-title" onDark lines={[{ text: RUTA.title[0] }, { text: RUTA.title[1], accent: true }]} />
      <Lead>{RUTA.lead}</Lead>
      <ol className="ag-step-rail ag-steps-v">
        {RUTA.pasos.map((paso) => (
          <li key={paso.n}>
            <span className="ag-num">{paso.n}</span>
            <div>
              <h3 className="ag-h3">{paso.title}</h3>
              <p>{paso.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="ag-card ag-card-dark" style={{ marginTop: 20 }}>
        <h3 className="ag-h3">{RUTA.ladoTitulo}</h3>
        <p>{RUTA.ladoTexto}</p>
      </div>
    </Section>
  );
}
