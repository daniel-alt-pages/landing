/** Estilos compartidos: clips Mi resumen (seguimiento + bento resumen). */

export type CourseMetricClipTone = 'default' | 'accent' | 'violet' | 'orange';

export const COURSE_METRIC_ICON_BOX = 'h-14 w-14 shrink-0';

export const courseMetricToneBadge: Record<CourseMetricClipTone, string> = {
  default: 'bg-[var(--course-surface-muted)] text-[var(--course-text-muted)]',
  accent: 'bg-[var(--course-accent)]/12 text-[var(--course-accent)]',
  violet: 'bg-violet-500/12 text-violet-600 dark:text-violet-300',
  orange: 'bg-orange-500/12 text-orange-600 dark:text-orange-300',
};

export const courseMetricToneBorder: Record<CourseMetricClipTone, string> = {
  default: 'border-[var(--course-border)]',
  accent: 'border-[var(--course-accent)]/20',
  violet: 'border-violet-500/20',
  orange: 'border-orange-500/20',
};

export const courseMetricToneIconBg: Record<CourseMetricClipTone, string> = {
  default: 'bg-[var(--course-surface-muted)]',
  accent: 'bg-[var(--course-accent)]/10',
  violet: 'bg-violet-500/10',
  orange: 'bg-orange-500/10',
};

export const courseMetricToneHover: Record<CourseMetricClipTone, string> = {
  default: 'hover:border-[var(--course-border-strong)]',
  accent: 'hover:border-[var(--course-accent)]/35 hover:shadow-md',
  violet: 'hover:border-violet-500/35 hover:shadow-md',
  orange: 'hover:border-orange-500/35 hover:shadow-md',
};

export const courseResumenSectionAccent: Record<'violet' | 'accent' | 'neutral', string> = {
  violet: 'border-violet-500/20 bg-violet-500/5',
  accent: 'border-[var(--course-accent)]/20 bg-[var(--course-accent)]/5',
  neutral: 'border-[var(--course-border)] bg-[var(--course-surface-muted)]/40',
};

export const courseMetricToneIconColor: Record<CourseMetricClipTone, string> = {
  default: 'text-[var(--course-text-muted)]',
  accent: 'text-[var(--course-accent)]',
  violet: 'text-violet-600 dark:text-violet-300',
  orange: 'text-orange-600 dark:text-orange-300',
};

/** Tipografía clips Dashboard — legible en pantallas grandes. */
export const courseDashboardClipTitle =
  'text-sm font-semibold leading-snug text-[var(--course-text)] sm:text-[15px] lg:text-base';
export const courseDashboardClipDesc =
  'mt-1.5 text-xs leading-relaxed text-[var(--course-text-muted)] sm:text-sm lg:leading-snug';
export const courseDashboardSectionTitle =
  'text-base font-bold tracking-tight text-[var(--course-text)] lg:text-lg';
export const courseDashboardSectionDesc =
  'mt-1 text-sm text-[var(--course-text-muted)] lg:text-[15px]';
