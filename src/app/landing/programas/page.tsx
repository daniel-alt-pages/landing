import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CONTACTO } from '../_contenido/contacto';
import { CTA_PROGRAMAS } from '../_contenido/programas';
import { CtaStrip } from '../_componentes/secciones/CtaStrip';
import { FaqSection } from '../_componentes/secciones/FaqSection';
import { FinalCta } from '../_componentes/secciones/FinalCta';
import { ContinuityCycle, InstitutionLadder } from '../_componentes/secciones/InstitutionLadder';
import { ProgramCompare } from '../_componentes/secciones/ProgramCompare';
import { CatalogoClient } from './catalogo/CatalogoClient';
import { buildWaUrl, WA_TEXT } from '../_lib/whatsapp';

export const metadata: Metadata = {
  title: { absolute: 'Elige tu programa | Alianza SEAMOSGENIOS' },
  description:
    'Programas, simulacros y cursos para estudiantes y familias. Elige según lo que necesitas y paga con Bold, un programa a la vez.',
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
      <CtaStrip title={CTA_PROGRAMAS.titulo} text={CTA_PROGRAMAS.texto} cta={CTA_PROGRAMAS.cta} href={buildWaUrl(CONTACTO.whatsappB2B, WA_TEXT.cta_final)} />
      <ProgramCompare />
      <InstitutionLadder />
      <ContinuityCycle />
      <FinalCta />
      <FaqSection />
    </>
  );
}
