'use client';

import { ShowcaseMateriaCard } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/ui-materias/ShowcaseMateriaCard';
import { SHOWCASE_MATERIAS } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/utilidades-panel/showcaseDashboardConstants';
import AnimateIn from '@shared/components/animations/AnimateIn';
import StarBorder from '@shared/components/animations/StarBorder';
import TextAnimation from '@shared/components/animations/TextAnimation';
import type { ShowcaseDashboardStats } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/useShowcaseDashboardStats';

type Props = { stats: ShowcaseDashboardStats };

export function ShowcaseDashboardMateriasSection({ stats }: Props) {
  const { embedded } = stats;
  const { estudiante, rankingInfo, subjectTops } = embedded;
  return (
  <AnimateIn type="fadeUp" delay={0.15}>
    <section>
      <div className="mb-6 flex items-center gap-2">
        <span className="h-6 w-2 rounded-full bg-indigo-600" />
        <TextAnimation text="Resultados por Área" as="h2" classname="text-xl font-bold text-slate-800" />
      </div>
      <div className="grid grid-cols-3 gap-6">
        {SHOWCASE_MATERIAS.map((materia, idx) => {
          const data = estudiante.puntajes[materia.key] ?? {
            puntaje: 0,
            correctas: 0,
            total_preguntas: 0,
          };
          const st = subjectTops.find((s) => s.materia === materia.key);
          return (
            <AnimateIn key={materia.key} type="fadeUp" delay={idx * 0.1}>
              <ShowcaseMateriaCard
                materia={materia}
                data={data}
                idx={idx}
                rankingPuesto={st?.miPuesto ?? 0}
                rankingTotal={st?.total ?? rankingInfo.total}
              />
            </AnimateIn>
          );
        })}

        <AnimateIn type="scaleUp" delay={0.6}>
          <StarBorder
            color="#10b981"
            speed="8s"
            radius="1.25rem"
            className="h-full transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10"
          >
            <div className="flex h-full cursor-default flex-col overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-emerald-50 via-white to-green-50">
              <div
                className="relative px-5 pb-4 pt-5"
                style={{
                  background:
                    'linear-gradient(135deg, #10b98115 0%, #10b98108 50%, transparent 100%)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg shadow-emerald-500/25">
                      <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-slate-800">Siguiente Simulacro</h3>
                      <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                        Solicitar información →
                      </p>
                    </div>
                  </div>
                  <span className="rounded-xl border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-600 shadow-sm">
                    NUEVO
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between px-5 pb-5">
                <div className="space-y-3">
                  <p className="text-xs leading-relaxed text-slate-500">
                    Practica con más simulacros tipo ICFES Saber 11 y mejora tu puntaje. Únete a
                    nuestro grupo de WhatsApp.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Estándares ICFES', 'Métricas avanzadas', 'Evolución'].map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700"
                      >
                        <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-500/20">
                  Escríbenos por WhatsApp
                </div>
              </div>
            </div>
          </StarBorder>
        </AnimateIn>
      </div>
    </section>
  </AnimateIn>


  );
}
