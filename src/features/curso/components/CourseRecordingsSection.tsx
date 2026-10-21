'use client';

import { useEffect, useMemo, useState } from 'react';
import RecordingsCatalogView from '@features/recordings/components/RecordingsCatalogView';
import SgEmptyState from '@shared/components/SgEmptyState';
import { SgSkeletonCard } from '@shared/components/SgSkeleton';
import { Clapperboard } from 'lucide-react';
import { useCourseVacacionalCalendar } from '../context/CourseVacacionalCalendarContext';
import { courseRecordingsToSim } from '../lib/courseRecordingsCatalog';
import { buildRecordingGeminiNotesIndex } from '../lib/courseRecordingGeminiNotes';
import { mergeVacacionalRecordingsCatalog } from '../lib/courseVacacionalRecordings';
import { courseSectionPath } from '../lib/courseRoutePaths';
import { useCourseRecordingsPrecache } from '../hooks/useCourseRecordingsPrecache';
import { useCourseTheme } from '../hooks/useCourseTheme';
import type { CourseRecording } from '../types/courseTypes';

/** Evita skeleton infinito si Firestore/calendario cuelga. */
const CALENDAR_SKELETON_MAX_MS = 8_000;

type CourseRecordingsSectionProps = {
  courseId: string;
  courseName?: string;
  recordings: CourseRecording[];
  active?: boolean;
  showVacacionalCalendar?: boolean;
  linkGeminiFromCalendar?: boolean;
  initialRecordingId?: string | null;
  onNavigateHome?: () => void;
};

export default function CourseRecordingsSection({
  courseId,
  courseName,
  recordings,
  active = true,
  showVacacionalCalendar = false,
  linkGeminiFromCalendar = false,
  initialRecordingId,
  onNavigateHome,
}: CourseRecordingsSectionProps) {
  const { dark } = useCourseTheme();
  const { enabled, events, loading: calendarLoading } = useCourseVacacionalCalendar();
  const [calendarWaitExpired, setCalendarWaitExpired] = useState(false);

  // Solo loading inicial — syncing de fondo no debe bloquear el catálogo.
  const waitingCalendar = showVacacionalCalendar && enabled && calendarLoading;

  useEffect(() => {
    if (!waitingCalendar) {
      setCalendarWaitExpired(false);
      return;
    }
    const t = window.setTimeout(() => setCalendarWaitExpired(true), CALENDAR_SKELETON_MAX_MS);
    return () => window.clearTimeout(t);
  }, [waitingCalendar]);

  const mergedRecordings = useMemo(() => {
    if (!showVacacionalCalendar || !enabled) {
      return mergeVacacionalRecordingsCatalog(recordings, [], courseId);
    }
    return mergeVacacionalRecordingsCatalog(recordings, events, courseId);
  }, [recordings, showVacacionalCalendar, enabled, events, courseId]);

  const simRecordings = useMemo(
    () => courseRecordingsToSim(mergedRecordings),
    [mergedRecordings],
  );

  useCourseRecordingsPrecache(courseId, simRecordings, String(mergedRecordings.length));

  const calendarEvents = enabled ? events : [];

  const geminiNotesIndex = useMemo(
    () =>
      linkGeminiFromCalendar && calendarEvents.length
        ? buildRecordingGeminiNotesIndex(calendarEvents)
        : new Map(),
    [linkGeminiFromCalendar, calendarEvents],
  );

  if (!simRecordings.length) {
    if (waitingCalendar && !calendarWaitExpired) {
      return <SgSkeletonCard lines={5} />;
    }
    return (
      <SgEmptyState
        icon={Clapperboard}
        title="Sin grabaciones aún"
        message="Cuando se publiquen clases grabadas, las verás aquí organizadas por área."
      />
    );
  }

  return (
    <RecordingsCatalogView
      simulationId={courseId}
      courseName={courseName}
      recordings={simRecordings}
      homeHref={courseSectionPath('resumen')}
      onNavigateHome={onNavigateHome}
      variant={dark ? 'dark' : 'light'}
      catalogMode="course"
      initialRecordingId={initialRecordingId ?? undefined}
      calendarEvents={calendarEvents}
      calendarLoading={linkGeminiFromCalendar && calendarLoading}
      geminiNotesIndex={geminiNotesIndex}
      sectionInactive={!active}
    />
  );
}
