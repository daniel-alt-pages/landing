import { AdpmhWordmark } from '@/app/landing-profesional/contenido-landing/ui-componentes/AdpmhWordmark';

/** Marca de agua ADPMH — solo en `.cotiz-landing-scope` */
export function CotizLandingWatermark() {
  return (
    <div className="cotiz-landing-watermark" aria-hidden>
      <AdpmhWordmark className="cotiz-landing-watermark__mark" />
    </div>
  );
}
