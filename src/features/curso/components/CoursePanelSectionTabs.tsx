'use client';

import { motion } from 'motion/react';
import type { CourseSectionTab } from '../types/courseTypes';
import { filterCourseSectionNav } from '../lib/courseSectionNav';
import { COURSE_PANEL_SPRING } from '../lib/coursePanelMotion';

type CoursePanelSectionTabsProps = {
  active: CourseSectionTab;
  onChange: (tab: CourseSectionTab) => void;
  showSeguimiento?: boolean;
  /** Tabs más bajos para la burbuja del chrome en desktop. */
  compact?: boolean;
  /** Override nav visibility (ej. solo móvil en grabaciones). */
  className?: string;
};

/** Tabs horizontales de sección — solo desktop (navbar superior). */
export default function CoursePanelSectionTabs({
  active,
  onChange,
  showSeguimiento = false,
  compact = false,
  className,
}: CoursePanelSectionTabsProps) {
  const items = filterCourseSectionNav(showSeguimiento);
  const navClass =
    className ?? 'hidden lg:flex lg:flex-wrap lg:items-center lg:gap-1';

  return (
    <nav
      className={navClass}
      aria-label="Secciones del curso"
    >
      {items.map((item) => {
        const isActive = item.id === active;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`relative inline-flex items-center gap-1.5 rounded-full font-semibold transition-colors ${
              compact
                ? 'min-h-8 px-2.5 py-1 text-xs'
                : 'min-h-9 px-3 py-1.5 text-xs lg:min-h-10 lg:px-3.5 lg:text-sm'
            } ${
              isActive
                ? 'text-white shadow-sm'
                : 'text-[var(--course-text-muted)] hover:bg-[var(--course-surface-muted)] hover:text-[var(--course-text)]'
            }`}
          >
            {isActive ? (
              <motion.span
                layoutId="course-panel-section-pill"
                data-course-motion
                className="absolute inset-0 -z-10 rounded-full bg-[var(--course-accent)] shadow-sm"
                transition={COURSE_PANEL_SPRING}
              />
            ) : null}
            <Icon className="h-3.5 w-3.5 shrink-0 lg:h-4 lg:w-4" aria-hidden />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
