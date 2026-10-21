'use client';

import dynamic from 'next/dynamic';
import { displaySerif, platformVideoStories } from '../content';
import { landingChrome } from '../utilidades/landingChrome';

const PlatformVideoEmbed = dynamic(
  () => import('../ui-componentes/PlatformVideoEmbed').then((m) => ({ default: m.PlatformVideoEmbed })),
  { loading: () => <div className="aspect-video animate-pulse rounded-[20px] bg-slate-200/70" aria-hidden /> },
);

const MOSAIC = platformVideoStories.slice(0, 4);

export function ProductVideoMosaic({ isLightLanding }: { isLightLanding: boolean }) {
  const chrome = landingChrome(isLightLanding);

  return (
    <div className="mx-auto mt-14 w-full max-w-[min(80rem,100%)]">
      <p className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${chrome.eyebrow}`}>Recorrido</p>
      <h3 className={`${displaySerif} mt-3 text-[clamp(1.4rem,2.4vw,1.85rem)] font-bold tracking-[-0.03em] ${chrome.title}`}>
        Lo que ve el estudiante.
      </h3>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {MOSAIC.map((item) => (
          <article key={item.title} className={`eg-card overflow-hidden ${chrome.card}`}>
            <div className="aspect-[16/10] overflow-hidden bg-[#1A1A1A]">
              <PlatformVideoEmbed title={item.title} prismicVideoUrl={item.prismicVideoUrl} youtubeId={item.youtubeId} />
            </div>
            <div className="p-5">
              <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${chrome.eyebrow}`}>{item.eyebrow}</p>
              <h4 className={`mt-2 text-[16px] font-semibold ${chrome.title}`}>{item.title}</h4>
              <p className={`mt-2 text-sm leading-relaxed ${chrome.muted}`}>{item.text}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
