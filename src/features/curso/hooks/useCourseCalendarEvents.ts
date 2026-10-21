'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@features/auth/lib/firebase';
import { fetchCourseCalendarEvents } from '../lib/fetchCourseCalendarEvents';
import type { CourseCalendarEventDto } from '../lib/courseCalendarTypes';
import {
  CACHE_TTL_COURSE_CALENDAR_MS,
  CACHE_TTL_COURSE_RUNTIME_MS,
  COURSE_CALENDAR_POLL_MS,
  courseCacheGet,
  courseCacheSet,
  courseCalendarSnapshotCacheKey,
  courseCalendarWeekCacheKey,
  courseRuntimeCacheKey,
} from '../lib/courseCache';
import { peekCoursePanelSnapshot } from '../lib/coursePanelCache';
import {
  fetchCourseCalendarSnapshot,
  fetchCourseRuntime,
  isLocalCourseCalendarApiEnabled,
  peekCachedCalendarEvents,
  peekCachedCourseRuntime,
} from '../lib/courseRuntimeFirestore';
import { ensureCourseFirestoreAuth } from '../lib/ensureCourseFirestoreAuth';
import type { CourseCalendarSnapshotDoc, CourseRuntimeDoc } from '../types/courseRuntimeTypes';
import {
  fetchLocalCourseCalendarSnapshot,
  filterCalendarEventsInBounds,
} from '../lib/courseLocalCalendar';
import { fetchAttendanceManifest } from '../lib/courseAttendanceLocal';
import {
  bogotaCourseApiRange,
  bogotaTodayKey,
  clampWeekIndex,
  formatAcademicWeekNavLabel,
  listVacacionalAcademicWeekRanges,
  resolveCourseDateBounds,
  weekIndexForDate,
  type BogotaWeekRange,
} from '../lib/courseVacacionalWeek';
import {
  isVacacionalCalendarDisplayEvent,
} from '../lib/courseVacacionalAttendance';
import { normalizeVacacionalCalendarEvents } from '../lib/courseVacacionalSummaryNormalize';
import { withTimeout } from '@shared/lib/withTimeout';

const CALENDAR_FIRESTORE_TIMEOUT_MS = 12_000;

type UseCourseCalendarEventsOptions = {
  courseId?: string;
  enabled?: boolean;
  includeCancelled?: boolean;
  courseStartDate?: string;
  courseEndDate?: string;
};

function readCachedSnapshotEvents(
  courseId: string,
  calendarVersion: number,
): CourseCalendarEventDto[] | null {
  const key = courseCalendarSnapshotCacheKey(courseId, calendarVersion);
  const cached = courseCacheGet<CourseCalendarSnapshotDoc>(key);
  if (cached?.events?.length) return cached.events;
  const legacy = courseCacheGet<{ events: CourseCalendarEventDto[] }>(key);
  return legacy?.events?.length ? legacy.events : null;
}

