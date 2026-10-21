'use client';

import { useEffect, type ReactNode } from 'react';
import { CourseThemeProvider } from '@features/curso/context/CourseThemeContext';
import { useCourseTheme } from '@features/curso/hooks/useCourseTheme';
import { courseThemeScopeClass } from '@features/curso/lib/courseThemeScope';

function AdminSeguimientoDarkScope({ children }: { children: ReactNode }) {
  const { dark, setDark } = useCourseTheme();

  useEffect(() => {
    setDark(true);
  }, [setDark]);

  return (
    <div className={`${courseThemeScopeClass(dark)} rounded-2xl border border-white/10 bg-[#0a0a14]/80 p-4 sm:p-6`}>
      {children}
    </div>
  );
}

/** Envuelve UI de seguimiento en tokens curso (oscuro) dentro del admin. */
export default function AdminSeguimientoScope({ children }: { children: ReactNode }) {
  return (
    <CourseThemeProvider>
      <AdminSeguimientoDarkScope>{children}</AdminSeguimientoDarkScope>
    </CourseThemeProvider>
  );
}
