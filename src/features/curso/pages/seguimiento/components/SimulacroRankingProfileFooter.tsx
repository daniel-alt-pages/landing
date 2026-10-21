'use client';

import { BookOpen, Target, Trophy } from 'lucide-react';
import type { SimulacroRankingSnapshot } from '../../../lib/courseAttendanceRanking';
import {
  formatRankingPointsGap,
  RANKING_TOP_VISIBLE,
} from '../lib/seguimientoUi';
import { SIMULACRO_POINTS_BREAKDOWN_LABEL } from '../../../lib/courseAttendancePoints';

type SimulacroRankingProfileFooterProps = {
  snapshot: SimulacroRankingSnapshot;
};

export default function SimulacroRankingProfileFooter({
  snapshot,
}: SimulacroRankingProfileFooterProps) {
  const { rank, score, puntajeGlobal, presented, rosterSize, inTop, pointsGapToTop } = snapshot;
  const topTargetScore =
    pointsGapToTop != null ? score + pointsGapToTop : score > 0 ? score : null;
  const progressPct =
    topTargetScore != null && topTargetScore > 0 && !inTop
      ? Math.round(Math.min(100, Math.max(0, (score / topTargetScore) * 100)))
      : inTop && score > 0
        ? 100
        : null;

  return (
    <section
      className="relative z-10"
      aria-label="Tu posición en el ranking del simulacro"
    >
      <div
        className={`rounded-[1.25rem] p-px shadow-[0_12px_40px_-12px_rgba(124,58,237,0.35)] ${
          inTop
            ? 'bg-gradient-to-br from-amber-400/90 via-[var(--course-accent)]/70 to-violet-500/60'
            : 'bg-gradient-to-br from-[var(--course-accent)]/55 via-violet-400/35 to-[var(--course-accent)]/25'
        }`}
      >
        <div className="rounded-[1.2rem] bg-[var(--course-surface)]/95 p-4 backdrop-blur-md sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${
                  inTop
                    ? 'bg-amber-500/15 ring-amber-400/30'
                    : 'bg-[var(--course-accent)]/10 ring-[var(--course-accent)]/25'
                }`}
              >
                <BookOpen
                  className={`h-6 w-6 ${inTop ? 'text-amber-500' : 'text-[var(--course-accent)]'}`}
                  aria-hidden
                />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--course-text-muted)]">
                  Ranking {SIMULACRO_POINTS_BREAKDOWN_LABEL}
                </p>
                <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0 tabular-nums">
                  <span className="text-3xl font-black leading-none text-[var(--course-text)]">
                    #{rank}
                  </span>
                  <span className="text-xs font-semibold text-[var(--course-text-muted)]">
                    de {rosterSize} estudiantes
                  </span>
                </p>
              </div>
            </div>

            {!inTop && pointsGapToTop != null ? (
              <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--course-accent)]/25 bg-[var(--course-accent)]/10 px-3 py-1.5 text-xs font-bold text-[var(--course-accent)]">
                <Target className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">
                  Faltan {formatRankingPointsGap(pointsGapToTop)} pts ICFES · Top {RANKING_TOP_VISIBLE}
                </span>
              </div>
            ) : inTop ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-300">
                <Trophy className="h-3.5 w-3.5" aria-hidden />
                Top {RANKING_TOP_VISIBLE}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-lg border border-[var(--course-border)] bg-[var(--course-surface-muted)]/50 px-2.5 py-1 text-xs font-bold tabular-nums text-[var(--course-text)]">
              +{score} pts ranking
            </span>
            {presented ? (
              <span className="rounded-lg border border-[var(--course-border)] bg-[var(--course-surface-muted)]/50 px-2.5 py-1 text-xs font-semibold tabular-nums text-[var(--course-text-muted)]">
                ICFES global: {puntajeGlobal}
              </span>
            ) : (
              <span className="rounded-lg border border-rose-500/20 bg-rose-500/8 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300">
                Sin presentar
              </span>
            )}
          </div>

          {!inTop && progressPct != null ? (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                <span className="text-[var(--course-text-muted)]">
                  Progreso hacia el Top {RANKING_TOP_VISIBLE}
                </span>
                <span className="tabular-nums text-[var(--course-accent)]">{progressPct}%</span>
              </div>
              <div
                className="h-2.5 overflow-hidden rounded-full bg-[var(--course-surface-muted)] ring-1 ring-inset ring-black/5 dark:ring-white/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPct}
                aria-label={`Progreso hacia el Top ${RANKING_TOP_VISIBLE} del simulacro`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--course-accent)] to-violet-500 transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.max(8, progressPct)}%` }}
                />
              </div>
            </div>
          ) : null}

          <p className="mt-4 text-[11px] leading-relaxed text-[var(--course-text-muted)]">
            El simulacro SG11-20 suma su puntaje global ICFES al ranking general del vacacional.
            Este bloque muestra tu posición solo por ese simulacro: 1 punto de ranking por cada
            punto ICFES. Si no presentaste el simulacro, quedas con 0 pts en esta tabla.
          </p>
        </div>
      </div>
    </section>
  );
}
