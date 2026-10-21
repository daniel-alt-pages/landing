import { BENEFICIOS_ESTUDIANTES } from '../../_contenido/beneficios';
import { BrandPhoto } from '../primitivas/BrandPhoto';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';

export function StudentBenefits() {
  return (
    <Section id="estudiantes-beneficios" tone="paper" label="est-ben-title">
      <div className="ag-benefit-split">
        <BrandPhoto alt="Estudiante con el material de preparación Saber 11." />
        <div>
          <DisplayTitle
            id="est-ben-title"
            lines={[{ text: BENEFICIOS_ESTUDIANTES.title[0] }, { text: BENEFICIOS_ESTUDIANTES.title[1], accent: true }]}
          />
          <Lead>{BENEFICIOS_ESTUDIANTES.lead}</Lead>
          <ol className="ag-step-rail ag-steps-v">
            {BENEFICIOS_ESTUDIANTES.items.map((item) => (
              <li key={item.n}>
                <span className="ag-num ag-num-sm">{item.n}</span>
                <div>
                  <h3 className="ag-h3">{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="ag-h3" style={{ marginTop: 8 }}>
            {BENEFICIOS_ESTUDIANTES.cierre}
          </p>
        </div>
      </div>
    </Section>
  );
}
