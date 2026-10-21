'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CalendarRange, ChevronDown, Globe2, HelpCircle, BookOpen, Target, Trophy } from 'lucide-react';
import {
  attendanceRankingMetricNumber,
  buildWeeklyDimensionRankings,
  entryForPerson,
  ranksByPerson,
  type AttendanceRankingEntry,
} from '../../../lib/courseAttendanceRanking';
import { bogotaTodayKey } from '../../../lib/courseVacacionalWeek';
import { SgSkeletonCard } from '@shared/components/SgSkeleton';
import SgEmptyState from '@shared/components/SgEmptyState';
import { useCourseTheme } from '../../../hooks/useCourseTheme';
import {
  courseRankingMedalClass,
  formatRankingPointsGap,
  RANKING_TOP_VISIBLE,
} from '../lib/seguimientoUi';
import CourseSimulacroRankingPanel from './CourseSimulacroRankingPanel';
import CourseAttendanceStudentModal from './CourseAttendanceStudentModal';
import RankingPodium, { type RankingPodiumEntry } from './RankingPodium';
import RankingMethodologyModal from './RankingMethodologyModal';
import RankingPrizeBanner from './RankingPrizeBanner';
import RankingUserPositionFooter, { useRankingReveal } from './RankingUserPositionFooter';
import RankingStreakBadge from './RankingStreakBadge';
import RankingWeekPickerSheet from './RankingWeekPickerSheet';
import RankingStudentContextPanel, {
  RankingStudentContextMobileLine,
} from './RankingStudentContextPanel';
import { VACACIONAL_COURSE_DISPLAY_LABEL } from '../lib/seguimientoLabels';
import { streakTier, streakTierBorderClass } from '../lib/seguimientoStreakUi';
import {
  rankingExpandedBlockVariants,
  rankingExpandedContainerVariants,
  rankingListRowMotion,
  rankingProgressTransition,
  rankingTapScale,
} from '../lib/seguimientoMotion';
import type { CourseAttendanceReportRow } from '../../../lib/courseAttendanceReport';
import type { useSeguimientoLeaderboard } from '../hooks/useSeguimientoLeaderboard';
import { useProfilePhotos } from '@/hooks/useProfilePhotos';
import { photoUrlForPerson } from '@/lib/personPhotoLookup';

type LeaderboardState = ReturnType<typeof useSeguimientoLeaderboard>;

type RankingScope = 'global' | 'week';
type RankingKind = 'seguimiento' | 'simulacro';

type CourseAttendanceRankingPanelProps = {
  leaderboard: LeaderboardState;
};

type RankingDisplayRow = {
  entry: AttendanceRankingEntry;
  rank: number;
  isYou: boolean;
};

