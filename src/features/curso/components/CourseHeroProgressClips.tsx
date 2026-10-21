'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { CourseStudentMetrics } from '../types/courseTypes';
import { coursePanelStaggerItem, coursePanelTapScale } from '../lib/coursePanelMotion';
import { CoursePanelStagger } from './CoursePanelStagger';
import { buildExcusaDatesForEmail } from '../lib/courseAttendanceExcusas';
import { computeAttendanceStreaks } from '../lib/courseAttendanceStreaks';
import { buildAllDimensionRankings } from '../lib/courseAttendanceRanking';
import { buildCoursePersonKey } from '../lib/courseAccessKeys';
import { buildIdentityFromSessionAsync } from '../lib/courseEntitlements';
import { peekCachedLeaderboardReport } from '../lib/courseAttendanceReportCache';
import { CURSO_SEGUIMIENTO_ICONS } from '../lib/courseSeguimientoIcons';
import { filterVacacionalLiveRecentSessions } from '../lib/courseVacacionalAttendance';
import { formatHoursLabel } from '../lib/courseMeetAttendance';
import { useCourseVacacionalCalendar } from '../context/CourseVacacionalCalendarContext';
import CourseSvgIcon from './CourseSvgIcon';
import StreakFlameIcon from './StreakFlameIcon';

type CourseHeroProgressClipsProps = {
  courseId: string;
  metrics?: CourseStudentMetrics | null;
  metricsLoading?: boolean;
  onOpenSeguimiento: () => void;
};

type HeroClipProps = {
  label: string;
  value: string;
  hint?: string;
  onClick: () => void;
  icon?: LucideIcon;
  iconClass?: string;
  iconSrc?: string;
  streakDayCount?: number;
};

function HeroClip({
  icon: Icon,
  label,
  value,
  hint,
  iconClass = 'text-white/80',
  onClick,
  iconSrc,
  streakDayCount,
}: HeroClipProps) {
  const reduceMotion = useReducedMotion();
  const tap = coursePanelTapScale(reduceMotion);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={coursePanelStaggerItem}
      whileTap={tap}
      data-course-motion
      className="inline-flex min-w-[calc(50%-0.25rem)] flex-1 basis-[calc(50%-0.25rem)] items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-3 py-2 text-left backdrop-blur-sm transition hover:bg-white/22 sm:min-w-[7.5rem] sm:basis-auto"
    >
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
        {streakDayCount !== undefined ? (
          <StreakFlameIcon dayStreak={streakDayCount} size={22} className="h-[22px] w-[22px]" />
        ) : iconSrc ? (
          <CourseSvgIcon src={iconSrc} size={22} className="h-[22px] w-[22px]" />
        ) : Icon ? (
          <Icon className={`h-4 w-4 ${iconClass}`} aria-hidden />
        ) : null}
      </span>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wide text-white/70">{label}</p>
        <p className="text-sm font-black tabular-nums leading-tight text-white">{value}</p>
        {hint ? <p className="text-[10px] text-white/65">{hint}</p> : null}
      </div>
    </motion.button>
  );
}

