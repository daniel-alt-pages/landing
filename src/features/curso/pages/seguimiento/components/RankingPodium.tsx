'use client';

import { Crown } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import SgStudentAvatar from '@shared/components/SgStudentAvatar';
import {
  courseRankingMedalClass,
  seguimientoPodiumCardClass,
  seguimientoPodiumGlowClass,
  seguimientoPodiumStepClass,
  seguimientoRankingRowClass,
} from '../lib/seguimientoUi';
import { SEGUIMIENTO_APPLE_SPRING_SOFT } from '../lib/seguimientoMotion';
import RankingStreakBadge from './RankingStreakBadge';

export type RankingPodiumEntry = {
  personKey: string;
  name: string;
  score: number;
  /** Si se define, reemplaza el número en el podio (ej. horas formateadas). */
  scoreDisplay?: string;
  sessionsAttended: number;
  sessionsTotal: number;
  attendanceRate: number;
  dayStreak: number;
  photoUrl?: string | null;
  isYou: boolean;
};

type RankingPodiumProps = {
  /** Orden: 1º, 2º, 3º */
  entries: RankingPodiumEntry[];
  dark: boolean;
  onSelect: (personKey: string) => void;
};

const PODIUM_LAYOUT: Array<{
  rank: 1 | 2 | 3;
  entryIndex: number;
  stepHeight: string;
  avatarSize: string;
  avatarText: string;
  lift: string;
  order: string;
}> = [
  {
    rank: 2,
    entryIndex: 1,
    stepHeight: 'h-[5.25rem] sm:h-[5.75rem]',
    avatarSize: 'h-12 w-12',
    avatarText: 'text-sm',
    lift: '',
    order: 'order-1',
  },
  {
    rank: 1,
    entryIndex: 0,
    stepHeight: 'h-[6.75rem] sm:h-[7.5rem]',
    avatarSize: 'h-14 w-14 sm:h-16 sm:w-16',
    avatarText: 'text-base',
    lift: '-translate-y-1 sm:-translate-y-2',
    order: 'order-2',
  },
  {
    rank: 3,
    entryIndex: 2,
    stepHeight: 'h-[4.5rem] sm:h-[5rem]',
    avatarSize: 'h-11 w-11 sm:h-12 sm:w-12',
    avatarText: 'text-xs',
    lift: '',
    order: 'order-3',
  },
];

