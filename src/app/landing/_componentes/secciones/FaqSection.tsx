import { FAQ, FAQ_TITULO } from '../../_contenido/faq';
import { Accordion } from '../primitivas/Accordion';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';

export function FaqSection() {
  return (
    <Section id="faq" tone="white" label="faq-title">
      <header className="ag-section-head">
        <DisplayTitle id="faq-title" lines={[{ text: FAQ_TITULO[0] }]} />
        <Lead>Las respuestas que más piden rectores y coordinadores antes de dar el primer paso. Si la suya no está, escríbanos.</Lead>
      </header>
      <div className="ag-faq">
        <Accordion items={FAQ} />
        <p className="ag-faq-cta">
          <a className="ag-btn" href="#solicitar-reunion">
            Resolver mis dudas en una reunión
          </a>
        </p>
      </div>
    </Section>
  );
}
