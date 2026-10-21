import type { AdminAttendanceReport } from '@features/admin/lib/fetchAdminCourseAttendanceReport';
import { buildAllDimensionRankings } from '@features/curso/lib/courseAttendanceRanking';
import { computeAttendanceStreaks } from '@features/curso/lib/courseAttendanceStreaks';
import { filterVacacionalLiveRecentSessions } from '@features/curso/lib/courseVacacionalAttendance';
import { bogotaTodayKey } from '@features/curso/lib/courseVacacionalWeek';
import {
  computeNationalAttendanceStudy,
} from '@features/admin/lib/adminNationalAttendanceStudy';

export type RateBucket = { label: string; count: number; tone: 'rose' | 'orange' | 'amber' | 'cyan' | 'emerald' };

export type GroupWeekTrendPoint = {
  index: number;
  shortLabel: string;
  heading: string;
  /** % asistidas / dictadas (grupo). null si aún no hay clases dictadas. */
  avgPct: number | null;
  attended: number;
  completed: number;
  scheduled: number;
  scheduledClasses: number;
  status: 'active' | 'pending' | 'future';
};

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function shortWeekLabel(start: string, end: string): string {
  const fmt = (key: string, withMonth: boolean) => {
    const dt = new Date(`${key}T12:00:00-05:00`);
    return dt.toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      day: 'numeric',
      ...(withMonth ? { month: 'short' } : {}),
    });
  };
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  if (sameMonth) return `${fmt(start, false)}–${fmt(end, true)}`;
  return `${fmt(start, true)}–${fmt(end, true)}`;
}

