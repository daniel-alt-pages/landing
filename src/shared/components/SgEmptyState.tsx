'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type SgEmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
};

export default function SgEmptyState({
  icon: Icon,
  title,
  message,
  action,
  className = '',
}: SgEmptyStateProps) {
  return (
    <div
      className={`rounded-[var(--course-radius-lg)] border border-dashed border-[var(--course-border)] bg-[var(--course-surface-muted)] px-5 py-10 text-center ${className}`}
      role="status"
    >
      {Icon ? (
        <span className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--course-accent-soft)] text-[var(--course-accent)]">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      ) : null}
      <p className="text-sm font-semibold text-[var(--course-text)]">{title}</p>
      {message ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--course-text-muted)]">{message}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
