'use client';

import { showcaseDomIds } from '../../constants/dom-ids';
import { SHOWCASE_MARKETING_BANNER } from '../../constants/marketing';

export function ShowcaseDashboardBanner() {
  return (
    <section id={showcaseDomIds.sectionBanner} aria-label="Promociones Seamos Genios">
      <div className="overflow-hidden rounded-[1.875rem] border border-solid border-slate-200/90 bg-slate-200/80 shadow-lg shadow-slate-200/60">
        <div className="relative aspect-[1600/686] w-full bg-slate-100">
          <img
            src={SHOWCASE_MARKETING_BANNER.src}
            alt={SHOWCASE_MARKETING_BANNER.alt}
            width={1600}
            height={686}
            className="absolute inset-0 m-auto h-auto max-h-full w-auto max-w-full object-contain object-center p-3 select-none"
            draggable={false}
            loading="eager"
          />
        </div>
        <div className="border-t border-solid border-slate-100 bg-white px-3 py-2.5">
          <p className="text-center text-[11px] leading-snug text-slate-400">
            Banner promocional —{' '}
            <span className="font-semibold text-slate-500">Seamos Genios</span>
          </p>
        </div>
      </div>
    </section>
  );
}
