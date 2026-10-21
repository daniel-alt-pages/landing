import type { Metadata } from 'next';
import { PAGINAS } from '../_contenido/paginas';
import { FinalCta } from '../_componentes/secciones/FinalCta';
import { PageIntro } from '../_componentes/secciones/PageIntro';
import { ResultsGallery } from '../_componentes/secciones/ResultsGallery';
import { TrustedSchools } from '../_componentes/secciones/TrustedSchools';
import { VoicesSection } from '../_componentes/secciones/VoicesSection';

export const metadata: Metadata = {
  title: { absolute: 'Resultados y testimonios | Alianza SEAMOSGENIOS' },
  description: 'Puntaje perfecto en 2025, más de 50 estudiantes sobre 410 y testimonios de estudiantes de todo el país.',
};

export default function ResultadosPage() {
  return (
    <>
      <PageIntro eyebrow={PAGINAS.resultados.eyebrow} title={PAGINAS.resultados.title} lead={PAGINAS.resultados.lead} />
      <ResultsGallery />
      <VoicesSection tone="white" />
      <TrustedSchools tone="paper" />
      <FinalCta />
    </>
  );
}
