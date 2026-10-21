'use client';

import { Gift, Info, Trophy } from 'lucide-react';
import { useCourseTheme } from '../../../hooks/useCourseTheme';

export default function RankingPrizeBanner() {
  const { dark } = useCourseTheme();

  return (
    <aside
      className={`rounded-2xl border px-4 py-3.5 sm:px-5 ${
        dark
          ? 'border-amber-400/25 bg-gradient-to-br from-amber-500/12 via-[var(--course-surface)] to-violet-600/10'
          : 'border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-white to-violet-50/60'
      }`}
      aria-label="Información de premios del ranking"
    >
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            dark ? 'bg-amber-400/20 text-amber-200' : 'bg-amber-100 text-amber-700'
          }`}
        >
          <Gift className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${
              dark ? 'text-amber-200' : 'text-amber-800'
            }`}
          >
            <Trophy className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Premio al final del curso
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--course-text)] sm:text-xs">
            Al cerrar el vacacional habrá premio para{' '}
            <strong>una sola persona</strong>: el <strong>#1 del ranking global</strong> por puntos
            acumulados (asistencia, minutos en vivo y rachas).
          </p>
        </div>
      </div>
      <p
        className={`mt-3 flex items-start gap-2 rounded-lg px-2.5 py-2 text-[10px] leading-relaxed sm:text-[11px] ${
          dark
            ? 'bg-white/5 text-[var(--course-text-muted)]'
            : 'bg-[var(--course-surface-muted)]/60 text-[var(--course-text-muted)]'
        }`}
      >
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--course-accent)]" aria-hidden />
        <span>
          Tus puntos pueden variar por ajustes en la lógica del ranking. Los cambios se aplican
          igual para todos.
        </span>
      </p>
    </aside>
  );
}
