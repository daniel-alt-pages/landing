'use client';

import { Play } from 'lucide-react';
import type { CourseDoc } from '../types/courseTypes';

type ContinueRecording = { id: string; title: string };

type CourseHeroProps = {
  course: CourseDoc;
  percentComplete?: number;
  continueWatching?: ContinueRecording | null;
  onContinue?: (recordingId: string) => void;
};

export default function CourseHero({
  course,
  percentComplete = 0,
  continueWatching,
  onContinue,
}: CourseHeroProps) {
  const { hero, name, audienceLabel } = course;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--course-border-strong)] bg-gradient-to-br from-[var(--course-accent)] via-indigo-600 to-[var(--course-accent-2)] p-6 text-white shadow-[var(--course-shadow-lg)] sm:p-8">
      {hero.coverImageUrl ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${hero.coverImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          aria-hidden
        />
      ) : null}
      <div className="relative z-[1]">
        {hero.badge || audienceLabel ? (
          <span className="mb-3 inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
            {hero.badge || audienceLabel}
          </span>
        ) : null}
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          {hero.title || name}
        </h1>
        {hero.subtitle ? (
          <p className="mt-2 max-w-2xl text-sm text-white/80 sm:text-base">{hero.subtitle}</p>
        ) : null}

        {percentComplete > 0 ? (
          <div className="mt-5 max-w-md">
            <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-white/90">
              <span>Progreso del curso</span>
              <span className="tabular-nums">{percentComplete}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-white/20"
              role="progressbar"
              aria-valuenow={percentComplete}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-white transition-all duration-300"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
        ) : null}

        {continueWatching && onContinue ? (
          <button
            type="button"
            onClick={() => onContinue(continueWatching.id)}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/25"
          >
            <Play className="h-4 w-4" aria-hidden />
            Seguir viendo
          </button>
        ) : null}
      </div>
    </section>
  );
}
