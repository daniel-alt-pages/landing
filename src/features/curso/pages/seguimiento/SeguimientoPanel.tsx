'use client';

import { useMemo, useState } from 'react';
import { Activity, History, Trophy } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { CURSO_SEGUIMIENTO_ICONS } from '../../lib/courseSeguimientoIcons';
import CoursePanelSectionTransition from '../../components/CoursePanelSectionTransition';
import { COURSE_PANEL_SPRING } from '../../lib/coursePanelMotion';
import SgEmptyState from '@shared/components/SgEmptyState';
import { SgSkeletonCard } from '@shared/components/SgSkeleton';
import type { CourseStudentMetrics } from '../../types/courseTypes';
import { useCourseTheme } from '../../hooks/useCourseTheme';
import { useCourseVacacionalCalendar } from '../../context/CourseVacacionalCalendarContext';
import type { CourseExcusasManifest } from '../../lib/courseAttendanceExcusas';
import { buildExcusaDatesForEmail } from '../../lib/courseAttendanceExcusas';
import { computeAttendanceStreaks } from '../../lib/courseAttendanceStreaks';
import {
  aggregateWeekAttendance,
  buildWeekSchedulesFromCalendar,
  reconcileSessionForHistorial,
  weekCompletedAttendanceRate,
} from '../../lib/courseAttendanceWeek';
import { bogotaWeekRange } from '../../lib/courseVacacionalWeek';
import { filterVacacionalLiveRecentSessions } from '../../lib/courseVacacionalAttendance';
import { formatHoursLabel } from '../../lib/courseMeetAttendance';
import CourseNextClassCountdown from '../../components/CourseNextClassCountdown';
import CourseAttendanceSummary, { type CourseAttendanceSummaryProps } from './components/CourseAttendanceSummary';
import CourseAttendanceRankingPanel from './components/CourseAttendanceRankingPanel';
import { useSeguimientoLeaderboard } from './hooks/useSeguimientoLeaderboard';
import {
  SeguimientoDualMetricClip,
  SeguimientoMetricClip,
  SeguimientoSection,
  SeguimientoStatusClip,
} from './components/SeguimientoClips';
import {
  asistenciaPctSpec,
  clasesAsistidasSpec,
  formatWeekRangeLabel,
  horasEnVivoSpec,
  pluralClases,
  rachaClasesSpec,
} from './lib/seguimientoMetricCopy';
import WeeklyStreakCard from './components/WeeklyStreakCard';
import { seguimientoHeaderAccentClass, seguimientoTabClass } from './lib/seguimientoUi';

type SeguimientoTab = 'resumen' | 'ranking' | 'historial';

type SeguimientoPanelProps = CourseAttendanceSummaryProps & {
  courseId?: string;
};

const TAB_ITEMS: { id: SeguimientoTab; label: string; icon: typeof Activity }[] = [
  { id: 'resumen', label: 'Mi resumen', icon: Activity },
  { id: 'ranking', label: 'Ranking', icon: Trophy },
  { id: 'historial', label: 'Historial', icon: History },
];

