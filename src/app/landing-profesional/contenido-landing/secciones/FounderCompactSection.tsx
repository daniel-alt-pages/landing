'use client';

import { ChevronRight } from 'lucide-react';
import ProfileCard from '../ui-componentes/ProfileCard';
import {
  danielDeveloperIntroParagraphs,
  danielImpactHighlights,
  danielMediaMentions,
  danielProfileHighlights,
  danielProfileImages,
  danielStoryPoints,
  displaySerif,
} from '../content';
import { landingChrome } from '../utilidades/landingChrome';

type FounderCompactSectionProps = {
  isLightLanding: boolean;
  onContact: () => void;
};

export function FounderCompactSection({ isLightLanding, onContact }: FounderCompactSectionProps) {
  const chrome = landingChrome(isLightLanding);

  return (
    <section
      id="desarrollador"
      className={`${chrome.section} mx-auto w-full max-w-[min(80rem,100%)]`}
      aria-labelledby="desarrollador-title"
    >
      <div className="grid gap-8 xl:grid-cols-[minmax(min(100%,16rem),0.7fr)_minmax(0,1.3fr)] xl:items-start">
        <ProfileCard
          name="Daniel Eduardo De la Cruz Vega"
          title="Fundador y desarrollador de SEAMOSGENIOS"
          handle="danieldev"
          status="Online"
          contactText="Coordinar con Daniel"
          avatarUrl={danielProfileImages[0]}
          images={[...danielProfileImages]}
          showUserInfo
          enableTilt
          enableMobileTilt={false}
          onContactClick={onContact}
          behindGlowColor={isLightLanding ? 'rgba(204, 0, 0, 0.22)' : 'rgba(204, 0, 0, 0.35)'}
          behindGlowEnabled
          innerGradient="linear-gradient(145deg,#1A1A1A 0%,#3A1515 100%)"
        />

        <div className="min-w-0">
          <p className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${chrome.eyebrow}`}>Fundador</p>
          <h2
            id="desarrollador-title"
            className={`${displaySerif} mt-3 text-[clamp(1.5rem,2.4vw,2rem)] font-bold tracking-[-0.03em] ${chrome.title}`}
          >
            De Caño de Aguas al PreICFES con evidencia.
          </h2>
          <p className={`mt-4 max-w-2xl text-[15px] leading-relaxed ${chrome.muted}`}>
            {danielDeveloperIntroParagraphs[1]}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {danielProfileHighlights.map((item) => (
              <div key={item.label} className={`eg-card p-4 ${chrome.card}`}>
                <strong className={`block text-lg font-bold tracking-tight ${chrome.title}`}>{item.value}</strong>
                <span className={`mt-1 block text-xs leading-relaxed ${chrome.subtle}`}>{item.label}</span>
              </div>
            ))}
          </div>

          <details className={`group mt-6 overflow-hidden ${chrome.card}`} style={{ borderRadius: 16 }}>
            <summary
              className={`flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] [&::-webkit-details-marker]:hidden ${chrome.eyebrow}`}
            >
              Historia, impacto y medios
              <ChevronRight className="h-4 w-4 transition group-open:rotate-90" aria-hidden />
            </summary>
            <div className="space-y-5 border-t px-5 py-5" style={{ borderColor: 'inherit' }}>
              <p className={`text-sm leading-relaxed ${chrome.muted}`}>{danielDeveloperIntroParagraphs[0]}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {danielStoryPoints.slice(0, 4).map((point, index) => (
                  <article key={point.title} className={`rounded-[16px] border p-4 ${isLightLanding ? 'border-[rgba(130,96,75,0.14)] bg-[#FDF8F3]' : 'border-white/10 bg-black/20'}`}>
                    <span className={`text-[11px] font-semibold ${chrome.eyebrow}`}>
                      {String(index + 1).padStart(2, '0')} · {point.label}
                    </span>
                    <h3 className={`mt-2 text-sm font-semibold ${chrome.title}`}>{point.title}</h3>
                    <p className={`mt-2 text-sm leading-relaxed ${chrome.muted}`}>{point.text}</p>
                  </article>
                ))}
              </div>
              <ul className={`space-y-2 text-sm leading-relaxed ${chrome.muted}`}>
                {danielImpactHighlights.map((item) => (
                  <li key={item.slice(0, 24)}>{item}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                {danielMediaMentions.slice(0, 6).map((mention) => (
                  <a
                    key={mention.href}
                    href={mention.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      isLightLanding ? 'border-[rgba(130,96,75,0.16)] bg-white text-slate-800' : 'border-white/16 bg-white/5 text-white'
                    }`}
                  >
                    {mention.source}
                  </a>
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
