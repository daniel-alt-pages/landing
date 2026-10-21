import type { CourseStudentMetrics } from '../types/courseTypes';
import type { CourseAttendanceReportRow } from './courseAttendanceReport';
import { formatMinutesAsDuration } from './courseMeetAttendance';
import { computeAttendanceStreaks } from './courseAttendanceStreaks';
import {
  buildExcusaDatesByEmail,
  type CourseExcusasManifest,
} from './courseAttendanceExcusas';
import {
  computeAttendancePoints,
  mergeSimulacroIntoAttendancePoints,
  sumSimulacroBonusPoints,
  type AttendancePointsBreakdown,
} from './courseAttendancePoints';
import {
  compareAttendanceRankingTieBreak,
  computeAttendanceRankingTieBreak,
  type AttendanceRankingTieBreak,
} from './courseAttendanceRankingTiebreak';
import {
  mergeWeekSessionsWithSchedule,
  type WeekScheduledClass,
} from './courseAttendanceWeek';

export type AttendanceRankingSort =
  | 'overall'
  | 'attendanceRate'
  | 'sessionsAttended'
  | 'classStreak'
  | 'dayStreak'
  | 'attendedHours';

export const ATTENDANCE_RANKING_DIMENSIONS: AttendanceRankingSort[] = [
  'sessionsAttended',
  'attendedHours',
  'classStreak',
  'dayStreak',
  'attendanceRate',
];

export const ATTENDANCE_RANKING_SORTS: AttendanceRankingSort[] = [
  'overall',
  ...ATTENDANCE_RANKING_DIMENSIONS,
];

export const ATTENDANCE_RANKING_SORT_LABELS: Record<AttendanceRankingSort, string> = {
  overall: 'Ranking general',
  attendanceRate: '% asistencia',
  sessionsAttended: 'Clases asistidas',
  classStreak: 'Racha de clases',
  dayStreak: 'Racha de días',
  attendedHours: 'Horas en vivo',
};

export type AttendanceRankingEntry = {
  personKey: string;
  displayLabel: string;
  institution?: string;
  attendanceRate: number;
  sessionsAttended: number;
  sessionsTotal: number;
  sessionsCompleted: number;
  sessionsUpcoming: number;
  attendedHours: number;
  attendedMinutes: number;
  tieBreak: AttendanceRankingTieBreak;
  classStreak: number;
  bestClassStreak: number;
  dayStreak: number;
  bestDayStreak: number;
  /** Puntos acumulados (sin límite). */
  compositeScore?: number;
  pointsBreakdown?: AttendancePointsBreakdown;
  isCurrentUser?: boolean;
};

export function abbreviateRankingName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Estudiante';
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}

function rowToEntry(
  row: CourseAttendanceReportRow | CourseStudentMetrics,
  weekSchedules: WeekScheduledClass[][] | undefined,
  displayLabel: string,
  institution?: string,
  excusaDates?: ReadonlySet<string>,
): AttendanceRankingEntry {
  const streakOpts = excusaDates?.size ? { excusaDates } : undefined;
  const streaks = computeAttendanceStreaks(
    row.recentSessions,
    weekSchedules,
    row.courseId,
    streakOpts,
  );
  const tieBreak = computeAttendanceRankingTieBreak(row.recentSessions, row.courseId);
  const basePoints = computeAttendancePoints(row.recentSessions, weekSchedules, row.courseId, streakOpts);
  const points = mergeSimulacroIntoAttendancePoints(basePoints, row.simulacroBonuses);
  const a = row.attendance;
  const attendedMinutes =
    tieBreak.attendedMinutes > 0
      ? tieBreak.attendedMinutes
      : Math.round((a.attendedHours ?? 0) * 60);

  return {
    personKey: row.personKey,
    displayLabel,
    institution,
    attendanceRate: a.attendanceRate ?? 0,
    sessionsAttended: a.sessionsAttended ?? 0,
    sessionsTotal: a.sessionsTotal ?? 0,
    sessionsCompleted: a.sessionsCompleted ?? 0,
    sessionsUpcoming: a.sessionsUpcoming ?? 0,
    attendedHours: attendedMinutes / 60,
    attendedMinutes,
    tieBreak,
    classStreak: streaks.currentClassStreak,
    bestClassStreak: streaks.bestClassStreak,
    dayStreak: streaks.currentDayStreak,
    bestDayStreak: streaks.bestDayStreak,
    compositeScore: points.total,
    pointsBreakdown: points.breakdown,
  };
}

