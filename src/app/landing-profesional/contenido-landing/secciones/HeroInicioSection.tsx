'use client';

import { Calculator } from 'lucide-react';
import { danielProfileImages, displaySerif } from '../content';

type HeroInicioSectionProps = {
  isLightLanding: boolean;
  onQuote: () => void;
};

const LINE_A = 'Simulacros que convierten resultados';
const LINE_B = 'en decisiones.';

function WordRise({ text, start = 0, muted = false }: { text: string; start?: number; muted?: boolean }) {
  return (
    <span className={muted ? 'text-current opacity-45' : undefined}>
      {text.split(' ').map((word, i) => (
        <span key={`${word}-${i}`} className="eg-hero-word" style={{ ['--i' as string]: start + i }}>
          {word}
          {i < text.split(' ').length - 1 ? '\u00a0' : ''}
        </span>
      ))}
    </span>
  );
}

export function HeroInicioSection({ isLightLanding, onQuote }: HeroInicioSectionProps) {
  const mosaic = danielProfileImages.slice(0, 6);

  return (
    <section
      id="inicio"
      className="relative mx-auto flex min-h-[min(100dvh,56rem)] w-full max-w-[min(80rem,100%)] flex-col justify-center px-[clamp(1rem,3vw,2.5rem)] pb-16 pt-10 lg:min-h-[calc(100dvh-5rem)]"
      aria-labelledby="inicio-title"
    >
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
        <div className="eg-fade-in min-w-0 text-center lg:text-left">
          <p
            className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${
              isLightLanding ? 'text-slate-500' : 'text-white/45'
            }`}
          >
            PreICFES · Saber 11
          </p>
          <h1
            id="inicio-title"
            className={`${displaySerif} mt-4 text-balance text-[clamp(1.85rem,4.6vw,3.5rem)] font-bold leading-[1.05] tracking-[-0.05em] ${
              isLightLanding ? 'text-slate-950' : 'text-white'
            }`}
          >
            <WordRise text={LINE_A} />
            <br />
            <WordRise text={LINE_B} start={LINE_A.split(' ').length} muted />
          </h1>
          <p
            className={`mx-auto mt-6 max-w-xl text-[16px] leading-relaxed lg:mx-0 ${
              isLightLanding ? 'text-slate-600' : 'text-white/62'
            }`}
          >
            Cotiza aplicaciones tipo ICFES con retro en vivo, grabaciones y paneles para estudiantes y
            coordinación. Misma experiencia, individual o institución.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap lg:justify-start">
            <button
              type="button"
              onClick={onQuote}
              className="eg-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#CC0000] px-8 py-3 text-[15px] font-semibold text-white"
            >
              Cotizar
              <Calculator className="h-4 w-4" aria-hidden />
            </button>
            <a
              href="/login"
              className={`eg-cta inline-flex min-h-12 items-center justify-center rounded-full border px-8 py-3 text-[15px] font-semibold ${
                isLightLanding
                  ? 'border-[rgba(130,96,75,0.22)] bg-white text-slate-950'
                  : 'border-white/20 bg-transparent text-white'
              }`}
            >
              Ingresar
            </a>
          </div>
        </div>

        <div className="eg-hero-media grid grid-cols-3 gap-3" aria-hidden>
          {mosaic.map((src, i) => (
            <div
              key={src}
              className={`eg-card overflow-hidden ${i % 3 === 1 ? 'mt-6' : ''} ${
                isLightLanding ? 'bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]' : 'bg-white/5'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="aspect-[4/5] h-full w-full object-cover" loading={i < 3 ? 'eager' : 'lazy'} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
