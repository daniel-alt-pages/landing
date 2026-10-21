'use client';

/* eslint-disable @next/next/no-img-element */

import type { CSSProperties } from 'react';

export type ChromaGridItem = {
  image: string;
  title: string;
  subtitle: string;
  handle?: string;
  borderColor: string;
  gradient: string;
  url?: string;
};

type ChromaGridProps = {
  items: readonly ChromaGridItem[];
  radius?: number;
  damping?: number;
  fadeOut?: number;
  ease?: string;
  className?: string;
};

function cssEase(ease: string): string {
  if (ease === 'power3.out') return 'cubic-bezier(0.22, 1, 0.36, 1)';
  return ease;
}

export default function ChromaGrid({
  items,
  radius = 300,
  damping = 0.45,
  fadeOut = 0.6,
  ease = 'power3.out',
  className = '',
}: ChromaGridProps) {
  return (
    <div
      className={`grid h-full grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4 ${className}`}
      style={
        {
          '--chroma-radius': `${radius}px`,
          '--chroma-damping': `${damping}s`,
          '--chroma-fade': fadeOut,
          '--chroma-ease': cssEase(ease),
        } as CSSProperties
      }
    >
      {items.map((item) => {
        const cardStyle = {
          '--chroma-border': item.borderColor,
          '--chroma-gradient': item.gradient,
        } as CSSProperties;
        const content = (
          <article
            className="group relative h-full min-h-[21rem] overflow-hidden rounded-[1.5rem] border bg-slate-950 text-white shadow-2xl shadow-black/30 transition duration-[var(--chroma-damping)] ease-[var(--chroma-ease)] hover:-translate-y-1 hover:shadow-[0_24px_var(--chroma-radius)_rgba(8,145,178,0.20)]"
            style={{
              ...cardStyle,
              borderColor: item.borderColor,
            }}
          >
            <div className="absolute inset-0 opacity-[var(--chroma-fade)] transition duration-[var(--chroma-damping)] group-hover:opacity-90" style={{ background: item.gradient }} aria-hidden />
            <div className="absolute inset-px rounded-[1.45rem] bg-slate-950/35" aria-hidden />
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-[var(--chroma-ease)] group-hover:scale-[1.035]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 p-4">
              {item.handle ? (
                <p className="mb-2 inline-flex rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100 backdrop-blur">
                  {item.handle}
                </p>
              ) : null}
              <h3 className="text-lg font-black leading-tight tracking-[-0.02em]">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/72">{item.subtitle}</p>
            </div>
          </article>
        );

        return item.url ? (
          <a key={`${item.title}-${item.image}`} href={item.url} target="_blank" rel="noopener noreferrer" className="block h-full rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-cyan-300/45">
            {content}
          </a>
        ) : (
          <div key={`${item.title}-${item.image}`} className="h-full">
            {content}
          </div>
        );
      })}
    </div>
  );
}
