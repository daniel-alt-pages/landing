import {
  Calendar,
  Clapperboard,
  FolderOpen,
  LayoutDashboard,
  Percent,
  type LucideIcon,
} from 'lucide-react';
import type { CourseSectionTab } from '../types/courseTypes';

export type CourseSectionNavItem = {
  id: CourseSectionTab;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

export const COURSE_SECTION_NAV: CourseSectionNavItem[] = [
  { id: 'resumen', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
  { id: 'grabaciones', label: 'Grabaciones', shortLabel: 'Grab.', icon: Clapperboard },
  { id: 'materiales', label: 'Materiales', shortLabel: 'Mat.', icon: FolderOpen },
  { id: 'clases', label: 'Clases', shortLabel: 'Clases', icon: Calendar },
  { id: 'seguimiento', label: 'Seguimiento', shortLabel: 'Seguim.', icon: Percent },
];

export function filterCourseSectionNav(showSeguimiento = false): CourseSectionNavItem[] {
  return COURSE_SECTION_NAV.filter((t) => {
    if (t.id === 'seguimiento') return showSeguimiento;
    return true;
  });
}
