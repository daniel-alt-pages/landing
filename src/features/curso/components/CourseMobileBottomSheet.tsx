'use client';

import type { ComponentProps } from 'react';
import SgMobileBottomSheet from '@shared/components/SgMobileBottomSheet';
import { useCourseTheme } from '../hooks/useCourseTheme';
import { courseThemeScopeClass } from '../lib/courseThemeScope';

type CourseMobileBottomSheetProps = Omit<ComponentProps<typeof SgMobileBottomSheet>, 'scopeClassName'>;

/** Bottom sheet del panel curso con tokens `--course-*` según tema elegido. */
export default function CourseMobileBottomSheet(props: CourseMobileBottomSheetProps) {
  const { dark } = useCourseTheme();
  return <SgMobileBottomSheet scopeClassName={courseThemeScopeClass(dark)} {...props} />;
}
