'use client';

import CourseClassLinksSection from '../../components/CourseClassLinksSection';
import type { CourseDoc } from '../../types/courseTypes';
import type { resolveCourseCalendarProgram } from '../../lib/courseCalendarConfig';

type ClasesSectionProps = {
  course: CourseDoc;
  calendarEmbedUrl?: string;
  calendarProgram?: ReturnType<typeof resolveCourseCalendarProgram>;
  calendarTitle: string;
  calendarSubtitle: string;
  onOpenGrabacionesTab: (recordingId?: string) => void;
};

export default function ClasesSection({
  course,
  calendarEmbedUrl,
  calendarProgram,
  calendarTitle,
  calendarSubtitle,
  onOpenGrabacionesTab,
}: ClasesSectionProps) {
  return (
    <CourseClassLinksSection
      classLinks={course.classLinks}
      calendarEmbedUrl={calendarEmbedUrl}
      calendarProgram={calendarProgram ?? undefined}
      calendarTitle={calendarTitle}
      calendarSubtitle={calendarSubtitle}
      catalogRecordings={course.recordings}
      courseId={course.id}
      onOpenGrabacionesTab={onOpenGrabacionesTab}
    />
  );
}
