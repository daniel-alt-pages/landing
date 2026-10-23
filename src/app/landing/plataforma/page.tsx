import type { Metadata } from 'next';
import { PAGINAS } from '../_contenido/paginas';
import { FinalCta } from '../_componentes/secciones/FinalCta';
import { ChallengesSection, DomainRouteSection, LayersSection, MethodSection } from '../_componentes/secciones/MethodSection';
import { PageIntro } from '../_componentes/secciones/PageIntro';
import { PanelsShowcase } from '../_componentes/secciones/PanelsShowcase';

export const metadata: Metadata = {
  title: { absolute: 'Plataforma y método ADPMH | Alianza SEAMOSGENIOS' },
  description: 'Paneles de coordinación y de estudiante, analítica en cinco capas y Desafíos para la práctica diaria del Saber 11.',
};

export default function PlataformaPage() {
  return (
    <>
      <PageIntro eyebrow={PAGINAS.plataforma.eyebrow} title={PAGINAS.plataforma.title} lead={PAGINAS.plataforma.lead} />
      <PanelsShowcase />
      <MethodSection />
      <LayersSection />
      <ChallengesSection />
      <DomainRouteSection />
      <FinalCta eyebrow="Del diagnóstico a la ruta" lead="Todo empieza con un simulacro: la plataforma convierte cada respuesta de sus estudiantes en un reporte por competencia. Véala en vivo en 30 minutos." />
    </>
  );
}
