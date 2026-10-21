import { OFERTA } from '../../_contenido/oferta';
import { contactoHref } from '../../_lib/links';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';

export function PrimerPaso() {
  return (
    <Section id="como-empieza" tone="paper" label="empieza-title" className="ag-primer">
      <DisplayTitle id="empieza-title" lines={[{ text: 'Cómo funciona' }, { text: 'el primer paso', accent: true }]} />
      <Lead>{OFERTA.lead}</Lead>
      <ol className="ag-step-rail ag-steps-4 ag-step-photos ag-plain-list">
        {OFERTA.simulacro.pasos.map((paso) => (
          <li key={paso.n} className="ag-card">
            <img className="ag-step-photo" src={paso.image} alt={paso.imageAlt} width={640} height={400} />
            <div className="ag-step-copy">
              <div className="ag-step-head">
                <span className="ag-num">{paso.n.padStart(2, '0')}</span>
                <h3 className="ag-h3">{paso.title}</h3>
              </div>
              <p>{paso.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="ag-primer-foot">
        <p>{OFERTA.simulacro.nota}</p>
        <a className="ag-btn" href={contactoHref('simulacro')}>
          {OFERTA.simulacro.cta}
        </a>
      </div>
    </Section>
  );
}
