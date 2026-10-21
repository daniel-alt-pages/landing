'use client';

import type { LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import CourseSvgIcon from '../../../components/CourseSvgIcon';
import StreakFlameIcon from '../../../components/StreakFlameIcon';
import { coursePanelInViewMotion, coursePanelTapScale } from '../../../lib/coursePanelMotion';
import {
  courseDashboardClipDesc,
  courseDashboardClipTitle,
  courseDashboardSectionDesc,
  courseDashboardSectionTitle,
  courseMetricToneBorder,
  courseMetricToneIconBg,
  courseMetricToneIconColor,
  courseResumenSectionAccent,
  type CourseMetricClipTone,
} from '../../../lib/courseMetricClipUi';

type SeguimientoSectionProps = {
  title: string;
  subtitle?: string;
  accent?: 'violet' | 'accent' | 'neutral';
  children: React.ReactNode;
};

export function SeguimientoSection({
  title,
  subtitle,
  accent = 'neutral',
  children,
}: SeguimientoSectionProps) {
  const reduceMotion = useReducedMotion();
  const headerMotion = coursePanelInViewMotion(reduceMotion);

  return (
    <section className="space-y-3">
      <motion.div
        {...headerMotion}
        data-course-motion
        className={`course-panel-glass rounded-xl border px-3 py-2.5 sm:px-4 ${courseResumenSectionAccent[accent]}`}
      >
        <h3 className={courseDashboardSectionTitle}>{title}</h3>
        {subtitle ? <p className={courseDashboardSectionDesc}>{subtitle}</p> : null}
      </motion.div>
      {children}
    </section>
  );
}

type SeguimientoMetricClipProps = {
  labelTitle: string;
  labelSpec?: string;
  value: string;
  tone?: CourseMetricClipTone;
  className?: string;
  icon?: LucideIcon;
  iconSrc?: string;
  streakDayCount?: number;
};

function ClipIconBox({
  icon: Icon,
  iconSrc,
  tone,
  streakDayCount,
}: {
  icon?: LucideIcon;
  iconSrc?: string;
  tone: CourseMetricClipTone;
  streakDayCount?: number;
}) {
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${courseMetricToneIconBg[tone]}`}
    >
      {streakDayCount !== undefined ? (
        <StreakFlameIcon dayStreak={streakDayCount} size={28} className="h-7 w-7" />
      ) : iconSrc ? (
        <CourseSvgIcon src={iconSrc} size={28} className="h-7 w-7 sm:h-7 sm:w-7" />
      ) : Icon ? (
        <Icon
          className={`h-4 w-4 sm:h-5 sm:w-5 ${courseMetricToneIconColor[tone]}`}
          aria-hidden
        />
      ) : null}
    </span>
  );
}

export function SeguimientoMetricClip({
  icon: Icon,
  iconSrc,
  streakDayCount,
  labelTitle,
  labelSpec,
  value,
  tone = 'default',
  className = '',
}: SeguimientoMetricClipProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      {...coursePanelInViewMotion(reduceMotion)}
      data-course-motion
      whileTap={coursePanelTapScale(reduceMotion)}
      className={`course-panel-glass course-panel-surface flex min-h-0 flex-col rounded-2xl border p-3 sm:p-4 ${courseMetricToneBorder[tone]} ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={courseDashboardClipTitle}>{labelTitle}</p>
          {labelSpec ? (
            <p className={`${courseDashboardClipDesc} line-clamp-3`}>{labelSpec}</p>
          ) : null}
        </div>
        <ClipIconBox icon={Icon} iconSrc={iconSrc} tone={tone} streakDayCount={streakDayCount} />
      </div>
      <p className="mt-2 text-xl font-black tabular-nums leading-tight text-[var(--course-text)] sm:mt-3 sm:text-2xl">
        {value}
      </p>
    </motion.div>
  );
}

type DualMetricItem = { shortLabel: string; value: string };

type SeguimientoDualMetricClipProps = {
  labelTitle: string;
  labelSpec?: string;
  primary: DualMetricItem;
  secondary: DualMetricItem;
  tone?: CourseMetricClipTone;
  icon?: LucideIcon;
  iconSrc?: string;
  className?: string;
};