function RankingMedal({ rank, dark }: { rank: number; dark: boolean }) {
  const size = rank <= 3 ? 'h-9 w-9 text-xs' : 'h-8 w-8 text-[11px]';
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg font-black tabular-nums shadow-sm ${size} ${courseRankingMedalClass(rank, dark)}`}
    >
      #{rank}
    </div>
  );
}

function scopeButtonClass(active: boolean, dark: boolean): string {
  const base =
    'inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--course-accent)]/50';
  if (active) {
    return `${base} bg-[var(--course-surface)] text-[var(--course-text)] shadow-sm ring-1 ${
      dark ? 'ring-white/15' : 'ring-[var(--course-border-strong,var(--course-border))]'
    }`;
  }
  return `${base} text-[var(--course-text-muted)] hover:text-[var(--course-text)]`;
}

type RankingListRowProps = {
  entry: AttendanceRankingEntry;
  rank: number;
  isYou: boolean;
  row?: CourseAttendanceReportRow;
  dark: boolean;
  onSelect: (personKey: string) => void;
};

function RankingListRow({ entry, rank, isYou, row, dark, onSelect }: RankingListRowProps) {
  const name = row?.rosterName || entry.displayLabel;
  const score = entry.compositeScore ?? 0;
  const tier = streakTier(entry.dayStreak);
  const borderClass = streakTierBorderClass(tier, dark);
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(entry.personKey)}
      whileTap={rankingTapScale(reduceMotion)}
      layout
      className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 overflow-visible rounded-xl border-2 px-3 py-3 text-left transition sm:gap-x-3 sm:px-4 md:flex md:py-2.5 ${
        dark ? 'bg-[var(--course-surface)]' : 'bg-[var(--course-surface)]'
      } ${borderClass} ${
        isYou
          ? 'ring-2 ring-[var(--course-accent)]/35 ring-offset-1 ring-offset-[var(--course-bg)]'
          : 'hover:brightness-[1.02]'
      }`}
    >
      <div className="flex w-[7.5rem] shrink-0 items-center justify-start gap-2 overflow-visible sm:w-[8rem] md:w-[8.25rem]">
        <RankingMedal rank={rank} dark={dark} />
        <RankingStreakBadge dayStreak={entry.dayStreak} size="sm" />
      </div>
      <div className="min-w-0 md:flex-[1.8_1_0]">
        <p className="text-sm font-semibold leading-snug text-[var(--course-text)] break-words">
          {name}
          {isYou ? (
            <span className="ml-1.5 text-[10px] font-bold uppercase text-[var(--course-accent)]">
              Tú
            </span>
          ) : null}
        </p>
        <p className="truncate text-[10px] text-[var(--course-text-muted)]">
          {VACACIONAL_COURSE_DISPLAY_LABEL}
        </p>
        <RankingStudentContextMobileLine row={row} />
      </div>
      <RankingStudentContextPanel row={row} variant="inline" />
      <div className="min-w-12 shrink-0 text-right tabular-nums sm:min-w-14">
        <p className="text-lg font-black leading-none text-[var(--course-text)] md:text-base md:leading-normal">{score}</p>
        <p className="text-[10px] font-semibold text-[var(--course-text-muted)]">pts</p>
      </div>
    </motion.button>
  );
}

