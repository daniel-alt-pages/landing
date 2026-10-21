'use client';

import { useMemo } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { useCourseVacacionalCalendar } from '../context/CourseVacacionalCalendarContext';
import { formatAcademicWeekNavLabel, formatWeekHeading } from '../lib/courseVacacionalWeek';
import { isVacacionalLiveClassEvent } from '../lib/courseVacacionalAttendance';
import {
  vacacionalEventDayKey,
  vacacionalEventStartDate,
  vacacionalClassPhase,
  formatCountdownToClassStart,
} from '../lib/courseVacacionalEventTime';
import type { CourseRecording } from '../types/courseTypes';
import CourseVacacionalWeekView from './CourseVacacionalWeekView';
import { useSecondTick } from '../hooks/useSecondTick';

function formatSyncLabel(
  lastSyncedAt: number | null,
  syncing: boolean,
  runtimeVersion: number | null,
  dataSource: 'live' | 'static' | null,
): string {
  if (syncing) return 'Sincronizando con Firebase…';
  if (!lastSyncedAt) return 'Sin sincronizar';
  const mins = Math.floor((Date.now() - lastSyncedAt) / 60_000);
  const ago =
    mins < 1 ? 'ahora' : mins === 1 ? 'hace 1 min' : `hace ${mins} min`;
  const version = runtimeVersion != null ? ` · v${runtimeVersion}` : '';
  const source = dataSource === 'static' ? ' · respaldo local' : ' · Firebase';
  return `Sincronizado ${ago}${version}${source}`;
}

type CourseCalendarEventsPanelProps = {
  title?: string;
  subtitle?: string;
  catalogRecordings?: CourseRecording[];
  courseId?: string;
  onOpenGrabacionesTab?: (recordingId?: string) => void;
};

