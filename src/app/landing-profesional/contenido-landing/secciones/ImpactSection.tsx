'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { buildImpactMetricCards, impactValidityDefinitions, numberFormatter } from '../mapa-impacto/impactData';
import { useLandingReferenceIndex } from '../utilidades/useLandingReferenceIndex';
import { useInViewOnce } from '../utilidades/useInViewOnce';
import { Pill } from '../ui-componentes/LandingPrimitives';
import { displaySerif } from '../content';
import type { LandingTone } from '../tipos';

const ColombiaImpactMap = dynamic(() => import('../mapa-impacto/ColombiaImpactMap').then((m) => m.ColombiaImpactMap), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />,
});

function MapLoadingSkeleton() {
  return (
    <div className="flex h-[clamp(18rem,52dvh,34rem)] items-center justify-center rounded-[1.4rem] border border-dashed border-white/15 bg-black/20 sm:h-[clamp(22rem,58dvh,34rem)]">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">Preparando mapa…</span>
    </div>
  );
}

const IMPACT_GRID_CLASS =
  'flex flex-col gap-8 lg:gap-10 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] xl:items-start 2xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] 2xl:gap-12';

type ImpactSectionProps = {
  isLightLanding: boolean;
  bodyTitleClass: string;
  bodyMutedClass: string;
  bodySubtleClass: string;
  landingTone: LandingTone;
};

