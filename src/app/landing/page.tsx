import { VideoResultados } from './_componentes/secciones/VideoResultados';
// Oculto por decisión de Daniel 2026-10-23: import { ResultsGallery } from './_componentes/secciones/ResultsGallery';
import { CifrasClave } from './_componentes/secciones/CifrasClave';
// Oculto por decisión de Daniel 2026-10-23: import { ResultadosB2026 } from './_componentes/secciones/ResultadosB2026';
// Oculto 2026-10-23: import { AlbumesCarousel } from './_componentes/secciones/AlbumesCarousel';
// Oculto 2026-10-23: import { Section } from './_componentes/primitivas/Section';
import { AlianzasSection } from './_componentes/secciones/AlianzasSection';
import { FaqSection } from './_componentes/secciones/FaqSection';
import { FinalCta } from './_componentes/secciones/FinalCta';
import { Hero } from './_componentes/secciones/Hero';
import { MapaSitio } from './_componentes/secciones/MapaSitio';
import { PrimerPaso } from './_componentes/secciones/PrimerPaso';
import { ProductRail } from './_componentes/secciones/ProductRail';
import { ScreenGallery } from './_componentes/secciones/ScreenGallery';
import { StorefrontBanner } from './_componentes/secciones/StorefrontBanner';
// VoicesSection: import retirado mientras está oculto en la home (restaurar junto con la línea comentada).
import { ReelsEnlaceInicio } from './_componentes/secciones/ReelsEnlaceInicio';

/**
 * Orden (propuesta rediseno-home): qué es y alcance → mapa del sitio → alianzas en curso → cómo empezar →
 * producto → evidencia (Voces, sin cambios) → tienda B2C (aparte del embudo B2B) →
 * dudas → cierre con formulario como final real de la página.
 */
export default function AlianzaInicio() {
  return (
    <>
      <ReelsEnlaceInicio />
      <Hero />
      <StorefrontBanner />
      <ProductRail />
      <MapaSitio />
      {/* #cifras + #voces forman un solo bloque gris (espaciado en landing/sistema.css: .ag-bloque-datos) */}
      <div className="ag-bloque-datos">
        <CifrasClave muroVoces />
        {/* VoicesSection oculto en la home por decisión de Daniel 2026-10-23: <VoicesSection compact tone="grey" /> */}
      </div>
      {/* Oculto por decisión de Daniel 2026-10-23; restaurar descomentando (y sus imports) */}
      {/* <Section id="puntajes" tone="grey"><AlbumesCarousel /></Section> */}
      {/* Oculto por decisión de Daniel 2026-10-23; restaurar descomentando */}
      {/* <ResultadosB2026 /> */}
      {/* Oculto por decisión de Daniel 2026-10-23; restaurar descomentando */}
      {/* <ResultsGallery id="superacion" carrusel={false} /> */}
      <AlianzasSection />
      <PrimerPaso />
      <ScreenGallery />
      <VideoResultados />
      <FaqSection />
      <FinalCta eyebrow="Después de resolver sus dudas" lead="Las preguntas que sigan abiertas las revisamos con usted en una reunión de 30 minutos, o puede empezar por un simulacro gratuito para su institución." />
    </>
  );
}
