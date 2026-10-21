import { ArrowRight, Award, LayoutDashboard, School } from 'lucide-react';
import Link from 'next/link';
import { PILARES } from '../../_contenido/hero';
import { DisplayTitle } from '../primitivas/DisplayTitle';
import { Lead } from '../primitivas/Lead';
import { Section } from '../primitivas/Section';
import { Spotlight } from '../primitivas/Spotlight';

const ICONS = {
  medir: LayoutDashboard,
  acompanar: School,
  demostrar: Award,
} as const;

export function PillarsSection() {
  return (
    <Section id="pilares" tone="grey" label="pilares-title">
      <DisplayTitle id="pilares-title" lines={[{ text: PILARES.title[0] }, { text: PILARES.title[1], accent: true }]} />
      <Lead>{PILARES.lead}</Lead>
      <div className="ag-grid-3" style={{ marginTop: 28 }}>
        {PILARES.items.map((item) => {
          const Icon = ICONS[item.id];
          return (
          <Spotlight key={item.id} className="ag-pillar ag-product-card">
            <span className="ag-num ag-num-sm" aria-hidden>
              <Icon size={16} color="#ffffff" />
            </span>
            <p className="ag-eyebrow">{item.eyebrow}</p>
            <h3 className="ag-h3 ag-pillar-title">{item.title}</h3>
            <p>{item.text}</p>
            <Link className="ag-text-link" href={item.href}>
              {item.cta} <ArrowRight size={16} aria-hidden />
            </Link>
          </Spotlight>
          );
        })}
      </div>
    </Section>
  );
}
