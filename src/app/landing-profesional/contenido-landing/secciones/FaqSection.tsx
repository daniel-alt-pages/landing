'use client';

import { ArrowRight, ChevronRight } from 'lucide-react';
import { Pill } from '../ui-componentes/LandingPrimitives';
import { displaySerif, faqItems } from '../content';
import type { LandingTone } from '../tipos';

type FaqSectionProps = {
  isLightLanding: boolean;
  bodyTitleClass: string;
  bodyMutedClass: string;
  bodySubtleClass: string;
  bodyCardClass: string;
  bodyPillSurface: 'light' | 'dark';
  landingTone: LandingTone;
  sectionClassName: string;
  onContactClick: () => void;
};

export function FaqSection({
  isLightLanding,
  bodyTitleClass,
  bodyMutedClass,
  bodySubtleClass,
  bodyCardClass,
  bodyPillSurface,
  landingTone,
  sectionClassName,
  onContactClick,
}: FaqSectionProps) {
  void landingTone;

  return (
    <section
      id="faq"
      className={`cotiz-landing-chapter scroll-mt-[var(--cotiz-mhdr-offset,4.5rem)] sm:scroll-mt-28 ${sectionClassName}`}
      aria-labelledby="faq-title"
    >
      <div className="mx-auto w-full max-w-[min(80rem,100%)]">
        <div className="max-w-3xl">
          <Pill surface={bodyPillSurface}>Preguntas frecuentes</Pill>
          <h2
            id="faq-title"
            className={`${displaySerif} mt-5 text-pretty text-4xl font-medium tracking-tight ${bodyTitleClass} sm:text-5xl`}
          >
            ¿Tienes dudas?
          </h2>
          <p className={`mt-4 text-sm leading-relaxed sm:text-base ${bodyMutedClass}`}>
            Respuestas claras sobre formato, fechas, resultados, pago y garantía — para estudiantes e instituciones.
          </p>
        </div>

        <div className="mt-8 space-y-3 sm:mt-10 sm:space-y-4">
          {faqItems.map((item, index) => (
            <details
              key={item.question}
              open={index === 0}
              className={`group rounded-[16px] p-4 sm:p-5 ${bodyCardClass}`}
            >
              <summary
                className={`flex cursor-pointer list-none items-center justify-between gap-3 text-left text-sm font-semibold tracking-tight [&::-webkit-details-marker]:hidden sm:text-base ${bodyTitleClass}`}
              >
                <span className="min-w-0 flex-1 text-pretty">{item.question}</span>
                <ChevronRight
                  className={`h-4 w-4 shrink-0 transition group-open:rotate-90 ${
                    isLightLanding ? 'text-slate-400' : 'text-white/38'
                  }`}
                  aria-hidden
                />
              </summary>
              <p className={`mt-4 border-t pt-4 text-sm leading-relaxed ${bodyMutedClass} ${
                isLightLanding ? 'border-slate-200' : 'border-white/10'
              }`}>
                {item.answer}
              </p>
            </details>
          ))}
        </div>

        <div
          className={`mt-10 flex flex-col gap-4 rounded-[1.75rem] p-5 sm:mt-12 sm:flex-row sm:items-center sm:justify-between sm:p-6 ${bodyCardClass}`}
        >
          <div className="min-w-0">
            <p className={`font-mono text-[10px] font-semibold uppercase tracking-[0.2em] ${bodySubtleClass}`}>
              ¿Aún tienes preguntas?
            </p>
            <p className={`mt-2 text-sm leading-relaxed sm:text-base ${bodyMutedClass}`}>
              Coordina por WhatsApp con el equipo comercial — individual o institución.
            </p>
          </div>
          <button
            type="button"
            onClick={onContactClick}
            className={
              'eg-cta inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#CC0000] px-6 py-2.5 text-sm font-semibold text-white'
            }
          >
            Contactar ventas
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
