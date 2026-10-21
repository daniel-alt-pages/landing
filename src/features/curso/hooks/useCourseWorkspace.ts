'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CourseDoc } from '../types/courseTypes';
import {
  broadcastCourseSelection,
  readSelectedCourseId,
  writeSelectedCourseId,
} from '../lib/courseEntitlements';
import {
  fetchEntitledCourseById,
  fetchCourseRecordingsFallback,
  peekCachedCourseById,
} from '../lib/courseFirestore';
import { shouldLoadCourseFromLocal } from '../lib/courseLocalData';
import { isCoursePublished } from '../lib/courseMappers';
import { peekCoursePanelSnapshot } from '../lib/coursePanelCache';
import { useCourseEntitlementsContext } from '../context/CourseEntitlementsProvider';
import { clearCourseSessionCaches } from '../lib/clearCourseSessionCaches';
import { AsyncTimeoutError, withTimeout } from '@shared/lib/withTimeout';

const COURSE_EVENT = 'sg-student-course';
/** Evita skeleton eterno si Firestore/getDoc cuelga en prod. */
const COURSE_LOAD_TIMEOUT_MS = 12_000;

function resolveBootCourseId(courseIds: string[]): string {
  if (!courseIds.length) return '';
  const stored = readSelectedCourseId();
  if (stored && courseIds.includes(stored)) return stored;
  return courseIds[0];
}

function peekEntitledPanelSnapshot(courseId: string, allowedCourseIds: string[]) {
  if (!courseId || !allowedCourseIds.includes(courseId)) return null;
  return peekCoursePanelSnapshot(courseId);
}

export function useCourseWorkspace() {
  const { entitlements, loading: entLoading } = useCourseEntitlementsContext();
  const courseIds = useMemo(
    () => entitlements?.courses.map((c) => c.courseId) ?? [],
    [entitlements],
  );
  const entitlementsReady = !entLoading && Boolean(entitlements);

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [course, setCourse] = useState<CourseDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entitlementsReady) {
      setSelectedCourseId('');
      setCourse(null);
      setLoading(entLoading);
      setRefreshing(false);
      setFromCache(false);
      setError(null);
      return;
    }

    if (!courseIds.length) {
      clearCourseSessionCaches();
      setSelectedCourseId('');
      setCourse(null);
      setLoading(false);
      setRefreshing(false);
      setFromCache(false);
      setError(null);
      return;
    }

    const nextId = resolveBootCourseId(courseIds);
    const stored = readSelectedCourseId();
    if (stored && !courseIds.includes(stored)) {
      clearCourseSessionCaches({ keepSelectedCourse: false });
    }

    setSelectedCourseId(nextId);
    writeSelectedCourseId(nextId);
  }, [courseIds, entLoading, entitlementsReady]);

  useEffect(() => {
    const onCourse = (e: Event) => {
      const id = (e as CustomEvent<{ courseId?: string }>).detail?.courseId;
      if (id && courseIds.includes(id)) setSelectedCourseId(id);
    };
    window.addEventListener(COURSE_EVENT, onCourse);
    return () => window.removeEventListener(COURSE_EVENT, onCourse);
  }, [courseIds]);

  const loadCourse = useCallback(
    async (courseId: string) => {
      if (!entitlementsReady || !courseIds.length) {
        setCourse(null);
        setLoading(false);
        return;
      }

      if (!courseId || !courseIds.includes(courseId)) {
        setCourse(null);
        setLoading(false);
        setError('No tienes acceso a este curso.');
        return;
      }

      const cached = peekCachedCourseById(courseId, courseIds);
      const panelCached = peekEntitledPanelSnapshot(courseId, courseIds);
      const instant = cached ?? panelCached?.course ?? null;

      if (instant) {
        setCourse(instant);
        setError(null);
        setLoading(false);
        setFromCache(true);
        setRefreshing(true);
      } else {
        setLoading(true);
        setRefreshing(false);
        setFromCache(false);
        setError(null);
      }

      try {
        let doc = await withTimeout(
          fetchEntitledCourseById(courseId, courseIds),
          COURSE_LOAD_TIMEOUT_MS,
          'Curso timeout',
        );
        if (doc && !isCoursePublished(doc)) {
          setError('Este curso aún no está publicado.');
          setCourse(null);
          return;
        }
        if (doc && !doc.recordings.length) {
          const fallback = await withTimeout(
            fetchCourseRecordingsFallback(courseId),
            6_000,
            'Recordings fallback timeout',
          ).catch(() => [] as CourseDoc['recordings']);
          if (fallback.length) {
            doc = { ...doc, recordings: fallback };
          }
        }
        setCourse(doc);
        setFromCache(false);
        if (!doc) {
          setError(
            shouldLoadCourseFromLocal()
              ? 'No encontramos el JSON local del curso. Ejecuta npm run data:ensure-local y npm run data:link-local.'
              : 'No tienes acceso al contenido de este curso.',
          );
        }
      } catch (err) {
        if (!instant) {
          setError(
            err instanceof AsyncTimeoutError
              ? 'La carga del curso tardó demasiado. Reintenta.'
              : 'No pudimos cargar el curso.',
          );
          setCourse(null);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [courseIds, entitlementsReady],
  );

  useEffect(() => {
    if (!entitlementsReady) return;
    void loadCourse(selectedCourseId);
  }, [entitlementsReady, loadCourse, selectedCourseId]);

  const selectCourse = useCallback(
    (courseId: string) => {
      if (!courseIds.includes(courseId)) return;
      setSelectedCourseId(courseId);
      writeSelectedCourseId(courseId);
      broadcastCourseSelection(courseId);
    },
    [courseIds],
  );

  const hasInstantCourse =
    Boolean(course) ||
    (selectedCourseId &&
      courseIds.includes(selectedCourseId) &&
      (Boolean(peekCachedCourseById(selectedCourseId, courseIds)) ||
        Boolean(peekEntitledPanelSnapshot(selectedCourseId, courseIds)?.course)));

  const initialLoading = entitlementsReady && !hasInstantCourse && loading;

  return {
    entitlements,
    courseIds,
    selectedCourseId,
    selectCourse,
    course,
    entitlementsLoading: entLoading,
    courseLoading: loading,
    loading: initialLoading,
    initialLoading,
    refreshing,
    fromCache,
    error,
    reload: () => loadCourse(selectedCourseId),
  };
}
