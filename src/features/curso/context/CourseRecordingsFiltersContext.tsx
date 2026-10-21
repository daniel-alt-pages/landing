'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  EMPTY_COURSE_RECORDING_FILTERS,
  type CourseRecordingFilterState,
} from '../lib/courseRecordingsFilters';

type CourseRecordingsFiltersContextValue = {
  filters: CourseRecordingFilterState;
  setFilters: (filters: CourseRecordingFilterState) => void;
  patchFilters: (patch: Partial<CourseRecordingFilterState>) => void;
};

const CourseRecordingsFiltersContext = createContext<CourseRecordingsFiltersContextValue | null>(
  null,
);

export function CourseRecordingsFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<CourseRecordingFilterState>(
    EMPTY_COURSE_RECORDING_FILTERS,
  );

  const value = useMemo(
    () => ({
      filters,
      setFilters,
      patchFilters: (patch: Partial<CourseRecordingFilterState>) =>
        setFilters((prev) => ({ ...prev, ...patch })),
    }),
    [filters],
  );

  return (
    <CourseRecordingsFiltersContext.Provider value={value}>
      {children}
    </CourseRecordingsFiltersContext.Provider>
  );
}

export function useCourseRecordingsFilters() {
  const ctx = useContext(CourseRecordingsFiltersContext);
  if (!ctx) {
    throw new Error('useCourseRecordingsFilters must be used within CourseRecordingsFiltersProvider');
  }
  return ctx;
}

export function useCourseRecordingsFiltersOptional() {
  return useContext(CourseRecordingsFiltersContext);
}
