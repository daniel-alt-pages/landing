'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Info, X } from 'lucide-react';
import {
  buildIcfesGlobalScoreBreakdown,
  formatIcfesDecimal,
  ICFES_GLOBAL_SCALE_MAX,
  ICFES_GLOBAL_TROPHY_ICON,
  ICFES_SINGLE_ERROR_SCORE_CAP,
  ICFES_SINGLE_ERROR_SCORE_MIN,
  ICFES_SUBJECT_WEIGHTS,
  ICFES_TOTAL_WEIGHT,
  type SubjectPuntaje,
} from '@features/estudiante/lib/icfesGlobalScore';
import { SG_AREA_COLORS, SG_AREA_ORDER } from '@shared/lib/sgAreaColors';

type StudentGlobalScoreModalProps = {
  open: boolean;
  onClose: () => void;
  puntajes: Record<string, SubjectPuntaje | undefined>;
  puntajeGlobal: number;
};

const STEPS = ['Ponderación', 'Puntaje global'] as const;

const STUDENT_SCORE_MODAL_OPEN_KEY = 'student_score_modal_open';
const BACKDROP_CLOSE_GUARD_MS = 450;

function WeightLegend() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {SG_AREA_ORDER.map((key) => (
        <span
          key={key}
          className="inline-flex items-center rounded-lg border border-slate-200/90 bg-white px-2 py-1 text-[10px] font-bold tabular-nums text-slate-600 shadow-sm"
        >
          <span className="text-slate-400 mr-1">{SG_AREA_COLORS[key].short}</span>
          ×{ICFES_SUBJECT_WEIGHTS[key]}
        </span>
      ))}
      <span className="text-[10px] font-semibold text-slate-400">= 13 total</span>
    </div>
  );
}