export function SeguimientoDualMetricClip({
  icon: Icon,
  iconSrc,
  labelTitle,
  labelSpec,
  primary,
  secondary,
  tone = 'violet',
  className = '',
}: SeguimientoDualMetricClipProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      {...coursePanelInViewMotion(reduceMotion)}
      data-course-motion
      whileTap={coursePanelTapScale(reduceMotion)}
      className={`course-panel-glass course-panel-surface flex min-h-0 flex-col rounded-2xl border p-3 sm:p-4 ${courseMetricToneBorder[tone]} ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={courseDashboardClipTitle}>{labelTitle}</p>
          {labelSpec ? (
            <p className={`${courseDashboardClipDesc} line-clamp-2`}>{labelSpec}</p>
          ) : null}
        </div>
        {iconSrc || Icon ? <ClipIconBox icon={Icon} iconSrc={iconSrc} tone={tone} /> : null}
      </div>
      <div className="mt-2 flex items-end gap-3 sm:mt-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--course-text-muted)] sm:text-xs">
            {primary.shortLabel}
          </p>
          <p className="text-xl font-black tabular-nums text-[var(--course-text)] sm:text-2xl">
            {primary.value}
          </p>
        </div>
        <div className="mb-1 h-8 w-px shrink-0 bg-[var(--course-border)]" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--course-text-muted)] sm:text-xs">
            {secondary.shortLabel}
          </p>
          <p className="text-xl font-black tabular-nums text-[var(--course-text)] sm:text-2xl">
            {secondary.value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

type StatusTone = 'success' | 'warn' | 'danger' | 'accent';

type SeguimientoStatusClipProps = {
  labelTitle: string;
  labelSpec?: string;
  value: number;
  tone?: StatusTone;
  icon?: LucideIcon;
  iconSrc?: string;
};

const statusToneBorder: Record<StatusTone, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/8',
  warn: 'border-amber-500/30 bg-amber-500/8',
  danger: 'border-rose-500/30 bg-rose-500/8',
  accent: 'border-[var(--course-border)] bg-[var(--course-surface)]',
};

const statusToneIconColor: Record<StatusTone, string> = {
  success: 'text-emerald-600 dark:text-emerald-400',
  warn: 'text-amber-600 dark:text-amber-400',
  danger: 'text-rose-600 dark:text-rose-400',
  accent: 'text-[var(--course-accent)]',
};

const statusToneValue: Record<StatusTone, string> = {
  success: 'text-emerald-600 dark:text-emerald-400',
  warn: 'text-amber-600 dark:text-amber-400',
  danger: 'text-rose-600 dark:text-rose-400',
  accent: 'text-[var(--course-accent)]',
};

export function SeguimientoStatusClip({
  icon: Icon,
  iconSrc,
  labelTitle,
  labelSpec,
  value,
  tone = 'accent',
}: SeguimientoStatusClipProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      {...coursePanelInViewMotion(reduceMotion)}
      data-course-motion
      whileTap={coursePanelTapScale(reduceMotion)}
      className={`course-panel-glass flex min-h-0 flex-col rounded-2xl border p-3 sm:p-4 ${statusToneBorder[tone]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={courseDashboardClipTitle}>{labelTitle}</p>
          {labelSpec ? (
            <p className={`${courseDashboardClipDesc} line-clamp-2`}>{labelSpec}</p>
          ) : null}
        </div>
        {iconSrc || Icon ? (
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--course-surface-muted)] sm:h-10 sm:w-10">
            {iconSrc ? (
              <CourseSvgIcon src={iconSrc} size={28} className="h-7 w-7" />
            ) : Icon ? (
              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${statusToneIconColor[tone]}`} aria-hidden />
            ) : null}
          </span>
        ) : null}
      </div>
      <p className={`mt-2 text-xl font-black tabular-nums sm:mt-3 sm:text-2xl ${statusToneValue[tone]}`}>
        {value}
      </p>
    </motion.div>
  );
}
