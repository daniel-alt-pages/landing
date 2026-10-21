import type { CourseCalendarEventDto } from './courseCalendarTypes';
import { isVacacionalEventEnded, vacacionalEventStartDate } from './courseVacacionalEventTime';
import { isVacacionalLiveClassEvent } from './courseVacacionalAttendance';

export type CourseScheduleStats = {
  total: number;
  upcoming: number;
  completed: number;
  liveOrSoon: number;
};

export function computeCourseScheduleStats(
  events: CourseCalendarEventDto[],
  now = Date.now(),
  courseId = 'preicfes-sg26',
): CourseScheduleStats {
  const classEvents = events.filter((e) => isVacacionalLiveClassEvent(e, courseId));
  let upcoming = 0;
  let completed = 0;
  let liveOrSoon = 0;

  for (const event of classEvents) {
    const ended = isVacacionalEventEnded(event, now);
    const start = vacacionalEventStartDate(event);
    if (ended) {
      completed += 1;
    } else {
      upcoming += 1;
      if (start) {
        const ms = start.getTime() - now;
        if (ms <= 15 * 60 * 1000) liveOrSoon += 1;
      }
    }
  }

  return {
    total: classEvents.length,
    upcoming,
    completed,
    liveOrSoon,
  };
}
