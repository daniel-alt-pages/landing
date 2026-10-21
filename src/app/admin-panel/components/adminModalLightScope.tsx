'use client';

import { useEffect, type ReactNode } from 'react';
import { CourseThemeProvider } from '@features/curso/context/CourseThemeContext';
import { useCourseTheme } from '@features/curso/hooks/useCourseTheme';

/** Fuerza tema claro curso (como panel estudiante) dentro de un portal/modal. */
function ForceCourseLightInner({ children }: { children: ReactNode }) {
  const { setDark } = useCourseTheme();

  useEffect(() => {
    setDark(false);
  }, [setDark]);

  return children;
}

export function AdminModalLightScope({ children }: { children: ReactNode }) {
  return (
    <CourseThemeProvider>
      <ForceCourseLightInner>{children}</ForceCourseLightInner>
    </CourseThemeProvider>
  );
}
