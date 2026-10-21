'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  studentToolsGet,
  studentToolsUpdate,
  subscribeStudentTools,
  type CourseFavoritesState,
} from '../lib/studentToolsStore';

const EMPTY_FAVORITES: CourseFavoritesState = { recordingIds: [], materialIds: [] };

export function useCourseFavorites(courseId: string | null) {
  const [, bump] = useState(0);

  useEffect(() => {
    if (!courseId) return;
    return subscribeStudentTools(courseId, () => bump((n) => n + 1));
  }, [courseId]);

  const favorites = courseId ? studentToolsGet(courseId).favorites : EMPTY_FAVORITES;
  const recordingFavoriteCount = favorites.recordingIds.length;
  const materialFavoriteCount = favorites.materialIds.length;

  const mutate = useCallback(
    (updater: (prev: CourseFavoritesState) => CourseFavoritesState) => {
      if (!courseId) return;
      studentToolsUpdate(courseId, (prev) => ({
        ...prev,
        favorites: updater(prev.favorites),
      }));
    },
    [courseId],
  );

  const toggleRecordingFavorite = useCallback(
    (recordingId: string) => {
      mutate((f) => {
        const set = new Set(f.recordingIds);
        if (set.has(recordingId)) set.delete(recordingId);
        else set.add(recordingId);
        return { ...f, recordingIds: [...set] };
      });
    },
    [mutate],
  );

  const toggleMaterialFavorite = useCallback(
    (materialId: string) => {
      mutate((f) => {
        const set = new Set(f.materialIds);
        if (set.has(materialId)) set.delete(materialId);
        else set.add(materialId);
        return { ...f, materialIds: [...set] };
      });
    },
    [mutate],
  );

  const isRecordingFavorite = useCallback(
    (id: string) => favorites.recordingIds.includes(id),
    [favorites.recordingIds],
  );

  const isMaterialFavorite = useCallback(
    (id: string) => favorites.materialIds.includes(id),
    [favorites.materialIds],
  );

  return {
    favorites,
    recordingFavoriteCount,
    materialFavoriteCount,
    toggleRecordingFavorite,
    toggleMaterialFavorite,
    isRecordingFavorite,
    isMaterialFavorite,
  };
}