/** Calendario: Firestore versionado (default) u opt-in ICS local (:3099). */
export function useCourseCalendarEvents(options: UseCourseCalendarEventsOptions = {}) {
  const {
    courseId = '',
    enabled = true,
    includeCancelled = false,
    courseStartDate,
    courseEndDate,
  } = options;

  const useLocalApi = isLocalCourseCalendarApiEnabled();
  const useFirestore = Boolean(courseId) && !useLocalApi;

  const bounds = useMemo(
    () => resolveCourseDateBounds(courseStartDate, courseEndDate),
    [courseStartDate, courseEndDate],
  );

  const weeks = useMemo(
    () => (courseId ? listVacacionalAcademicWeekRanges(courseId, bounds) : []),
    [bounds, courseId],
  );
  const courseRange = useMemo(() => bogotaCourseApiRange(bounds), [bounds]);
  const legacyCacheKey = courseCalendarWeekCacheKey(courseRange.start, courseRange.end);

  const [weekIndex, setWeekIndex] = useState(() =>
    clampWeekIndex(weekIndexForDate(weeks, bogotaTodayKey()), weeks),
  );
  const [events, setEvents] = useState<CourseCalendarEventDto[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [runtimeVersion, setRuntimeVersion] = useState<number | null>(null);
  const [attendanceVersion, setAttendanceVersion] = useState<number | null>(null);
  const [authTick, setAuthTick] = useState(0);
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const runtimeVersionRef = useRef<number | null>(null);
  const initialLoadDoneRef = useRef(false);
  const [dataSource, setDataSource] = useState<'live' | 'static' | null>(null);

  const week: BogotaWeekRange = weeks[weekIndex] ?? weeks[0] ?? { start: '', end: '', keys: [] };

  useEffect(() => {
    setWeekIndex((prev) => clampWeekIndex(weekIndexForDate(weeks, bogotaTodayKey()), weeks));
  }, [weeks]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => setAuthTick((t) => t + 1));
    return () => unsub();
  }, []);

  const filterEvents = useCallback(
    (items: CourseCalendarEventDto[]) => {
      let scoped = normalizeVacacionalCalendarEvents(items);
      scoped = filterCalendarEventsInBounds(
        scoped,
        bounds.start,
        bounds.end,
        includeCancelled,
      );
      if (!includeCancelled) {
        scoped = scoped.filter((event) => event.status !== 'cancelled');
      }
      if (courseId === 'preicfes-sg26') {
        scoped = scoped.filter((event) => isVacacionalCalendarDisplayEvent(event, courseId));
      }
      return scoped;
    },
    [bounds.end, bounds.start, courseId, includeCancelled],
  );

  const applyRuntime = useCallback((runtime: CourseRuntimeDoc) => {
    setRuntimeVersion(runtime.calendarVersion);
    runtimeVersionRef.current = runtime.calendarVersion;
    setAttendanceVersion(runtime.attendanceVersion ?? null);
    courseCacheSet(courseRuntimeCacheKey(runtime.courseId), runtime, CACHE_TTL_COURSE_RUNTIME_MS);
  }, []);

  const applyEvents = useCallback(
    (next: CourseCalendarEventDto[], source: 'live' | 'static') => {
      const filtered = filterEvents(next);
      setEvents(filtered);
      eventsRef.current = filtered;
      setDataSource(source);
      setError(null);
      setNeedsAuth(false);
      setLastSyncedAt(Date.now());
      if (source === 'live' && useLocalApi) {
        courseCacheSet(legacyCacheKey, filtered, CACHE_TTL_COURSE_CALENDAR_MS);
      }
    },
    [filterEvents, legacyCacheKey, useLocalApi],
  );

  const reloadFromStaticSnapshot = useCallback(async (): Promise<boolean> => {
    if (!courseId) return false;
    const snapshot = await fetchLocalCourseCalendarSnapshot(courseId);
    if (!snapshot?.events?.length) return false;
    applyEvents(snapshot.events, 'static');
    return true;
  }, [applyEvents, courseId]);

  const hydrateFromVersionedCache = useCallback(
    (runtime: CourseRuntimeDoc): boolean => {
      const cachedEvents = readCachedSnapshotEvents(courseId, runtime.calendarVersion);
      if (!cachedEvents?.length) return false;
      applyRuntime(runtime);
      applyEvents(cachedEvents, 'live');
      return true;
    },
    [applyEvents, applyRuntime, courseId],
  );

  const reloadFromLocalApi = useCallback(
    async (force = false) => {
      const isBackground = force && initialLoadDoneRef.current;

      if (!force) {
        const cached = courseCacheGet<CourseCalendarEventDto[]>(legacyCacheKey);
        if (cached?.length) {
          applyEvents(cached, 'live');
          setLoading(false);
          initialLoadDoneRef.current = true;
        }
      }

      setSyncing(true);
      if (!isBackground && !eventsRef.current.length) setLoading(true);

      try {
        const data = await fetchCourseCalendarEvents({
          start: courseRange.apiStart,
          end: courseRange.apiEnd,
          includeCancelled,
        });
        if (data.success && data.events?.length) {
          applyEvents(data.events, 'live');
          if (courseId) {
            const manifest = await fetchAttendanceManifest(courseId);
            const v =
              manifest?.attendanceVersion ?? manifest?.sessions?.length ?? null;
            if (v != null) setAttendanceVersion(v);
          }
          return;
        }

        const fromStatic = await reloadFromStaticSnapshot();
        if (fromStatic) return;

        if (!eventsRef.current.length) {
          setEvents([]);
          const needsCalendarAuth = !data.success && Boolean(data.needsAuth);
          setError(
            data.success
              ? 'Calendario vacío. Ejecuta npm run course:export-calendar.'
              : data.error || 'No pudimos cargar el calendario.',
          );
          setNeedsAuth(needsCalendarAuth);
        }
      } catch {
        const fromStatic = await reloadFromStaticSnapshot();
        if (!fromStatic && !eventsRef.current.length) {
          setEvents([]);
          setError('Sin calendario en vivo. Usa snapshot local o npm run dev.');
        }
      } finally {
        setLoading(false);
        setSyncing(false);
        initialLoadDoneRef.current = true;
      }
    },
    [
      applyEvents,
      courseId,
      includeCancelled,
      legacyCacheKey,
      courseRange.apiStart,
      courseRange.apiEnd,
      reloadFromStaticSnapshot,
    ],
  );

  const reloadFromFirestore = useCallback(
    async (force = false) => {
      if (!courseId) return;

      const isBackground = force && initialLoadDoneRef.current;
      setError(null);
      setNeedsAuth(false);

      if (!(await ensureCourseFirestoreAuth('useCourseCalendarEvents'))) {
        if (!eventsRef.current.length) {
          await reloadFromStaticSnapshot();
          if (!eventsRef.current.length) {
            setError('Inicia sesión con Google para ver el calendario del curso.');
            setNeedsAuth(true);
          }
        }
        setLoading(false);
        setSyncing(false);
        initialLoadDoneRef.current = true;
        return;
      }

      if (!force) {
        const cachedRuntime = peekCachedCourseRuntime(courseId);
        if (cachedRuntime && hydrateFromVersionedCache(cachedRuntime)) {
          setLoading(false);
          initialLoadDoneRef.current = true;
        } else {
          const panelBoot = peekCoursePanelSnapshot(courseId);
          const bootEvents = peekCachedCalendarEvents(courseId);
          if (panelBoot?.calendarVersion != null && bootEvents.length) {
            setRuntimeVersion(panelBoot.calendarVersion);
            runtimeVersionRef.current = panelBoot.calendarVersion;
            setAttendanceVersion(panelBoot.attendanceVersion ?? null);
            applyEvents(bootEvents, 'live');
            setLoading(false);
            initialLoadDoneRef.current = true;
          }
        }
      }

      setSyncing(true);
      if (!isBackground && !eventsRef.current.length) setLoading(true);

      try {
        const runtime = await withTimeout(
          fetchCourseRuntime(courseId, { force }),
          CALENDAR_FIRESTORE_TIMEOUT_MS,
          'Calendario runtime timeout',
        );
        if (!runtime) {
          const fromStatic = await reloadFromStaticSnapshot();
          if (!fromStatic && !eventsRef.current.length) {
            setEvents([]);
            setError('Calendario pendiente de sync en Firebase. Ejecuta course:sync-calendar.');
          }
          return;
        }

        applyRuntime(runtime);

        const versionUnchanged =
          force &&
          runtime.calendarVersion === runtimeVersionRef.current &&
          eventsRef.current.length > 0;

        if (versionUnchanged) {
          setLastSyncedAt(Date.now());
          return;
        }

        if (!force && hydrateFromVersionedCache(runtime)) {
          setLastSyncedAt(Date.now());
        }

        const payload = await withTimeout(
          fetchCourseCalendarSnapshot(courseId, runtime.calendarVersion),
          CALENDAR_FIRESTORE_TIMEOUT_MS,
          'Calendario snapshot timeout',
        );
        const snapshotMatchesRuntime =
          payload?.snapshot?.events?.length &&
          payload.snapshot.version === runtime.calendarVersion;
        if (snapshotMatchesRuntime) {
          const filtered = filterEvents(payload.snapshot.events);
          if (filtered.length) {
            applyEvents(payload.snapshot.events, 'live');
            courseCacheSet(
              courseCalendarSnapshotCacheKey(courseId, payload.snapshot.version),
              payload.snapshot,
              Number.MAX_SAFE_INTEGER,
            );
            return;
          }
        }

        const fromStatic = await reloadFromStaticSnapshot();
        if (fromStatic) return;

        if (!eventsRef.current.length) {
          setEvents([]);
          setError(
            payload?.snapshot?.events?.length
              ? 'Calendario sin clases visibles tras filtros. Revisa fechas del curso o sync.'
              : 'Snapshot de calendario no disponible en Firebase.',
          );
        }
      } catch {
        const fromStatic = await reloadFromStaticSnapshot();
        if (!fromStatic && !eventsRef.current.length) {
          setEvents([]);
          setError('No pudimos cargar el calendario desde Firebase.');
        }
      } finally {
        setLoading(false);
        setSyncing(false);
        initialLoadDoneRef.current = true;
      }
    },
    [applyEvents, applyRuntime, courseId, hydrateFromVersionedCache, reloadFromStaticSnapshot],
  );

  const reload = useCallback(
    async (force = false) => {
      if (!enabled) return;
      if (useFirestore) {
        await reloadFromFirestore(force);
        return;
      }
      await reloadFromLocalApi(force);
    },
    [enabled, useFirestore, reloadFromFirestore, reloadFromLocalApi],
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void reload(false);
  }, [enabled, courseId, useFirestore, legacyCacheKey, reload, authTick]);

  useEffect(() => {
    if (!enabled || !useFirestore) return;
    const id = window.setInterval(() => void reload(true), COURSE_CALENDAR_POLL_MS);
    return () => window.clearInterval(id);
  }, [enabled, useFirestore, courseId, reload]);

  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void reload(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [enabled, reload]);

  const goToTodayWeek = useCallback(() => {
    setWeekIndex(clampWeekIndex(weekIndexForDate(weeks, bogotaTodayKey()), weeks));
  }, [weeks]);

  const goPrevWeek = useCallback(() => {
    setWeekIndex((prev) => clampWeekIndex(prev - 1, weeks));
  }, [weeks]);

  const goNextWeek = useCallback(() => {
    setWeekIndex((prev) => clampWeekIndex(prev + 1, weeks));
  }, [weeks]);

  return {
    bounds,
    weeks,
    weekIndex,
    week,
    setWeekIndex: (idx: number) => setWeekIndex(clampWeekIndex(idx, weeks)),
    goToTodayWeek,
    goPrevWeek,
    goNextWeek,
    events,
    loading,
    syncing,
    error,
    needsAuth,
    lastSyncedAt,
    runtimeVersion,
    attendanceVersion,
    dataSource,
    reload: () => reload(true),
  };
}
