'use client';

import LogoLoop, { type LogoItem } from '@/app/landing-profesional/contenido-landing/ui-componentes/LogoLoop';
import { Pill } from '@/app/landing-profesional/contenido-landing/ui-componentes/LandingPrimitives';
import { displaySerif, platformTechLogos } from '@/app/landing-profesional/contenido-landing/content';

type PlatformTechStackSectionProps = {
  isLightLanding: boolean;
};

export function PlatformTechStackSection({ isLightLanding }: PlatformTechStackSectionProps) {
  const techLoopFadeColor = isLightLanding ? '#ffffff' : '#080a12';

  const renderTechLogo = (item: LogoItem) => {
    const title = item.title ?? ('alt' in item ? item.alt : undefined) ?? 'Tecnología';
    const visual =
      'node' in item ? (
        item.node
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.src}
          srcSet={item.srcSet}
          sizes={item.sizes}
          width={item.width}
          height={item.height}
          alt={item.alt ?? title}
          className="h-8 w-auto object-contain"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      );

    const content = (
      <span
        className={`group/logo grid h-20 w-24 place-items-center rounded-2xl border px-4 py-3 transition duration-300 ${
          isLightLanding
            ? 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-cyan-300 hover:text-slate-950 hover:shadow-md'
            : 'border-white/10 bg-white/[0.045] text-white/64 hover:border-cyan-200/40 hover:bg-white/[0.075] hover:text-white'
        }`}
        title={title}
      >
        <span
          className={`grid h-14 w-14 place-items-center rounded-2xl transition duration-300 group-hover/logo:scale-110 ${
            isLightLanding
              ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/10'
              : 'bg-cyan-200/10 text-cyan-100 shadow-lg shadow-cyan-950/20'
          }`}
          aria-hidden
        >
          {visual}
        </span>
      </span>
    );

    return item.href ? (
      <a href={item.href} target="_blank" rel="noreferrer noopener" aria-label={title} className="block rounded-2xl">
        {content}
      </a>
    ) : (
      content
    );
  };

  return (
    <section
      aria-labelledby="tecnologias-title"
      className={`mb-12 overflow-hidden rounded-[2rem] border p-5 shadow-2xl sm:mb-14 sm:rounded-[2.4rem] sm:p-7 ${
        isLightLanding
          ? 'border-slate-200/90 bg-white/80 text-slate-950 shadow-slate-900/10'
          : 'border-white/[0.08] bg-white/[0.035] text-white shadow-black/35'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Pill surface={isLightLanding ? 'light' : 'dark'}>Stack real de producción</Pill>
          <h2
            id="tecnologias-title"
            className={`${displaySerif} mt-4 text-pretty text-[clamp(1.8rem,3vw,3rem)] font-medium leading-tight tracking-[-0.035em] ${
              isLightLanding ? 'text-slate-950' : 'text-white'
            }`}
          >
            Tecnologías que sostienen toda la plataforma.
          </h2>
        </div>
        <p className={`max-w-xl text-sm leading-relaxed sm:text-base ${isLightLanding ? 'text-slate-600' : 'text-white/56'}`}>
          Frontend, datos, visualización, reportes, video y despliegue. Todo integrado para que SEAMOSGENIOS y ADPMH
          funcionen como una experiencia completa, no como piezas sueltas.
        </p>
      </div>

      <div className="mt-7 space-y-4">
        <LogoLoop
          logos={platformTechLogos}
          speed={96}
          direction="left"
          logoHeight={64}
          gap={20}
          hoverSpeed={14}
          fadeOut
          fadeOutColor={techLoopFadeColor}
          scaleOnHover
          renderItem={renderTechLogo}
          ariaLabel="Tecnologías principales utilizadas en SEAMOSGENIOS"
        />
        <LogoLoop
          logos={[...platformTechLogos].reverse()}
          speed={82}
          direction="right"
          logoHeight={64}
          gap={20}
          hoverSpeed={14}
          fadeOut
          fadeOutColor={techLoopFadeColor}
          scaleOnHover
          renderItem={renderTechLogo}
          ariaLabel="Tecnologías complementarias utilizadas en SEAMOSGENIOS"
        />
      </div>
    </section>
  );
}
