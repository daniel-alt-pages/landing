import dynamic from 'next/dynamic';
import { Pill } from '../ui-componentes/LandingPrimitives';
import { displaySerif, scientificPlatformLayers } from '../content';
import type { LandingTone } from '../tipos';

const CoordinatorMethodCharts = dynamic(
  () => import('../ui-componentes/CoordinatorMethodCharts').then((m) => ({ default: m.CoordinatorMethodCharts })),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-2xl bg-slate-200/40" aria-hidden /> },
);

const TrustedMarksCarousel = dynamic(
  () => import('@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico').then((m) => ({ default: m.TrustedMarksCarousel })),
  { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-2xl bg-slate-200/40" aria-hidden /> },
);

type ScientificMethodSectionProps = {
  isLightLanding: boolean;
  bodyPillSurface: 'light' | 'dark';
  bodyTitleClass: string;
  bodyMutedClass: string;
  bodySubtleClass: string;
  landingTone: LandingTone;
};

export function ScientificMethodSection({
  isLightLanding,
  bodyPillSurface,
  bodyTitleClass,
  bodyMutedClass,
  bodySubtleClass,
  landingTone,
}: ScientificMethodSectionProps) {
  return (
    <section
      id="metodo-cientifico"
      className={`cotiz-landing-chapter scroll-mt-[var(--cotiz-mhdr-offset,4.5rem)] border-t px-4 py-12 sm:scroll-mt-28 sm:px-6 sm:py-16 lg:px-8 xl:px-10 ${
        isLightLanding ? 'border-[rgba(130,96,75,0.16)] bg-transparent' : 'border-white/16 bg-transparent'
      }`}
    >
      <div className="mx-auto w-full max-w-[min(80rem,100%)]">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.88fr)] xl:items-start xl:gap-12">
          <div className="min-w-0">
            <Pill surface={bodyPillSurface}>Método de la plataforma</Pill>
            <h2 className={`${displaySerif} mt-5 text-pretty text-4xl font-medium tracking-tight ${bodyTitleClass} sm:text-5xl`}>
              Qué hace SEAMOSGENIOS desde una lectura científica.
            </h2>
            <p className={`mt-5 text-sm leading-relaxed sm:text-base ${bodyMutedClass}`}>
              La plataforma funciona como un sistema de evaluación formativa: captura respuestas de simulacros tipo ICFES,
              las procesa con analítica educativa descriptiva y devuelve evidencia accionable para estudiantes,
              docentes y coordinación académica. Su valor no está solo en calcular un puntaje, sino en cerrar el ciclo entre
              medición, interpretación, retroalimentación y planificación del siguiente refuerzo.
            </p>
            <p className={`mt-4 text-sm leading-relaxed ${bodySubtleClass}`}>
              La lectura científica aquí es prudente: el sistema describe patrones de desempeño, error y progreso; no
              reemplaza evaluación profesional, acompañamiento docente ni decisiones institucionales contextualizadas.
            </p>
            <CoordinatorMethodCharts tone={landingTone} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {scientificPlatformLayers.map((layer) => (
              <article
                key={layer.title}
                className={`rounded-[1.6rem] p-5 transition ${
                  isLightLanding
                    ? 'eg-card border border-[rgba(130,96,75,0.16)] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)]'
                    : 'eg-card border border-white/16 bg-white/[0.025]'
                }`}
              >
                <span
                  className={`font-mono text-[11px] font-semibold uppercase tracking-[0.22em] ${
                    isLightLanding ? 'text-slate-500' : 'text-white/45'
                  }`}
                >
                  {layer.step}
                </span>
                <h3 className={`mt-4 text-lg font-semibold ${bodyTitleClass}`}>{layer.title}</h3>
                <p className={`mt-3 text-sm leading-relaxed ${bodyMutedClass}`}>{layer.text}</p>
              </article>
            ))}
          </div>
        </div>
        <TrustedMarksCarousel isLightLanding={isLightLanding} />
      </div>
    </section>
  );
}
