'use client';

import { scientificPlatformLayers, displaySerif } from '../content';
import { landingChrome } from '../utilidades/landingChrome';

const STEPS = [scientificPlatformLayers[0], scientificPlatformLayers[1], scientificPlatformLayers[4]];

export function HowItWorksStrip({ isLightLanding }: { isLightLanding: boolean }) {
  const chrome = landingChrome(isLightLanding);

  return (
    <div className="mx-auto mb-12 w-full max-w-[min(80rem,100%)]">
      <p className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${chrome.eyebrow}`}>Cómo funciona</p>
      <h2 className={`${displaySerif} mt-3 max-w-xl text-[clamp(1.6rem,3vw,2.25rem)] font-bold tracking-[-0.03em] ${chrome.title}`}>
        Medir, leer e intervenir.
      </h2>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {STEPS.map((step) => (
          <article key={step.step} className="min-w-0">
            <p className={`text-[2.25rem] font-bold leading-none tracking-[-0.04em] ${chrome.subtle}`}>{step.step}</p>
            <h3 className={`mt-3 text-[17px] font-semibold tracking-[-0.02em] ${chrome.title}`}>{step.title}</h3>
            <p className={`mt-2 text-sm leading-relaxed ${chrome.muted}`}>{step.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
