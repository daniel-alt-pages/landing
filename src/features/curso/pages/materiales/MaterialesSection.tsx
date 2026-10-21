'use client';

import { useMemo } from 'react';
import CourseMaterialsGrid from '../../components/CourseMaterialsGrid';
import { useCourseStudentMaterials } from '../../hooks/useCourseStudentMaterials';
import { mergeCourseMaterials } from '../../lib/mergeCourseMaterials';
import type { CourseDoc } from '../../types/courseTypes';

type MaterialesSectionProps = {
  course: CourseDoc;
  showVacacionalCalendar: boolean;
  onOpenClasesTab: () => void;
};

export default function MaterialesSection({
  course,
  showVacacionalCalendar,
  onOpenClasesTab,
}: MaterialesSectionProps) {
  const { materials: studentMaterials } = useCourseStudentMaterials(course.id);

  const materials = useMemo(
    () => mergeCourseMaterials(course.materials, studentMaterials),
    [course.materials, studentMaterials],
  );

  return (
    <CourseMaterialsGrid
      courseId={course.id}
      materials={materials}
      showVacacionalCalendar={showVacacionalCalendar}
      onOpenClasesTab={onOpenClasesTab}
    />
  );
}
