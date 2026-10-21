'use client';

import { Moon, Sun } from 'lucide-react';
import { useCourseTheme } from '../hooks/useCourseTheme';

export default function CourseThemeToggle() {
  const { dark, toggle } = useCourseTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-[var(--course-border)] bg-[var(--course-surface)] text-[var(--course-text-muted)] shadow-sm transition hover:border-[var(--course-accent)] hover:text-[var(--course-accent)]"
      aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
      aria-pressed={dark}
    >
      {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}
