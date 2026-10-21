'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { BookOpen, Check, ChevronDown, HelpCircle, Target } from 'lucide-react';
import {
  buildSimulacroRanking,
  DEFAULT_SIMULACRO_ID,
  entryForPerson,
  simulacroRankingSnapshot,
  type SimulacroRankingEntry,
} from '../../../lib/courseAttendanceRanking';
import { SgSkeletonCard } from '@shared/components/SgSkeleton';
import SgEmptyState from '@shared/components/SgEmptyState';
import { useCourseTheme } from '../../../hooks/useCourseTheme';
import {
  courseRankingMedalClass,
  formatRankingPointsGap,
  RANKING_TOP_VISIBLE,
} from '../lib/seguimientoUi';
import CourseAttendanceStudentModal from './CourseAttendanceStudentModal';
import RankingPodium, { type RankingPodiumEntry } from './RankingPodium';
import RankingMethodologyModal from './RankingMethodologyModal';
import RankingUserPositionFooter, { useRankingReveal } from './RankingUserPositionFooter';
import RankingStreakBadge from './RankingStreakBadge';
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

type CourseSimulacroRankingPanelProps = {
  leaderboard: LeaderboardState;
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

function SimulacroRankingListRow({
  item,
  rank,
  isYou,
  row,
  attendanceEntry,
  dark,
  onSelect,
}: {
  item: SimulacroRankingEntry;
  rank: number;
  isYou: boolean;
  row?: CourseAttendanceReportRow;
  attendanceEntry?: { dayStreak: number };
  dark: boolean;
  onSelect: (personKey: string) => void;
}) {
  const name = row?.rosterName || item.displayLabel;
  const tier = streakTier(attendanceEntry?.dayStreak ?? 0);
  const borderClass = streakTierBorderClass(tier, dark);
  const presented = item.presented;
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(item.personKey)}
      whileTap={rankingTapScale(reduceMotion)}
      layout
      className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 overflow-visible rounded-xl border-2 px-3 py-3 text-left transition sm:gap-x-3 sm:px-4 md:flex md:py-2.5 ${
        dark ? 'bg-[var(--course-surface)]' : 'bg-[var(--course-surface)]'
      } ${borderClass} ${
        isYou
          ? 'ring-2 ring-[var(--course-accent)]/35 ring-offset-1 ring-offset-[var(--course-bg)]'
          : 'hover:brightness-[1.02]'
      } ${!presented ? 'opacity-80' : ''}`}
    >
      <div className="flex w-[7.5rem] shrink-0 items-center justify-start gap-2 overflow-visible sm:w-[8rem] md:w-[8.25rem]">
        <RankingMedal rank={rank} dark={dark} />
        <RankingStreakBadge dayStreak={attendanceEntry?.dayStreak ?? 0} size="sm" />
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
        <p className="text-lg font-black leading-none text-[var(--course-text)] md:text-base md:leading-normal">{item.puntajeGlobal}</p>
        <p className="text-[10px] font-semibold text-[var(--course-text-muted)]">
          {presented ? 'ICFES' : 'sin presentar'}
        </p>
      </div>
    </motion.button>
  );
}

function SimulacroRankingUserStickyBar({
  userRank,
  userItem,
  userReportRow,
  attendanceEntry,
  userInTop,
  pointsGapToTop,
  rosterSize,
  simLabel,
  dark,
  onSelect,
}: {
  userRank: number;
  userItem: SimulacroRankingEntry;
  userReportRow?: CourseAttendanceReportRow;
  attendanceEntry?: { dayStreak: number };
  userInTop: boolean;
  pointsGapToTop: number | null;
  rosterSize: number;
  simLabel: string;
  dark: boolean;
  onSelect: (personKey: string) => void;
}) {
  const name = userReportRow?.rosterName || userItem.displayLabel;
  const score = userItem.puntajeGlobal;
  const topTargetScore = pointsGapToTop != null ? score + pointsGapToTop : null;
  const progressPct =
    topTargetScore != null && topTargetScore > 0 && !userInTop
      ? Math.round(Math.min(100, Math.max(0, (score / topTargetScore) * 100)))
      : userInTop && score > 0
        ? 100
        : null;
  const tier = streakTier(attendanceEntry?.dayStreak ?? 0);
  const borderClass = streakTierBorderClass(tier, dark);
  const revealed = useRankingReveal();
  const reduceMotion = useReducedMotion();
  const revealState = revealed ? 'visible' : 'hidden';

  return (
    <div aria-label="Tu posición en el ranking del simulacro" role="status">
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
            dark ? 'bg-[var(--course-bg)]/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'
          }`}
        >
          <motion.div
            variants={rankingExpandedBlockVariants}
            className="flex flex-wrap items-start justify-between gap-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  userInTop
                    ? 'bg-amber-500/15 ring-1 ring-amber-400/30'
                    : 'bg-[var(--course-accent)]/10 ring-1 ring-[var(--course-accent)]/25'
                }`}
              >
                <BookOpen
                  className={`h-6 w-6 ${userInTop ? 'text-amber-500' : 'text-[var(--course-accent)]'}`}
                  aria-hidden
                />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--course-text-muted)]">
                  {userInTop ? '¡Estás en el Top visible!' : 'Tu posición en el ranking del simulacro'}
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
                  Faltan {formatRankingPointsGap(pointsGapToTop)} pts ICFES · Top {RANKING_TOP_VISIBLE}
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
                className="h-2.5 overflow-hidden rounded-full bg-[var(--course-surface-muted)] ring-1 ring-inset ring-black/5 dark:ring-white/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPct}
                aria-label={`Progreso hacia el Top ${RANKING_TOP_VISIBLE} del simulacro`}
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
            onClick={() => onSelect(userItem.personKey)}
            className={`mt-4 grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 rounded-xl border-2 px-3 py-3 text-left transition hover:brightness-[1.02] sm:gap-x-3 sm:px-4 md:flex ${
              dark ? 'bg-[var(--course-surface)]' : 'bg-[var(--course-surface)]'
            } ${borderClass} ring-2 ring-[var(--course-accent)]/30 ring-offset-2 ring-offset-[var(--course-bg)]`}
          >
            <div className="flex w-[7.5rem] shrink-0 items-center gap-2 overflow-visible sm:w-[8rem] md:w-[8.25rem]">
              <RankingMedal rank={userRank} dark={dark} />
              <RankingStreakBadge dayStreak={attendanceEntry?.dayStreak ?? 0} size="sm" />
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
              <p className="text-[10px] font-semibold text-[var(--course-text-muted)]">
                {userItem.presented ? 'ICFES' : 'sin presentar'}
              </p>
            </div>
          </motion.button>

          <motion.p
            variants={rankingExpandedBlockVariants}
            className="mt-4 text-[11px] leading-relaxed text-[var(--course-text-muted)]"
          >
            Ranking por puntaje global ICFES de {simLabel}. 1 punto ICFES =
            +1 pt en el ranking general de seguimiento.
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}

function SimulacroDropdown({
  simIds,
  value,
  onChange,
}: {
  simIds: string[];
  value: string;
  onChange: (simId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((next) => !next)}
        className="group inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--course-border)] bg-[var(--course-surface)] px-3 py-2 text-left text-xs font-semibold text-[var(--course-text)] shadow-sm transition hover:border-[var(--course-accent)]/40 hover:bg-[var(--course-surface-muted)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--course-accent)]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--course-bg)]"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Seleccionar simulacro"
      >
        <span className="text-[var(--course-text-muted)]">Simulacro</span>
        <span className="font-black tabular-nums">{value}</span>
        <ChevronDown
          className={`h-4 w-4 text-[var(--course-text-muted)] transition group-hover:text-[var(--course-accent)] ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-30 mt-2 min-w-full overflow-hidden rounded-xl border border-[var(--course-border)] bg-[var(--course-surface)] p-1 shadow-xl shadow-black/10 ring-1 ring-black/5 dark:shadow-black/30 dark:ring-white/10">
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--course-text-muted)]">
            Simulacros
          </div>
          <div role="listbox" aria-label="Simulacros disponibles" className="space-y-1">
            {simIds.map((simId) => {
              const selected = simId === value;
              return (
                <button
                  key={simId}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(simId);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-bold tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--course-accent)]/45 ${
                    selected
                      ? 'bg-[var(--course-accent)] text-white shadow-sm'
                      : 'text-[var(--course-text)] hover:bg-[var(--course-surface-muted)]'
                  }`}
                >
                  <span>{simId}</span>
                  {selected ? <Check className="h-4 w-4" aria-hidden /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CourseSimulacroRankingPanel({
  leaderboard,
}: CourseSimulacroRankingPanelProps) {
  const { dark } = useCourseTheme();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectGuardUntilRef = useRef(0);
  const selectPerson = useCallback((key: string | null) => {
    if (key != null && Date.now() < selectGuardUntilRef.current) return;
    setSelectedKey(key);
  }, []);
  const closeStudentModal = useCallback(() => {
    selectGuardUntilRef.current = Date.now() + 400;
    setSelectedKey(null);
  }, []);
  const [showMethodology, setShowMethodology] = useState(false);
  const [selectedSimId, setSelectedSimId] = useState(DEFAULT_SIMULACRO_ID);

  const { report, rankings, ranksMap, loading, error, currentPersonKey, personKeyCandidates } =
    leaderboard;
  const { photos } = useProfilePhotos(!loading && Boolean(report?.rows.length));

  const availableSimIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of report?.rows ?? []) {
      for (const bonus of row.simulacroBonuses ?? []) {
        if (bonus.simId) ids.add(bonus.simId);
      }
    }
    if (!ids.size) ids.add(DEFAULT_SIMULACRO_ID);
    return [...ids].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  }, [report]);

  const activeSimId = availableSimIds.includes(selectedSimId)
    ? selectedSimId
    : availableSimIds[0] ?? DEFAULT_SIMULACRO_ID;
  const activeSimLabel = `Simulacro ${activeSimId}`;

  const list = useMemo(
    () => (report?.rows.length ? buildSimulacroRanking(report.rows, activeSimId) : []),
    [report, activeSimId],
  );

  const allCandidates = useMemo(
    () =>
      personKeyCandidates?.length
        ? personKeyCandidates
        : currentPersonKey
          ? [currentPersonKey]
          : [],
    [personKeyCandidates, currentPersonKey],
  );

  const isCurrentUser = useMemo(() => {
    const keys = new Set(allCandidates);
    return (personKey: string) => keys.has(personKey);
  }, [allCandidates]);

  const userItem = useMemo(() => {
    if (!allCandidates.length) return undefined;
    for (const key of allCandidates) {
      const found = list.find((e) => e.personKey === key);
      if (found) return found;
    }
    return undefined;
  }, [list, allCandidates]);

  const userRank = userItem ? list.findIndex((e) => e.personKey === userItem.personKey) + 1 : null;
  const userInTop = userRank != null && userRank > 0 && userRank <= RANKING_TOP_VISIBLE;

  const snapshot = useMemo(() => {
    if (!report?.rows.length || !userItem) return null;
    return simulacroRankingSnapshot(report.rows, userItem.personKey, RANKING_TOP_VISIBLE, activeSimId);
  }, [report, userItem, activeSimId]);

  const topList = useMemo(() => list.slice(0, RANKING_TOP_VISIBLE), [list]);

  const topThree = useMemo(() => list.slice(0, 3), [list]);

  const attendanceEntryFor = useCallback(
    (personKey: string) => rankings?.overall.find((e) => e.personKey === personKey),
    [rankings],
  );

  const podiumEntries = useMemo((): RankingPodiumEntry[] => {
    if (!report?.rows.length) return [];
    return topThree.map((item) => {
      const row = report.rows.find((r) => r.personKey === item.personKey);
      const att = attendanceEntryFor(item.personKey);
      return {
        personKey: item.personKey,
        name: row?.rosterName || item.displayLabel,
        score: item.puntajeGlobal,
        scoreDisplay: item.presented ? `${item.puntajeGlobal} ICFES` : '—',
        sessionsAttended: att?.sessionsAttended ?? 0,
        sessionsTotal: att?.sessionsTotal || att?.sessionsCompleted || 0,
        attendanceRate: att?.attendanceRate ?? 0,
        dayStreak: att?.dayStreak ?? 0,
        photoUrl: photoUrlForPerson(photos, item.personKey, row),
        isYou: isCurrentUser(item.personKey),
      };
    });
  }, [topThree, report, photos, isCurrentUser, attendanceEntryFor]);

  const userReportRow = userItem
    ? report?.rows.find((r) => r.personKey === userItem.personKey)
    : undefined;

  const selectedRow = selectedKey ? report?.rows.find((r) => r.personKey === selectedKey) : undefined;
  const selectedEntry =
    selectedKey && rankings ? entryForPerson(rankings, selectedKey) : undefined;

  if (loading) return <SgSkeletonCard lines={8} />;

  if (error || !report?.rows.length) {
    return (
      <SgEmptyState
        icon={BookOpen}
        title="Ranking del simulacro sin datos"
        message={error || 'Aún no hay puntajes del simulacro cargados.'}
      />
    );
  }

  const rosterSize = report.rosterCount ?? report.rows.length;
  const reduceMotion = useReducedMotion();
  const presentedCount = list.filter((e) => e.presented).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--course-accent)]/30 bg-[var(--course-accent)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--course-accent)]">
          <BookOpen className="h-3.5 w-3.5" aria-hidden />
          {activeSimLabel} · Top {RANKING_TOP_VISIBLE} · {rosterSize} estudiantes
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SimulacroDropdown
          simIds={availableSimIds}
          value={activeSimId}
          onChange={setSelectedSimId}
        />

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
        Top {RANKING_TOP_VISIBLE} por puntaje global ICFES · {presentedCount} presentaron {activeSimId}
      </p>

      <RankingPodium entries={podiumEntries} dark={dark} onSelect={selectPerson} />

      <ul className="space-y-2">
        {topList.map((item, index) => {
          const rank = index + 1;
          const row = report.rows.find((r) => r.personKey === item.personKey);
          return (
            <motion.li
              key={`${item.personKey}-${rank}`}
              {...rankingListRowMotion(index, reduceMotion)}
            >
              <SimulacroRankingListRow
                item={item}
                rank={rank}
                isYou={isCurrentUser(item.personKey)}
                row={row}
                attendanceEntry={attendanceEntryFor(item.personKey)}
                dark={dark}
                onSelect={selectPerson}
              />
            </motion.li>
          );
        })}
      </ul>

      {userItem && userRank ? (
        <RankingUserPositionFooter
          userRank={userRank}
          label={userReportRow?.rosterName || userItem.displayLabel}
          score={userItem.puntajeGlobal}
          scoreSuffix={userItem.presented ? 'ICFES' : 'sin presentar'}
        >
          <SimulacroRankingUserStickyBar
            userRank={userRank}
            userItem={userItem}
            userReportRow={userReportRow}
            attendanceEntry={attendanceEntryFor(userItem.personKey)}
            userInTop={userInTop}
            pointsGapToTop={snapshot?.pointsGapToTop ?? null}
            rosterSize={rosterSize}
            simLabel={activeSimLabel}
            dark={dark}
            onSelect={selectPerson}
          />
        </RankingUserPositionFooter>
      ) : null}

      {showMethodology ? <RankingMethodologyModal onClose={() => setShowMethodology(false)} /> : null}

      {selectedRow && selectedEntry && report && ranksMap ? (
        <CourseAttendanceStudentModal
          row={selectedRow}
          entry={selectedEntry}
          report={report}
          ranksByPerson={ranksMap}
          activeSort="overall"
          isCurrentUser={isCurrentUser(selectedRow.personKey)}
          onClose={closeStudentModal}
        />
      ) : null}
    </div>
  );
}
