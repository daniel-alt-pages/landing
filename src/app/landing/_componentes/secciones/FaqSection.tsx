import { FAQ, FAQ_TITULO, type FaqItem } from '../../_contenido/faq';
import { Accordion } from '../primitivas/Accordion';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';

export function FaqSection({
  items = FAQ,
  lead = 'Las respuestas que más piden rectores y coordinadores antes de dar el primer paso. Si la suya no está, escríbanos.',
  cta = { href: '#solicitar-reunion', label: 'Agendar reunión de 30 min' },
}: { items?: FaqItem[]; lead?: string; cta?: { href: string; label: string } } = {}) {
  return (
    <Section id="faq" tone="white" label="faq-title">
      <header className="ag-section-head">
        <DisplayTitle id="faq-title" lines={[{ text: FAQ_TITULO[0] }]} />
        <Lead>{lead}</Lead>
      </header>
      <div className="ag-faq">
        <Accordion items={items} />
        <p className="ag-faq-cta">
          <a className="ag-btn" href={cta.href}>
            {cta.label}
          </a>
        </p>
      </div>
    </Section>
  );
}
