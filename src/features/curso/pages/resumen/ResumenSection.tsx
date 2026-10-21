'use client';

import { SgSkeletonCard } from '@shared/components/SgSkeleton';
import CourseBentoSummary from '../../components/CourseBentoSummary';
import CourseToolsHub from '../../components/CourseToolsHub';
import type {
  CourseDoc,
  CourseEntitlementsResult,
  CourseSectionTab,
  CourseStudentMetrics,
} from '../../types/courseTypes';

type ResumenSectionProps = {
  course: CourseDoc | null;
  metrics: CourseStudentMetrics | null;
  metricsLoading: boolean;
  studentName?: string;
  entitlements: CourseEntitlementsResult | null;
  onOpenTab: (tab: CourseSectionTab) => void;
  sectionLoading: boolean;
  error?: string | null;
  hasCourse: boolean;
};

export default function ResumenSection({
  course,
  metrics,
  metricsLoading,
  studentName,
  entitlements,
  onOpenTab,
  sectionLoading,
  error,
  hasCourse,
}: ResumenSectionProps) {
  if (sectionLoading) {
    return <SgSkeletonCard lines={4} />;
  }

  return (
    <div className="space-y-8">
      {course ? (
        <CourseBentoSummary
          course={course}
          metrics={metrics}
          metricsLoading={metricsLoading && !metrics}
          studentName={studentName}
          onOpenTab={onOpenTab}
        />
      ) : null}

      <CourseToolsHub entitlements={entitlements} />

      {error && !hasCourse ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {error} Estamos publicando el contenido de tu curso.
        </p>
      ) : null}
    </div>
  );
}
