'use client';

import { Video } from 'lucide-react';
import { displaySerif, pricingCards } from '@/app/landing-profesional/contenido-landing/content';

type QuoteAccessPreviewProps = {
  isLightLanding: boolean;
  embedded?: boolean;
};

export function QuoteAccessPreview({ isLightLanding, embedded = false }: QuoteAccessPreviewProps) {
  const shellClass = embedded
    ? 'min-w-0'
    : isLightLanding
      ? 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5'
      : 'rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 sm:rounded-2xl sm:p-5';

  const innerClass = embedded
    ? 'min-w-0'
    : isLightLanding
      ? 'rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-inner sm:rounded-xl sm:p-5'
      : 'rounded-lg border border-white/[0.06] bg-black/40 p-4 sm:rounded-xl sm:p-5';

  return (
    <div className={shellClass}>
      <div className={innerClass}>
        <div
          className={`flex flex-wrap items-start justify-between gap-4 border-b pb-5 ${
            isLightLanding ? 'border-slate-200' : 'border-white/10'
          }`}
        >
          <div>
            <p
              className={`font-mono text-[11px] uppercase tracking-[0.18em] ${
                isLightLanding ? 'text-slate-500' : 'text-white/40'
              }`}
            >
              quote.preview
            </p>
            <p
              className={`${displaySerif} mt-2 text-xl font-medium ${isLightLanding ? 'text-slate-900' : 'text-white/90'}`}
            >
              Acceso incluido por compra
            </p>
          </div>
          <div
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider ${
              isLightLanding
                ? 'border-slate-200 bg-white text-slate-600 shadow-sm'
                : 'border-white/15 bg-white/[0.04] text-white/65'
            }`}
          >
            En vivo + grabado
          </div>
        </div>
        <div className="grid gap-3 py-5 sm:grid-cols-2 sm:gap-3">
          {pricingCards.map((card) => (
            <div
              key={card.segment}
              className={
                isLightLanding
                  ? 'rounded-xl border border-slate-200 bg-white p-3.5 sm:rounded-2xl sm:p-4'
                  : 'rounded-xl border border-white/[0.07] bg-black/25 p-3.5 sm:rounded-2xl sm:p-4'
              }
            >
              <p
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isLightLanding ? 'text-slate-500' : 'text-white/42'
                }`}
              >
                {card.badge}
              </p>
              <p className={`mt-3 text-2xl font-semibold tracking-tight ${isLightLanding ? 'text-slate-900' : 'text-white'}`}>
                {card.priceText}
              </p>
              <p className={`mt-1 text-xs ${isLightLanding ? 'text-slate-600' : 'text-white/48'}`}>por estudiante</p>
            </div>
          ))}
        </div>
        <div
          className={
            isLightLanding
              ? 'rounded-xl border border-slate-200 bg-slate-100/80 p-4'
              : 'rounded-xl border border-white/[0.06] bg-white/[0.02] p-4'
          }
        >
          <div className="flex items-start gap-3">
            <Video
              className={`mt-0.5 h-5 w-5 shrink-0 ${isLightLanding ? 'text-slate-500' : 'text-white/50'}`}
              aria-hidden
            />
            <div>
              <p className={`text-sm font-semibold ${isLightLanding ? 'text-slate-900' : 'text-white'}`}>
                Todos reciben lo mismo
              </p>
              <p className={`mt-1 text-sm leading-relaxed ${isLightLanding ? 'text-slate-600' : 'text-white/50'}`}>
                Simulacro, retroalimentación en vivo y grabaciones. La tarifa cambia por volumen, no por la calidad del
                acceso.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
