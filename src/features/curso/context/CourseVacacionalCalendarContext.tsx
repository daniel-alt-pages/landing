'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useCourseCalendarEvents } from '../hooks/useCourseCalendarEvents';
import type { CourseCalendarEventDto } from '../lib/courseCalendarTypes';
import type { BogotaWeekRange, CourseDateBounds } from '../lib/courseVacacionalWeek';
import CourseLiveClassReminder from '../components/CourseLiveClassReminder';

type CourseVacacionalCalendarContextValue = {
  enabled: boolean;
  bounds: CourseDateBounds;
  weeks: BogotaWeekRange[];
  weekIndex: number;
  week: BogotaWeekRange;
  setWeekIndex: (idx: number) => void;
  goToTodayWeek: () => void;
  goPrevWeek: () => void;
  goNextWeek: () => void;
  events: CourseCalendarEventDto[];
  loading: boolean;
  syncing: boolean;
  error: string | null;
  needsAuth: boolean;
  lastSyncedAt: number | null;
  runtimeVersion: number | null;
  attendanceVersion: number | null;
  dataSource: 'live' | 'static' | null;
  reload: () => void;
};

const CourseVacacionalCalendarContext = createContext<CourseVacacionalCalendarContextValue | null>(
  null,
);

export function CourseVacacionalCalendarProvider({
  enabled,
  courseId,
  courseStartDate,
  courseEndDate,
  children,
}: {
  enabled: boolean;
  courseId?: string;
  courseStartDate?: string;
  courseEndDate?: string;
  children: ReactNode;
}) {
  const calendar = useCourseCalendarEvents({
    enabled,
    courseId,
    courseStartDate,
    courseEndDate,
  });

  return (
    <CourseVacacionalCalendarContext.Provider value={{ enabled, ...calendar }}>
      {children}
      {enabled ? <CourseLiveClassReminder /> : null}
    </CourseVacacionalCalendarContext.Provider>
  );
}

export function useCourseVacacionalCalendar() {
  const ctx = useContext(CourseVacacionalCalendarContext);
  if (!ctx) {
    return {
      enabled: false,
      bounds: { start: '', end: '' },
      weeks: [] as BogotaWeekRange[],
      weekIndex: 0,
      week: { start: '', end: '', keys: [] as string[] },
      setWeekIndex: () => {},
      goToTodayWeek: () => {},
      goPrevWeek: () => {},
      goNextWeek: () => {},
      events: [] as CourseCalendarEventDto[],
      loading: false,
      syncing: false,
      error: null,
      needsAuth: false,
      lastSyncedAt: null as number | null,
      runtimeVersion: null as number | null,
      attendanceVersion: null as number | null,
      dataSource: null as 'live' | 'static' | null,
      reload: () => {},
    };
  }
  return ctx;
}
