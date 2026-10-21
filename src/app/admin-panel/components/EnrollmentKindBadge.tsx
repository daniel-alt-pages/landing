'use client';

import type { CourseEnrollmentKind } from '@features/curso/lib/courseEnrollmentKind';
import { COURSE_ENROLLMENT_KIND_LABEL } from '@features/curso/lib/courseEnrollmentKind';

type Props = {
  kind?: CourseEnrollmentKind;
  variant?: 'admin' | 'course';
  className?: string;
};

export default function EnrollmentKindBadge({ kind = 'unknown', variant = 'admin', className = '' }: Props) {
  if (kind === 'unknown') {
    return (
      <span
        className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
          variant === 'admin'
            ? 'border-white/15 bg-white/5 text-white/45'
            : 'border-[var(--course-border)] bg-[var(--course-surface-muted)] text-[var(--course-text-muted)]'
        } ${className}`}
      >
        {COURSE_ENROLLMENT_KIND_LABEL.unknown}
      </span>
    );
  }

  const isBecado = kind === 'becado';
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        isBecado
          ? variant === 'admin'
            ? 'border-violet-400/35 bg-violet-500/15 text-violet-200'
            : 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300'
          : variant === 'admin'
            ? 'border-cyan-400/35 bg-cyan-500/15 text-cyan-200'
            : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
      } ${className}`}
    >
      {COURSE_ENROLLMENT_KIND_LABEL[kind]}
    </span>
  );
}
