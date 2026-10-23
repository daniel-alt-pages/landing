import type { Metadata } from 'next';
import { PAGINAS } from '../_contenido/paginas';
import { FinalCta } from '../_componentes/secciones/FinalCta';
import { PageIntro } from '../_componentes/secciones/PageIntro';
import { ResultadosB2026, TOP_B2026 } from '../_componentes/secciones/ResultadosB2026';
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
      <PageIntro
        eyebrow={PAGINAS.resultados.eyebrow}
        title={['Resultados que', 'su colegio puede mostrar']}
        lead="Puntajes reales, mejoras con nuestro acompañamiento y mensajes de estudiantes de todo el país: evidencia para decidir con su consejo directivo."
      />
      <ResultsGallery id="superacion" carrusel={false} estilo="alianzas" />
      <ResultadosB2026
        titulo={[{ text: 'Estudiantes de todo el país' }, { text: 'en lo más alto', accent: true }]}
        lead="Los puntajes más altos de nuestros estudiantes del Calendario B, con su nombre y su ciudad."
      />
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
