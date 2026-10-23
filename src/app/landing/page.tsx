import { VideoResultados } from './_componentes/secciones/VideoResultados';
import { ResultsGallery } from './_componentes/secciones/ResultsGallery';
import { CifrasClave } from './_componentes/secciones/CifrasClave';
import { ResultadosB2026, TOP_B2026 } from './_componentes/secciones/ResultadosB2026';
import { AlianzasSection } from './_componentes/secciones/AlianzasSection';
import { FaqSection } from './_componentes/secciones/FaqSection';
import { FinalCta } from './_componentes/secciones/FinalCta';
import { Hero } from './_componentes/secciones/Hero';
import { MapaSitio } from './_componentes/secciones/MapaSitio';
import { PrimerPaso } from './_componentes/secciones/PrimerPaso';
import { ProductRail } from './_componentes/secciones/ProductRail';
import { ScreenGallery } from './_componentes/secciones/ScreenGallery';
import { StorefrontBanner } from './_componentes/secciones/StorefrontBanner';
import { VoicesSection } from './_componentes/secciones/VoicesSection';

/**
 * Orden (propuesta rediseno-home): qué es y alcance → mapa del sitio → alianzas en curso → cómo empezar →
 * producto → evidencia (Voces, sin cambios) → tienda B2C (aparte del embudo B2B) →
 * dudas → cierre con formulario como final real de la página.
 */
export default function AlianzaInicio() {
  return (
    <>
      <Hero />
      <StorefrontBanner />
      <ProductRail />
      <MapaSitio />
      <CifrasClave excluirFotos={TOP_B2026.map((f) => f.src)} />
      <VoicesSection compact tone="grey" />
      <ResultadosB2026 />
      <ResultsGallery id="superacion" carrusel={false} />
      <VideoResultados />
      <AlianzasSection />
      <PrimerPaso />
      <ScreenGallery />
      <FaqSection />
      <FinalCta eyebrow="Después de resolver sus dudas" lead="Las preguntas que sigan abiertas las revisamos con usted en una reunión de 30 minutos, o puede empezar por un simulacro gratuito para su institución." />
    </>
  );
}
