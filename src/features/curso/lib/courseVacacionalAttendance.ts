import type { CourseCalendarEventDto } from './courseCalendarTypes';
import type {
  CourseAttendanceManifest,
  CourseAttendanceManifestSession,
  CourseIdentity,
  CourseRecentSession,
  CourseStudentMetrics,
  MeetAttendanceRow,
} from '../types/courseTypes';
import { COURSE_DEFAULT_TOTAL_HOURS } from '../types/courseTypes';
import { buildCoursePersonKey } from './courseAccessKeys';
import {
  formatCountdownToClassStart,
  isVacacionalClassFinishedForAttendance,
  isVacacionalEventEnded,
  isVacacionalInductionEvent,
  isVacacionalInductionTopic,
  vacacionalClassPhase,
  vacacionalEventDayKey,
  vacacionalEventEndDate,
  vacacionalEventStartDate,
} from './courseVacacionalEventTime';
import { PREICFES_SG26_VACACIONAL_LIVE_BOUNDS } from './courseAttendanceWeek';
import {
  bogotaCourseApiRange,
  resolveCourseDateBounds,
} from './courseVacacionalWeek';
import {
  buildMetricsFromMeetSessions,
  findStudentRowForMeet,
  formatMinutesAsDuration,
  sessionStatusFromMinutes,
} from './courseMeetAttendance';
import { fetchCourseCalendarEvents } from './fetchCourseCalendarEvents';
import { readStudentDisplayName } from './courseStudentSession';
import {
  applyExcusaSessionOverrideToRow,
  type ExcusaSessionOverride,
} from './courseExcusaSessionOverrides';

/** Sesión de historial Meet/Firestore — solo clases en vivo (inducciones no cuentan). */
export function isVacacionalLiveRecentSession(
  session: CourseRecentSession,
  courseId = 'preicfes-sg26',
): boolean {
  const date = session.date?.trim();
  if (!date) return false;
  if (isVacacionalInductionTopic(session.topic)) return false;
  if (courseId === 'preicfes-sg26' && date < PREICFES_SG26_VACACIONAL_LIVE_BOUNDS.start) {
    return false;
  }
  return true;
}

export function filterVacacionalLiveRecentSessions(
  sessions: CourseRecentSession[] | undefined,
  courseId = 'preicfes-sg26',
): CourseRecentSession[] {
  if (!sessions?.length) return [];
  return sessions.filter((s) => isVacacionalLiveRecentSession(s, courseId));
}

export function sanitizeVacacionalStudentMetrics(
  metrics: CourseStudentMetrics,
): CourseStudentMetrics {
  if (metrics.courseId !== 'preicfes-sg26') return metrics;
  const recentSessions = filterVacacionalLiveRecentSessions(
    metrics.recentSessions,
    metrics.courseId,
  );
  const a = metrics.attendance;
  const sessionsTotal = a.sessionsTotal ?? 0;
  const sessionsAttended = a.sessionsAttended ?? 0;
  const attendanceRate = computeVacacionalClassAttendanceRate(
    sessionsAttended,
    sessionsTotal,
  );
  const sessionsChanged =
    recentSessions.length !== (metrics.recentSessions?.length ?? 0);
  const rateChanged = attendanceRate !== (a.attendanceRate ?? 0);
  if (!sessionsChanged && !rateChanged) return metrics;
  return {
    ...metrics,
    recentSessions,
    attendance: { ...a, attendanceRate },
  };
}

export function isVacacionalClassEvent(event: CourseCalendarEventDto): boolean {
  if (event.status === 'cancelled') return false;
  return Boolean(event.start?.dateTime);
}

/** Clases en vivo del vacacional — sin inducciones ni eventos previas al inicio oficial. */
/** % asistencia = clases con presencia / clases programadas (incluye pendientes). */
export function computeVacacionalClassAttendanceRate(
  sessionsAttended: number,
  sessionsTotal: number,
): number {
  if (sessionsTotal <= 0) return 0;
  return sessionsAttended / sessionsTotal;
}

import {
  isVacacionalDisplayPlaceholderSummary,
  isVacacionalIcsRecurringGarbageSummary,
} from './courseVacacionalSummaryNormalize';

export function isVacacionalPlaceholderEvent(event: CourseCalendarEventDto): boolean {
  return isVacacionalDisplayPlaceholderSummary(event.summary);
}