function SeguimientoResumen({
  metrics,
  excusas,
}: {
  metrics: CourseStudentMetrics;
  excusas?: CourseExcusasManifest | null;
}) {
  const excusaDates = useMemo(
    () => buildExcusaDatesForEmail(excusas, metrics.emailLower),
    [excusas, metrics.emailLower],
  );
  const streakOpts = excusaDates.size ? { excusaDates } : undefined;
  const calendar = useCourseVacacionalCalendar();
  const streaks = useMemo(
    () =>
      computeAttendanceStreaks(
        filterVacacionalLiveRecentSessions(metrics.recentSessions, metrics.courseId),
        undefined,
        metrics.courseId,
        streakOpts,
      ),
    [metrics.recentSessions, metrics.courseId, streakOpts],
  );
  const { attendance, recentSessions } = metrics;
  const pct = Math.round((attendance.attendanceRate || 0) * 100);
  const completed = attendance.sessionsCompleted ?? attendance.sessionsTotal;
  const attendedHoursLabel = formatHoursLabel(attendance.attendedHours);
  const totalHoursLabel = formatHoursLabel(attendance.totalHours);

  // Tasa de la semana en curso (lun–dom Bogotá) sobre clases ya dictadas.
  const weekRange = useMemo(() => bogotaWeekRange(), []);
  const weekSchedule = useMemo(() => {
    if (!calendar.enabled || !calendar.events.length) return undefined;
    return buildWeekSchedulesFromCalendar(
      calendar.events,
      [weekRange],
      metrics.courseId,
    )[0];
  }, [calendar.enabled, calendar.events, metrics.courseId, weekRange]);
  const weekStats = useMemo(() => {
    return aggregateWeekAttendance(
      filterVacacionalLiveRecentSessions(metrics.recentSessions, metrics.courseId),
      weekRange,
      weekSchedule,
    );
  }, [metrics.recentSessions, metrics.courseId, weekRange, weekSchedule]);
  const weekPct = Math.round(weekCompletedAttendanceRate(weekStats) * 100);
  const weekHoursLabel = formatHoursLabel(weekStats.attendedHours);
  const weekLabel = formatWeekRangeLabel(weekRange.start, weekRange.end);
  const classStreakLabel = pluralClases(streaks.currentClassStreak);
  return (
    <div className="space-y-4">
      <WeeklyStreakCard
        recentSessions={metrics.recentSessions}
        courseId={metrics.courseId}
        excusaDates={excusaDates}
      />

      <SeguimientoSection
        title="Tu asistencia y rachas"
        subtitle="Solo cuentan las clases que ya pasaron"
        accent="violet"
      >
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-2">
          <SeguimientoMetricClip
            streakDayCount={streaks.currentClassStreak}
            labelTitle="Racha sin faltar a clase"
            labelSpec={rachaClasesSpec(streaks.bestClassStreak)}
            value={classStreakLabel}
            tone="orange"
          />
          <SeguimientoMetricClip
            iconSrc={CURSO_SEGUIMIENTO_ICONS.horas}
            labelTitle="Tiempo en clase en vivo"
            labelSpec={horasEnVivoSpec(
              totalHoursLabel,
              streaks.currentDayStreak,
              streaks.bestDayStreak,
            )}
            value={attendedHoursLabel}
            tone="accent"
          />
          <SeguimientoMetricClip
            iconSrc={CURSO_SEGUIMIENTO_ICONS.clasesProgramadas}
            labelTitle="Clases a las que llegaste"
            labelSpec={clasesAsistidasSpec(
              attendance.sessionsPresent ?? 0,
              attendance.sessionsPartial ?? 0,
              attendance.sessionsAbsent ?? 0,
              attendance.sessionsUpcoming ?? 0,
              completed,
            )}
            value={`${attendance.sessionsAttended} de ${completed}`}
            tone="violet"
          />
          <SeguimientoDualMetricClip
            iconSrc={CURSO_SEGUIMIENTO_ICONS.tasaGlobal}
            labelTitle="Porcentaje de asistencia"
            labelSpec={asistenciaPctSpec(
              weekLabel,
              weekHoursLabel,
              weekStats.sessionsCompleted > 0,
            )}
            primary={{
              shortLabel: 'Esta semana',
              value: weekStats.sessionsCompleted > 0 ? `${weekPct}%` : '—',
            }}
            secondary={{
              shortLabel: 'Todo el curso',
              value: `${pct}%`,
            }}
            tone="violet"
          />
        </div>
      </SeguimientoSection>

      {(attendance.sessionsPresent !== undefined ||
        attendance.sessionsPartial !== undefined) && (
        <SeguimientoSection
          title="Estado de tus clases"
          subtitle="Según el reporte de Google Meet"
          accent="accent"
        >
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            <SeguimientoStatusClip
              iconSrc={CURSO_SEGUIMIENTO_ICONS.asistenciasCompletas}
              labelTitle="Asistencia completa"
              labelSpec="Llegaste el tiempo que cuenta"
              value={attendance.sessionsPresent ?? 0}
              tone="success"
            />
            <SeguimientoStatusClip
              iconSrc={CURSO_SEGUIMIENTO_ICONS.asistenciasParciales}
              labelTitle="Conexión corta"
              labelSpec="Entraste, pero poco tiempo"
              value={attendance.sessionsPartial ?? 0}
              tone="warn"
            />
            <SeguimientoStatusClip
              iconSrc={CURSO_SEGUIMIENTO_ICONS.ausencia}
              labelTitle="No asististe"
              labelSpec="No apareciste en la lista"
              value={attendance.sessionsAbsent ?? 0}
              tone="danger"
            />
            <SeguimientoStatusClip
              iconSrc={CURSO_SEGUIMIENTO_ICONS.proximasClases}
              labelTitle="Por venir"
              labelSpec="Aún no empiezan"
              value={attendance.sessionsUpcoming ?? 0}
              tone="accent"
            />
          </div>
        </SeguimientoSection>
      )}

      {recentSessions?.length ? (
        <CourseNextClassCountdown sessions={recentSessions} />
      ) : null}
    </div>
  );
}

