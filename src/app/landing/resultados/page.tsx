import type { Metadata } from 'next';
import { FinalCta } from '../_componentes/secciones/FinalCta';
import { TOP_B2026 } from '../_componentes/secciones/ResultadosB2026';
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
      <ResultsGallery id="superacion" carrusel={false} estilo="alianzas" />
      <ResultsGallery
        excluirFotos={TOP_B2026.map((f) => f.src)}
        superacion={false}
        titulo={[{ text: 'Los álbumes' }, { text: 'completos', accent: true }]}
        lead="Recorra, tarjeta por tarjeta, los puntajes reales de nuestros estudiantes."
      />
      <VideoResultados />
      <VoicesSection tone="white" />
      <TrustedSchools tone="paper" />
      <FinalCta eyebrow="Sume a su institución" lead="Como los colegios que acaba de ver, su institución puede empezar con un simulacro gratuito y recibir el panel de resultados por competencia." />
    </>
  );
}
