'use client';

import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import CourseSvgIcon from './CourseSvgIcon';
import { coursePanelTapScale } from '../lib/coursePanelMotion';
import {
  courseDashboardClipDesc,
  courseDashboardClipTitle,
  courseMetricToneBorder,
  courseMetricToneHover,
  courseMetricToneIconBg,
  courseMetricToneIconColor,
  type CourseMetricClipTone,
} from '../lib/courseMetricClipUi';

type CourseDashboardClipProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  iconSrc?: string;
  tone?: CourseMetricClipTone;
  className?: string;
  /** Métrica grande (curso) o CTA tipo botón (simulacro). */
  footer?: string;
  footerKind?: 'metric' | 'action';
  onClick?: () => void;
  href?: string;
};

function ClipIcon({
  icon: Icon,
  iconSrc,
  tone,
}: {
  icon?: LucideIcon;
  iconSrc?: string;
  tone: CourseMetricClipTone;
}) {
  return (
    <span
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl lg:h-12 lg:w-12 ${courseMetricToneIconBg[tone]}`}
    >
      {iconSrc ? (
        <CourseSvgIcon
          src={iconSrc}
          size={22}
          className="h-5 w-5 lg:h-[22px] lg:w-[22px]"
        />
      ) : Icon ? (
        <Icon
          className={`h-5 w-5 lg:h-[22px] lg:w-[22px] ${courseMetricToneIconColor[tone]}`}
          aria-hidden
        />
      ) : null}
    </span>
  );
}

function ClipFooter({
  footer,
  footerKind,
  tone,
}: {
  footer: string;
  footerKind: 'metric' | 'action';
  tone: CourseMetricClipTone;
}) {
  if (footerKind === 'metric') {
    return (
      <p className="mt-2 text-xl font-black tabular-nums tracking-tight text-[var(--course-text)] sm:mt-3 sm:text-2xl lg:text-3xl">
        {footer}
      </p>
    );
  }

  return (
    <span
      className={`mt-2 inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:mt-3 sm:px-3.5 sm:py-2 sm:text-sm lg:text-[15px] ${
        tone === 'orange'
          ? 'border-orange-500/30 bg-orange-500/10 text-orange-700 group-hover:bg-orange-600 group-hover:text-white dark:text-orange-200'
          : 'border-[var(--course-accent)]/30 bg-[var(--course-accent)]/10 text-[var(--course-accent)] group-hover:bg-[var(--course-accent)] group-hover:text-white'
      }`}
    >
      {footer}
      <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" aria-hidden />
    </span>
  );
}

export default function CourseDashboardClip({
  title,
  description,
  icon,
  iconSrc,
  tone = 'default',
  className = '',
  footer,
  footerKind = 'metric',
  onClick,
  href,
}: CourseDashboardClipProps) {
  const reduceMotion = useReducedMotion();
  const tap = coursePanelTapScale(reduceMotion);
  const shellClass = `group flex w-full flex-col rounded-2xl border p-3 text-left shadow-sm transition duration-200 hover:bg-[var(--course-surface-muted)]/30 sm:p-4 lg:p-5 course-panel-glass course-panel-surface ${courseMetricToneBorder[tone]} ${courseMetricToneHover[tone]} ${className}`;

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 pr-1">
          <p className={courseDashboardClipTitle}>{title}</p>
          <p className={`${courseDashboardClipDesc} line-clamp-2 sm:line-clamp-3`}>{description}</p>
        </div>
        <ClipIcon icon={icon} iconSrc={iconSrc} tone={tone} />
      </div>
      {footer ? <ClipFooter footer={footer} footerKind={footerKind} tone={tone} /> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={shellClass} data-course-motion>
        {body}
      </Link>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={tap}
      data-course-motion
      className={shellClass}
    >
      {body}
    </motion.button>
  );
}
