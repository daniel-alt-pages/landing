'use client';

import CoursePanelSelect, { type CoursePanelSelectOption } from './CoursePanelSelect';

type CourseStyledNativeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: CoursePanelSelectOption[];
  'aria-label'?: string;
  className?: string;
  variant?: 'course' | 'admin';
  selectClassName?: string;
};

/** @deprecated selectClassName ignorado — usa menú custom del panel. */
export default function CourseStyledNativeSelect({
  value,
  onChange,
  options,
  'aria-label': ariaLabel,
  className = '',
  variant = 'course',
}: CourseStyledNativeSelectProps) {
  const isAdmin = variant === 'admin';

  return (
    <CoursePanelSelect
      value={value}
      onChange={onChange}
      options={options}
      aria-label={ariaLabel}
      variant="pill"
      className={
        isAdmin
          ? `rounded-full border-white/10 bg-white/[0.04] [&_button]:border-white/10 [&_button]:bg-white/[0.04] [&_button]:text-white [&_button]:hover:bg-white/[0.08] ${className}`
          : className
      }
    />
  );
}
