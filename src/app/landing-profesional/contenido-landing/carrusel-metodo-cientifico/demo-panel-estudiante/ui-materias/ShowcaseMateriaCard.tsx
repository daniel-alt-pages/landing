'use client';

import StarBorder from '@shared/components/animations/StarBorder';
import type { ShowcaseMateriaConfig } from '../constants/materias';
import {
  getNivelDesempeno,
  showcaseGetInsight,
  showcaseGetNivelMateriaMeta,
  showcaseGetScaleForMateria,
} from '../constants/performance';

type Materia = ShowcaseMateriaConfig;

type Puntaje = { puntaje: number; correctas: number; total_preguntas: number };

export function ShowcaseMateriaCard({
  materia,
  data,
  idx,
  rankingPuesto,
  rankingTotal,
  variant = 'dark',
}: {
  materia: Materia;
  data: Puntaje;
  idx: number;
  rankingPuesto: number;
  rankingTotal: number;
  /** `light` = tarjetas blancas del dashboard; `dark` = panel oscuro. */
  variant?: 'light' | 'dark';
}) {
  const isLight = variant === 'light';
  const porc = data.total_preguntas > 0 ? Math.round((data.correctas / data.total_preguntas) * 100) : 0;
  const nivelMateria = data.total_preguntas > 0 ? showcaseGetNivelMateriaMeta(data.puntaje) : null;
  const insight = showcaseGetInsight(data.puntaje);

  return (
    <StarBorder
      color={data.total_preguntas > 0 ? materia.color : '#94a3b8'}
      speed="6s"
      radius="1.25rem"
      className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div
        className={`w-full overflow-hidden rounded-[1.25rem] text-left ${
          isLight ? 'border border-slate-100 bg-white' : 'border border-white/5 bg-[#0f111a]'
        }`}
      >
        <div
          className="h-1.5 w-full"
          style={{
            background:
              data.total_preguntas > 0
                ? `linear-gradient(90deg, ${materia.color}, ${materia.color}99)`
                : 'linear-gradient(90deg, #cbd5e1, #94a3b8)',
          }}
        />
        <div
          className="relative px-5 pt-4 pb-4"
          style={{
            background:
              data.total_preguntas > 0
                ? `linear-gradient(135deg, ${materia.color}12 0%, ${materia.color}08 50%, transparent 100%)`
                : 'linear-gradient(135deg, #94a3b812 0%, #94a3b808 50%, transparent 100%)',
          }}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${materia.color}, ${materia.color}cc)`,
                  boxShadow: `0 8px 20px ${materia.color}30`,
                }}
              >
                <MateriaIcon materiaKey={materia.key} />
              </div>
              <div>
                <h3
                  className={`text-[15px] font-bold leading-tight ${isLight ? 'text-slate-800' : 'text-white'}`}
                >
                  {materia.label}
                </h3>
                {nivelMateria && (
                  <span
                    className={`mt-1 inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold ${nivelMateria.badge}`}
                  >
                    {nivelMateria.label}
                  </span>
                )}
              </div>
            </div>
            <div
              className="inline-flex min-w-[56px] items-center justify-center rounded-2xl px-3 py-2 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${materia.color}, ${materia.color}dd)`,
                boxShadow: `0 4px 15px ${materia.color}40`,
              }}
            >
              <span className="text-2xl font-black leading-none tracking-tight text-white">
                {data.puntaje}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-4 px-5 pb-5">
          <div>
            <div className="mb-2 flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span>Progreso</span>
              <span className="font-black" style={{ color: materia.color }}>
                {porc}%
              </span>
            </div>
            <div className={`relative h-2 w-full rounded-full ${isLight ? 'bg-slate-100' : 'bg-[#14161f]'}`}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${porc}%`,
                  background: `linear-gradient(90deg, ${materia.color}cc, ${materia.color})`,
                }}
              />
            </div>
            <div
              className={`mt-2 flex items-center gap-2 rounded-xl border px-3 py-1.5 ${
                isLight ? 'border-slate-100 bg-slate-50' : 'border-white/5 bg-[#14161f]'
              }`}
            >
              <span className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {data.correctas}
                <span className="font-medium text-slate-500"> / {data.total_preguntas}</span>
              </span>
            </div>
          </div>
          <div className={`flex items-start gap-2.5 rounded-2xl border p-3 ${insight.bg} ${insight.border}`}>
            <p className={`text-[11px] font-medium leading-snug ${insight.color}`}>{insight.text}</p>
          </div>
          {data.puntaje > 0 && (() => {
            const niveles = showcaseGetScaleForMateria(materia.key);
            if (!niveles) return null;
            const actual = getNivelDesempeno(materia.key, data.puntaje);
            const actualLabel = actual?.etiqueta ?? '';
            return (
              <div
                className={`space-y-2 rounded-2xl border border-solid p-3 ${
                  isLight ? 'border-slate-100 bg-slate-50' : 'border-white/5 bg-[#14161f]'
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Escala ICFES {materia.label}
                </p>
                <div className="flex gap-1.5">
                  {niveles.map((lvl) => {
                    const isActive = !!actual && lvl.etiqueta === actual.etiqueta;
                    return (
                      <div key={lvl.etiqueta} className="flex flex-1 flex-col gap-1">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            background: isActive ? materia.color : 'rgba(255,255,255,0.08)',
                            boxShadow: isActive ? `0 0 16px ${materia.color}55` : 'none',
                          }}
                        />
                        <p
                          className={`text-center text-[9px] font-black leading-none ${
                            isActive
                              ? isLight
                                ? 'text-slate-800'
                                : 'text-white'
                              : 'text-slate-500'
                          }`}
                        >
                          {lvl.etiqueta}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className={`text-center text-[10px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Tu puntaje ({data.puntaje}) corresponde al nivel{' '}
                  <strong style={{ color: materia.color }}>{actualLabel}</strong>
                </p>
              </div>
            );
          })()}
          {rankingPuesto > 0 && (
            <div
              className="w-full rounded-2xl p-2.5 animate-pulse"
              style={{ backgroundColor: `${materia.color}10`, border: `1px solid ${materia.color}25` }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider opacity-70"
                  style={{ color: materia.color }}
                >
                  Ranking
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black" style={{ color: materia.color }}>
                    #{rankingPuesto}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">/ {rankingTotal}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </StarBorder>
  );
}

function MateriaIcon({ materiaKey }: { materiaKey: string }) {
  const cls = 'h-5 w-5';
  if (materiaKey === 'matemáticas')
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  if (materiaKey === 'lectura crítica')
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    );
  if (materiaKey === 'sociales y ciudadanas')
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  if (materiaKey === 'ciencias naturales')
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    );
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}
