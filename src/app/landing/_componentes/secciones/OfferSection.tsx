import { Check } from 'lucide-react';
import { formatCOP, SIMULATION_PRICES } from '@/lib/cotizacionSimulacro';
import { CONTACTO } from '../../_contenido/contacto';
import { OFERTA } from '../../_contenido/oferta';
import { contactoHref } from '../../_lib/links';
import { buildWaUrl, WA_TEXT } from '../../_lib/whatsapp';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';
import { Pending } from '../primitivas/bits';

export function OfferSection() {
  const precio = OFERTA.mostrarPrecioUnitario
    ? `Desde ${formatCOP(SIMULATION_PRICES.institution)} por estudiante`
    : OFERTA.precioTexto;
  return (
    <Section id="oferta" tone="black" label="oferta-title">
      <DisplayTitle id="oferta-title" onDark lines={[{ text: OFERTA.title[0] }, { text: OFERTA.title[1], accent: true }]} />
      <Lead>{OFERTA.lead}</Lead>
      <div className="ag-offer-grid" style={{ marginTop: 28 }}>
        <article id="simulacro-gratis" className="ag-card ag-card-dark ag-offer-card">
          <p className="ag-eyebrow">{OFERTA.simulacro.titulo}</p>
          <p className="ag-stat-num">{OFERTA.simulacro.precio}</p>
          <ol className="ag-mini-steps">
            {OFERTA.simulacro.pasos.map((paso) => (
              <li key={paso.n}>
                <span className="ag-num ag-num-sm">{paso.n}</span>
                <span>
                  <strong>{paso.title}.</strong> {paso.text}
                </span>
              </li>
            ))}
          </ol>
          <p>{OFERTA.simulacro.nota}</p>
          <a className="ag-btn" href={contactoHref('simulacro')}>
            {OFERTA.simulacro.cta}
          </a>
        </article>
        <article className="ag-card ag-featured ag-offer-card">
          <span className="ag-badge">{OFERTA.alianzaBadge}</span>
          <h3 className="ag-h3" style={{ marginTop: 12 }}>
            {OFERTA.alianzaTitulo}
          </h3>
          <ul className="ag-check-list">
            {OFERTA.alianza.map((item) => (
              <li key={item}>
                <Check className="ag-check" size={18} aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Pending note={OFERTA.confirmar}>
            <p style={{ fontWeight: 800 }}>{precio}</p>
          </Pending>
          <a className="ag-btn" href={contactoHref('reunion')}>
            {OFERTA.alianzaCta}
          </a>
        </article>
        <article className="ag-card ag-card-dark ag-offer-card">
          <h3 className="ag-h3">{OFERTA.preicfes.titulo}</h3>
          <p>{OFERTA.preicfes.texto}</p>
          <a className="ag-btn-ghost ag-on-dark" href={buildWaUrl(CONTACTO.whatsappB2B, WA_TEXT.oferta_preicfes)}>
            {OFERTA.preicfes.cta}
          </a>
        </article>
      </div>
      <Pending note={OFERTA.confirmar}>
        <ul className="ag-micro">
          <li>{OFERTA.microImplementacion}</li>
          {OFERTA.micro.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Pending>
    </Section>
  );
}
