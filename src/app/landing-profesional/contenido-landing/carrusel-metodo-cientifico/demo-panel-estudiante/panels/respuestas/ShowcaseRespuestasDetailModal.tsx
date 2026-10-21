'use client';

import { BarChart, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { showcaseDomIds } from '../../constants/dom-ids';
import { showcaseTourHighlightClass } from '../../context/showcaseTourHighlightClass';
import type { ShowcaseRespuestaCell } from './showcase-respuestas-sessions';
import { showcaseMockGroupStats } from './showcase-respuestas-sessions';

type Props = {
  question: ShowcaseRespuestaCell;
  tourHighlightId: string | null;
  onClose: () => void;
};

export function ShowcaseRespuestasDetailModal({ question, tourHighlightId, onClose }: Props) {
  const group = showcaseMockGroupStats(question.numero);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[55] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-h-[min(92%,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div className="mb-4 flex items-start justify-between gap-3">
          <motion.div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Pregunta #{question.numero}
            </p>
            <h3 className="mt-1 text-xl font-black text-white">
              {question.es_correcta ? '¡Correcta!' : 'Incorrecta'}
            </h3>
          </motion.div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs font-bold text-white/50 hover:bg-white/10 hover:text-white"
          >
            Cerrar
          </button>
        </motion.div>

        <motion.div
          className={`mb-4 flex items-center gap-3 rounded-2xl border p-3 ${
            question.es_correcta
              ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-500/20 to-emerald-500/5'
              : 'border-rose-500/30 bg-gradient-to-r from-rose-500/20 to-rose-500/5'
          }`}
        >
          <motion.div
            className={`rounded-xl p-2 ${
              question.es_correcta ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            {question.es_correcta ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
          </motion.div>
          <p className="text-sm text-white/65">
            {question.es_correcta
              ? 'Has dominado este concepto.'
              : `La correcta era ${question.correcta}, tú marcaste ${question.respuesta || 'NR'}.`}
          </p>
        </motion.div>

        <motion.div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-3">
          <motion.div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-white/40">Dificultad global</span>
            <span className="font-bold tabular-nums text-white">{group.correctPct}% acertó</span>
          </motion.div>
          <motion.div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-400"
              style={{ width: `${group.correctPct}%` }}
            />
          </motion.div>
        </motion.div>

        <h5 className="mb-3 flex items-center gap-2 text-sm font-bold text-white/70">
          <BarChart size={16} className="text-purple-400" />
          Cómo respondió el grupo
        </h5>
        <motion.div className="space-y-2">
          {(['A', 'B', 'C', 'D'] as const).map((opt) => {
            const isCorrectOpt = opt === question.correcta;
            const isChosenOpt = opt === question.respuesta;
            const pctVal = group.dist[opt];
            const optId = showcaseDomIds.option(opt);

            return (
              <motion.div
                key={opt}
                className={`rounded-xl border bg-white/5 p-2.5 ${
                  isCorrectOpt
                    ? 'border-emerald-500/30'
                    : isChosenOpt
                      ? 'border-rose-500/30'
                      : 'border-transparent'
                }`}
              >
                <motion.div className="mb-1.5 flex items-center justify-between text-xs">
                  <span
                    id={optId}
                    className={`flex items-center gap-2 font-bold ${showcaseTourHighlightClass(optId, tourHighlightId)} ${
                      isCorrectOpt
                        ? 'text-emerald-400'
                        : isChosenOpt
                          ? 'text-rose-400'
                          : 'text-white/60'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                        isCorrectOpt
                          ? 'bg-emerald-500 text-white'
                          : isChosenOpt
                            ? 'bg-rose-500 text-white'
                            : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {opt}
                    </span>
                    {isCorrectOpt ? 'Correcta' : isChosenOpt ? 'Tu marca' : ''}
                  </span>
                  <span className="font-bold tabular-nums text-white/70">{pctVal}%</span>
                </motion.div>
                <motion.div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pctVal}%`,
                      background: isCorrectOpt
                        ? 'linear-gradient(to right, #10b981, #34d399)'
                        : isChosenOpt
                          ? 'linear-gradient(to right, #f43f5e, #fb7185)'
                          : 'rgba(255,255,255,0.2)',
                    }}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
