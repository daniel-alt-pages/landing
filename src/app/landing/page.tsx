import { CifrasClave } from './_componentes/secciones/CifrasClave';
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
      <CifrasClave />
      <AlianzasSection />
      <PrimerPaso />
      <ScreenGallery />
      <VoicesSection compact tone="grey" />
      <FaqSection />
      <FinalCta />
    </>
  );
}
