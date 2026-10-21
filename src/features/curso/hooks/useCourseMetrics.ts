'use client';

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@features/auth/lib/firebase';
import type { CourseStudentMetrics } from '../types/courseTypes';
import { useCourseVacacionalCalendar } from '../context/CourseVacacionalCalendarContext';
import {
  computeVacacionalMetricsFromEvents,
  fetchMeetAttendanceMetrics,
} from '../lib/courseAttendanceLocal';
import {
  CACHE_TTL_COURSE_METRICS_FRESH_MS,
  CACHE_TTL_COURSE_METRICS_MS,
  courseCacheGet,
  courseCacheIsFresh,
  courseCacheSet,
  courseMetricsCacheKey,
} from '../lib/courseCache';
import { buildIdentityFromSessionAsync } from '../lib/courseEntitlements';
import { buildCoursePersonKey } from '../lib/courseAccessKeys';
import {
  fetchCourseMetrics,
  fetchFirestoreSimulacroBonuses,
} from '../lib/courseFirestore';
import { mergeSimulacroBonusesIntoMetrics } from '../lib/courseAttendancePoints';
import { readStudentDisplayName } from '../lib/courseStudentSession';
import {
  coursePanelCacheVersion,
  peekCoursePanelSnapshot,
} from '../lib/coursePanelCache';

export function useCourseMetrics(courseId: string, enabled = true) {
  const calendar = useCourseVacacionalCalendar();
  const panelVersion = coursePanelCacheVersion(
    calendar.runtimeVersion,
    calendar.attendanceVersion,
  );
  const panelSnap = useMemo(
    () => (courseId ? peekCoursePanelSnapshot(courseId, panelVersion) : null),
    [courseId, panelVersion],
  );
  const [metrics, setMetrics] = useState<CourseStudentMetrics | null>(
    () => panelSnap?.metrics ?? null,
  );
  const [loading, setLoading] = useState(() => enabled && Boolean(courseId) && !panelSnap?.metrics);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authTick, setAuthTick] = useState(0);
  const studentName = useMemo(() => readStudentDisplayName(), []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => setAuthTick((t) => t + 1));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!enabled || !courseId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      const asyncIdentity = await buildIdentityFromSessionAsync();
      const personKey = buildCoursePersonKey(asyncIdentity);
      const attendanceVersion = calendar.attendanceVersion ?? undefined;
      const cacheKey = courseMetricsCacheKey(courseId, personKey, attendanceVersion);
      const cachedMetrics =
        courseCacheGet<CourseStudentMetrics>(cacheKey) ?? panelSnap?.metrics ?? null;

      const cacheFresh =
        cachedMetrics && courseCacheIsFresh(cacheKey, CACHE_TTL_COURSE_METRICS_FRESH_MS);

      if (cachedMetrics) {
        setMetrics(cachedMetrics);
        setLoading(false);
        setRefreshing(!cacheFresh);
      } else {
        setLoading(calendar.loading && calendar.events.length === 0);
        setRefreshing(false);
      }

      if (cacheFresh) {
        setError(null);
        return;
      }

      setError(null);

      const persistMetrics = (data: CourseStudentMetrics | null) => {
        if (!data) return;
        const resolvedVersion = data.attendanceVersion ?? attendanceVersion;
        courseCacheSet(
          courseMetricsCacheKey(courseId, personKey, resolvedVersion),
          data,
          CACHE_TTL_COURSE_METRICS_MS,
        );
      };

      try {
        let resolved: CourseStudentMetrics | null = null;

        if (calendar.enabled && calendar.events.length) {
          resolved = await computeVacacionalMetricsFromEvents(
            courseId,
            asyncIdentity,
            calendar.events,
            studentName,
            Date.now(),
          );
        }

        if (!resolved) {
          resolved = await fetchMeetAttendanceMetrics(courseId, asyncIdentity, studentName);
        }

        if (!resolved) {
          resolved = await fetchCourseMetrics(courseId, asyncIdentity);
        }

        if (resolved) {
          const simBonuses = await fetchFirestoreSimulacroBonuses(courseId, asyncIdentity);
          resolved = mergeSimulacroBonusesIntoMetrics(resolved, { simulacroBonuses: simBonuses });
        }

        if (cancelled) return;

        if (resolved) {
          setMetrics(resolved);
          persistMetrics(resolved);
        } else if (!cachedMetrics) {
          setMetrics(null);
          setError('Seguimiento pendiente de sync. Ejecuta course:sync-attendance.');
        }
      } catch {
        if (cancelled) return;
        if (!cachedMetrics) {
          setMetrics(null);
          setError('No pudimos cargar tu seguimiento.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    courseId,
    enabled,
    calendar.enabled,
    calendar.events,
    calendar.runtimeVersion,
    calendar.attendanceVersion,
    calendar.loading,
    studentName,
    authTick,
    panelSnap?.metrics,
  ]);

  return {
    metrics,
    loading,
    refreshing: refreshing || calendar.syncing,
    error,
    studentName,
    hasMetrics: Boolean(metrics),
  };
}
