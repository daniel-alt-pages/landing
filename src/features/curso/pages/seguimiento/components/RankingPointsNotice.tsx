'use client';

import { Info } from 'lucide-react';

export default function RankingPointsNotice() {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-[var(--course-border)] bg-[var(--course-surface-muted)]/40 px-3 py-2 text-[10px] leading-relaxed text-[var(--course-text-muted)] sm:text-[11px]">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--course-accent)]" aria-hidden />
      <span>
        Tus puntos actuales pueden variar en el futuro debido a ajustes en la lógica del sistema de
        ranking. Los cambios se aplican de forma uniforme para todos los participantes del curso
        vacacional.
      </span>
    </p>
  );
}
