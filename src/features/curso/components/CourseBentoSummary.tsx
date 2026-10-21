'use client';

import { useMemo } from 'react';
import { CalendarClock } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { CURSO_RESUMEN_ICONS } from '../lib/courseSeguimientoIcons';
import CourseDashboardClip from './CourseDashboardClip';
import { CoursePanelStagger, CoursePanelStaggerItem } from './CoursePanelStagger';
import { COURSE_PANEL_SPRING } from '../lib/coursePanelMotion';
import SgCard from '@shared/components/SgCard';
import type { CourseDoc, CourseSectionTab, CourseStudentMetrics } from '../types/courseTypes';
import { useCourseReminders } from '../hooks/useCourseReminders';
import { useCourseVacacionalCalendar } from '../context/CourseVacacionalCalendarContext';
import { peekCachedCalendarEvents } from '../lib/courseRuntimeFirestore';
import CourseHeroNextClassPanel from './CourseHeroNextClassPanel';
import CourseHeroProgressClips from './CourseHeroProgressClips';
import { useCourseStudentMaterials } from '../hooks/useCourseStudentMaterials';
import { computeCourseScheduleStats } from '../lib/courseDashboardStats';
import {
  firstNameFromDisplayName,
  resolveDashboardUpcomingSessions,
} from '../lib/courseDashboardUpcoming';
import { countVisibleMaterials } from '../lib/mergeCourseMaterials';
import { mergeVacacionalRecordingsCatalog } from '../lib/courseVacacionalRecordings';
import {
  courseDashboardSectionDesc,
  courseDashboardSectionTitle,
} from '../lib/courseMetricClipUi';
import { formatHoursLabel } from '../lib/courseMeetAttendance';
import {
  bogotaTodayKey,
} from '../lib/courseVacacionalWeek';
import {
  vacacionalEventStartDate,
  vacacionalEventDayKey,
  vacacionalClassPhase,
  formatCountdownToClassStart,
} from '../lib/courseVacacionalEventTime';
import { useSecondTick } from '../hooks/useSecondTick';

type CourseBentoSummaryProps = {
  course: CourseDoc;
  metrics?: CourseStudentMetrics | null;
  metricsLoading?: boolean;
  studentName?: string | null;
  onOpenTab: (tab: CourseSectionTab, opts?: { recordingId?: string }) => void;
};

function formatCourseDates(course: CourseDoc): string | null {
  if (!course.courseStartDate && !course.courseEndDate) return null;
  const fmt = (iso: string) => {
    const d = new Date(`${iso}T12:00:00`);
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  };
  if (course.courseStartDate && course.courseEndDate) {
    return `${fmt(course.courseStartDate)} – ${fmt(course.courseEndDate)}`;
  }
  return course.courseStartDate ? `Desde ${fmt(course.courseStartDate)}` : null;
}

