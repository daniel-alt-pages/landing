import type { ReactNode } from 'react';
import { CONTACTO } from '../../_contenido/contacto';
import { contactoHref } from '../../_lib/links';
import { buildWaUrl, WA_TEXT } from '../../_lib/whatsapp';
import BlurText from '../bits/BlurText';
import { BrandPhoto } from '../primitivas/BrandPhoto';

export function PageIntro({
  title,
  lead,
  visual,
}: {
  eyebrow: string;
  title: readonly [string, string];
  lead: string;
  visual?: ReactNode;
}) {
  return (
    <section className="ag-section ag-tone-grey ag-intro" aria-labelledby="intro-title">
      <div className="ag-wrap ag-split">
        <div>
          <h1 id="intro-title" className="ag-display ag-display-sm">
            <BlurText as="span" align="start" className="ag-blur-line" text={title[0]} delay={50} blur={8} distance={14} />
            <BlurText as="span" align="start" className="ag-blur-line ag-accent" text={title[1]} delay={90} blur={8} distance={14} />
          </h1>
          <p className="ag-lead">{lead}</p>
          <div className="ag-actions">
            <a className="ag-btn" href={contactoHref('reunion')}>
              Agendar reunión de 30 min
            </a>
            <a className="ag-btn-ghost" href={contactoHref('simulacro')}>
              Solicitar simulacro gratis
            </a>
          </div>
          <p style={{ marginTop: 12 }}>
            <a className="ag-text-link" href={buildWaUrl(CONTACTO.whatsappB2B, WA_TEXT.hero)}>
              Prefiero escribir por WhatsApp
            </a>
          </p>
        </div>
        <div className="ag-hero-collage">{visual ?? <BrandPhoto />}</div>
      </div>
    </section>
  );
}
