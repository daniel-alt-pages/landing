import type { Metadata } from 'next';
import { PAGINAS } from '../_contenido/paginas';
import { AboutSection } from '../_componentes/secciones/AboutSection';
import { FinalCta } from '../_componentes/secciones/FinalCta';
import { PageIntro } from '../_componentes/secciones/PageIntro';
import { FounderSection, TeamSection } from '../_componentes/secciones/TeamSection';

export const metadata: Metadata = {
  title: { absolute: 'Nosotros | Alianza SEAMOSGENIOS' },
  description: 'Quiénes somos, la historia de nuestro fundador y el equipo de tutores de las mejores universidades de Colombia.',
};

export default function NosotrosPage() {
  return (
    <>
      <PageIntro eyebrow={PAGINAS.nosotros.eyebrow} title={PAGINAS.nosotros.title} lead={PAGINAS.nosotros.lead} />
      <AboutSection />
      <FounderSection />
      <TeamSection />
      <FinalCta eyebrow="Conozca al equipo en acción" lead="Conozca cómo trabaja nuestro equipo en una reunión de 30 minutos o con un simulacro gratuito." />
    </>
  );
}
