import type { Metadata } from 'next';
import { PAGINAS } from '../_contenido/paginas';
import { FinalCta } from '../_componentes/secciones/FinalCta';
import { PageIntro } from '../_componentes/secciones/PageIntro';
import { ResultadosB2026 } from '../_componentes/secciones/ResultadosB2026';
import { ResultsGallery } from '../_componentes/secciones/ResultsGallery';
import { TrustedSchools } from '../_componentes/secciones/TrustedSchools';
import { VideoResultados } from '../_componentes/secciones/VideoResultados';
import { VoicesSection } from '../_componentes/secciones/VoicesSection';

export const metadata: Metadata = {
  title: { absolute: 'Resultados y testimonios | Alianza SEAMOSGENIOS' },
  description: 'Puntaje perfecto en 2025, más de 50 estudiantes sobre 410 y testimonios de estudiantes de todo el país.',
};

export default function ResultadosPage() {
  return (
    <>
      <PageIntro eyebrow={PAGINAS.resultados.eyebrow} title={PAGINAS.resultados.title} lead={PAGINAS.resultados.lead} />
      <ResultadosB2026 />
      <ResultsGallery />
      <VideoResultados />
      <VoicesSection tone="white" />
      <TrustedSchools tone="paper" />
      <FinalCta eyebrow="Sume a su institución" lead="Como los colegios que acaba de ver, su institución puede empezar con un simulacro gratuito y recibir el panel de resultados por competencia." />
    </>
  );
}
