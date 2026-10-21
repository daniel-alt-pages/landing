'use client';

import CoursePanelSelect, { type CoursePanelSelectOption } from './CoursePanelSelect';

type CourseRecordingsSortMenuProps = {
  value: string;
  onChange: (value: string) => void;
  options: CoursePanelSelectOption[];
  'aria-label'?: string;
};

export default function CourseRecordingsSortMenu({
  value,
  onChange,
  options,
  'aria-label': ariaLabel = 'Ordenar clases',
}: CourseRecordingsSortMenuProps) {
  return (
    <CoursePanelSelect
      value={value}
      onChange={onChange}
      options={options}
      aria-label={ariaLabel}
      variant="pill"
    />
  );
}