export default function CourseBentoSummary({
  course,
  metrics,
  metricsLoading = false,
  studentName,
  onOpenTab,
}: CourseBentoSummaryProps) {
  const reduceMotion = useReducedMotion();
  const calendar = useCourseVacacionalCalendar();
  const cachedCalendarEvents = peekCachedCalendarEvents(course.id);
  const calendarEvents =
    calendar.events.length > 0 ? calendar.events : cachedCalendarEvents;
  const calendarEnabled = calendar.enabled || calendarEvents.length > 0;
  const { upcoming: linkUpcoming, countdown: linkCountdown, formatWhen } = useCourseReminders(
    course.classLinks,
  );

  const displayName = metrics?.displayName || studentName || null;
  const firstName = firstNameFromDisplayName(displayName);
  const courseDates = formatCourseDates(course);

  const upcomingSessions = useMemo(
    () =>
      resolveDashboardUpcomingSessions(metrics, calendarEvents, calendarEnabled),
    [metrics, calendarEvents, calendarEnabled],
  );

  const scheduleStats = useMemo(
    () => computeCourseScheduleStats(calendarEvents, undefined, course.id),
    [calendarEvents, course.id],
  );

  const { materials: studentMaterials, loading: materialsLoading } = useCourseStudentMaterials(
    course.id,
  );
  const materialsCount = useMemo(
    () => countVisibleMaterials(course.materials, studentMaterials),
    [course.materials, studentMaterials],
  );
  const compiladosCount = useMemo(() => {
    const merged = [...studentMaterials, ...course.materials];
    return merged.filter(
      (m) => m.visible !== false && m.kind === 'pdf' && (m.id || m.url),
    ).length;
  }, [course.materials, studentMaterials]);

  const recordingsCount = useMemo(() => {
    const events =
      calendarEnabled && calendarEvents.length ? calendarEvents : [];
    return mergeVacacionalRecordingsCatalog(course.recordings, events, course.id).filter(
      (r) => r.visibleToStudents !== false,
    ).length;
  }, [course.recordings, course.id, calendarEnabled, calendarEvents]);
  const attendance = metrics?.attendance;
  const attendancePct =
    attendance && attendance.sessionsTotal > 0
      ? Math.round((attendance.sessionsAttended / attendance.sessionsTotal) * 100)
      : attendance
        ? Math.round(attendance.attendanceRate * 100)
        : null;

  const syncLabel = calendar.syncing
    ? 'Actualizando calendario…'
    : calendar.lastSyncedAt
      ? `Calendario · ${new Date(calendar.lastSyncedAt).toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
        })}`
      : calendarEvents.length
        ? 'Calendario en caché'
        : calendar.loading
          ? 'Cargando calendario…'
          : null;

  const now = useSecondTick(calendarEnabled && calendarEvents.length > 0);
  const todayKey = bogotaTodayKey(new Date(now));

  const todayUpcomingClasses = useMemo(() => {
    return calendarEvents
      .filter((e) => {
        if (vacacionalEventDayKey(e) !== todayKey) return false;
        const phase = vacacionalClassPhase(e, now);
        return phase === 'upcoming' || phase === 'starting-soon' || phase === 'live';
      })
      .sort((a, b) => {
        const ta = vacacionalEventStartDate(a)?.getTime() ?? 0;
        const tb = vacacionalEventStartDate(b)?.getTime() ?? 0;
        return ta - tb;
      });
  }, [calendarEvents, todayKey, now]);

  return (
    <div className="space-y-5">
      <motion.section
        data-course-motion
        initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.992 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduceMotion ? { duration: 0.01 } : COURSE_PANEL_SPRING}
        className="relative overflow-hidden rounded-3xl border border-[var(--course-border-strong)] bg-gradient-to-br from-[var(--course-accent)] via-indigo-600 to-[var(--course-accent-2)] p-5 text-white shadow-[var(--course-shadow-lg)] sm:p-7"
      >
        {course.hero.coverImageUrl ? (
          <div
            className="pointer-events-none absolute inset-0 opacity-15"
            style={{
              backgroundImage: `url(${course.hero.coverImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            aria-hidden
          />
        ) : null}
        <div className="relative z-[1] grid gap-5 lg:grid-cols-[1fr_minmax(0,280px)] lg:items-start">
          <div className="flex min-w-0 flex-col gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/75">
                {course.hero.badge || course.audienceLabel || 'Mi curso'}
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                {firstName ? `Hola, ${firstName}` : course.hero.title || course.name}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
                {course.hero.subtitle || course.name}
                {courseDates ? ` · ${courseDates}` : ''}
              </p>
              {syncLabel ? (
                <p className="mt-2 text-[11px] font-medium text-white/70">{syncLabel}</p>
              ) : null}
            </div>
            <CourseHeroProgressClips
              courseId={course.id}
              metrics={metrics}
              metricsLoading={metricsLoading}
              onOpenSeguimiento={() => onOpenTab('seguimiento')}
            />
          </div>

          <CourseHeroNextClassPanel
            upcomingSessions={upcomingSessions}
            calendarEvents={calendarEvents}
            linkUpcoming={linkUpcoming}
            formatWhen={formatWhen}
            pendingClassCount={scheduleStats.upcoming}
            onOpenTab={onOpenTab}
          />
        </div>
      </motion.section>

      {calendarEnabled && todayUpcomingClasses.length > 0 ? (
        <motion.section
          data-course-motion
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={reduceMotion ? { duration: 0.01 } : COURSE_PANEL_SPRING}
          aria-labelledby="today-classes-heading"
          className="relative overflow-hidden rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 shadow-lg sm:p-5"
        >
          <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.25) 0%, transparent 65%)' }} aria-hidden />
          <div className="relative z-[1] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 id="today-classes-heading" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-200">
                <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
                {todayUpcomingClasses.length === 1 ? 'Tu clase de hoy' : `Tus clases de hoy (${todayUpcomingClasses.length})`}
              </h2>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/70">
                {todayKey}
              </span>
            </div>
            <div className={`grid gap-3 ${todayUpcomingClasses.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {todayUpcomingClasses.map((event) => {
                const start = vacacionalEventStartDate(event);
                const phase = vacacionalClassPhase(event, now);
                const countdownLabel = start
                  ? phase === 'live' || phase === 'starting-soon'
                    ? 'En vivo ahora'
                    : formatCountdownToClassStart(start, now)
                  : null;
                const isLive = phase === 'live' || phase === 'starting-soon';
                return (
                  <div
                    key={event.id}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                      isLive
                        ? 'border-emerald-400/40 bg-emerald-500/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-white">
                        {event.summary || 'Clase programada'}
                      </p>
                      {start ? (
                        <p className="mt-0.5 text-[10px] text-white/60">
                          {start.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })}
                        </p>
                      ) : null}
                    </div>
                    {countdownLabel ? (
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums ${
                          isLive
                            ? 'animate-pulse bg-emerald-400 text-emerald-950'
                            : 'bg-indigo-500/30 text-indigo-200'
                        }`}
                      >
                        {countdownLabel}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>
      ) : null}

      {!upcomingSessions.length ? (
        linkUpcoming ? (
          <SgCard interactive onClick={() => onOpenTab('clases')} padding="md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--course-text-muted)]">
                  Próxima clase
                </p>
                <p className="mt-2 text-lg font-bold text-[var(--course-text)]">
                  {linkUpcoming.link.label}
                </p>
                <p className="mt-1 text-xs text-[var(--course-text-muted)]">
                  {formatWhen(linkUpcoming.startsAt)}
                </p>
              </div>
              <CalendarClock className="h-5 w-5 shrink-0 text-[var(--course-accent)]" aria-hidden />
            </div>
            {linkCountdown ? (
              <p className="mt-3 inline-flex rounded-full bg-[var(--course-accent-soft)] px-3 py-1 text-xs font-bold text-[var(--course-accent)]">
                {linkCountdown.label}
              </p>
            ) : null}
          </SgCard>
        ) : calendar.loading && !calendar.events.length ? (
          <SgCard padding="md" className="border-dashed">
            <p className="text-sm text-[var(--course-text-muted)]">Cargando clases programadas…</p>
          </SgCard>
        ) : (
          <SgCard padding="md" className="border-dashed">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--course-text-muted)]">
              Próximas clases
            </p>
            <p className="mt-2 text-sm text-[var(--course-text)]">
              {calendar.error
                ? calendar.error
                : 'No hay clases próximas visibles en tu calendario ahora mismo.'}
            </p>
            <button
              type="button"
              onClick={() => onOpenTab('clases')}
              className="mt-3 text-sm font-semibold text-[var(--course-accent)] hover:underline"
            >
              Ver calendario de clases →
            </button>
          </SgCard>
        )
      ) : null}

      <section className="space-y-4">
        <div>
          <h3 className={courseDashboardSectionTitle}>Todo en un lugar</h3>
          <p className={courseDashboardSectionDesc}>
            Clases, grabaciones, materiales y tu progreso en el vacacional
          </p>
        </div>

        <CoursePanelStagger className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 lg:gap-3">
          {scheduleStats.total > 0 ? (
            <CoursePanelStaggerItem>
              <CourseDashboardClip
                title="Clases del vacacional"
                description={`${scheduleStats.upcoming} por venir y ${scheduleStats.completed} ya pasaron. Abre el calendario y enlaces de clase.`}
                footer={String(scheduleStats.total)}
                iconSrc={CURSO_RESUMEN_ICONS.clasesEnVivo}
                tone="violet"
                onClick={() => onOpenTab('clases')}
              />
            </CoursePanelStaggerItem>
          ) : null}

          {attendancePct !== null && attendance ? (
            <CoursePanelStaggerItem>
              <CourseDashboardClip
                title="Asistencia en vivo"
                description={`Llevas ${attendance.sessionsAttended} de ${attendance.sessionsTotal} clases y ${formatHoursLabel(attendance.attendedHours)} de ${formatHoursLabel(attendance.totalHours)} en vivo.`}
                footer={`${attendancePct}%`}
                iconSrc={CURSO_RESUMEN_ICONS.asistencia}
                tone="accent"
                onClick={() => onOpenTab('seguimiento')}
              />
            </CoursePanelStaggerItem>
          ) : metricsLoading && scheduleStats.total > 0 ? (
            <CoursePanelStaggerItem>
              <CourseDashboardClip
                title="Asistencia en vivo"
                description="Estamos calculando tus horas y clases registradas."
                footer="…"
                iconSrc={CURSO_RESUMEN_ICONS.asistencia}
                tone="accent"
                onClick={() => onOpenTab('seguimiento')}
              />
            </CoursePanelStaggerItem>
          ) : null}

          <CoursePanelStaggerItem>
            <CourseDashboardClip
              title="Grabaciones"
              description="Repasa las clases del vacacional cuando quieras, desde tu panel."
              footer={String(recordingsCount)}
              iconSrc={CURSO_RESUMEN_ICONS.grabaciones}
              tone="violet"
              onClick={() => onOpenTab('grabaciones')}
            />
          </CoursePanelStaggerItem>

          <CoursePanelStaggerItem>
            <CourseDashboardClip
              title="Materiales"
              description={
                materialsLoading
                  ? 'Cargando tus compilados y archivos del curso…'
                  : compiladosCount > 0
                    ? `${compiladosCount} compilados en Drive más tu carpeta personal de apuntes.`
                    : 'Compilados PDF y carpeta personal en Google Drive.'
              }
              footer={materialsLoading ? '…' : String(materialsCount)}
              iconSrc={CURSO_RESUMEN_ICONS.materiales}
              tone="accent"
              onClick={() => onOpenTab('materiales')}
            />
          </CoursePanelStaggerItem>

          <CoursePanelStaggerItem>
            <CourseDashboardClip
              title="Seguimiento"
              description={
                attendance
                  ? `Ranking del curso, puntos y rachas. Llevas ${attendance.sessionsAttended} de ${attendance.sessionsTotal} clases.`
                  : 'Ranking, puntos, rachas y detalle de tu asistencia.'
              }
              footer={attendancePct !== null ? `${attendancePct}%` : 'Ver'}
              footerKind={attendancePct !== null ? 'metric' : 'action'}
              iconSrc={CURSO_RESUMEN_ICONS.seguimiento}
              tone="accent"
              onClick={() => onOpenTab('seguimiento')}
            />
          </CoursePanelStaggerItem>
        </CoursePanelStagger>
      </section>
    </div>
  );
}
