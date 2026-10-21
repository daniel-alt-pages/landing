import { FaqSection } from './_componentes/secciones/FaqSection';
import { FinalCta } from './_componentes/secciones/FinalCta';
import { Hero } from './_componentes/secciones/Hero';
import { PrimerPaso } from './_componentes/secciones/PrimerPaso';
import { ProductRail } from './_componentes/secciones/ProductRail';
import { ScreenGallery } from './_componentes/secciones/ScreenGallery';
import { StorefrontBanner } from './_componentes/secciones/StorefrontBanner';
import { VoicesSection } from './_componentes/secciones/VoicesSection';

export default function AlianzaInicio() {
  return (
    <>
      <Hero />
      <StorefrontBanner />
      <ProductRail />
      <ScreenGallery />
      <PrimerPaso />
      <VoicesSection compact tone="grey" />
      <FinalCta />
      <FaqSection />
    </>
  );
}
