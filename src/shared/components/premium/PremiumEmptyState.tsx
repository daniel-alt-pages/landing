'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type PremiumEmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
};

export default function PremiumEmptyState({
  icon: Icon,
  title,
  message,
  action,
  className = '',
}: PremiumEmptyStateProps) {
  return (
    <div
      className={`rounded-[1.35rem] border border-dashed border-white/[0.12] bg-white/[0.02] px-5 py-10 text-center ${className}`}
      role="status"
    >
      {Icon ? (
        <span className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-indigo-500/10 text-indigo-300">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
      ) : null}
      <p className="text-sm font-bold text-[var(--coord-text-primary)]">{title}</p>
      {message ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--coord-text-tertiary)]">{message}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
