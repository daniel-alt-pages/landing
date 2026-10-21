'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CourseRecording } from '../types/courseTypes';
import {
  studentToolsGet,
  studentToolsUpdate,
  subscribeStudentTools,
} from '../lib/studentToolsStore';

type ProgressRecording = Pick<CourseRecording, 'id' | 'title' | 'visibleToStudents' | 'sortOrder'>;

export function useCourseProgress(
  courseId: string | null,
  recordings: ProgressRecording[],
) {
  const [, bump] = useState(0);

  useEffect(() => {
    if (!courseId) return;
    return subscribeStudentTools(courseId, () => bump((n) => n + 1));
  }, [courseId]);

  const progress = courseId
    ? studentToolsGet(courseId).progress
    : { watchedIds: [], inProgressId: null, lastOpenedAt: null };

  const visibleRecordings = useMemo(
    () => recordings.filter((r) => r.visibleToStudents !== false),
    [recordings],
  );

  const watchedSet = useMemo(() => new Set(progress.watchedIds), [progress.watchedIds]);

  const percentComplete = useMemo(() => {
    if (!visibleRecordings.length) return 0;
    const watched = visibleRecordings.filter((r) => watchedSet.has(r.id)).length;
    return Math.round((watched / visibleRecordings.length) * 100);
  }, [visibleRecordings, watchedSet]);

  const watchedVisibleCount = useMemo(
    () => visibleRecordings.filter((r) => watchedSet.has(r.id)).length,
    [visibleRecordings, watchedSet],
  );

  const continueWatching = useMemo((): ProgressRecording | null => {
    const sorted = [...visibleRecordings].sort((a, b) => a.sortOrder - b.sortOrder);

    if (progress.inProgressId) {
      const inProgress = sorted.find((r) => r.id === progress.inProgressId);
      if (inProgress && !watchedSet.has(inProgress.id)) return inProgress;
    }

    return sorted.find((r) => !watchedSet.has(r.id)) ?? null;
  }, [progress.inProgressId, visibleRecordings, watchedSet]);

  const markOpened = useCallback(
    (recordingId: string) => {
      if (!courseId) return;
      studentToolsUpdate(courseId, (prev) => {
        const watched = new Set(prev.progress.watchedIds);
        watched.add(recordingId);
        return {
          ...prev,
          progress: {
            watchedIds: [...watched],
            inProgressId: recordingId,
            lastOpenedAt: Date.now(),
          },
        };
      });
    },
    [courseId],
  );

  const isWatched = useCallback((id: string) => watchedSet.has(id), [watchedSet]);

  const isInProgress = useCallback(
    (id: string) => progress.inProgressId === id && !watchedSet.has(id),
    [progress.inProgressId, watchedSet],
  );

  return {
    progress,
    percentComplete,
    continueWatching,
    markOpened,
    isWatched,
    isInProgress,
    watchedCount: watchedVisibleCount,
    totalCount: visibleRecordings.length,
  };
}