export function isVacacionalCalendarDisplayEvent(
  event: CourseCalendarEventDto,
  courseId?: string,
): boolean {
  if (event.status === 'cancelled') return false;
  if (!isVacacionalClassEvent(event)) return false;
  if (isVacacionalInductionEvent(event)) return false;
  if (isVacacionalIcsRecurringGarbageSummary(event.summary)) return false;
  if (isVacacionalPlaceholderEvent(event)) return true;
  return isVacacionalLiveClassEvent(event, courseId);
}

export function isVacacionalLiveClassEvent(
  event: CourseCalendarEventDto,
  courseId?: string,
): boolean {
  if (isVacacionalIcsRecurringGarbageSummary(event.summary)) return false;
  if (isVacacionalPlaceholderEvent(event)) return false;
  if (!isVacacionalClassEvent(event)) return false;
  if (isVacacionalInductionEvent(event)) return false;
  if (courseId === 'preicfes-sg26') {
    const date = vacacionalEventDayKey(event);
    if (date < PREICFES_SG26_VACACIONAL_LIVE_BOUNDS.start) return false;
  }
  return true;
}

const VACACIONAL_CLASE_NUM_RE = /clase\s*#\s*(\d+)/i;

/** Varias clases el mismo día → emparejar por número en manifest.id (clase-04, …). */
function findMeetSessionForEvent(
  event: CourseCalendarEventDto,
  sessions: CourseAttendanceManifestSession[],
): CourseAttendanceManifestSession | undefined {
  const match = event.summary?.match(VACACIONAL_CLASE_NUM_RE);
  if (match) {
    const num = parseInt(match[1], 10);
    const token = `clase-${String(num).padStart(2, '0')}`;
    const byClase = sessions.find((s) => s.id?.includes(token));
    if (byClase) return byClase;
  }
  const date = vacacionalEventDayKey(event);
  return sessions.find((s) => s.date === date);
}