function primaryMetricDelta(
  sort: AttendanceRankingSort,
  a: AttendanceRankingEntry,
  b: AttendanceRankingEntry,
): number {
  switch (sort) {
    case 'overall':
      return (b.compositeScore ?? 0) - (a.compositeScore ?? 0);
    case 'sessionsAttended':
      return b.sessionsAttended - a.sessionsAttended;
    case 'attendedHours':
      return b.attendedMinutes - a.attendedMinutes;
    case 'classStreak':
      return b.classStreak - a.classStreak;
    case 'dayStreak':
      return b.dayStreak - a.dayStreak;
    default:
      const rateDiff = b.attendanceRate - a.attendanceRate;
      if (rateDiff !== 0) return rateDiff;
      return b.sessionsAttended - a.sessionsAttended;
  }
}

function compareRankingEntries(
  a: AttendanceRankingEntry,
  b: AttendanceRankingEntry,
  sort: AttendanceRankingSort,
): number {
  const primary = primaryMetricDelta(sort, a, b);
  if (primary !== 0) return primary;
  const tie = compareAttendanceRankingTieBreak(a.tieBreak, b.tieBreak);
  if (tie !== 0) return tie;
  return a.displayLabel.localeCompare(b.displayLabel, 'es', { sensitivity: 'base' });
}

function rankAllDimensions(
  baseEntries: AttendanceRankingEntry[],
): Record<AttendanceRankingSort, AttendanceRankingEntry[]> {
  const result = {} as Record<AttendanceRankingSort, AttendanceRankingEntry[]>;
  for (const sort of ATTENDANCE_RANKING_SORTS) {
    result[sort] = [...baseEntries].sort((a, b) => compareRankingEntries(a, b, sort));
  }
  return result;
}

export function buildAttendanceRanking(
  rows: CourseAttendanceReportRow[],
  weekSchedules: WeekScheduledClass[][] | undefined,
  sort: AttendanceRankingSort = 'overall',
  currentPersonKey?: string,
  excusas?: CourseExcusasManifest | null,
): AttendanceRankingEntry[] {
  const excusaByEmail = buildExcusaDatesByEmail(excusas);
  const entries = rows.map((row) =>
    rowToEntry(
      row,
      weekSchedules,
      row.rosterName || row.displayName || row.personKey,
      row.institution,
      excusaByEmail.get((row.emailLower || '').toLowerCase()),
    ),
  );

  const sorted = [...entries].sort((a, b) => compareRankingEntries(a, b, sort));
  if (currentPersonKey) {
    return sorted.map((e) => ({ ...e, isCurrentUser: e.personKey === currentPersonKey }));
  }
  return sorted;
}

/** Ranking general ordenado por puntos acumulados. */
export function buildUnifiedAttendanceRanking(
  rows: CourseAttendanceReportRow[],
  weekSchedules: WeekScheduledClass[][] | undefined,
  currentPersonKey?: string,
  excusas?: CourseExcusasManifest | null,
): AttendanceRankingEntry[] {
  return buildAttendanceRanking(rows, weekSchedules, 'overall', currentPersonKey, excusas);
}

export function rankForPerson(
  ranking: AttendanceRankingEntry[],
  personKey: string,
): number | null {
  const idx = ranking.findIndex((e) => e.personKey === personKey);
  return idx >= 0 ? idx + 1 : null;
}

export type AttendanceRankingRanksByPerson = Map<
  string,
  Partial<Record<AttendanceRankingSort, number>>
>;

export function buildAllDimensionRankings(
  rows: CourseAttendanceReportRow[],
  weekSchedules: WeekScheduledClass[][] | undefined,
  excusas?: CourseExcusasManifest | null,
): Record<AttendanceRankingSort, AttendanceRankingEntry[]> {
  const excusaByEmail = buildExcusaDatesByEmail(excusas);
  return rankAllDimensions(
    rows.map((row) =>
      rowToEntry(
        row,
        weekSchedules,
        row.rosterName || row.displayName || row.personKey,
        row.institution,
        excusaByEmail.get((row.emailLower || '').toLowerCase()),
      ),
    ),
  );
}

