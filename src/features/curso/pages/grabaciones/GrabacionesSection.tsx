'use client';

import CourseRecordingsKeepAlive from '../../components/CourseRecordingsKeepAlive';
import CourseRecordingsSection from '../../components/CourseRecordingsSection';
import type { CourseDoc } from '../../types/courseTypes';

type GrabacionesSectionProps = {
  active: boolean;
  course: CourseDoc;
  showVacacionalCalendar: boolean;
  linkGeminiFromCalendar: boolean;
  initialRecordingId?: string | null;
  onNavigateHome: () => void;
};

export default function GrabacionesSection({
  active,
  course,
  showVacacionalCalendar,
  linkGeminiFromCalendar,
  initialRecordingId,
  onNavigateHome,
}: GrabacionesSectionProps) {
  return (
    <CourseRecordingsKeepAlive active={active}>
      <CourseRecordingsSection
        courseId={course.id}
        courseName={course.name}
        recordings={course.recordings}
        active={active}
        showVacacionalCalendar={showVacacionalCalendar}
        linkGeminiFromCalendar={linkGeminiFromCalendar}
        initialRecordingId={initialRecordingId}
        onNavigateHome={onNavigateHome}
      />
    </CourseRecordingsKeepAlive>
  );
}
