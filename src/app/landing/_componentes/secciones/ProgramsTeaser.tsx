import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PROGRAMAS } from '../../_contenido/programas';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';

export function ProgramsTeaser() {
  return (
    <Section id="programas" tone="white" label="programas-teaser-title">
      <DisplayTitle
        id="programas-teaser-title"
        lines={[{ text: PROGRAMAS.teaserTitulo[0] }, { text: PROGRAMAS.teaserTitulo[1], accent: true }]}
      />
      <Lead>{PROGRAMAS.teaserLead}</Lead>
      <div className="ag-grid-3" style={{ marginTop: 28 }}>
        <article className="ag-card ag-product-card">
          <p className="ag-eyebrow">16 semanas</p>
          <h3 className="ag-h3">PreICFES Intensivo</h3>
          <p>Unas 426 horas en vivo para construir la base y medir cada tres o cuatro semanas.</p>
        </article>
        <article className="ag-card ag-product-card">
          <p className="ag-eyebrow">8 semanas</p>
          <h3 className="ag-h3">PreICFES Vacacional</h3>
          <p>Unas 225 horas en vivo de práctica: pregunta, error, explicación y repetición.</p>
        </article>
        <article className="ag-card ag-product-card">
          <p className="ag-eyebrow">Sin matrícula</p>
          <h3 className="ag-h3">Simulacros abiertos</h3>
          <p>Diagnósticos sin costo y pruebas abiertas para quien todavía no está en un programa.</p>
        </article>
      </div>
      <p style={{ marginTop: 20 }}>
        <Link className="ag-text-link" href="/landing/programas">
          {PROGRAMAS.teaserCta} <ArrowRight size={16} aria-hidden />
        </Link>
      </p>
    </Section>
  );
}