export function computeAdminAttendanceAnalytics(report: AdminAttendanceReport) {
  const rows = report.rows;
  const rates = rows.map((r) => r.attendance.attendanceRate ?? 0);
  const avgRate = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  const medRate = median(rates);

  const attendedHours = rows.map((r) => r.attendance.attendedHours ?? 0);
  const totalHours = attendedHours.reduce((a, b) => a + b, 0);
  const avgHours = rows.length ? totalHours / rows.length : 0;

  const below50 = rates.filter((r) => r < 0.5).length;
  const above80 = rates.filter((r) => r >= 0.8).length;
  const perfect = rates.filter((r) => r >= 0.99).length;
  const matchWarnings = rows.filter((r) => r.matchWarning).length;

  const totalSessionsAttended = rows.reduce(
    (acc, r) => acc + (r.attendance.sessionsAttended ?? 0),
    0,
  );
  const totalSessionsCompleted = rows.reduce(
    (acc, r) => acc + (r.attendance.sessionsCompleted ?? 0),
    0,
  );

  const buckets: RateBucket[] = [
    { label: '0–20%', count: 0, tone: 'rose' },
    { label: '20–40%', count: 0, tone: 'orange' },
    { label: '40–60%', count: 0, tone: 'amber' },
    { label: '60–80%', count: 0, tone: 'cyan' },
    { label: '80–100%', count: 0, tone: 'emerald' },
  ];
  for (const rate of rates) {
    const pct = rate * 100;
    if (pct < 20) buckets[0].count += 1;
    else if (pct < 40) buckets[1].count += 1;
    else if (pct < 60) buckets[2].count += 1;
    else if (pct < 80) buckets[3].count += 1;
    else buckets[4].count += 1;
  }
  const maxBucket = Math.max(1, ...buckets.map((b) => b.count));

  const today = bogotaTodayKey();
  const weekTrend: GroupWeekTrendPoint[] = report.weeks.map((week, i) => {
    const stats = rows.map((r) => r.weekStats[i]).filter(Boolean);
    const completed = stats.reduce((acc, s) => acc + s.sessionsCompleted, 0);
    const attended = stats.reduce((acc, s) => acc + s.sessionsAttended, 0);
    const scheduled = stats.reduce((acc, s) => acc + s.sessionsScheduled, 0);
    const isFuture = week.start > today;
    const hasCompleted = completed > 0;
    const status: GroupWeekTrendPoint['status'] = isFuture
      ? 'future'
      : hasCompleted
        ? 'active'
        : week.scheduledClasses > 0
          ? 'pending'
          : 'future';

    return {
      index: i,
      shortLabel: `Sem ${i + 1}`,
      heading: `${shortWeekLabel(week.start, week.end)} · ${week.heading}`,
      avgPct: hasCompleted ? Math.round((attended / completed) * 100) : null,
      attended,
      completed,
      scheduled,
      scheduledClasses: week.scheduledClasses,
      status,
    };
  });

  const activeWeeks = weekTrend.filter((w) => w.status === 'active');
  const pendingWeeks = weekTrend.filter((w) => w.status === 'pending' || w.status === 'future');

  const instMap = new Map<string, { count: number; rateSum: number }>();
  for (const row of rows) {
    const inst = (row.institution || 'Sin institución').trim() || 'Sin institución';
    const prev = instMap.get(inst) ?? { count: 0, rateSum: 0 };
    instMap.set(inst, {
      count: prev.count + 1,
      rateSum: prev.rateSum + (row.attendance.attendanceRate ?? 0),
    });
  }
  const institutions = [...instMap.entries()]
    .map(([name, { count, rateSum }]) => ({
      name,
      count,
      avgPct: Math.round((rateSum / count) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const maxInstCount = Math.max(1, ...institutions.map((i) => i.count));

  let maxClassStreak = 0;
  let maxDayStreak = 0;
  let streak3Plus = 0;
  let streak0 = 0;
  let sumBestClass = 0;
  let sumCurrentClass = 0;
  let sumBestDay = 0;
  let activeClassStreakNow = 0;
  for (const row of rows) {
    const streaks = computeAttendanceStreaks(
      filterVacacionalLiveRecentSessions(row.recentSessions, report.courseId),
      report.weekSchedules,
      report.courseId,
    );
    maxClassStreak = Math.max(maxClassStreak, streaks.bestClassStreak);
    maxDayStreak = Math.max(maxDayStreak, streaks.bestDayStreak);
    sumBestClass += streaks.bestClassStreak;
    sumCurrentClass += streaks.currentClassStreak;
    sumBestDay += streaks.bestDayStreak;
    if (streaks.bestClassStreak >= 3) streak3Plus += 1;
    if (streaks.bestClassStreak === 0) streak0 += 1;
    if (streaks.currentClassStreak > 0) activeClassStreakNow += 1;
  }
  const streakN = rows.length || 1;

  const rankings = buildAllDimensionRankings(rows, report.weekSchedules);

  const rankingHighlights = [
    { key: 'overall', label: 'General', entry: rankings.overall[0] },
    { key: 'attendedHours', label: 'Horas en vivo', entry: rankings.attendedHours[0] },
    { key: 'classStreak', label: 'Racha clases', entry: rankings.classStreak[0] },
    { key: 'sessionsAttended', label: 'Clases asistidas', entry: rankings.sessionsAttended[0] },
  ];

  const nationalStudy = computeNationalAttendanceStudy(report);

  return {
    total: rows.length,
    avgRate,
    medRate,
    totalHours,
    avgHours,
    below50,
    above80,
    perfect,
    matchWarnings,
    totalSessionsAttended,
    totalSessionsCompleted,
    buckets,
    maxBucket,
    weekTrend,
    activeWeeks,
    pendingWeeks,
    institutions,
    maxInstCount,
    maxClassStreak,
    maxDayStreak,
    avgBestClassStreak: sumBestClass / streakN,
    avgCurrentClassStreak: sumCurrentClass / streakN,
    avgBestDayStreak: sumBestDay / streakN,
    activeClassStreakNow,
    streak3Plus,
    streak0,
    rankings,
    rankingHighlights,
    nationalStudy,
  };
}

export const BUCKET_BAR_CLASS: Record<RateBucket['tone'], string> = {
  rose: 'bg-rose-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-400',
  cyan: 'bg-cyan-400',
  emerald: 'bg-emerald-500',
};