export default function StudentGlobalScoreModal({
  open,
  onClose,
  puntajes,
  puntajeGlobal,
}: StudentGlobalScoreModalProps) {
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const openedAtRef = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const breakdown = useMemo(
    () => buildIcfesGlobalScoreBreakdown(puntajes, puntajeGlobal),
    [puntajes, puntajeGlobal],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Solo al abrir — no resetear paso si el padre re-renderiza (onClose nueva referencia).
  useEffect(() => {
    if (!open) return;
    setStep(0);
    openedAtRef.current = Date.now();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    try {
      sessionStorage.setItem(STUDENT_SCORE_MODAL_OPEN_KEY, '1');
    } catch {
      /* ignore */
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      try {
        sessionStorage.removeItem(STUDENT_SCORE_MODAL_OPEN_KEY);
      } catch {
        /* ignore */
      }
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleBackdropClose = () => {
    if (Date.now() - openedAtRef.current < BACKDROP_CLOSE_GUARD_MS) return;
    onClose();
  };

  if (!open || !mounted) return null;

  const averageLabel = formatIcfesDecimal(breakdown.average);
  const scaledLabel = formatIcfesDecimal(breakdown.scaled, 1);
  const singleErrorSubjects = breakdown.rows.filter((r) => r.inSingleErrorRange);

  return createPortal(
    <div
      data-student-global-score-modal="true"
      className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-global-score-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm border-0 cursor-default"
        aria-label="Cerrar"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleBackdropClose}
      />

      <div
        className="relative z-10 flex h-dvh max-h-dvh w-full flex-col overflow-hidden rounded-none border border-white/10 bg-white shadow-2xl shadow-indigo-900/20 sm:h-auto sm:max-h-[92dvh] sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-5 pt-5 pb-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-300/90">
                Saber 11 · Seamos Genios
              </p>
              <h2
                id="student-global-score-modal-title"
                className="mt-1 text-base sm:text-lg font-bold leading-snug"
              >
                ¿Cómo se obtiene tu puntaje global?
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:bg-white/15 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            {STEPS.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                className={`flex-1 rounded-xl px-2 py-2 text-center transition-all ${
                  step === index
                    ? 'bg-white text-indigo-900 shadow-md'
                    : 'bg-white/10 text-white/75 hover:bg-white/15'
                }`}
              >
                <span className="block text-[9px] font-bold uppercase tracking-wide opacity-70">
                  Paso {index + 1}
                </span>
                <span className="block text-[11px] font-bold leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 bg-slate-50/80">
          {step === 0 ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Multiplica cada puntaje de prueba por su ponderación.
                </p>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  La ponderación indica cuánto pesa cada área en el global (3+3+3+3+1 = 13).
                </p>
              </div>

              <WeightLegend />

              <ul className="space-y-2">
                {breakdown.rows.map((row) => (
                  <li
                    key={row.key}
                    className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm"
                    style={{ borderLeftWidth: 4, borderLeftColor: row.hex }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={row.iconUrl}
                        alt=""
                        className="h-9 w-9 shrink-0"
                        width={36}
                        height={36}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-slate-800 leading-tight truncate">
                          {row.label}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-400">
                          Ponderación ×{row.weight}
                          {row.hasData && breakdown.sumWeighted > 0 ? (
                            <span className="text-slate-500">
                              {' '}
                              · {formatIcfesDecimal(row.contributionPct, 0)}% del total ponderado
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {row.hasData ? (
                          <>
                            <p className="text-[11px] font-semibold text-slate-500 tabular-nums">
                              {row.score} × {row.weight}
                            </p>
                            <p className="text-lg font-black tabular-nums text-slate-900">
                              {row.weighted}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs font-semibold text-slate-400">Sin datos</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-3">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" aria-hidden />
                  <div className="text-[12px] leading-relaxed text-amber-950">
                    <p>
                      <strong>Un solo error</strong> puede dejar el puntaje de una materia entre{' '}
                      <strong>{ICFES_SINGLE_ERROR_SCORE_MIN}</strong> y{' '}
                      <strong>{ICFES_SINGLE_ERROR_SCORE_CAP}</strong> pts (no hasta 100), según
                      dificultad de la pregunta y margen de error de la calibración.
                    </p>
                    {singleErrorSubjects.length > 0 ? (
                      <p className="mt-2 text-amber-900/90">
                        En tu caso,{' '}
                        {singleErrorSubjects.map((r) => r.label).join(', ')} está en ese rango
                        orientativo.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-800 text-center">
                Suma los resultados, divide entre {ICFES_TOTAL_WEIGHT} y multiplica por 5.
              </p>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                    <div className="text-center min-w-[10rem]">
                      <p className="text-sm sm:text-base font-bold tabular-nums leading-snug text-slate-800">
                        {breakdown.rows.map((r, index) => (
                          <span key={r.key}>
                            {index > 0 ? <span className="text-orange-500"> + </span> : null}
                            {r.weighted}
                          </span>
                        ))}
                      </p>
                      <div className="my-1.5 h-0.5 w-full min-w-[8rem] bg-orange-500 rounded-full" />
                      <p className="text-sm sm:text-base font-black tabular-nums text-slate-800">
                        {ICFES_TOTAL_WEIGHT}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-orange-500 tabular-nums">=</span>
                    <span className="text-sm sm:text-base font-black tabular-nums text-slate-800">
                      {averageLabel}
                    </span>
                  </div>

                  <p className="text-sm sm:text-base font-bold tabular-nums text-center">
                    <span className="text-slate-800">{averageLabel}</span>
                    <span className="mx-1.5 text-orange-500">×</span>
                    <span className="text-slate-800">5</span>
                    <span className="mx-1.5 text-orange-500">=</span>
                    <span className="text-slate-800">{scaledLabel}</span>
                  </p>

                  <p className="text-[11px] text-slate-500 text-center">
                    Redondeo al entero →{' '}
                    <strong className="text-slate-800">{breakdown.computedGlobal}</strong> pts
                  </p>
                </div>
              </div>

              <div
                className="w-full rounded-[1.75rem] sm:rounded-[2rem] border border-slate-200/90 bg-white p-5 sm:p-6 md:p-7 shadow-sm relative overflow-hidden"
                data-score-result-card
              >
                <div
                  className="relative z-10 flex flex-row items-center justify-center gap-4 sm:gap-5 md:gap-6 w-full max-w-[min(100%,24rem)] mx-auto"
                >
                  <div className="shrink-0 flex items-center justify-center">
                    <img
                      src={ICFES_GLOBAL_TROPHY_ICON}
                      alt=""
                      className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 object-contain"
                      width={96}
                      height={96}
                    />
                  </div>
                  <div className="flex flex-col items-center justify-center text-center min-w-0 flex-1">
                    <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
                      <span className="w-1 h-3.5 sm:h-4 bg-violet-600 rounded-full shrink-0" />
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-violet-800">
                        Tu puntaje global
                      </p>
                    </div>
                    <p
                      className="text-[3.25rem] leading-[0.92] sm:text-[4rem] md:text-5xl font-black tabular-nums tracking-tighter text-slate-900 [text-shadow:none]"
                    >
                      {puntajeGlobal}
                    </p>
                    <p className="text-slate-600 font-semibold mt-1 text-base sm:text-lg md:text-xl">
                      de {ICFES_GLOBAL_SCALE_MAX} posibles
                    </p>
                  </div>
                </div>
              </div>

              {!breakdown.matchesOfficial ? (
                <p className="text-[11px] leading-relaxed text-slate-500 text-center px-1">
                  El puntaje oficial ({puntajeGlobal}) puede diferir del cálculo simple (
                  {breakdown.computedGlobal}) por calibración por pregunta, penalizaciones o
                  redondeos del simulacro.
                </p>
              ) : (
                <p className="text-[11px] text-emerald-700 text-center font-semibold">
                  Tu puntaje coincide con la fórmula de ponderación.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3.5 sm:px-5">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(0)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Atrás
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">Con tus puntajes actuales</span>
          )}

          {step === 0 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/30 hover:bg-indigo-700 transition-colors"
            >
              Ver resultado
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/30 hover:bg-indigo-700 transition-colors"
            >
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