/** Ranking semanal: puntos acumulados solo con las clases de esa semana. */
export function buildWeeklyDimensionRankings(
  rows: CourseAttendanceReportRow[],
  weekSchedules: WeekScheduledClass[][],
  weekIndex: number,
  excusas?: CourseExcusasManifest | null,
): Record<AttendanceRankingSort, AttendanceRankingEntry[]> {
  const schedule = weekSchedules[weekIndex] || [];
  const excusaByEmail = buildExcusaDatesByEmail(excusas);

  const entries = rows.map((row): AttendanceRankingEntry => {
    const weekSessions = mergeWeekSessionsWithSchedule(row.recentSessions, schedule);
    const stats = row.weekStats?.[weekIndex];
    const excusaDates = excusaByEmail.get((row.emailLower || '').toLowerCase());
    const streakOpts = excusaDates?.size ? { excusaDates } : undefined;
    const streaks = computeAttendanceStreaks(row.recentSessions, [schedule], row.courseId, streakOpts);
    const tieBreak = computeAttendanceRankingTieBreak(weekSessions, row.courseId);
    const points = computeAttendancePoints(row.recentSessions, [schedule], row.courseId, streakOpts);

    const sessionsAttended = stats?.sessionsAttended ?? 0;
    const sessionsCompleted = stats?.sessionsCompleted ?? 0;
    const attendedMinutes = stats?.attendedMinutes ?? tieBreak.attendedMinutes;

    return {
      personKey: row.personKey,
      displayLabel: row.rosterName || row.displayName || row.personKey,
      institution: row.institution,
      attendanceRate: sessionsCompleted > 0 ? sessionsAttended / sessionsCompleted : 0,
      sessionsAttended,
      sessionsTotal: stats?.sessionsScheduled ?? schedule.length,
      sessionsCompleted,
      sessionsUpcoming: stats?.sessionsPending ?? 0,
      attendedHours: attendedMinutes / 60,
      attendedMinutes,
      tieBreak,
      classStreak: streaks.currentClassStreak,
      bestClassStreak: streaks.bestClassStreak,
      dayStreak: streaks.currentDayStreak,
      bestDayStreak: streaks.bestDayStreak,
      compositeScore: points.total,
      pointsBreakdown: points.breakdown,
    };
  });

  return rankAllDimensions(entries);
}

export function ranksByPerson(
  rankings: Record<AttendanceRankingSort, AttendanceRankingEntry[]>,
): AttendanceRankingRanksByPerson {
  const map: AttendanceRankingRanksByPerson = new Map();
  for (const sort of ATTENDANCE_RANKING_SORTS) {
    rankings[sort].forEach((entry, index) => {
      const bucket = map.get(entry.personKey) || {};
      bucket[sort] = index + 1;
      map.set(entry.personKey, bucket);
    });
  }
  return map;
}

export function entryForPerson(
  rankings: Record<AttendanceRankingSort, AttendanceRankingEntry[]>,
  personKey: string,
): AttendanceRankingEntry | undefined {
  return (
    rankings.overall?.find((e) => e.personKey === personKey) ??
    rankings.sessionsAttended.find((e) => e.personKey === personKey)
  );
}

