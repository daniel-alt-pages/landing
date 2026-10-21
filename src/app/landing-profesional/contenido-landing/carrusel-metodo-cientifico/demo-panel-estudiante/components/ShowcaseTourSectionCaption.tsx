'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { ShowcaseTourSectionMeta } from '../tour/tour-config';

type Props = {
  phase: ShowcaseTourSectionMeta | null;
  visible: boolean;
};

const KIND_LABEL: Record<ShowcaseTourSectionMeta['kind'], string> = {
  reset: 'Reinicio',
  hold: 'Enfoque',
  scroll: 'Desplazamiento',
  click: 'Interacción',
  detail: 'Detalle',
  tail: 'Cierre',
};

export function ShowcaseTourSectionCaption({ phase, visible }: Props) {
  return (
    <AnimatePresence mode="wait">
      {visible && phase ? (
        <motion.div
          key={phase.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.22 }}
          className="pointer-events-none absolute inset-x-2 bottom-2 z-[80] sm:inset-x-3"
          role="status"
          aria-live="polite"
          aria-atomic
        >
          <div className="rounded-xl border border-white/15 bg-slate-950/88 px-3 py-2.5 shadow-xl backdrop-blur-md">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-cyan-200">
                {KIND_LABEL[phase.kind]}
              </span>
              {phase.tab ? (
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/35">
                  {phase.tab === 'dashboard'
                    ? 'Inicio'
                    : phase.tab === 'metricas'
                      ? 'Métricas'
                      : phase.tab === 'respuestas'
                        ? 'Análisis'
                        : 'Ranking'}
                </span>
              ) : null}
            </div>
            <p className="text-xs font-bold leading-snug text-white">{phase.title}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-white/65">{phase.description}</p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
