'use client';

import { useCourseThemeContext } from '../context/CourseThemeContext';

/** Tema claro/oscuro del panel curso — una sola fuente vía CourseThemeProvider. */
export function useCourseTheme() {
  return useCourseThemeContext();
}
