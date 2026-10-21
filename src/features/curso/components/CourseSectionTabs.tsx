'use client';

import SgAreaIconBottomNav from '@shared/components/SgAreaIconBottomNav';
import { useCourseTheme } from '../hooks/useCourseTheme';
import type { CourseSectionTab } from '../types/courseTypes';
import { filterCourseSectionNav } from '../lib/courseSectionNav';

const COURSE_NAV_ACCENT = '#7c3aed';

type CourseSectionTabsProps = {
  active: CourseSectionTab;
  onChange: (tab: CourseSectionTab) => void;
  showSeguimiento?: boolean;
  homeHref?: string;
  homeLabel?: string;
};

/** Nav inferior fijo — solo móvil/tablet (< lg). */
export default function CourseSectionTabs({
  active,
  onChange,
  showSeguimiento = false,
}: CourseSectionTabsProps) {
  const { dark } = useCourseTheme();
  const items = filterCourseSectionNav(showSeguimiento).map((t) => ({
    key: t.id,
    label: t.shortLabel,
    icon: t.icon,
  }));

  return (
    <div className="lg:hidden">
      <SgAreaIconBottomNav
        items={items}
        activeKey={active}
        onSelect={(key) => onChange(key as CourseSectionTab)}
        variant={dark ? 'dark' : 'light'}
        position="fixed"
        themeAccentHex={COURSE_NAV_ACCENT}
        ariaLabel="Secciones del curso"
      />
    </div>
  );
}
