'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Video } from 'lucide-react';
import type { CourseCalendarEventDto } from '../lib/courseCalendarTypes';
import type { CourseRecentSession, CourseSectionTab } from '../types/courseTypes';
import type { UpcomingClass } from '../hooks/useCourseReminders';
import {
  formatCountdownToClassStart,
  formatVacacionalEventClockBogota,
  isVacacionalMeetJoinable,
  isVacacionalMeetLockedByDay,
  vacacionalClassPhase,
  vacacionalEventStartDate,
} from '../lib/courseVacacionalEventTime';

type CourseHeroNextClassPanelProps = {
  upcomingSessions: CourseRecentSession[];
  calendarEvents: CourseCalendarEventDto[];
  linkUpcoming: UpcomingClass | null;
  formatWhen: (date: Date) => string;
  pendingClassCount: number;
  onOpenTab: (tab: CourseSectionTab) => void;
};

export default function CourseHeroNextClassPanel({
  upcomingSessions,
  calendarEvents,
  linkUpcoming,
  formatWhen,
  pendingClassCount,
  onOpenTab,
}: CourseHeroNextClassPanelProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const nextSession = upcomingSessions[0];
  const nextEvent = useMemo(() => {
    if (!nextSession?.sessionId) return null;
    return calendarEvents.find((event) => event.id === nextSession.sessionId) ?? null;
  }, [calendarEvents, nextSession?.sessionId]);

  const start = nextEvent
    ? vacacionalEventStartDate(nextEvent)
    : linkUpcoming?.startsAt ?? null;

  const phase = nextEvent ? vacacionalClassPhase(nextEvent, now) : null;
  const isLive = phase === 'live' || nextSession?.status === 'live-soon';
  const meetJoinable = nextEvent ? isVacacionalMeetJoinable(nextEvent, now) : false;
  const meetLocked = nextEvent ? isVacacionalMeetLockedByDay(nextEvent, now) : false;

  const title =
    nextSession?.topic?.trim() ||
    linkUpcoming?.link.label?.trim() ||
    'Próxima clase en vivo';

  const headerLabel = isLive ? 'Clase en vivo' : 'Próxima clase';

  const timeLabel = start
    ? start.toLocaleString('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Bogota',
      })
    : linkUpcoming
      ? formatWhen(linkUpcoming.startsAt)
      : null;

  const clockLabel =
    start && !isLive ? formatVacacionalEventClockBogota(start) : null;

  const detailLabel = (() => {
    if (isLive) return 'La reunión ya empezó · entra con tu correo de Google';
    if (start && !isLive) return formatCountdownToClassStart(start, now);
    if (pendingClassCount > 1) {
      return `${pendingClassCount - 1} clase${pendingClassCount - 1 === 1 ? '' : 's'} más en tu calendario`;
    }
    if (meetLocked) return 'Meet se habilita el día de la clase';
    return 'Horario del vacacional · zona Colombia';
  })();

  const meetHref =
    meetJoinable && nextEvent?.hangoutLink
      ? nextEvent.hangoutLink
      : linkUpcoming?.link.url?.trim() || null;

  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/90">
          {headerLabel}
        </p>
        <CalendarClock className="h-5 w-5 shrink-0 text-white/80" aria-hidden />
      </div>

      <p className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-white">{title}</p>

      {timeLabel ? (
        <p className="mt-1 text-xs text-white/85">
          {timeLabel}
          {clockLabel ? ` · ${clockLabel}` : ''}
        </p>
      ) : null}

      <p className="mt-2 text-[11px] leading-snug text-white/80">{detailLabel}</p>

      {meetHref && (meetJoinable || isLive || linkUpcoming) ? (
        <a
          href={meetHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-white/90 ${
            isLive ? 'shadow-lg shadow-white/20' : ''
          }`}
        >
          <Video className="h-4 w-4" aria-hidden />
          {isLive ? 'Unirme a la clase' : 'Entrar a la clase'}
        </a>
      ) : (
        <button
          type="button"
          onClick={() => onOpenTab('clases')}
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-white/90"
        >
          <CalendarClock className="h-4 w-4" aria-hidden />
          Ver calendario de clases
        </button>
      )}
    </div>
  );
}
