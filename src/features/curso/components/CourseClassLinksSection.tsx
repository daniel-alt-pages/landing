'use client';

import { useMemo } from 'react';
import { Calendar, CalendarPlus, ExternalLink } from 'lucide-react';
import CourseCalendarEventsPanel from './CourseCalendarEventsPanel';
import SgEmptyState from '@shared/components/SgEmptyState';
import type { CourseClassLink, CourseCalendarProgram, CourseRecording } from '../types/courseTypes';
import { buildCalendarEmbedUrl } from '../lib/courseCalendarEmbed';
import { downloadClassIcs, useCourseReminders } from '../hooks/useCourseReminders';

type CourseClassLinksSectionProps = {
  classLinks: CourseClassLink[];
  calendarEmbedUrl?: string;
  calendarProgram?: CourseCalendarProgram;
  calendarTitle?: string;
  calendarSubtitle?: string;
  catalogRecordings?: CourseRecording[];
  courseId?: string;
  onOpenGrabacionesTab?: (recordingId?: string) => void;
};

function formatStartsAt(value: CourseClassLink['startsAt']): string {
  if (!value) return '';
  const date =
    typeof value === 'object' && value !== null && 'toDate' in value
      ? (value as { toDate: () => Date }).toDate()
      : new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CourseClassLinksSection({
  classLinks,
  calendarEmbedUrl,
  calendarProgram,
  calendarTitle = 'Calendario de clases',
  calendarSubtitle = 'Horarios del curso · zona horaria Colombia',
  catalogRecordings = [],
  courseId,
  onOpenGrabacionesTab,
}: CourseClassLinksSectionProps) {
  const useVacacionalList = calendarProgram === 'vacacional';
  const hasCalendar = Boolean(calendarEmbedUrl?.trim());
  const visibleLinks = classLinks.filter((l) => l.visible !== false);
  const { upcoming, countdown, formatWhen } = useCourseReminders(classLinks);

  const embedSrc = useMemo(() => {
    if (!calendarEmbedUrl) return '';
    return buildCalendarEmbedUrl(calendarEmbedUrl, { view: 'WEEK' });
  }, [calendarEmbedUrl]);

  if (!hasCalendar && !visibleLinks.length) {
    return (
      <SgEmptyState
        icon={Calendar}
        title="Sin clases programadas"
        message="Los enlaces de clase aparecerán aquí cuando el equipo los publique."
      />
    );
  }

  return (
    <div className="space-y-6">
      {upcoming ? (
        <section
          aria-label="Próxima clase"
          className="rounded-[var(--course-radius-lg)] border border-[var(--course-border)] bg-[var(--course-surface)] p-4 shadow-sm sm:p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--course-text-muted)]">
                Próxima clase
              </p>
              <h2 className="mt-1 text-lg font-bold text-[var(--course-text)]">
                {upcoming.link.label}
              </h2>
              <p className="mt-1 text-sm text-[var(--course-text-muted)]">
                {formatWhen(upcoming.startsAt)}
              </p>
              {countdown ? (
                <p className="mt-2 inline-flex rounded-full bg-[var(--course-accent-soft)] px-3 py-1 text-xs font-bold text-[var(--course-accent)]">
                  {countdown.label}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => downloadClassIcs(upcoming.link, upcoming.startsAt)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)] px-4 py-2.5 text-sm font-semibold text-[var(--course-text)] hover:border-[var(--course-accent)]"
              >
                <CalendarPlus className="h-4 w-4" aria-hidden />
                Agregar al calendario
              </button>
              {upcoming.link.url ? (
                <a
                  href={upcoming.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--course-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  Abrir clase
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
      {hasCalendar ? (
        <section aria-labelledby="course-calendar-heading">
          <div className="mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="course-calendar-heading" className="text-lg font-bold text-[var(--course-text)]">
                {calendarTitle}
              </h2>
              {calendarProgram === 'vacacional' ? (
                <span className="rounded-full bg-[var(--course-accent-soft)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--course-accent)]">
                  Solo vacacional
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-sm text-[var(--course-text-muted)]">{calendarSubtitle}</p>
          </div>

          {useVacacionalList ? (
            <CourseCalendarEventsPanel
              title="Clases del vacacional"
              subtitle="Modo semana · hoy resaltado · Meet por área"
              catalogRecordings={catalogRecordings}
              courseId={courseId}
              onOpenGrabacionesTab={onOpenGrabacionesTab}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[var(--course-border)] bg-[var(--course-surface)] shadow-[var(--course-shadow)] ring-1 ring-[var(--course-border)]">
              <iframe
                src={embedSrc}
                title={calendarTitle}
                className="h-[min(72vh,680px)] w-full border-0 bg-[var(--course-surface)]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </section>
      ) : null}

      {visibleLinks.length ? (
        <section aria-labelledby="course-class-links-heading">
          {hasCalendar ? (
            <h2 id="course-class-links-heading" className="mb-3 text-base font-bold text-[var(--course-text)]">
              Enlaces directos
            </h2>
          ) : null}
          <ul className="space-y-3">
            {visibleLinks.map((link) => {
              const when = formatStartsAt(link.startsAt);
              return (
                <li
                  key={link.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[var(--course-border)] bg-[var(--course-surface)] p-4 shadow-[var(--course-shadow)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-[var(--course-text)]">{link.label}</h3>
                    {link.topic ? (
                      <p className="mt-1 text-sm text-[var(--course-text-muted)]">{link.topic}</p>
                    ) : null}
                    {when ? (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--course-accent)]">
                        <Calendar className="h-3.5 w-3.5" aria-hidden />
                        {when}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                    {link.startsAt ? (
                      <button
                        type="button"
                        onClick={() => {
                          const startsAt =
                            typeof link.startsAt === 'object' &&
                            link.startsAt !== null &&
                            'toDate' in link.startsAt
                              ? (link.startsAt as { toDate: () => Date }).toDate()
                              : new Date(String(link.startsAt));
                          if (!Number.isNaN(startsAt.getTime())) {
                            downloadClassIcs(link, startsAt);
                          }
                        }}
                        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)] px-4 py-2.5 text-sm font-semibold text-[var(--course-text)] transition hover:border-[var(--course-accent)] hover:bg-[var(--course-accent-soft)]"
                      >
                        <CalendarPlus className="h-4 w-4" aria-hidden />
                        .ics
                      </button>
                    ) : null}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--course-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                    >
                      Abrir clase
                      <ExternalLink className="h-4 w-4" aria-hidden />
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
