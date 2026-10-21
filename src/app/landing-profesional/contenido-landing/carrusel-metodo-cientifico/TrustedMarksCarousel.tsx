'use client';

import { MethodShowcase3DCarousel } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/carrusel-3d/MethodShowcase3DCarousel';
import { buildMethodShowcaseSlides } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/diapositivas/buildMethodShowcaseSlides';

type TrustedMarksCarouselProps = {
  isLightLanding: boolean;
};

/** Bloque «Pensado para equipos académicos» + carrusel 3D de demos (#metodo-cientifico). */
export function TrustedMarksCarousel({ isLightLanding }: TrustedMarksCarouselProps) {
  const slides = buildMethodShowcaseSlides(undefined, isLightLanding);

  return (
    <div
      className={`mt-14 border-t pt-10 sm:mt-16 sm:pt-12 ${isLightLanding ? 'border-slate-200/80' : 'border-white/10'}`}
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <p className={`text-base font-semibold sm:text-lg ${isLightLanding ? 'text-slate-800' : 'text-white/80'}`}>
          Pensado para equipos académicos
        </p>
        <p className={`mt-2 text-sm ${isLightLanding ? 'text-slate-500' : 'text-white/45'}`}>
          Recorre capacidades del método; iremos sumando grabaciones y demos.
        </p>
      </div>

      <div className="mx-auto mt-10 mb-2 w-full min-w-0 max-w-[min(72rem,100%)] px-3 sm:mt-12 sm:px-6 sm:pb-2 lg:px-10">
        <MethodShowcase3DCarousel
          slides={slides}
          isLightLanding={isLightLanding}
          layout="wide"
          autoplay
          autoplayDelay={5000}
          pauseOnHover
          loop
          contentAspectRatio={16 / 9}
        />
      </div>
    </div>
  );
}
