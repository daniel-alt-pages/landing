'use client';

import { useMemo } from 'react';
import { Radio } from 'lucide-react';
import {
  formatCountdownCompact,
  getCountdownParts,
  padCountdownUnit,
  type CountdownParts,
} from '../lib/courseCountdown';
import { useSecondTick } from '../hooks/useSecondTick';

export type CountdownTarget = {
  id: string;
  topic: string;
  startsAtIso: string;
  status?: 'upcoming' | 'live-soon';
  accentColor?: string;
};

function CountdownUnit({
  value,
  label,
  wide = false,
}: {
  value: string;
  label: string;
  wide?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative flex items-center justify-center rounded-lg border border-[var(--course-border)] bg-[var(--course-surface-muted)] px-1.5 py-1.5 font-mono text-base font-black tabular-nums text-[var(--course-text)] shadow-sm sm:rounded-xl sm:px-2.5 sm:py-2 sm:text-xl ${wide ? 'min-w-[2.5rem] sm:min-w-[3rem]' : 'min-w-[2.25rem] sm:min-w-[2.75rem]'}`}
        aria-hidden
      >
        {value}
      </div>
      <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--course-text-muted)] sm:text-[10px]">
        {label}
      </span>
    </div>
  );
}

function CountdownDigits({ parts, showDays }: { parts: CountdownParts; showDays: boolean }) {
  if (parts.expired) {
    return (
      <p className="flex items-center gap-2 text-sm font-bold text-emerald-300">
        <Radio className="h-4 w-4 animate-pulse" aria-hidden />
        Clase en curso
      </p>
    );
  }

  return (
    <div className="flex flex-nowrap items-center justify-center gap-1 sm:gap-1.5" role="timer">
      {showDays ? (
        <>
          <CountdownUnit value={String(parts.days)} label="días" wide />
          <span className="px-0.5 text-lg font-black text-[var(--course-accent)] sm:text-xl" aria-hidden>
            :
          </span>
        </>
      ) : null}
      <CountdownUnit value={padCountdownUnit(parts.hours)} label="horas" />
      <span className="px-0.5 text-lg font-black text-[var(--course-accent)] sm:text-xl" aria-hidden>
        :
      </span>
      <CountdownUnit value={padCountdownUnit(parts.minutes)} label="min" />
      <span className="px-0.5 text-lg font-black text-[var(--course-accent)] sm:text-xl" aria-hidden>
        :
      </span>
      <CountdownUnit value={padCountdownUnit(parts.seconds)} label="seg" />
    </div>
  );
}

export function CourseLiveCountdownRow({
  target,
  compact = false,
}: {
  target: CountdownTarget;
  compact?: boolean;
}) {
  const now = useSecondTick(true);
  const targetMs = useMemo(() => new Date(target.startsAtIso).getTime(), [target.startsAtIso]);
  const parts = getCountdownParts(targetMs, now);
  const showDays = parts.days > 0;
  const ariaLabel = parts.expired
    ? `${target.topic}: en curso`
    : `${target.topic}: ${formatCountdownCompact(parts)}`;

  if (compact) {
    return (
      <span className="font-mono font-bold tabular-nums text-[var(--course-text)]" aria-label={ariaLabel}>
        {parts.expired ? 'En curso' : formatCountdownCompact(parts)}
      </span>
    );
  }

  return (
    <article
      className="relative flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-violet-400/25 bg-gradient-to-br from-violet-950/95 via-slate-950 to-indigo-950/95 p-3 shadow-[0_0_24px_rgba(139,92,246,0.1)] sm:p-4"
      aria-label={ariaLabel}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(rgba(139,92,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.08) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
        aria-hidden
      />
      <div className="relative min-w-0">
        {target.status === 'live-soon' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-100 ring-1 ring-amber-400/40">
            <Radio className="h-3 w-3 animate-pulse" aria-hidden />
            Pronto
          </span>
        ) : (
          <span className="rounded-full bg-violet-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-100 ring-1 ring-violet-400/35">
            Programada
          </span>
        )}
        <p className="mt-2 line-clamp-3 text-xs font-bold leading-snug text-white sm:text-sm">
          {target.topic}
        </p>
      </div>
      <div className="relative mt-auto pt-1">
        <CountdownDigits parts={parts} showDays={showDays} />
      </div>
    </article>
  );
}

export function pickUpcomingCountdownTargets(
  sessions: { sessionId?: string; topic?: string; startsAtIso?: string; status?: string }[],
): CountdownTarget[] {
  return sessions
    .filter(
      (s) =>
        s.startsAtIso &&
        (s.status === 'upcoming' || s.status === 'live-soon'),
    )
    .sort(
      (a, b) =>
        new Date(a.startsAtIso!).getTime() - new Date(b.startsAtIso!).getTime(),
    )
    .map((s) => ({
      id: s.sessionId || `${s.startsAtIso}-${s.topic}`,
      topic: s.topic || 'Clase programada',
      startsAtIso: s.startsAtIso!,
      status: s.status as CountdownTarget['status'],
    }));
}
