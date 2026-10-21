'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { readCourseThemeDark, writeCourseThemeDark } from '../lib/studentToolsStore';

type CourseThemeContextValue = {
  dark: boolean;
  toggle: () => void;
  setDark: (dark: boolean) => void;
};

const CourseThemeContext = createContext<CourseThemeContextValue | null>(null);

export function CourseThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDarkState] = useState(() => {
    if (typeof window === 'undefined') return false;
    return readCourseThemeDark();
  });

  const setDark = useCallback((next: boolean) => {
    setDarkState(next);
    writeCourseThemeDark(next);
  }, []);

  const toggle = useCallback(() => {
    setDarkState((prev) => {
      const next = !prev;
      writeCourseThemeDark(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ dark, toggle, setDark }),
    [dark, toggle, setDark],
  );

  return (
    <CourseThemeContext.Provider value={value}>{children}</CourseThemeContext.Provider>
  );
}

export function useCourseThemeContext() {
  const ctx = useContext(CourseThemeContext);
  if (!ctx) {
    throw new Error('useCourseThemeContext must be used within CourseThemeProvider');
  }
  return ctx;
}
