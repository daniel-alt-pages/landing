import type { Metadata } from 'next';
import { FinalCta } from '../_componentes/secciones/FinalCta';
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
      {/* Un solo bloque: superación + carrusel de álbumes completos (id #resultados, destino del menú). */}
      <ResultsGallery id="resultados" titleAs="h1" estilo="alianzas" />
      <VideoResultados />
      <VoicesSection tone="white" />
      <TrustedSchools tone="paper" />
      <FinalCta tarjetas={['whatsapp']} eyebrow="Sume a su institución" lead="Como los colegios que acaba de ver, su institución puede empezar con un simulacro gratuito y recibir el panel de resultados por competencia." />
    </>
  );
}