export default function CourseHeroProgressClips({
  courseId,
  metrics,
  metricsLoading = false,
  onOpenSeguimiento,
}: CourseHeroProgressClipsProps) {
  const calendar = useCourseVacacionalCalendar();
  const attendanceVersion = calendar.attendanceVersion ?? metrics?.attendanceVersion;

  const cachedReport = useMemo(
    () => peekCachedLeaderboardReport(courseId, attendanceVersion),
    [courseId, attendanceVersion],
  );

  const [currentPersonKey, setCurrentPersonKey] = useState<string | null>(null);

  useEffect(() => {
    if (!metrics) return;
    void buildIdentityFromSessionAsync().then((identity) => {
      setCurrentPersonKey(buildCoursePersonKey(identity));
    });
  }, [metrics]);

  const heroRankings = useMemo(() => {
    if (!cachedReport?.rows.length) return null;
    return buildAllDimensionRankings(
      cachedReport.rows,
      cachedReport.weekSchedules,
      cachedReport.excusas,
    );
  }, [cachedReport]);

  const excusaDates = useMemo(
    () => buildExcusaDatesForEmail(cachedReport?.excusas, metrics?.emailLower),
    [cachedReport?.excusas, metrics?.emailLower],
  );

  const streaks = useMemo(() => {
    if (!metrics?.recentSessions?.length) return null;
    return computeAttendanceStreaks(
      filterVacacionalLiveRecentSessions(metrics.recentSessions, metrics.courseId),
      undefined,
      metrics.courseId,
      excusaDates.size ? { excusaDates } : undefined,
    );
  }, [metrics, excusaDates]);

  const attendance = metrics?.attendance;
  const attendancePct =
    attendance && attendance.sessionsTotal > 0
      ? Math.round((attendance.sessionsAttended / attendance.sessionsTotal) * 100)
      : attendance
        ? Math.round(attendance.attendanceRate * 100)
        : null;

  const userRank = useMemo(() => {
    if (!currentPersonKey || !heroRankings?.overall.length) return null;
    const idx = heroRankings.overall.findIndex((e) => e.personKey === currentPersonKey);
    return idx >= 0 ? idx + 1 : null;
  }, [currentPersonKey, heroRankings]);

  const userScore = useMemo(() => {
    if (!currentPersonKey || !heroRankings?.overall.length) return null;
    const entry = heroRankings.overall.find((e) => e.personKey === currentPersonKey);
    return entry?.compositeScore ?? null;
  }, [currentPersonKey, heroRankings]);

  const showSkeleton = metricsLoading && !metrics;
  const hasAnyClip =
    showSkeleton ||
    streaks ||
    attendancePct !== null ||
    userRank !== null;

  if (!hasAnyClip) return null;

  if (showSkeleton) {
    return (
      <div className="flex flex-wrap gap-2" aria-busy="true" aria-label="Cargando tu progreso">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[52px] min-w-[calc(50%-0.25rem)] flex-1 basis-[calc(50%-0.25rem)] rounded-xl border border-white/20 bg-white/10 sm:min-w-[7.5rem] sm:basis-auto"
          />
        ))}
      </div>
    );
  }

  return (
    <CoursePanelStagger className="flex flex-wrap gap-2">
      {streaks ? (
        <>
          <HeroClip
            iconSrc={CURSO_SEGUIMIENTO_ICONS.racha}
            label="Racha clases"
            value={String(streaks.currentClassStreak)}
            hint={`Mejor ${streaks.bestClassStreak}`}
            onClick={onOpenSeguimiento}
          />
          <HeroClip
            label="Racha días"
            value={String(streaks.currentDayStreak)}
            hint={`Mejor ${streaks.bestDayStreak}`}
            streakDayCount={streaks.currentDayStreak}
            onClick={onOpenSeguimiento}
          />
        </>
      ) : null}

      {userRank ? (
        <HeroClip
          icon={Trophy}
          label="Tu puesto"
          value={`#${userRank}`}
          hint={userScore != null ? `${userScore} pts` : undefined}
          iconClass="text-amber-200"
          onClick={onOpenSeguimiento}
        />
      ) : null}

      {attendancePct !== null && attendance ? (
        <HeroClip
          iconSrc={CURSO_SEGUIMIENTO_ICONS.tasaGlobal}
          label="Asistencia"
          value={`${attendancePct}%`}
          hint={`${attendance.sessionsAttended}/${attendance.sessionsTotal} clases`}
          onClick={onOpenSeguimiento}
        />
      ) : null}

      {attendance && attendance.sessionsAttended > 0 ? (
        <HeroClip
          iconSrc={CURSO_SEGUIMIENTO_ICONS.horas}
          label="Horas vivo"
          value={formatHoursLabel(attendance.attendedHours)}
          hint={`de ${formatHoursLabel(attendance.totalHours)}`}
          onClick={onOpenSeguimiento}
        />
      ) : null}
    </CoursePanelStagger>
  );
}
