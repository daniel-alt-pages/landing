'use client';

import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type PremiumGlassVariant = 'dark' | 'light' | 'hero-dark';

type PremiumGlassCardProps = {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'score';
  variant?: PremiumGlassVariant;
  as?: 'div' | 'section' | 'article';
} & Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'children'>;

const paddingClass = {
  sm: 'p-5 sm:p-6',
  md: 'p-6 sm:p-8',
  lg: 'p-8 sm:p-10',
  score: 'p-5 sm:p-6 md:p-7 lg:p-8',
};

const variantClass: Record<PremiumGlassVariant, string> = {
  dark:
    'border-white/[0.12] bg-[rgba(17,24,39,0.92)] shadow-[0_24px_80px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-inset ring-indigo-400/20 backdrop-blur-xl',
  light:
    'border-slate-200/90 bg-white/95 shadow-[0_8px_32px_rgba(15,23,42,0.08)] ring-1 ring-inset ring-indigo-500/10 backdrop-blur-sm hover:shadow-[0_16px_48px_rgba(99,102,241,0.14)] transition-shadow',
  'hero-dark':
    'border-white/[0.12] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-2xl ring-1 ring-inset ring-indigo-400/25 hover:shadow-indigo-500/25 transition-all',
};

const PremiumGlassCard = forwardRef<HTMLDivElement, PremiumGlassCardProps>(function PremiumGlassCard(
  {
    children,
    className = '',
    padding = 'md',
    variant = 'dark',
    as: Tag = 'div',
    ...rest
  },
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={`overflow-hidden rounded-[1.35rem] border ${variantClass[variant]} ${paddingClass[padding]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
});

export default PremiumGlassCard;