export default function CourseCalendarEventsPanel({
  title = 'Clases del vacacional',
  subtitle = 'Semanas del horario vacacional (08 jun – 26 jul)',
  catalogRecordings = [],
  courseId,
  onOpenGrabacionesTab,
}: CourseCalendarEventsPanelProps) {
  const {
    enabled,
    bounds,
    weeks,
    weekIndex,
    week,
    goPrevWeek,
    goNextWeek,
    goToTodayWeek,
    events,
    loading,
    syncing,
    error,
    needsAuth,
    lastSyncedAt,
    runtimeVersion,
    dataSource,
    reload,
  } = useCourseVacacionalCalendar();

  const weekNavLabel =
    'weekNumber' in week && 'label' in week
      ? formatAcademicWeekNavLabel(
          week as { start: string; end: string; keys: string[]; weekNumber: number; label: string },
          weeks.length,
        )
      : `Semana ${weekIndex + 1} de ${weeks.length} · ${formatWeekHeading(week.start, week.end)}`;
  const courseSpanLabel = formatWeekHeading(bounds.start, bounds.end);
  const syncLabel = useMemo(
    () => formatSyncLabel(lastSyncedAt, syncing, runtimeVersion, dataSource),
    [lastSyncedAt, syncing, runtimeVersion, dataSource],
  );
  const weekScheduledCount = useMemo(() => {
    const weekDays = new Set(week.keys);
    return events.filter(
      (event) =>
        weekDays.has(vacacionalEventDayKey(event)) &&
        isVacacionalLiveClassEvent(event, courseId),
    ).length;
  }, [events, week.keys, courseId]);

  const now = useSecondTick(!loading);

  const nextUpcomingEvent = useMemo(() => {
    const upcoming = events
      .filter((e) => {
        const phase = vacacionalClassPhase(e, now);
        return phase === 'upcoming' || phase === 'starting-soon';
      })
      .sort((a, b) => {
        const ta = vacacionalEventStartDate(a)?.getTime() ?? 0;
        const tb = vacacionalEventStartDate(b)?.getTime() ?? 0;
        return ta - tb;
      });
    return upcoming[0] ?? null;
  }, [events, now]);

  const nextClassCountdownLabel = useMemo(() => {
    if (!nextUpcomingEvent) return null;
    const start = vacacionalEventStartDate(nextUpcomingEvent);
    if (!start) return null;
    return formatCountdownToClassStart(start, now);
  }, [nextUpcomingEvent, now]);

  if (!enabled) return null;

  const atFirstWeek = weekIndex <= 0;
  const atLastWeek = weekIndex >= weeks.length - 1;

  return (
    <section aria-labelledby="course-calendar-api-heading" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id="course-calendar-api-heading" className="text-base font-bold text-[var(--course-text)]">
            {title}
          </h3>
          <p className="mt-0.5 text-sm text-[var(--course-text-muted)]">{subtitle}</p>
          <p className="mt-1 text-xs font-medium text-[var(--course-text-muted)]">Curso: {courseSpanLabel}</p>
          <p className="mt-0.5 text-xs font-semibold capitalize text-[var(--course-accent)]">{weekNavLabel}</p>
          <p className="mt-0.5 text-xs font-medium text-[var(--course-text-muted)]">
            {weekScheduledCount === 1
              ? '1 clase programada esta semana'
              : `${weekScheduledCount} clases programadas esta semana`}
          </p>
          <p className="mt-1 text-[11px] text-[var(--course-text-muted)]" aria-live="polite">
            {syncLabel}
            {syncing ? (
              <Loader2 className="ml-1 inline h-3 w-3 animate-spin align-[-2px]" aria-hidden />
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-[var(--course-border)] bg-[var(--course-surface)] p-1">
            <button
              type="button"
              onClick={goPrevWeek}
              disabled={atFirstWeek}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--course-text-muted)] transition hover:bg-[var(--course-surface-muted)] hover:text-[var(--course-text)] disabled:opacity-40"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={goToTodayWeek}
              className="inline-flex min-h-8 items-center rounded-lg bg-[var(--course-accent-soft)] px-2.5 text-[11px] font-semibold text-[var(--course-accent)] transition hover:brightness-105 sm:text-xs"
            >
              Semana actual
            </button>
            <button
              type="button"
              onClick={goNextWeek}
              disabled={atLastWeek}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--course-text-muted)] transition hover:bg-[var(--course-surface-muted)] hover:text-[var(--course-text)] disabled:opacity-40"
              aria-label="Semana siguiente"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <button
            type="button"
            onClick={() => void reload()}
            disabled={syncing}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[var(--course-border)] bg-[var(--course-surface)] px-3 py-2 text-sm font-semibold text-[var(--course-text)] transition hover:border-[var(--course-accent)] hover:text-[var(--course-accent)] disabled:opacity-60"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            Actualizar
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-[var(--course-text)]">
          <p className="font-semibold">Calendario vacacional no disponible</p>
          <p className="mt-1">{error}</p>
          {needsAuth ? (
            <p className="mt-2 text-xs">
              Ejecuta <code className="rounded bg-amber-500/15 px-1 text-[var(--course-text)]">npm run dev</code> (incluye
              calendar-api :3099) o solo{' '}
              <code className="rounded bg-amber-500/15 px-1 text-[var(--course-text)]">npm run dev:calendar-api</code>.
            </p>
          ) : null}
        </div>
      ) : null}

      {!error ? (
        <>
          {nextUpcomingEvent && nextClassCountdownLabel ? (
            <div
              className="flex items-center gap-3 rounded-2xl border border-[var(--course-accent)]/30 bg-gradient-to-r from-[var(--course-accent)]/10 via-[var(--course-accent-soft)] to-[var(--course-accent)]/10 px-4 py-3"
              role="status"
              aria-live="polite"
            >
              <CalendarClock className="h-5 w-5 shrink-0 text-[var(--course-accent)]" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--course-text-muted)]">
                  Próxima clase
                </p>
                <p className="truncate text-sm font-bold text-[var(--course-text)]">
                  {nextUpcomingEvent.summary || 'Clase programada'}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[var(--course-accent)] px-3 py-1 text-xs font-bold text-white tabular-nums">
                {nextClassCountdownLabel}
              </span>
            </div>
          ) : null}
          <CourseVacacionalWeekView
            weekKeys={week.keys}
            events={events}
            loading={loading}
            catalogRecordings={catalogRecordings}
            courseId={courseId}
            onOpenGrabacionesTab={onOpenGrabacionesTab}
          />
        </>
      ) : null}
    </section>
  );
}
