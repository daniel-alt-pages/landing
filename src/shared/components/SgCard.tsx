'use client';

import type { ReactNode } from 'react';

type SgCardProps = {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
  interactive?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
};

const paddingClass = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

export default function SgCard({
  children,
  className = '',
  as: Tag = 'div',
  interactive = false,
  onClick,
  padding = 'md',
}: SgCardProps) {
  const base =
    'rounded-[var(--course-radius-lg)] border border-[var(--course-border)] bg-[var(--course-surface)] shadow-[var(--course-shadow)]';
  const hover = interactive
    ? 'cursor-pointer transition duration-200 hover:border-[var(--course-border-strong)] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--course-accent)]'
    : '';

  if (interactive && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${hover} ${paddingClass[padding]} w-full text-left ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <Tag className={`${base} ${hover} ${paddingClass[padding]} ${className}`}>{children}</Tag>
  );
}
