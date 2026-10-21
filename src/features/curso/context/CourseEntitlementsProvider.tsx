'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useCourseEntitlements } from '../hooks/useCourseEntitlements';
import type { CourseIdentity } from '../types/courseTypes';
import { initCourseAuthIdentitySync } from '../lib/courseAuthSync';

type CourseEntitlementsContextValue = ReturnType<typeof useCourseEntitlements>;

const CourseEntitlementsContext = createContext<CourseEntitlementsContextValue | null>(null);

export function CourseEntitlementsProvider({
  children,
  identityHint,
}: {
  children: ReactNode;
  identityHint?: Partial<CourseIdentity>;
}) {
  useEffect(() => {
    initCourseAuthIdentitySync();
  }, []);

  const value = useCourseEntitlements(identityHint);
  return (
    <CourseEntitlementsContext.Provider value={value}>
      {children}
    </CourseEntitlementsContext.Provider>
  );
}

export function useCourseEntitlementsContext(): CourseEntitlementsContextValue {
  const ctx = useContext(CourseEntitlementsContext);
  if (!ctx) {
    throw new Error(
      'useCourseEntitlementsContext debe usarse dentro de CourseEntitlementsProvider',
    );
  }
  return ctx;
}

/** Null fuera del provider (p. ej. tests); en /estudiante siempre hay provider en shell. */
export function useCourseEntitlementsOptional(): CourseEntitlementsContextValue | null {
  return useContext(CourseEntitlementsContext);
}