function RankingPodiumMedal({ rank, dark }: { rank: number; dark: boolean }) {
  const size = rank === 1 ? 'h-8 w-8 text-[11px]' : 'h-7 w-7 text-[10px]';
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-black tabular-nums shadow-md ${size} ${courseRankingMedalClass(rank, dark)}`}
      aria-hidden
    >
      {rank}
    </div>
  );
}

function podiumAuraClass(rank: number, dark: boolean): string {
  if (rank === 1) {
    return dark
      ? 'bg-[radial-gradient(circle_at_50%_45%,rgba(251,191,36,0.42),rgba(245,158,11,0.18)_42%,transparent_72%)]'
      : 'bg-[radial-gradient(circle_at_50%_45%,rgba(251,191,36,0.48),rgba(245,158,11,0.18)_44%,transparent_74%)]';
  }
  if (rank === 2) {
    return dark
      ? 'bg-[radial-gradient(circle_at_50%_48%,rgba(203,213,225,0.34),rgba(148,163,184,0.14)_44%,transparent_74%)]'
      : 'bg-[radial-gradient(circle_at_50%_48%,rgba(203,213,225,0.46),rgba(148,163,184,0.18)_44%,transparent_74%)]';
  }
  return dark
    ? 'bg-[radial-gradient(circle_at_50%_48%,rgba(251,146,60,0.34),rgba(249,115,22,0.14)_44%,transparent_74%)]'
    : 'bg-[radial-gradient(circle_at_50%_48%,rgba(251,146,60,0.44),rgba(249,115,22,0.18)_44%,transparent_74%)]';
}

function podiumProgressClass(rank: number): string {
  if (rank === 1) return 'bg-gradient-to-r from-amber-300 via-amber-500 to-orange-500';
  if (rank === 2) return 'bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500';
  return 'bg-gradient-to-r from-orange-300 via-orange-500 to-orange-600';
}

export default function RankingPodium({ entries, dark, onSelect }: RankingPodiumProps) {
  if (entries.length < 2) return null;
  const reduceMotion = useReducedMotion();
  const podiumTransition = reduceMotion ? { duration: 0.01 } : SEGUIMIENTO_APPLE_SPRING_SOFT;

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={podiumTransition}
      className={`relative overflow-hidden rounded-2xl border px-3 pb-0 pt-5 sm:px-5 sm:pt-6 ${
        dark
          ? 'border-[var(--course-border)] bg-[var(--course-surface-muted)]/30'
          : 'border-[var(--course-border)] bg-gradient-to-b from-[var(--course-surface)] to-[var(--course-surface-muted)]/50'
      }`}
      aria-label="Podio del ranking"
    >
      <div
        className={`pointer-events-none absolute inset-0 ${seguimientoPodiumGlowClass(dark)}`}
        aria-hidden
      />

      <p
        className={`relative z-[1] mb-4 text-center text-[10px] font-bold uppercase tracking-[0.14em] ${
          dark ? 'text-amber-200/80' : 'text-amber-700/90'
        }`}
      >
        Top 3
      </p>

      <div className="relative z-[1] flex items-end justify-center gap-1.5 sm:gap-3">
        {PODIUM_LAYOUT.map((slot) => {
          const entry = entries[slot.entryIndex];
          if (!entry) return <div key={slot.rank} className={`flex-1 ${slot.order}`} />;

          const rank = slot.rank;
          const isYou = entry.isYou;
          const attendancePct = Math.max(0, Math.min(100, Math.round(entry.attendanceRate * 100)));
          const attendanceWidth = `${Math.max(entry.sessionsAttended > 0 ? 8 : 0, attendancePct)}%`;

          return (
            <motion.div
              key={entry.personKey}
              initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                ...(reduceMotion ? { duration: 0.01 } : SEGUIMIENTO_APPLE_SPRING_SOFT),
                delay: reduceMotion ? 0 : rank === 1 ? 0.08 : rank === 2 ? 0 : 0.14,
              }}
              className={`relative flex min-w-0 max-w-[34%] flex-1 flex-col items-center ${slot.lift} ${slot.order}`}
            >
              <div
                className={`pointer-events-none absolute -inset-x-4 -bottom-3 top-4 blur-xl sm:-inset-x-6 ${podiumAuraClass(rank, dark)} ${
                  rank === 1 ? 'opacity-90' : 'opacity-70'
                }`}
                aria-hidden
              />
              <button
                type="button"
                onClick={() => onSelect(entry.personKey)}
                className={`group relative z-[1] mb-2 flex w-full flex-col items-center rounded-xl border px-2 py-2.5 text-center transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--course-accent)]/55 sm:px-3 sm:py-3 motion-safe:hover:-translate-y-0.5 ${seguimientoPodiumCardClass(rank, dark)} ${
                  isYou ? seguimientoRankingRowClass(true, dark) : ''
                }`}
                aria-label={`${entry.name}, puesto ${rank}, ${entry.score} puntos`}
              >
                {rank === 1 ? (
                  <span
                    className={`absolute -top-3 left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full p-1 ${
                      dark
                        ? 'bg-amber-400/25 text-amber-200 ring-2 ring-amber-400/40'
                        : 'bg-amber-100 text-amber-700 ring-2 ring-amber-300/80'
                    } motion-safe:animate-[podium-crown-float_2.8s_ease-in-out_infinite]`}
                    aria-hidden
                  >
                    <Crown className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.25} />
                  </span>
                ) : null}

                <div className="flex items-center justify-center gap-1.5">
                  <RankingPodiumMedal rank={rank} dark={dark} />
                  {isYou ? (
                    <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--course-accent)]">
                      Tú
                    </span>
                  ) : null}
                </div>

                <SgStudentAvatar
                  name={entry.name}
                  photoUrl={entry.photoUrl}
                  sizeClass={`${slot.avatarSize} mt-2`}
                  textClass={slot.avatarText}
                  roundedClass="rounded-full"
                  className={
                    rank === 1
                      ? dark
                        ? 'ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20'
                        : 'ring-2 ring-amber-400/70 shadow-lg shadow-amber-400/25'
                      : dark
                        ? 'ring-1 ring-white/15'
                        : 'ring-1 ring-[var(--course-border)]'
                  }
                />

                <p className="mt-2 line-clamp-2 text-[11px] font-bold leading-snug text-[var(--course-text)] sm:text-xs">
                  {entry.name}
                </p>

                <p
                  className={`mt-1 text-xl font-black tabular-nums sm:text-2xl ${
                    rank === 1 ? 'text-[var(--course-accent)]' : 'text-[var(--course-text)]'
                  }`}
                >
                  {entry.scoreDisplay ?? entry.score}
                  {!entry.scoreDisplay ? (
                    <span className="ml-0.5 text-[10px] font-bold opacity-70 sm:text-xs">pts</span>
                  ) : null}
                </p>

                <div className="mt-1.5 flex justify-center">
                  <RankingStreakBadge dayStreak={entry.dayStreak} size="sm" />
                </div>

                <div className="mt-2 w-full rounded-xl border border-black/5 bg-white/65 px-2 py-1.5 text-left shadow-sm dark:border-white/10 dark:bg-white/[0.07]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wide text-[var(--course-text-muted)]">
                      Clases asistidas
                    </span>
                    <span className="text-[10px] font-black tabular-nums text-[var(--course-text)]">
                      {attendancePct}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--course-surface-muted)] ring-1 ring-inset ring-black/5 dark:ring-white/10">
                      <div
                        className={`h-full rounded-full ${podiumProgressClass(rank)}`}
                        style={{ width: attendanceWidth }}
                      />
                    </div>
                    <span className="shrink-0 text-[9px] font-bold tabular-nums text-[var(--course-text-muted)]">
                      {entry.sessionsAttended}/{entry.sessionsTotal || '—'}
                    </span>
                  </div>
                </div>
              </button>

              <div
                className={`relative z-[1] flex w-full flex-col items-center justify-end rounded-t-xl bg-gradient-to-b px-2 pb-2 pt-3 ${slot.stepHeight} ${seguimientoPodiumStepClass(rank, dark)}`}
                aria-hidden
              >
                <div className="pointer-events-none absolute inset-x-2 top-2 h-1/2 rounded-full bg-white/20 blur-md" />
                <span className="text-lg font-black tabular-nums opacity-90 sm:text-xl">{rank}</span>
                <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider opacity-75 sm:text-[9px]">
                  {rank === 1 ? 'Campeón' : rank === 2 ? 'Segundo' : 'Tercero'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <style>{`
        @keyframes podium-crown-float {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, -3px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .motion-safe\\:animate-\\[podium-crown-float_2\\.8s_ease-in-out_infinite\\] {
            animation: none !important;
          }
        }
      `}</style>
    </motion.section>
  );
}
