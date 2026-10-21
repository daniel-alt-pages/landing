import type { CourseCalendarEventDto } from './courseCalendarTypes';
import type { CourseRecentSession, CourseStudentMetrics } from '../types/courseTypes';
import {
  formatCountdownToClassStart,
  isVacacionalEventEnded,
  vacacionalClassPhase,
  vacacionalEventDayKey,
  vacacionalEventEndDate,
  vacacionalEventStartDate,
} from './courseVacacionalEventTime';

export function upcomingSessionsFromCalendar(
  events: CourseCalendarEventDto[],
  now = Date.now(),
): CourseRecentSession[] {
  return events
    .filter(
      (event) =>
        event.status !== 'cancelled' &&
        Boolean(event.start?.dateTime || event.start?.date) &&
        !isVacacionalEventEnded(event, now),
    )
    .map((event) => {
      const start = vacacionalEventStartDate(event);
      const phase = vacacionalClassPhase(event, now);
      return {
        sessionId: event.id,
        date: vacacionalEventDayKey(event),
        topic: event.summary || 'Clase programada',
        attended: false,
        minutes: 0,
        durationLabel: start ? formatCountdownToClassStart(start, now) : 'Programada',
        status:
          phase === 'live' || phase === 'starting-soon'
            ? ('live-soon' as const)
            : ('upcoming' as const),
        startsAtIso: start?.toISOString(),
        endsAtIso: vacacionalEventEndDate(event)?.toISOString(),
      };
    })
    .sort(
      (a, b) =>
        new Date(a.startsAtIso ?? 0).getTime() - new Date(b.startsAtIso ?? 0).getTime(),
    );
}

export function resolveDashboardUpcomingSessions(
  metrics: CourseStudentMetrics | null | undefined,
  calendarEvents: CourseCalendarEventDto[],
  calendarEnabled: boolean,
  now = Date.now(),
): CourseRecentSession[] {
  const fromMetrics = (metrics?.recentSessions ?? []).filter(
    (session) =>
      session.startsAtIso &&
      (session.status === 'upcoming' || session.status === 'live-soon') &&
      new Date(session.startsAtIso).getTime() >= now - 60 * 60 * 1000,
  );

  if (fromMetrics.length) {
    return [...fromMetrics].sort(
      (a, b) =>
        new Date(a.startsAtIso!).getTime() - new Date(b.startsAtIso!).getTime(),
    );
  }

  if (calendarEnabled && calendarEvents.length) {
    return upcomingSessionsFromCalendar(calendarEvents, now);
  }

  return [];
}

export function firstNameFromDisplayName(name?: string | null): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? null;
}
