import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CONTACTO } from '../_contenido/contacto';
import { FAQ_FAMILIAS } from '../_contenido/faq';
import { CTA_PROGRAMAS } from '../_contenido/programas';
import { CtaStrip } from '../_componentes/secciones/CtaStrip';
import { FaqSection } from '../_componentes/secciones/FaqSection';
import { CierreFamilias } from '../_componentes/secciones/CierreFamilias';
import { VideoEstrategias } from '../_componentes/secciones/VideoResultados';
import { CatalogoClient } from './catalogo/CatalogoClient';
import { buildWaUrl, WA_TEXT } from '../_lib/whatsapp';

export const metadata: Metadata = {
  title: { absolute: 'Elige tu programa | Alianza SEAMOSGENIOS' },
  description:
    'Programas preICFES y simulacros de SEAMOSGENIOS. Solicite su cotización y pague con Bold, un programa a la vez.',
};

export default function ProgramasPage() {
  return (
    <>
      <Suspense
        fallback={(
          <section className="ag-section ag-store" aria-busy="true">
            <div className="ag-wrap">
              <div className="ag-store-grid">
                <div className="ag-store-skeleton is-deal" />
                <div className="ag-store-skeleton is-deal" />
                <div className="ag-store-skeleton is-deal" />
              </div>
            </div>
          </section>
        )}
      >
        <CatalogoClient />
      </Suspense>
      <CtaStrip title={CTA_PROGRAMAS.titulo} text={CTA_PROGRAMAS.texto} cta={CTA_PROGRAMAS.cta} href={buildWaUrl(CONTACTO.whatsappB2B, WA_TEXT.estudiantes)} />
      <VideoEstrategias />
      <FaqSection
        items={FAQ_FAMILIAS}
        lead="Lo que más preguntan estudiantes y familias antes de elegir. Si la suya no está, escríbanos."
        cta={{ href: '#contacto', label: 'Tengo otra pregunta' }}
      />
      <CierreFamilias />
    </>
  );
}
