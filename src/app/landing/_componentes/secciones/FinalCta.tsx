import { CONTACTO } from '../../_contenido/contacto';
import { CIERRE } from '../../_contenido/paginas';
import { contactoHref } from '../../_lib/links';
import { buildWaUrl, WA_TEXT } from '../../_lib/whatsapp';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';
import { LeadForm } from './LeadForm';

export function FinalCta() {
  return (
    <Section id="contacto" tone="white" label="contacto-title">
      <span id="solicitar-reunion" className="ag-anchor" aria-hidden />
      <span id="solicitar-simulacro" className="ag-anchor" aria-hidden />
      <header className="ag-section-head">
        <DisplayTitle id="contacto-title" lines={[{ text: CIERRE.title[0] }, { text: CIERRE.title[1], accent: true }]} />
        <Lead>{CIERRE.lead}</Lead>
      </header>
      <div className="ag-close">
        <div className="ag-close-cards">
          {CIERRE.cards.map((card) => {
            const href =
              card.id === 'whatsapp' ? buildWaUrl(CONTACTO.whatsappB2B, WA_TEXT.cta_final) : contactoHref(card.id === 'simulacro' ? 'simulacro' : 'reunion');
            return (
              <article key={card.id} className="ag-close-card">
                <img src={card.mascot} alt={card.mascotAlt} width={512} height={512} />
                <h3 className="ag-h3">{card.title}</h3>
                <p>{card.text}</p>
                <a className="ag-btn" href={href}>
                  {card.cta}
                </a>
              </article>
            );
          })}
        </div>
        <LeadForm />
      </div>
    </Section>
  );
}
