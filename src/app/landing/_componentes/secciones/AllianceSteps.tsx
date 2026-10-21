import { ShieldCheck } from 'lucide-react';
import { ALIANZA_PASOS } from '../../_contenido/landing-pasos';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';

export function AllianceSteps() {
  return (
    <Section id="como-funciona" tone="white" label="como-title">
      <DisplayTitle id="como-title" lines={[{ text: ALIANZA_PASOS.title[0] }, { text: ALIANZA_PASOS.title[1], accent: true }]} />
      <Lead>{ALIANZA_PASOS.lead}</Lead>
      <ol className="ag-step-rail ag-steps-v">
        {ALIANZA_PASOS.pasos.map((paso) => (
          <li key={paso.n}>
            <span className="ag-num">{paso.n}</span>
            <div>
              <h3 className="ag-h3">{paso.title}</h3>
              <p>{paso.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <ul className="ag-grid-4" style={{ marginTop: 16, padding: 0, listStyle: 'none' }}>
        {ALIANZA_PASOS.garantias.map((item) => (
          <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <ShieldCheck color="#0f172a" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p style={{ fontWeight: 800 }}>{ALIANZA_PASOS.cierre}</p>
    </Section>
  );
}
