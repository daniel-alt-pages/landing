'use client';

import { CalendarDays, Clock, Flame, Zap, Trophy, BookOpen, type LucideIcon } from 'lucide-react';
import type { CourseAttendanceReport, CourseAttendanceReportRow } from '../../../lib/courseAttendanceReport';
import {
  ATTENDANCE_POINTS_BREAKDOWN_LABELS,
  computeAttendancePoints,
  mergeSimulacroIntoAttendancePoints,
  type AttendancePointsBreakdown,
} from '../../../lib/courseAttendancePoints';
import {
  attendanceRankingProgressWidth,
  maxSimulacroBonusPointsInRows,
  maxSimulacroScoreInRows,
  simulacroBonusPointsForRow,
  simulacroRankingSnapshot,
  type AttendanceRankingEntry,
  type AttendanceRankingRanksByPerson,
} from '../../../lib/courseAttendanceRanking';
import { formatMinutesAsDuration } from '../../../lib/courseMeetAttendance';
import {
  academicWeekForDate,
  formatWeekHeading,
  listVacacionalAcademicWeekRanges,
} from '../../../lib/courseVacacionalWeek';
import {
  scheduledSessionsForReport,
  sessionDurationLabel,
  sessionStatusText,
} from '../../../lib/courseAttendanceWeek';
import SimulacroPointsDetailCard from './SimulacroPointsDetailCard';
import SimulacroRankingProfileFooter from './SimulacroRankingProfileFooter';
import { RANKING_TOP_VISIBLE } from '../lib/seguimientoUi';
import type { StreakTier } from '../lib/seguimientoStreakUi';
import type { CourseRecentSession } from '../../../types/courseTypes';
import { useCourseTheme } from '../../../hooks/useCourseTheme';

const BREAKDOWN_ICONS: Record<string, LucideIcon> = {
  minutos: Clock,
  multiplicador: Zap,
  rachaDias: CalendarDays,
  simulacros: BookOpen,
};

const LIVE_CLASS_INTENSITY_MAX_MINUTES = 120;

type SessionWeekGroup = {
  key: string;
  label: string;
  rangeLabel: string;
  sessions: CourseRecentSession[];
  attendedCount: number;
  completedCount: number;
  pendingCount: number;
  totalMinutes: number;
};

function sessionBadgeClass(dark: boolean, status?: CourseRecentSession['status']): string {
  if (status === 'present') {
    return dark
      ? 'bg-teal-500/15 text-teal-100 border-teal-400/30'
      : 'bg-teal-50 text-teal-800 border-teal-200';
  }
  if (status === 'partial') {
    return dark
      ? 'bg-amber-500/15 text-amber-100 border-amber-400/30'
      : 'bg-amber-50 text-amber-900 border-amber-200';
  }
  if (status === 'upcoming' || status === 'live-soon') {
    return dark
      ? 'bg-indigo-500/15 text-indigo-100 border-indigo-400/30'
      : 'bg-indigo-50 text-indigo-800 border-indigo-200';
  }
  return dark
    ? 'bg-slate-500/10 text-slate-200 border-slate-400/20'
    : 'bg-slate-50 text-slate-700 border-slate-200';
}