export function buildMetricsFromVacacionalCalendar(
  courseId: string,
  identity: CourseIdentity,
  manifest: CourseAttendanceManifest,
  calendarEvents: CourseCalendarEventDto[],
  meetSessions: { meta: CourseAttendanceManifestSession; rows: MeetAttendanceRow[] }[],
  displayName?: string,
  now = Date.now(),
  excusaSessionOverrides?: Map<string, ExcusaSessionOverride>,
): CourseStudentMetrics | null {
  const studentName = displayName || readStudentDisplayName() || 'Estudiante';
  const totalHours = manifest.totalHours || COURSE_DEFAULT_TOTAL_HOURS;
  const classEvents = calendarEvents
    .filter((e) => isVacacionalLiveClassEvent(e, courseId))
    .sort(
      (a, b) =>
        (vacacionalEventStartDate(a)?.getTime() ?? 0) -
        (vacacionalEventStartDate(b)?.getTime() ?? 0),
    );

  if (!classEvents.length && !meetSessions.length) {
    return {
      courseId,
      personKey: buildCoursePersonKey(identity),
      studentId: identity.studentId,
      emailLower: identity.emailLower,
      documento: identity.documento,
      displayName: studentName,
      attendance: {
        totalHours,
        attendedHours: 0,
        attendanceRate: 0,
        sessionsAttended: 0,
        sessionsTotal: 0,
        lastUpdatedAt: new Date().toISOString(),
      },
      recentSessions: [],
      version: 1,
    };
  }

  let attendedMinutes = 0;
  let sessionsAttended = 0;
  let sessionsCompleted = 0;
  let sessionsUpcoming = 0;
  let sessionsPresent = 0;
  let sessionsPartial = 0;
  let sessionsAbsent = 0;
  const recentSessions: CourseRecentSession[] = [];

  for (const event of classEvents) {
    const date = vacacionalEventDayKey(event);
    const start = vacacionalEventStartDate(event);
    const end = vacacionalEventEndDate(event);
    const phase = vacacionalClassPhase(event, now);
    const ended = isVacacionalClassFinishedForAttendance(event, now);
    const recordingPublished = ended && !isVacacionalEventEnded(event, now);
    const topic = event.summary || 'Clase vacacional';
    const startsAtIso = start?.toISOString();
    const endsAtIso = end?.toISOString();

    if (ended) {
      sessionsCompleted += 1;

      const meetMeta = findMeetSessionForEvent(event, manifest.sessions);
      const loaded = meetMeta
        ? meetSessions.find((s) => s.meta.id === meetMeta.id)
        : undefined;
      const hit = loaded ? findStudentRowForMeet(loaded.rows, studentName) : null;
      let minutes = hit?.durationMinutes ?? 0;
      let status = sessionStatusFromMinutes(minutes, meetMeta?.scheduledMinutes);
      let attended = minutes > 0;
      let joinedAt = hit?.joinedAt || undefined;
      let leftAt = hit?.leftAt || undefined;
      let durationLabel =
        hit?.durationLabel ||
        (attended
          ? formatMinutesAsDuration(minutes)
          : recordingPublished
            ? 'Sin registro Meet · grabación publicada'
            : 'Sin registro Meet');
      let countTowardPoints: boolean | undefined;

      const override = meetMeta?.id
        ? excusaSessionOverrides?.get(meetMeta.id)
        : undefined;
      if (override) {
        const synthetic = applyExcusaSessionOverrideToRow(override);
        if (attended) attendedMinutes -= minutes;
        if (status === 'present' || status === 'partial') sessionsAttended -= 1;
        if (status === 'present') sessionsPresent -= 1;
        else if (status === 'partial') sessionsPartial -= 1;
        else if (status === 'absent') sessionsAbsent -= 1;

        minutes = synthetic.minutes ?? 91;
        status = synthetic.status ?? 'partial';
        attended = true;
        joinedAt = synthetic.joinedAt;
        leftAt = synthetic.leftAt;
        durationLabel = synthetic.durationLabel ?? formatMinutesAsDuration(minutes);
        countTowardPoints = synthetic.countTowardPoints;
      }

      if (attended && countTowardPoints !== false) attendedMinutes += minutes;
      if (status === 'present' || status === 'partial') sessionsAttended += 1;
      if (status === 'present') sessionsPresent += 1;
      else if (status === 'partial') sessionsPartial += 1;
      else sessionsAbsent += 1;

      recentSessions.push({
        sessionId: event.id,
        date,
        topic,
        attended,
        minutes,
        joinedAt,
        leftAt,
        durationLabel,
        status,
        startsAtIso,
        endsAtIso,
        countTowardPoints,
      });
      continue;
    }

    sessionsUpcoming += 1;
    recentSessions.push({
      sessionId: event.id,
      date,
      topic,
      attended: false,
      minutes: 0,
      durationLabel: start ? formatCountdownToClassStart(start, now) : 'Programada',
      status: phase === 'live' || phase === 'starting-soon' ? 'live-soon' : 'upcoming',
      startsAtIso,
      endsAtIso,
    });
  }

  const sessionsTotal = sessionsCompleted + sessionsUpcoming;

  const attendedHours = Math.round((attendedMinutes / 60) * 10) / 10;
  const attendanceRate = computeVacacionalClassAttendanceRate(
    sessionsAttended,
    sessionsTotal,
  );

  return {
    courseId,
    personKey: buildCoursePersonKey(identity),
    studentId: identity.studentId,
    emailLower: identity.emailLower,
    documento: identity.documento,
    displayName: studentName,
    attendance: {
      totalHours,
      attendedHours,
      attendanceRate,
      sessionsAttended,
      sessionsTotal,
      sessionsCompleted,
      sessionsUpcoming,
      sessionsPresent,
      sessionsPartial,
      sessionsAbsent,
      lastUpdatedAt: new Date().toISOString(),
    },
    recentSessions: recentSessions.sort((a, b) => b.date.localeCompare(a.date)),
    version: 1,
  };
}

export async function fetchVacacionalCalendarEventsForAttendance(
  courseStartDate?: string,
  courseEndDate?: string,
): Promise<CourseCalendarEventDto[]> {
  const bounds = resolveCourseDateBounds(courseStartDate, courseEndDate);
  const range = bogotaCourseApiRange(bounds);
  const data = await fetchCourseCalendarEvents({
    start: range.apiStart,
    end: range.apiEnd,
  });
  if (data.success && data.events?.length) return data.events;

  if (typeof window === 'undefined') return [];

  try {
    const res = await fetch('/data/calendar/preicfes-sg26.json', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const snapshot = (await res.json()) as { events?: CourseCalendarEventDto[] };
    return snapshot.events ?? [];
  } catch {
    return [];
  }
}
