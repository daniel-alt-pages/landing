'use client';

import { displaySerif } from '../content';
import { landingChrome } from '../utilidades/landingChrome';

type FinalCtaSectionProps = {
  isLightLanding: boolean;
  onQuote: () => void;
};

export function FinalCtaSection({ isLightLanding, onQuote }: FinalCtaSectionProps) {
  const chrome = landingChrome(isLightLanding);

  return (
    <section className={`${chrome.section} text-center`} aria-labelledby="cierre-title">
      <p className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${chrome.eyebrow}`}>Próximo simulacro</p>
      <h2
        id="cierre-title"
        className={`${displaySerif} mx-auto mt-4 max-w-[18ch] text-[clamp(1.85rem,4vw,3rem)] font-bold leading-[1.08] tracking-[-0.04em] ${chrome.title}`}
      >
        Simulacros que convierten resultados en decisiones.
      </h2>
      <button
        type="button"
        onClick={onQuote}
        className="eg-cta mx-auto mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#CC0000] px-8 py-3 text-[15px] font-semibold text-white"
      >
        Cotizar
      </button>
    </section>
  );
}
