import { Pill } from '../ui-componentes/LandingPrimitives';
import { displaySerif } from '../content';

type CasesSectionProps = {
  isLightLanding: boolean;
};

export function CasesSection({ isLightLanding }: CasesSectionProps) {
  return (
      <section
        id="casos-ejemplo"
        className={`scroll-mt-24 border-t px-[clamp(1rem,3vw,2.5rem)] py-[clamp(2.5rem,6vw,4rem)] sm:scroll-mt-28 ${
          isLightLanding ? 'border-slate-200 bg-slate-50/80' : 'border-white/[0.06] bg-black/[0.15]'
        }`}
      >
        <div className="mx-auto w-full max-w-[min(80rem,100%)]">
          <div className="max-w-2xl">
            <Pill surface={isLightLanding ? 'light' : 'dark'}>Casos</Pill>
            <h2
              className={`${displaySerif} mt-4 text-3xl font-medium tracking-tight sm:text-4xl ${
                isLightLanding ? 'text-slate-900' : 'text-white'
              }`}
            >
              Donde encaja la propuesta
            </h2>
            <p className={`mt-3 text-sm leading-relaxed sm:text-[15px] ${isLightLanding ? 'text-slate-600' : 'text-white/55'}`}>
              Tres lecturas típicas de equipos que cotizan simulacro institucional: foco en cierre pedagógico, lectura por
              curso y decisión con evidencia exportable.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-4 sm:gap-5">
            {[
              {
                t: 'Cierre el mismo día',
                d: 'Retro en vivo + archivo para repaso: el estudiante sale con ruta clara y la institución con señales agregadas.',
              },
              {
                t: 'Coordinación por curso',
                d: 'Resúmenes y comparativas por grado sin depender de hojas sueltas: un solo panel para socializar en equipo.',
              },
              {
                t: 'Comercial transparente',
                d: 'COP por segmento y calculadora por grados matriculados: menos fricción entre rectoría, tesorería y uso académico.',
              },
            ].map((c) => (
              <article
                key={c.t}
                className={
                  isLightLanding
                    ? 'rounded-2xl border border-slate-200/90 bg-white p-5 shadow-md shadow-slate-900/5'
                    : 'rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 shadow-xl shadow-black/25'
                }
              >
                <h3 className={`text-base font-semibold ${isLightLanding ? 'text-slate-900' : 'text-white'}`}>{c.t}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${isLightLanding ? 'text-slate-600' : 'text-white/58'}`}>
                  {c.d}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>


  );
}