export default function SeguimientoPanel({
  metrics,
  loading,
  error,
  studentName,
  courseId = 'preicfes-sg26',
}: SeguimientoPanelProps) {
  const [tab, setTab] = useState<SeguimientoTab>('resumen');
  const reduceMotion = useReducedMotion();
  const { dark } = useCourseTheme();
  const calendar = useCourseVacacionalCalendar();

  const leaderboard = useSeguimientoLeaderboard(
    courseId,
    tab === 'ranking' && Boolean(metrics),
    {
      calendarEvents: calendar.enabled ? calendar.events : undefined,
      attendanceVersion: calendar.attendanceVersion ?? metrics?.attendanceVersion,
    },
  );

  if (loading) return <SgSkeletonCard lines={6} />;

  if (!metrics) {
    return (
      <SgEmptyState
        icon={Activity}
        title={error ? 'No pudimos cargar tu asistencia' : 'Seguimiento pendiente'}
        message={
          error ||
          (studentName
            ? `Cuando publiquemos las listas de Meet, verás tus horas aquí, ${studentName}.`
            : 'Tu asistencia se publicará cuando el equipo procese los registros.')
        }
      />
    );
  }

  const completedFromSessions = filterVacacionalLiveRecentSessions(
    metrics.recentSessions,
    metrics.courseId,
  )
    .map((s) => reconcileSessionForHistorial(s))
    .filter((s) => s.status && s.status !== 'upcoming' && s.status !== 'live-soon').length;
  const claseCount = Math.max(metrics.attendance.sessionsCompleted ?? 0, completedFromSessions);

  return (
    <div className="space-y-4">
      {tab !== 'ranking' ? (
        <motion.header
          data-course-motion
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0.01 } : COURSE_PANEL_SPRING}
          className={`rounded-[var(--course-radius-lg)] border px-3 py-3 sm:px-4 ${
            dark
              ? 'border-violet-500/25 bg-violet-600/10'
              : 'border-violet-200 bg-violet-50/80'
          }`}
        >
          <p
            className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide ${seguimientoHeaderAccentClass(dark)}`}
          >
            <Activity className="h-3 w-3" aria-hidden />
            Seguimiento
          </p>
          <p className="mt-0.5 text-sm font-bold text-[var(--course-text)]">
            {metrics.displayName || studentName || 'Tu progreso'}
          </p>
          <p className="text-[11px] text-[var(--course-text-muted)]">{claseCount} clases con registro</p>
        </motion.header>
      ) : null}

      <nav
        className={`flex gap-1 overflow-x-auto rounded-lg border p-0.5 ${
          dark
            ? 'border-[var(--course-border)] bg-[var(--course-surface-muted)]/50'
            : 'border-[var(--course-border)] bg-[var(--course-surface-muted)]/70'
        }`}
        aria-label="Secciones de seguimiento"
      >
        {TAB_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`relative ${seguimientoTabClass(active, dark)} ${
                active ? '!bg-transparent !text-white !shadow-none !ring-0' : ''
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {active ? (
                <motion.span
                  layoutId="seguimiento-sub-tab-pill"
                  data-course-motion
                  className="absolute inset-0 -z-10 rounded-md bg-[var(--course-accent)] shadow-sm"
                  transition={COURSE_PANEL_SPRING}
                />
              ) : null}
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </button>
          );
        })}
      </nav>

      <CoursePanelSectionTransition sectionKey={tab}>
        {tab === 'resumen' ? (
          <SeguimientoResumen metrics={metrics} excusas={leaderboard.report?.excusas} />
        ) : null}

        {tab === 'ranking' ? (
          <CourseAttendanceRankingPanel leaderboard={leaderboard} />
        ) : null}

        {tab === 'historial' ? (
          <CourseAttendanceSummary
            metrics={metrics}
            loading={false}
            error={null}
            studentName={studentName}
            historyOnly
            dark={dark}
          />
        ) : null}
      </CoursePanelSectionTransition>
    </div>
  );
}