export function attendanceRankingInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? parts.at(-1)?.[0] ?? ''}`.toUpperCase();
}

export function attendanceRankingMetricNumber(
  entry: AttendanceRankingEntry,
  sort: AttendanceRankingSort,
): number {
  switch (sort) {
    case 'overall':
      return entry.compositeScore ?? 0;
    case 'sessionsAttended':
      return entry.sessionsAttended;
    case 'attendedHours':
      return entry.attendedMinutes;
    case 'classStreak':
      return entry.classStreak;
    case 'dayStreak':
      return entry.dayStreak;
    default:
      return Math.round(entry.attendanceRate * 100);
  }
}

export function attendanceRankingMetricValue(
  entry: AttendanceRankingEntry,
  sort: AttendanceRankingSort,
): string {
  switch (sort) {
    case 'overall':
      return `${entry.compositeScore ?? 0} pts`;
    case 'sessionsAttended':
      const total =
        entry.sessionsTotal > 0
          ? entry.sessionsTotal
          : entry.sessionsCompleted || entry.sessionsAttended;
      return `${entry.sessionsAttended}/${total}`;
    case 'attendedHours':
      return formatMinutesAsDuration(entry.attendedMinutes);
    case 'classStreak':
      return `${entry.classStreak}`;
    case 'dayStreak':
      return `${entry.dayStreak}`;
    default:
      return `${Math.round(entry.attendanceRate * 100)}%`;
  }
}

export function attendanceRankingProgressWidth(value: number, max: number): string {
  if (max <= 0) return '0%';
  return `${Math.max(4, Math.min(100, Math.round((value / max) * 100)))}%`;
}

/** Puntaje del líder para barras relativas en la lista. */
export function leaderPointsFromRanking(
  ranking: AttendanceRankingEntry[],
): number {
  if (!ranking.length) return 0;
  return ranking[0].compositeScore ?? 0;
}

export const DEFAULT_SIMULACRO_ID = 'SG11-20';

export function simulacroPointsForRow(
  row: Pick<CourseAttendanceReportRow, 'simulacroBonuses'>,
  simId = DEFAULT_SIMULACRO_ID,
): number {
  const bonus = row.simulacroBonuses?.find((b) => b.simId === simId);
  return Math.max(0, Number(bonus?.points) || 0);
}

export function simulacroBonusPointsForRow(
  row: Pick<CourseAttendanceReportRow, 'simulacroBonuses'>,
): number {
  return sumSimulacroBonusPoints(row.simulacroBonuses);
}

export function simulacroBonusForRow(
  row: Pick<CourseAttendanceReportRow, 'simulacroBonuses'>,
  simId = DEFAULT_SIMULACRO_ID,
) {
  return row.simulacroBonuses?.find((b) => b.simId === simId);
}

export type SimulacroRankingEntry = {
  personKey: string;
  displayLabel: string;
  score: number;
  puntajeGlobal: number;
  presented: boolean;
};

export function buildSimulacroRanking(
  rows: CourseAttendanceReportRow[],
  simId = DEFAULT_SIMULACRO_ID,
): SimulacroRankingEntry[] {
  return rows
    .map((row) => {
      const bonus = simulacroBonusForRow(row, simId);
      const score = simulacroPointsForRow(row, simId);
      return {
        personKey: row.personKey,
        displayLabel: row.rosterName || row.displayName || row.personKey,
        score,
        puntajeGlobal: bonus?.puntajeGlobal ?? score,
        presented: score > 0,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.displayLabel.localeCompare(b.displayLabel, 'es');
    });
}

export type SimulacroRankingSnapshot = {
  rank: number;
  score: number;
  puntajeGlobal: number;
  presented: boolean;
  rosterSize: number;
  inTop: boolean;
  pointsGapToTop: number | null;
  topTargetScore: number | null;
};

export function simulacroRankingSnapshot(
  rows: CourseAttendanceReportRow[],
  personKey: string,
  topN: number,
  simId = DEFAULT_SIMULACRO_ID,
): SimulacroRankingSnapshot | null {
  const list = buildSimulacroRanking(rows, simId);
  const idx = list.findIndex((e) => e.personKey === personKey);
  if (idx < 0) return null;
  const entry = list[idx];
  const rank = idx + 1;
  const inTop = rank <= topN;
  const topCutoff = list[topN - 1];
  const pointsGapToTop =
    !inTop && topCutoff ? Math.max(0, topCutoff.score - entry.score) : null;
  return {
    rank,
    score: entry.score,
    puntajeGlobal: entry.puntajeGlobal,
    presented: entry.presented,
    rosterSize: list.length,
    inTop,
    pointsGapToTop,
    topTargetScore: topCutoff?.score ?? null,
  };
}

export function maxSimulacroScoreInRows(
  rows: CourseAttendanceReportRow[],
  simId = DEFAULT_SIMULACRO_ID,
): number {
  if (!rows.length) return 0;
  return Math.max(...rows.map((r) => simulacroPointsForRow(r, simId)), 0);
}

export function maxSimulacroBonusPointsInRows(rows: CourseAttendanceReportRow[]): number {
  if (!rows.length) return 0;
  return Math.max(...rows.map((r) => simulacroBonusPointsForRow(r)), 0);
}