function RankingUserStickyBar({
  userRank,
  userEntry,
  userReportRow,
  userInTop,
  pointsGapToTop,
  rosterSize,
  dark,
  onSelect,
}: {
  userRank: number;
  userEntry: AttendanceRankingEntry;
  userReportRow?: CourseAttendanceReportRow;
  userInTop: boolean;
  pointsGapToTop: number | null;
  rosterSize: number;
  dark: boolean;
  onSelect: (personKey: string) => void;
}) {
  const name = userReportRow?.rosterName || userEntry.displayLabel;
  const score = userEntry.compositeScore ?? attendanceRankingMetricNumber(userEntry, 'overall');
  const topTargetScore = pointsGapToTop != null ? score + pointsGapToTop : null;
  const progressPct =
    topTargetScore != null && topTargetScore > 0
      ? Math.round(Math.min(100, Math.max(0, (score / topTargetScore) * 100)))
      : null;
  const tier = streakTier(userEntry.dayStreak);
  const borderClass = streakTierBorderClass(tier, dark);
  const revealed = useRankingReveal();
  const reduceMotion = useReducedMotion();
  const revealState = revealed ? 'visible' : 'hidden';

  return (
    <div aria-label="Tu posición en el ranking" role="status">
      <motion.div
        variants={rankingExpandedContainerVariants}
        initial="hidden"
        animate={revealState}
        className={`rounded-[1.25rem] p-px shadow-[0_12px_40px_-12px_rgba(124,58,237,0.35)] ${
          userInTop
            ? 'bg-gradient-to-br from-amber-400/90 via-[var(--course-accent)]/70 to-violet-500/60'
            : 'bg-gradient-to-br from-[var(--course-accent)]/55 via-violet-400/35 to-[var(--course-accent)]/25'
        }`}
      >
        <div
          className={`rounded-[1.2rem] p-4 sm:p-5 ${
            dark
              ? 'bg-[var(--course-bg)]/95 backdrop-blur-md'
              : 'bg-white/95 backdrop-blur-md'
          }`}
        >
          <motion.div
            variants={rankingExpandedBlockVariants}
            className="flex flex-wrap items-start justify-between gap-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <motion.div
                variants={rankingExpandedBlockVariants}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  userInTop
                    ? 'bg-amber-500/15 ring-1 ring-amber-400/30'
                    : 'bg-[var(--course-accent)]/10 ring-1 ring-[var(--course-accent)]/25'
                }`}
              >
                <Trophy
                  className={`h-6 w-6 ${userInTop ? 'text-amber-500' : 'text-[var(--course-accent)]'}`}
                  aria-hidden
                />
              </motion.div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--course-text-muted)]">
                  {userInTop ? '¡Estás en el podio visible!' : 'Tu posición en el ranking'}
                </p>
                <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0 tabular-nums">
                  <motion.span
                    layoutId="ranking-user-rank-badge"
                    className="text-3xl font-black leading-none text-[var(--course-text)]"
                  >
                    #{userRank}
                  </motion.span>
                  <span className="text-xs font-semibold text-[var(--course-text-muted)]">
                    de {rosterSize} estudiantes
                  </span>
                </p>
              </div>
            </div>

            {!userInTop && pointsGapToTop != null ? (
              <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--course-accent)]/25 bg-[var(--course-accent)]/10 px-3 py-1.5 text-xs font-bold text-[var(--course-accent)]">
                <Target className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">
                  Faltan {formatRankingPointsGap(pointsGapToTop)} pts · Top {RANKING_TOP_VISIBLE}
                </span>
              </div>
            ) : userInTop ? (
              <span className="inline-flex items-center rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-300">
                Top {RANKING_TOP_VISIBLE}
              </span>
            ) : null}
          </motion.div>

          {!userInTop && progressPct != null ? (
            <motion.div variants={rankingExpandedBlockVariants} className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                <span className="text-[var(--course-text-muted)]">
                  Progreso hacia el Top {RANKING_TOP_VISIBLE}
                </span>
                <span className="tabular-nums text-[var(--course-accent)]">{progressPct}%</span>
              </div>
              <div
                className={`h-2.5 overflow-hidden rounded-full ring-1 ring-inset ${
                  dark ? 'bg-[var(--course-surface-muted)] ring-white/10' : 'bg-[var(--course-surface-muted)] ring-black/5'
                }`}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPct}
                aria-label={`Progreso hacia el Top ${RANKING_TOP_VISIBLE}`}
              >
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--course-accent)] to-violet-500"
                  initial={{ width: 0, opacity: 0.6 }}
                  animate={{ width: `${Math.max(8, progressPct)}%`, opacity: 1 }}
                  transition={rankingProgressTransition(reduceMotion)}
                />
              </div>
            </motion.div>
          ) : null}

          <motion.button
            type="button"
            variants={rankingExpandedBlockVariants}
            whileTap={rankingTapScale(reduceMotion)}
            onClick={() => onSelect(userEntry.personKey)}
            className={`mt-4 grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 rounded-xl border-2 px-3 py-3 text-left transition hover:brightness-[1.02] sm:gap-x-3 sm:px-4 md:flex ${
              dark ? 'bg-[var(--course-surface)]' : 'bg-[var(--course-surface)]'
            } ${borderClass} ring-2 ring-[var(--course-accent)]/30 ring-offset-2 ring-offset-[var(--course-bg)]`}
          >
            <div className="flex w-[7.5rem] shrink-0 items-center gap-2 overflow-visible sm:w-[8rem] md:w-[8.25rem]">
              <RankingMedal rank={userRank} dark={dark} />
              <RankingStreakBadge dayStreak={userEntry.dayStreak} size="sm" />
            </div>
            <div className="min-w-0 md:flex-[1.8_1_0]">
              <p className="text-sm font-semibold leading-snug text-[var(--course-text)] break-words">
                {name}
                <span className="ml-1.5 inline-flex rounded-md bg-[var(--course-accent)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Tú
                </span>
              </p>
              <p className="truncate text-[10px] text-[var(--course-text-muted)]">
                {VACACIONAL_COURSE_DISPLAY_LABEL}
              </p>
              <RankingStudentContextMobileLine row={userReportRow} />
            </div>
            <RankingStudentContextPanel row={userReportRow} variant="inline" />
            <div className="min-w-12 shrink-0 text-right tabular-nums sm:min-w-14">
              <p className="text-lg font-black leading-none text-[var(--course-text)] sm:text-xl md:leading-normal">{score}</p>
              <p className="text-[10px] font-semibold text-[var(--course-text-muted)]">pts</p>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

export default function CourseAttendanceRankingPanel({
  leaderboard,
}: CourseAttendanceRankingPanelProps) {
  const { dark } = useCourseTheme();
  const [rankingKind, setRankingKind] = useState<RankingKind>('seguimiento');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectGuardUntilRef = useRef(0);

  const selectPerson = useCallback((key: string | null) => {
    if (key != null && Date.now() < selectGuardUntilRef.current) return;
    setSelectedKey(key);
  }, []);

  const closeStudentModal = useCallback(() => {
    // ponytail: bloquea reopen por ghost-click ~400ms tras cerrar
    selectGuardUntilRef.current = Date.now() + 400;
    setSelectedKey(null);
  }, []);

  const { report, rankings, loading, error } = leaderboard;

  if (loading) return <SgSkeletonCard lines={8} />;

  if (error || !report?.rows.length || !rankings) {
    return (
      <SgEmptyState
        icon={Trophy}
        title="Ranking sin datos"
        message={error || 'Aún no hay suficientes registros para el ranking.'}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={`inline-flex w-full max-w-md gap-1 rounded-lg border p-0.5 sm:w-auto ${
          dark
            ? 'border-[var(--course-border)] bg-[var(--course-surface-muted)]/50'
            : 'border-[var(--course-border)] bg-[var(--course-surface-muted)]/70'
        }`}
        role="group"
        aria-label="Ranking a mostrar"
      >
        <button
          type="button"
          onClick={() => setRankingKind('seguimiento')}
          className={scopeButtonClass(rankingKind === 'seguimiento', dark)}
          aria-pressed={rankingKind === 'seguimiento'}
        >
          <Trophy className="h-3.5 w-3.5" aria-hidden />
          Seguimiento
        </button>
        <button
          type="button"
          onClick={() => setRankingKind('simulacro')}
          className={scopeButtonClass(rankingKind === 'simulacro', dark)}
          aria-pressed={rankingKind === 'simulacro'}
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden />
          Simulacro
        </button>
      </div>

      {rankingKind === 'simulacro' ? (
        <CourseSimulacroRankingPanel leaderboard={leaderboard} />
      ) : (
        <CourseSeguimientoRankingContent
          leaderboard={leaderboard}
          dark={dark}
          selectedKey={selectedKey}
          setSelectedKey={selectPerson}
          onCloseStudentModal={closeStudentModal}
        />
      )}
    </div>
  );
}

function CourseSeguimientoRankingContent({
  leaderboard,
  dark,
  selectedKey,
  setSelectedKey,
  onCloseStudentModal,
}: {
  leaderboard: LeaderboardState;
  dark: boolean;
  selectedKey: string | null;
  setSelectedKey: (key: string | null) => void;
  onCloseStudentModal: () => void;
}) {
  const [showMethodology, setShowMethodology] = useState(false);
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [scope, setScope] = useState<RankingScope>('global');

  const { report, rankings, ranksMap, currentPersonKey, personKeyCandidates } = leaderboard;
  const { photos } = useProfilePhotos(Boolean(report?.rows.length));

  // Semanas con clases programadas en el calendario.
  const selectableWeeks = useMemo(
    () => (report?.weeks ?? []).filter((w) => w.scheduledClasses > 0),
    [report],
  );

  const defaultWeekIndex = useMemo(() => {
    if (!selectableWeeks.length) return null;
    const today = bogotaTodayKey();
    const started = selectableWeeks.filter((w) => w.start <= today);
    return (started.at(-1) ?? selectableWeeks[0]).index;
  }, [selectableWeeks]);

  const [weekIndex, setWeekIndex] = useState<number | null>(defaultWeekIndex);

  const activeWeekIndex = weekIndex ?? defaultWeekIndex;

  const weeklyRankings = useMemo(() => {
    if (scope !== 'week' || !report?.rows.length || activeWeekIndex == null) return null;
    return buildWeeklyDimensionRankings(report.rows, report.weekSchedules, activeWeekIndex, report.excusas);
  }, [scope, report, activeWeekIndex]);

  const activeRankings = scope === 'week' && weeklyRankings ? weeklyRankings : rankings;

  const activeRanksMap = useMemo(() => {
    if (scope === 'week' && weeklyRankings) return ranksByPerson(weeklyRankings);
    return ranksMap;
  }, [scope, weeklyRankings, ranksMap]);

  const list = useMemo(() => activeRankings?.overall ?? [], [activeRankings]);

  const allCandidates = useMemo(
    () => (personKeyCandidates?.length ? personKeyCandidates : currentPersonKey ? [currentPersonKey] : []),
    [personKeyCandidates, currentPersonKey],
  );

  const userEntry = useMemo(() => {
    if (!allCandidates.length) return undefined;
    for (const key of allCandidates) {
      const found = list.find((e) => e.personKey === key);
      if (found) return found;
    }
    return undefined;
  }, [list, allCandidates]);

  const matchedPersonKey = userEntry?.personKey ?? null;

  const isCurrentUser = useMemo(() => {
    const keys = new Set(allCandidates);
    return (personKey: string) => keys.has(personKey);
  }, [allCandidates]);

  const userRank = userEntry
    ? list.findIndex((e) => e.personKey === matchedPersonKey) + 1
    : null;
  const userInTop = userRank != null && userRank > 0 && userRank <= RANKING_TOP_VISIBLE;

  const pointsGapToTop = useMemo(() => {
    if (!userEntry || !userRank || userRank <= RANKING_TOP_VISIBLE) return null;
    const topCutoff = list[RANKING_TOP_VISIBLE - 1];
    if (!topCutoff) return null;
    const userScore = attendanceRankingMetricNumber(userEntry, 'overall');
    const topScore = attendanceRankingMetricNumber(topCutoff, 'overall');
    return Math.max(0, topScore - userScore);
  }, [list, userEntry, userRank]);

  const topListRows = useMemo((): RankingDisplayRow[] => {
    return list.slice(0, RANKING_TOP_VISIBLE).map((entry, index) => ({
      entry,
      rank: index + 1,
      isYou: isCurrentUser(entry.personKey),
    }));
  }, [list, isCurrentUser]);

  const userReportRow = userEntry
    ? report?.rows.find((r) => r.personKey === userEntry.personKey)
    : undefined;

  const topThree = useMemo(() => list.slice(0, 3), [list]);

  const podiumEntries = useMemo((): RankingPodiumEntry[] => {
    if (!report?.rows.length) return [];
    return topThree.map((entry) => {
      const row = report.rows.find((r) => r.personKey === entry.personKey);
      return {
        personKey: entry.personKey,
        name: row?.rosterName || entry.displayLabel,
        score: attendanceRankingMetricNumber(entry, 'overall'),
        sessionsAttended: entry.sessionsAttended,
        sessionsTotal: entry.sessionsTotal || entry.sessionsCompleted,
        attendanceRate: entry.attendanceRate,
        dayStreak: entry.dayStreak,
        photoUrl: photoUrlForPerson(photos, entry.personKey, row),
        isYou: isCurrentUser(entry.personKey),
      };
    });
  }, [topThree, report, photos, isCurrentUser]);

  const selectedRow = selectedKey ? report?.rows.find((r) => r.personKey === selectedKey) : undefined;
  const selectedEntry =
    selectedKey && activeRankings ? entryForPerson(activeRankings, selectedKey) : undefined;

  if (!report?.rows.length || !rankings) return null;

  const rosterSize = report.rosterCount ?? report.rows.length;

  const activeWeekMeta =
    scope === 'week' && activeWeekIndex != null
      ? report.weeks.find((w) => w.index === activeWeekIndex)
      : null;
  const scopeLabel = activeWeekMeta ? `Semana ${activeWeekMeta.index + 1}` : 'Global';
  const reduceMotion = useReducedMotion();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--course-accent)]/30 bg-[var(--course-accent)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--course-accent)]">
          <Trophy className="h-3.5 w-3.5" aria-hidden />
          Ranking · Curso Vacacional · Top {RANKING_TOP_VISIBLE} · {rosterSize} estudiantes
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className={`inline-flex gap-1 rounded-lg border p-0.5 ${
            dark
              ? 'border-[var(--course-border)] bg-[var(--course-surface-muted)]/50'
              : 'border-[var(--course-border)] bg-[var(--course-surface-muted)]/70'
          }`}
          role="group"
          aria-label="Tipo de ranking"
        >
          <button
            type="button"
            onClick={() => setScope('global')}
            className={scopeButtonClass(scope === 'global', dark)}
            aria-pressed={scope === 'global'}
          >
            <Globe2 className="h-3.5 w-3.5" aria-hidden />
            Global
          </button>
          <button
            type="button"
            onClick={() => setScope('week')}
            className={scopeButtonClass(scope === 'week', dark)}
            aria-pressed={scope === 'week'}
            disabled={!selectableWeeks.length}
          >
            <CalendarRange className="h-3.5 w-3.5" aria-hidden />
            Semanal
          </button>
        </div>

        {scope === 'week' && selectableWeeks.length && activeWeekIndex != null ? (
          <button
            type="button"
            onClick={() => setShowWeekPicker(true)}
            className={`inline-flex min-h-9 max-w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition hover:bg-[var(--course-surface-muted)]/60 ${
              dark
                ? 'border-[var(--course-border)] bg-[var(--course-surface)] text-[var(--course-text)]'
                : 'border-[var(--course-border)] bg-[var(--course-surface)] text-[var(--course-text)]'
            }`}
            aria-haspopup="dialog"
          >
            <span className="truncate">
              Semana {activeWeekIndex + 1}
              {activeWeekMeta ? ` · ${activeWeekMeta.heading}` : ''}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--course-text-muted)]" aria-hidden />
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setShowMethodology(true)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--course-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--course-text-muted)] transition hover:bg-[var(--course-surface-muted)]/60 hover:text-[var(--course-text)]"
        >
          <HelpCircle className="h-3.5 w-3.5" aria-hidden />
          ¿Cómo se calcula?
        </button>
      </div>

      <p className="text-[11px] text-[var(--course-text-muted)]">
        Top {RANKING_TOP_VISIBLE} del vacacional · {scopeLabel}
        {activeWeekMeta ? ` · ${activeWeekMeta.heading}` : ''}
      </p>

      <RankingPodium
        entries={podiumEntries}
        dark={dark}
        onSelect={setSelectedKey}
      />

      <RankingPrizeBanner />

      <ul className="space-y-2">
        {topListRows.map(({ entry, rank, isYou }, index) => {
          const row = report.rows.find((r) => r.personKey === entry.personKey);
          return (
            <motion.li
              key={`${entry.personKey}-${rank}`}
              {...rankingListRowMotion(index, reduceMotion)}
            >
              <RankingListRow
                entry={entry}
                rank={rank}
                isYou={isYou}
                row={row}
                dark={dark}
                onSelect={setSelectedKey}
              />
            </motion.li>
          );
        })}
      </ul>

      {userEntry && userRank ? (
        <RankingUserPositionFooter
          userRank={userRank}
          label={userReportRow?.rosterName || userEntry.displayLabel}
          score={userEntry.compositeScore ?? attendanceRankingMetricNumber(userEntry, 'overall')}
        >
          <RankingUserStickyBar
            userRank={userRank}
            userEntry={userEntry}
            userReportRow={userReportRow}
            userInTop={userInTop}
            pointsGapToTop={pointsGapToTop}
            rosterSize={rosterSize}
            dark={dark}
            onSelect={setSelectedKey}
          />
        </RankingUserPositionFooter>
      ) : null}

      {showMethodology ? (
        <RankingMethodologyModal onClose={() => setShowMethodology(false)} />
      ) : null}

      {showWeekPicker && activeWeekIndex != null ? (
        <RankingWeekPickerSheet
          weeks={selectableWeeks}
          activeWeekIndex={activeWeekIndex}
          onSelect={setWeekIndex}
          onClose={() => setShowWeekPicker(false)}
        />
      ) : null}

      {selectedRow && selectedEntry && report ? (
        <CourseAttendanceStudentModal
          row={selectedRow}
          entry={selectedEntry}
          report={report}
          ranksByPerson={activeRanksMap}
          activeSort="overall"
          isCurrentUser={isCurrentUser(selectedRow.personKey)}
          onClose={onCloseStudentModal}
        />
      ) : null}
    </div>
  );
}
