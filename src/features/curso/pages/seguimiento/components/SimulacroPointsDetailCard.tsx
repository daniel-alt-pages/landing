'use client';

import { BookOpen, CheckCircle2, XCircle } from 'lucide-react';
import type { CourseSimulacroBonus } from '../../../types/courseTypes';
import { attendanceRankingProgressWidth } from '../../../lib/courseAttendanceRanking';
type SimulacroPointsDetailCardProps = {
  bonus?: CourseSimulacroBonus;
  rankingPoints: number;
  maxScoreInCohort: number;
  shareOfTotal?: number;
};

export default function SimulacroPointsDetailCard({
  bonus,
  rankingPoints,
  maxScoreInCohort,
  shareOfTotal,
}: SimulacroPointsDetailCardProps) {
  const presented = rankingPoints > 0;
  const simLabel = bonus?.simId ? `Simulacro ${bonus.simId}` : 'Simulacro';
  const icfesScore = bonus?.puntajeGlobal ?? rankingPoints;
  const justification =
    bonus?.justification ??
    (presented
      ? `${simLabel}: puntaje global ICFES ${icfesScore} → +${rankingPoints} pts en ranking de seguimiento.`
      : `No consta presentación de ${simLabel}. Suma 0 pts en el ranking del vacacional.`);

  const barMax = Math.max(maxScoreInCohort, rankingPoints, 1);
  const cohortPct = attendanceRankingProgressWidth(rankingPoints, barMax);
  const totalSharePct =
    shareOfTotal != null && shareOfTotal > 0
      ? attendanceRankingProgressWidth(shareOfTotal, 100)
      : null;

  return (
    <article
      className={`overflow-hidden rounded-2xl border shadow-sm ${
        presented
          ? 'border-indigo-200 bg-gradient-to-br from-white via-indigo-50/70 to-violet-50 shadow-indigo-100/70 dark:border-indigo-400/25 dark:from-indigo-500/12 dark:via-violet-500/8 dark:to-white/[0.03]'
          : 'border-[var(--course-border)] bg-[var(--course-surface-muted)]/35'
      }`}
    >
      <div className="flex items-start gap-3 px-3.5 py-3 sm:px-4 sm:py-3.5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${
            presented
              ? 'bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700 ring-indigo-200 dark:from-indigo-400/20 dark:to-violet-400/15 dark:text-indigo-100 dark:ring-indigo-300/20'
              : 'bg-[var(--course-surface-muted)] text-[var(--course-text-muted)] ring-[var(--course-border)]'
          }`}
        >
          <BookOpen className="h-5 w-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--course-text-muted)]">
                Simulacro
              </p>
              <p className="text-sm font-bold text-[var(--course-text)]">
                {simLabel}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-2xl font-black tabular-nums leading-none ${
                  presented
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent'
                    : 'text-[var(--course-text-muted)]'
                }`}
              >
                +{rankingPoints}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--course-text-muted)]">
                pts ranking
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                presented
                  ? 'border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300'
                  : 'border-rose-500/25 bg-rose-500/8 text-rose-700 dark:text-rose-300'
              }`}
            >
              {presented ? (
                <CheckCircle2 className="h-3 w-3" aria-hidden />
              ) : (
                <XCircle className="h-3 w-3" aria-hidden />
              )}
              {presented ? 'Presentado' : 'Sin presentar'}
            </span>
            {presented ? (
              <span className="rounded-full border border-indigo-200 bg-white/80 px-2 py-0.5 text-[10px] font-bold tabular-nums text-indigo-900 shadow-sm dark:border-indigo-300/20 dark:bg-white/8 dark:text-indigo-100">
                ICFES global: <strong>{icfesScore}</strong>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-indigo-200/70 px-3.5 py-3 sm:px-4 dark:border-white/10">
        <p className="text-[11px] leading-relaxed text-[var(--course-text-muted)]">{justification}</p>

        {presented ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-[var(--course-text-muted)]">
              <span>Vs. mejor puntaje del curso</span>
              <span className="tabular-nums font-black text-indigo-700 dark:text-indigo-200">{cohortPct.replace('%', '')}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--course-surface-muted)] ring-1 ring-inset ring-black/5 dark:ring-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-violet-500 to-indigo-600"
                style={{ width: cohortPct }}
              />
            </div>
          </div>
        ) : null}

        {totalSharePct && rankingPoints > 0 ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-[var(--course-text-muted)]">
              <span>Parte de tus puntos totales</span>
              <span className="tabular-nums">{Math.round(shareOfTotal ?? 0)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--course-surface-muted)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                style={{ width: totalSharePct }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