export function ImpactSection({
  isLightLanding,
  bodyTitleClass,
  bodyMutedClass,
  bodySubtleClass,
  landingTone,
}: ImpactSectionProps) {
  const { ref, inView } = useInViewOnce(0.08);
  const { index, indexStatus } = useLandingReferenceIndex(inView);
  const summary = index?.impactSummary;
  const impactMetricCards = useMemo(() => (summary ? buildImpactMetricCards(summary) : []), [summary]);
  const metricsLoading = indexStatus === 'loading';
  const metricsFailed = indexStatus === 'error' && inView;

  const legendSurface = isLightLanding
    ? 'border-slate-200/90 bg-white/90'
    : 'border-white/[0.1] bg-white/[0.04]';
  const legendTerm = isLightLanding ? 'text-slate-800' : 'text-white/90';
  const legendDef = isLightLanding ? 'text-slate-600' : 'text-white/60';

  const metricCardBase = isLightLanding
    ? 'border border-slate-200 bg-white shadow-md shadow-slate-900/5'
    : 'border border-white/[0.08] bg-white/[0.035] shadow-xl shadow-black/20';
  const metricCardEmphasis = isLightLanding
    ? 'border border-sky-200 bg-gradient-to-br from-sky-50 to-white shadow-md shadow-sky-900/10 ring-1 ring-sky-100'
    : 'border border-cyan-300/20 bg-gradient-to-br from-cyan-400/[0.08] to-white/[0.03] shadow-xl shadow-black/25 ring-1 ring-cyan-200/15';

  const shellClass = `cotiz-landing-chapter scroll-mt-[var(--cotiz-mhdr-offset,4.5rem)] border-t px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16 xl:scroll-mt-28 xl:px-10 ${
    isLightLanding ? 'border-slate-200 bg-white/95' : 'border-white/[0.06] bg-[#07111f]/92'
  }`;

  return (
    <div
      ref={ref}
      id="impacto-acumulado"
      className={`mx-auto w-full max-w-[min(80rem,100%)] ${shellClass}`}
    >
      <div className={IMPACT_GRID_CLASS}>
        <div className="min-w-0">
          <Pill surface={isLightLanding ? 'light' : 'dark'}>Alcance acumulado</Pill>
          <h2
            className={`${displaySerif} mt-4 text-pretty text-[clamp(1.75rem,4.5vw,3rem)] font-medium leading-[1.08] tracking-tight ${bodyTitleClass}`}
          >
            {summary ? (
              <>Más de {numberFormatter.format(summary.totals.uniqueUsers)} usuarios ya dejaron evidencia de aprendizaje.</>
            ) : metricsLoading ? (
              'Cargando alcance acumulado…'
            ) : metricsFailed ? (
              'No se pudieron cargar las métricas'
            ) : (
              'Alcance acumulado en simulacros'
            )}
          </h2>
          <p className={`mt-4 max-w-2xl text-sm leading-relaxed sm:text-base ${bodyMutedClass}`}>
            Resumen agregado de todos los ciclos de simulacro disponibles: usuarios únicos, simulacros válidos,
            promedios y cobertura por departamento. Sin datos personales en esta vista.
          </p>
          <p className={`mt-3 max-w-2xl text-xs leading-relaxed sm:text-sm ${bodySubtleClass}`}>
            {summary ? (
              <>
                Fuente interna: {summary.totals.simulations} simulacros procesados ({summary.simulations.length} ciclos
                en la serie).
              </>
            ) : (
              'Métricas agregadas; sin nombres, correos ni documentos.'
            )}
          </p>

          <aside
            className={`mt-5 rounded-[1.25rem] border p-4 sm:p-5 ${legendSurface}`}
            aria-label="Qué cuenta como simulacro válido"
          >
            <p className={`font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${bodySubtleClass}`}>
              Cómo leemos los datos
            </p>
            <ul className="mt-3 space-y-3">
              {impactValidityDefinitions.map((item) => (
                <li key={item.term} className="grid gap-1 sm:grid-cols-[minmax(7.5rem,9.5rem)_1fr] sm:gap-3">
                  <span className={`text-xs font-semibold sm:text-sm ${legendTerm}`}>{item.term}</span>
                  <span className={`text-xs leading-relaxed sm:text-sm ${legendDef}`}>{item.definition}</span>
                </li>
              ))}
            </ul>
          </aside>

          <div className="mt-6 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
            {metricsFailed ? (
              <p className={`col-span-full text-sm ${bodyMutedClass}`}>
                No cargó el resumen de impacto. En local:{' '}
                <code className="text-xs">pnpm run landing:impact</code> y reinicia{' '}
                <code className="text-xs">pnpm dev</code>. En producción:{' '}
                <code className="text-xs">pnpm run landing:reference:sync</code>.
              </p>
            ) : null}
            {metricsLoading && !impactMetricCards.length
              ? Array.from({ length: 8 }).map((_, cardIndex) => (
                  <article key={cardIndex} className={`rounded-[1.35rem] p-4 sm:p-[1.1rem] ${metricCardBase}`}>
                    <div className={`h-3 w-24 animate-pulse rounded ${isLightLanding ? 'bg-slate-200' : 'bg-white/10'}`} />
                    <div className={`mt-3 h-8 w-20 animate-pulse rounded ${isLightLanding ? 'bg-slate-200' : 'bg-white/10'}`} />
                  </article>
                ))
              : impactMetricCards.map((metric) => (
                  <article
                    key={metric.label}
                    className={`rounded-[1.35rem] p-4 sm:p-[1.1rem] ${metric.emphasis ? metricCardEmphasis : metricCardBase}`}
                  >
                    <p className={`font-mono text-[10px] font-semibold uppercase tracking-[0.2em] ${bodySubtleClass}`}>
                      {metric.label}
                    </p>
                    <p
                      className={`${displaySerif} mt-2.5 text-[clamp(1.5rem,3.5vw,1.875rem)] font-medium leading-none tracking-tight sm:mt-3 ${bodyTitleClass}`}
                    >
                      {metric.value}
                    </p>
                    <p className={`mt-2 text-[11px] leading-relaxed sm:text-xs ${bodyMutedClass}`}>{metric.detail}</p>
                  </article>
                ))}
          </div>
        </div>

        <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <ColombiaImpactMap tone={landingTone} loadMap={inView} impactSummary={summary ?? null} />
        </div>
      </div>
    </div>
  );
}