function shortClassLabel(topic?: string): string {
  if (!topic) return 'Clase';
  const num = topic.match(/CLASE\s*#?\s*(\d+)/i);
  if (num) return `Clase ${num[1]}`;
  return topic.length > 48 ? `${topic.slice(0, 45)}…` : topic;
}

function buildSessionWeekGroups(
  sessions: CourseRecentSession[],
  courseId = 'preicfes-sg26',
): SessionWeekGroup[] {
  const buckets = new Map<number, CourseRecentSession[]>();
  for (const session of sessions) {
    const week = academicWeekForDate(courseId, session.date);
    const key = week?.weekNumber ?? 0;
    const bucket = buckets.get(key) || [];
    bucket.push(session);
    buckets.set(key, bucket);
  }

  const weeks = listVacacionalAcademicWeekRanges(courseId);
  return weeks
    .filter((week) => buckets.has(week.weekNumber))
    .map((week) => {
      const weekSessions = buckets.get(week.weekNumber) || [];
      const pendingCount = weekSessions.filter(
        (s) => s.status === 'upcoming' || s.status === 'live-soon',
      ).length;
      const completedCount = weekSessions.length - pendingCount;
      const attendedCount = weekSessions.filter(
        (s) => s.status === 'present' || s.status === 'partial',
      ).length;
      const totalMinutes = weekSessions.reduce((sum, s) => sum + Math.max(0, s.minutes || 0), 0);

      return {
        key: `${week.weekNumber}-${week.start}`,
        label: week.label,
        rangeLabel: formatWeekHeading(week.start, week.end),
        sessions: weekSessions,
        attendedCount,
        completedCount,
        pendingCount,
        totalMinutes,
      };
    })
    .sort((a, b) => b.key.localeCompare(a.key));
}

function sessionIntensityRatio(session: CourseRecentSession): number {
  return Math.min(Math.max(session.minutes || 0, 0), LIVE_CLASS_INTENSITY_MAX_MINUTES) / LIVE_CLASS_INTENSITY_MAX_MINUTES;
}

function intensityTierFromRatio(ratio: number): StreakTier {
  if (ratio <= 0) return 0;
  if (ratio >= 1) return 7;
  if (ratio >= 0.85) return 6;
  if (ratio >= 0.7) return 5;
  if (ratio >= 0.55) return 4;
  if (ratio >= 0.4) return 3;
  if (ratio >= 0.2) return 2;
  return 1;
}

function sessionIntensityTier(session: CourseRecentSession): StreakTier {
  return intensityTierFromRatio(sessionIntensityRatio(session));
}

function weekIntensityRatio(week: SessionWeekGroup): number {
  if (week.completedCount <= 0) return 0;
  return Math.min(
    week.totalMinutes / (week.completedCount * LIVE_CLASS_INTENSITY_MAX_MINUTES),
    1,
  );
}

function weekIntensityTier(week: SessionWeekGroup): StreakTier {
  return intensityTierFromRatio(weekIntensityRatio(week));
}

function liveHeatSurfaceClass(dark: boolean, tier: StreakTier): string {
  switch (tier) {
    case 0:
      return dark ? 'bg-slate-500/10 border-slate-300/20' : 'bg-slate-50 border-slate-200';
    case 1:
    case 2:
      return dark ? 'bg-cyan-500/12 border-cyan-300/25' : 'bg-cyan-50/80 border-cyan-200';
    case 3:
    case 4:
      return dark ? 'bg-sky-500/14 border-sky-300/30' : 'bg-sky-50/80 border-sky-200';
    case 5:
      return dark ? 'bg-amber-500/16 border-amber-300/35' : 'bg-amber-50/85 border-amber-200';
    case 6:
      return dark ? 'bg-orange-500/18 border-orange-300/40' : 'bg-orange-50/90 border-orange-200';
    case 7:
      return dark
        ? 'bg-violet-500/18 border-violet-400/45 shadow-[0_0_0_1px_rgba(139,92,246,0.2)]'
        : 'bg-gradient-to-br from-violet-50 via-white to-indigo-50 border-[var(--course-accent)]/40 shadow-sm shadow-violet-200/45';
    default:
      return dark ? 'bg-white/5 border-white/10' : 'bg-white border-[var(--course-border)]';
  }
}

function liveHeatBarClass(dark: boolean, tier: StreakTier): string {
  switch (tier) {
    case 0:
      return dark ? 'bg-slate-300' : 'bg-slate-400';
    case 1:
    case 2:
      return dark ? 'bg-cyan-300' : 'bg-cyan-500';
    case 3:
    case 4:
      return dark ? 'bg-sky-300' : 'bg-sky-500';
    case 5:
      return dark ? 'bg-amber-300' : 'bg-amber-500';
    case 6:
      return dark ? 'bg-orange-400' : 'bg-gradient-to-r from-amber-500 to-orange-500';
    case 7:
      return dark ? 'bg-violet-400' : 'bg-gradient-to-r from-orange-500 via-rose-500 to-[var(--course-accent)]';
    default:
      return dark ? 'bg-white/30' : 'bg-[var(--course-text-muted)]/40';
  }
}

function liveHeatTextClass(dark: boolean, tier: StreakTier): string {
  switch (tier) {
    case 0:
      return dark ? 'text-slate-100' : 'text-slate-700';
    case 1:
    case 2:
      return dark ? 'text-cyan-100' : 'text-cyan-800';
    case 3:
    case 4:
      return dark ? 'text-sky-100' : 'text-sky-800';
    case 5:
      return dark ? 'text-amber-100' : 'text-amber-800';
    case 6:
      return dark ? 'text-orange-100' : 'text-orange-800';
    case 7:
      return dark ? 'text-violet-100' : 'text-[var(--course-accent)]';
    default:
      return dark ? 'text-white/50' : 'text-[var(--course-text-muted)]';
  }
}

function pendingSessionCardClass(dark: boolean): string {
  return dark
    ? 'bg-indigo-500/10 border-indigo-400/30 border-dashed'
    : 'bg-indigo-50/70 border-indigo-200 border-dashed';
}

function sessionIntensityCardClass(dark: boolean, session: CourseRecentSession): string {
  if (session.status === 'upcoming' || session.status === 'live-soon') {
    return pendingSessionCardClass(dark);
  }
  return liveHeatSurfaceClass(dark, sessionIntensityTier(session));
}

function sessionIntensityBarClass(dark: boolean, session: CourseRecentSession): string {
  if (session.status === 'upcoming' || session.status === 'live-soon') {
    return dark ? 'bg-indigo-400' : 'bg-indigo-500';
  }
  return liveHeatBarClass(dark, sessionIntensityTier(session));
}

function pointsToneClass(key: string, dark: boolean): { icon: string; bar: string; surface: string } {
  switch (key) {
    case 'minutos':
      return {
        icon: dark ? 'text-indigo-200' : 'text-indigo-600',
        bar: dark ? 'bg-indigo-400' : 'bg-gradient-to-r from-indigo-500 to-violet-500',
        surface: dark ? 'bg-indigo-500/10 border-indigo-400/25' : 'bg-indigo-50/60 border-indigo-200',
      };
    case 'multiplicador':
      return {
        icon: dark ? 'text-amber-200' : 'text-amber-600',
        bar: dark ? 'bg-amber-300' : 'bg-gradient-to-r from-amber-400 to-orange-500',
        surface: dark ? 'bg-amber-500/10 border-amber-400/25' : 'bg-amber-50/70 border-amber-200',
      };
    case 'rachaDias':
      return {
        icon: dark ? 'text-rose-200' : 'text-rose-600',
        bar: dark ? 'bg-rose-400' : 'bg-gradient-to-r from-orange-500 to-rose-500',
        surface: dark ? 'bg-rose-500/10 border-rose-400/25' : 'bg-rose-50/60 border-rose-200',
      };
    default:
      return {
        icon: dark ? 'text-violet-200' : 'text-[var(--course-accent)]',
        bar: dark ? 'bg-violet-400' : 'bg-gradient-to-r from-violet-500 to-[var(--course-accent)]',
        surface: dark ? 'bg-violet-500/10 border-violet-400/25' : 'bg-violet-50/60 border-violet-200',
      };
  }
}

function sessionIntensityLabel(session: CourseRecentSession): string {
  if (session.status === 'upcoming' || session.status === 'live-soon') return 'Pendiente';
  const minutes = Math.max(0, session.minutes || 0);
  if (minutes <= 0) return 'Sin registro';
  return `${Math.min(minutes, LIVE_CLASS_INTENSITY_MAX_MINUTES)}/${LIVE_CLASS_INTENSITY_MAX_MINUTES} min`;
}

export type AttendanceStudentModalBodyProps = {
  row: CourseAttendanceReportRow;
  entry: AttendanceRankingEntry;
  report: CourseAttendanceReport;
  ranksByPerson: AttendanceRankingRanksByPerson;
  dark?: boolean;
  /** Tokens curso (CSS vars). Si no, usa clases admin dark. */
  variant?: 'course' | 'admin';
  matchWarning?: boolean;
  streakStaleWarning?: boolean;
  /** false cuando el padre ya provee overflow-y-auto (modal de asistencia). */
  scrollContainer?: boolean;
  /** Muestra bloque de ranking simulacro al final (usuario logueado). */
  isCurrentUser?: boolean;
};

export default function AttendanceStudentModalBody({
  row,
  entry,
  report,
  ranksByPerson,
  dark: darkProp,
  variant = 'course',
  matchWarning,
  streakStaleWarning,
  scrollContainer = true,
  isCurrentUser = false,
}: AttendanceStudentModalBodyProps) {
  const { dark: themeDark } = useCourseTheme();
  const isDark = darkProp ?? themeDark;

  const sessions = scheduledSessionsForReport(row.recentSessions, report.weekSchedules);
  const pendingSessions = sessions.filter(
    (s) => s.status === 'upcoming' || s.status === 'live-soon',
  );
  const attendanceWeekGroups = buildSessionWeekGroups(sessions);

  const personRanks = ranksByPerson.get(row.personKey) || {};
  const a = row.attendance;
  const totalStudents = report.rows.length;
  const totalPoints = entry.compositeScore ?? 0;
  const breakdown = entry.pointsBreakdown;

  const pointsRows = breakdown
    ? (Object.keys(ATTENDANCE_POINTS_BREAKDOWN_LABELS) as Array<
        keyof Omit<AttendancePointsBreakdown, 'simulacros'>
      >)
        .map((key) => ({
          key,
          label: ATTENDANCE_POINTS_BREAKDOWN_LABELS[key],
          points: breakdown[key],
          detail: undefined as string | undefined,
        }))
        .filter((row) => row.points > 0)
    : [];

  const simRankingPoints = breakdown?.simulacros ?? simulacroBonusPointsForRow(row);
  const simShareOfTotal =
    totalPoints > 0 && simRankingPoints > 0 ? (simRankingPoints / totalPoints) * 100 : undefined;
  const simBonuses = row.simulacroBonuses?.length
    ? row.simulacroBonuses
    : [];

  const simulacroRankSnapshot = isCurrentUser
    ? simulacroRankingSnapshot(report.rows, row.personKey, RANKING_TOP_VISIBLE)
    : null;

  void variant; // solo course; admin reutiliza el mismo body

  const muted = 'text-[var(--course-text-muted)]';
  const mutedStrong = 'text-[var(--course-text)]/70';
  const text = 'text-[var(--course-text)]';
  const barBg = 'bg-[var(--course-surface-muted)]';
  const competitionBar = 'bg-gradient-to-r from-amber-400 via-violet-500 to-[var(--course-accent)]';

  const leaderPoints = report.rows.length
    ? Math.max(
        totalPoints,
        ...report.rows.map((r) =>
          mergeSimulacroIntoAttendancePoints(
            computeAttendancePoints(r.recentSessions, report.weekSchedules, r.courseId),
            r.simulacroBonuses,
          ).total,
        ),
      )
    : totalPoints;
  const leaderProgress = leaderPoints > 0 ? Math.min(Math.round((totalPoints / leaderPoints) * 100), 100) : 0;

  const rootClass = scrollContainer
    ? 'min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-3 pt-1 sm:px-5 sm:pb-4 space-y-3 sm:space-y-4'
    : 'px-4 pb-3 pt-3 sm:px-5 sm:pb-4 space-y-3 sm:space-y-4';

  return (
    <div className={rootClass}>
      {matchWarning ? (
        <div
          className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
            isDark
              ? 'border-amber-500/40 bg-amber-500/15 text-amber-100'
              : 'border-amber-300 bg-amber-50 text-amber-900'
          }`}
        >
          Nombre en Meet no coincide con roster — revisar match manual.
        </div>
      ) : null}

      {streakStaleWarning ? (
        <div
          className={`rounded-xl border px-3 py-2 text-xs ${
            isDark
              ? 'border-rose-500/35 bg-rose-500/15 text-rose-100'
              : 'border-rose-300 bg-rose-50 text-rose-900'
          }`}
        >
          La racha parece inflada respecto a clases programadas ({entry.sessionsTotal}). Actualiza datos
          o limpia caché del navegador.
        </div>
      ) : null}

      <div
        className={`relative overflow-hidden rounded-2xl border px-3.5 py-3 shadow-sm ${
          isDark
            ? 'border-violet-400/25 bg-gradient-to-br from-violet-500/12 via-indigo-500/8 to-slate-900 shadow-none'
            : 'border-violet-200/80 bg-gradient-to-br from-white via-violet-50/80 to-indigo-50 shadow-violet-100/70'
        }`}
      >
        <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-amber-300/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-4 h-24 w-24 rounded-full bg-violet-500/15 blur-2xl" />
        <div className="relative flex items-end justify-between gap-3">
          <div>
            <p className={`text-[11px] font-black uppercase tracking-wide ${isDark ? 'text-white/55' : 'text-slate-500'}`}>
              Puntos acumulados
            </p>
            <p className="bg-gradient-to-r from-violet-600 via-[var(--course-accent)] to-indigo-600 bg-clip-text text-3xl font-black tabular-nums leading-none text-transparent sm:text-4xl">
              {totalPoints}
              <span className={`ml-1 align-baseline text-sm font-black ${mutedStrong}`}>pts</span>
            </p>
          </div>
          {personRanks.overall ? (
            <span
              className={`rounded-xl border px-3 py-1.5 text-xs font-black tabular-nums shadow-sm ${
                isDark
                  ? 'border-amber-300/35 bg-gradient-to-br from-amber-500/18 to-white/5 text-amber-100'
                  : 'border-amber-300/80 bg-gradient-to-br from-amber-50 to-white text-amber-800 shadow-amber-100'
              }`}
            >
              Puesto #{personRanks.overall}
            </span>
          ) : null}
        </div>
        {leaderPoints > 0 ? (
          <>
            <div className={`relative mt-3 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wide ${isDark ? 'text-white/55' : 'text-slate-500'}`}>
              <span>Ritmo contra el líder</span>
              <span className="tabular-nums text-[var(--course-accent)]">{leaderProgress}%</span>
            </div>
            <div
              className={`relative mt-1 h-2.5 overflow-hidden rounded-full ${barBg} ring-1 ${
                isDark ? 'ring-white/10' : 'ring-black/5'
              }`}
            >
              <div
                className={`h-full rounded-full ${competitionBar}`}
                style={{ width: attendanceRankingProgressWidth(totalPoints, leaderPoints) }}
              />
            </div>
          </>
        ) : null}
      </div>

      {pointsRows.length > 0 ? (
        <section>
          <h4 className={`text-[11px] font-bold uppercase tracking-wide mb-2 ${muted}`}>
            Desglose de puntos
          </h4>
          <ul className="space-y-2">
            {pointsRows.map(({ key, label, points, detail }) => {
              const Icon = BREAKDOWN_ICONS[key] ?? Trophy;
              const share = totalPoints > 0 ? (points / totalPoints) * 100 : 0;
              const tone = pointsToneClass(key, isDark);
              return (
                <li
                  key={key}
                  className={`rounded-xl border px-3 py-2.5 shadow-sm ${tone.surface}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ${
                          isDark
                            ? 'bg-white/8 ring-white/10'
                            : 'bg-white/70 ring-black/5'
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${tone.icon}`} aria-hidden />
                      </span>
                      <span className={`truncate text-sm font-bold ${text}`}>{label}</span>
                    </div>
                    <span className={`text-sm font-black tabular-nums ${text}`}>+{points} pts</span>
                  </div>
                  {detail ? (
                    <p className={`mt-1 text-[10px] leading-relaxed ${muted}`}>{detail}</p>
                  ) : null}
                  {points > 0 ? (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div
                        className={`h-2 flex-1 overflow-hidden rounded-full ${barBg} ring-1 ${
                          isDark ? 'ring-white/10' : 'ring-black/5'
                        }`}
                      >
                        <div
                          className={`h-full rounded-full ${tone.bar}`}
                          style={{ width: attendanceRankingProgressWidth(share, 100) }}
                        />
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className={`mt-1.5 text-xs font-medium ${muted}`}>de {totalStudents} estudiantes</p>
        </section>
      ) : null}

      <section>
        <h4 className={`text-[11px] font-bold uppercase tracking-wide mb-2 ${muted}`}>
          Puntos por simulacro
        </h4>
        <div className="space-y-2">
          {simBonuses.length ? (
            simBonuses.map((bonus) => (
              <SimulacroPointsDetailCard
                key={bonus.simId}
                bonus={bonus}
                rankingPoints={Math.max(0, Number(bonus.points) || 0)}
                maxScoreInCohort={maxSimulacroScoreInRows(report.rows, bonus.simId)}
                shareOfTotal={
                  totalPoints > 0 && bonus.points > 0
                    ? (Math.max(0, Number(bonus.points) || 0) / totalPoints) * 100
                    : undefined
                }
              />
            ))
          ) : (
            <SimulacroPointsDetailCard
              rankingPoints={simRankingPoints}
              maxScoreInCohort={maxSimulacroBonusPointsInRows(report.rows)}
              shareOfTotal={simShareOfTotal}
            />
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <Stat
          label="Clases"
          value={`${a.sessionsAttended ?? 0}/${a.sessionsTotal ?? 0}`}
          icon={Trophy}
          sub={
            (a.sessionsUpcoming ?? entry.sessionsUpcoming) > 0
              ? `${a.sessionsUpcoming ?? entry.sessionsUpcoming} pendientes`
              : `${a.sessionsCompleted ?? entry.sessionsCompleted} dictadas`
          }
          dark={isDark}
        />
        <Stat
          label="Tiempo en vivo"
          value={formatMinutesAsDuration(entry.attendedMinutes)}
          icon={Clock}
          dark={isDark}
        />
        <Stat
          label="Racha clases"
          value={`${entry.classStreak}`}
          icon={Flame}
          sub={`Mejor ${entry.bestClassStreak}`}
          tone="flame"
          dark={isDark}
        />
        <Stat
          label="Racha días"
          value={`${entry.dayStreak}`}
          icon={CalendarDays}
          sub={`Mejor ${entry.bestDayStreak}`}
          tone="streak"
          dark={isDark}
        />
      </div>

      <section>
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h4 className={`text-[11px] font-bold uppercase tracking-wide ${muted}`}>
              Clases en vivo
              <span className={`font-semibold normal-case ${mutedStrong}`}>
                {' '}
                · por semana · inducciones no cuentan
              </span>
            </h4>
            <p className={`mt-0.5 text-[10px] font-medium ${muted}`}>
              Color asistencia: frío → intenso → violeta máximo (2 h o más).
            </p>
          </div>
          {pendingSessions.length > 0 ? (
            <span
              className={`rounded-full border px-2 py-1 text-[10px] font-bold ${
                isDark
                  ? 'border-indigo-400/30 bg-indigo-500/12 text-indigo-100'
                  : 'border-indigo-200 bg-indigo-50 text-indigo-800'
              }`}
            >
              {pendingSessions.length} pendiente(s)
            </span>
          ) : null}
        </div>
        {sessions.length === 0 ? (
          <p className={`text-sm ${muted}`}>Sin clases programadas con registro.</p>
        ) : (
          <div className="space-y-3">
            {attendanceWeekGroups.map((week) => {
              const weekTier = weekIntensityTier(week);
              const weekRatio = weekIntensityRatio(week);
              const weekProgress = attendanceRankingProgressWidth(weekRatio * 100, 100);
              return (
                <div
                  key={week.key}
                  className={`relative overflow-hidden rounded-2xl border p-2.5 pt-3 shadow-sm ${liveHeatSurfaceClass(isDark, weekTier)}`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 ${liveHeatBarClass(isDark, weekTier)}`} />
                  <div className="mb-2 flex items-start justify-between gap-2 px-1">
                    <div>
                      <p className={`text-sm font-black ${text}`}>{week.label}</p>
                      <p className={`text-xs font-semibold tabular-nums ${muted}`}>
                        {week.rangeLabel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black tabular-nums ${liveHeatTextClass(isDark, weekTier)}`}>
                        {formatMinutesAsDuration(week.totalMinutes)}
                      </p>
                      <p className={`text-[10px] font-semibold ${muted}`}>
                        {week.attendedCount}/{week.completedCount} asistidas
                        {week.pendingCount > 0 ? ` · ${week.pendingCount} pend.` : ''}
                      </p>
                    </div>
                  </div>

                  {week.completedCount > 0 ? (
                    <div className="mb-2 flex items-center gap-2 px-1">
                      <div className={`h-1.5 flex-1 overflow-hidden rounded-full ${barBg}`}>
                        <div
                          className={`h-full rounded-full ${liveHeatBarClass(isDark, weekTier)}`}
                          style={{ width: weekProgress }}
                        />
                      </div>
                      <span className={`text-[10px] font-black tabular-nums ${liveHeatTextClass(isDark, weekTier)}`}>
                        {Math.round(weekRatio * 100)}%
                      </span>
                    </div>
                  ) : null}

                  <ul className="space-y-2">
                    {week.sessions.map((session) => {
                      const intensityWidth = `${Math.max(sessionIntensityRatio(session) * 100, session.minutes ? 8 : 0)}%`;
                      return (
                        <li
                          key={`${session.sessionId}-${session.date}`}
                          className={`rounded-xl border px-3 py-2 ${sessionIntensityCardClass(isDark, session)}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold ${text}`}>
                                {shortClassLabel(session.topic)}
                              </p>
                              <p className={`text-xs font-medium tabular-nums ${muted}`}>
                                {session.date}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${sessionBadgeClass(
                                isDark,
                                session.status,
                              )}`}
                            >
                              {sessionStatusText(session)}
                            </span>
                          </div>
                          <div
                            className={`mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs tabular-nums ${muted}`}
                          >
                            {session.joinedAt ? <span>Entrada {session.joinedAt}</span> : null}
                            {session.leftAt ? <span>Salida {session.leftAt}</span> : null}
                            <span>{sessionDurationLabel(session)}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className={`h-1.5 flex-1 overflow-hidden rounded-full ${barBg}`}>
                              <div
                                className={`h-full rounded-full ${sessionIntensityBarClass(isDark, session)}`}
                                style={{ width: intensityWidth }}
                              />
                            </div>
                            <span className={`w-20 text-right text-[10px] font-bold tabular-nums ${mutedStrong}`}>
                              {sessionIntensityLabel(session)}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {simulacroRankSnapshot ? (
        <SimulacroRankingProfileFooter snapshot={simulacroRankSnapshot} />
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'default',
  dark = false,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  variant?: 'course' | 'admin';
  tone?: 'default' | 'flame' | 'streak';
  dark?: boolean;
}) {
  const toneClass =
    tone === 'flame'
      ? dark
        ? {
            card:
              'border-orange-400/30 bg-gradient-to-br from-orange-500/14 via-amber-500/10 to-white/[0.03]',
            icon: 'text-orange-300',
            value: 'bg-gradient-to-r from-orange-300 to-amber-200 bg-clip-text text-transparent',
          }
        : {
            card:
              'border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-white shadow-orange-100/70',
            icon: 'text-orange-600',
            value: 'bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent',
          }
      : tone === 'streak'
        ? dark
          ? {
              card:
                'border-violet-400/30 bg-gradient-to-br from-violet-500/14 via-indigo-500/10 to-white/[0.03]',
              icon: 'text-violet-300',
              value:
                'bg-gradient-to-r from-violet-300 to-indigo-200 bg-clip-text text-transparent',
            }
          : {
              card:
                'border-violet-200 bg-gradient-to-br from-violet-50 via-indigo-50 to-white shadow-violet-100/70',
              icon: 'text-violet-600',
              value:
                'bg-gradient-to-r from-violet-600 to-[var(--course-accent)] bg-clip-text text-transparent',
            }
        : dark
          ? {
              card:
                'border-[var(--course-border)] bg-gradient-to-br from-white/6 to-white/[0.03]',
              icon: 'text-[var(--course-accent)]',
              value: 'text-[var(--course-text)]',
            }
          : {
              card:
                'border-[var(--course-border)] bg-gradient-to-br from-white to-[var(--course-surface-muted)]/45',
              icon: 'text-[var(--course-accent)]',
              value: 'text-[var(--course-text)]',
            };

  return (
    <div className={`rounded-xl border px-3 py-2.5 shadow-sm ${toneClass.card}`}>
      <div
        className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[var(--course-text-muted)]"
      >
        <Icon className={`h-3.5 w-3.5 shrink-0 opacity-95 ${toneClass.icon}`} aria-hidden />
        {label}
      </div>
      <p className={`mt-0.5 text-lg font-black tabular-nums ${toneClass.value}`}>{value}</p>
      {sub ? (
        <p className="text-xs font-medium text-[var(--course-text-muted)]">{sub}</p>
      ) : null}
    </div>
  );
}
