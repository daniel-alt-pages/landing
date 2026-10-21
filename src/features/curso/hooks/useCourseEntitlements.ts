'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, waitForAuth } from '@features/auth/lib/firebase';
import { getStoredStudentId } from '@/lib/studentSession';
import { withTimeout } from '@shared/lib/withTimeout';
import type { CourseEntitlementsResult, CourseIdentity } from '../types/courseTypes';
import {
  resolveStudentEntitlements,
  buildIdentityFromSession,
  buildIdentityFromSessionAsync,
  peekCachedStudentEntitlements,
  readSimulacroPanelEnabled,
  writeCachedCourseNavVisible,
} from '../lib/courseEntitlements';
import { shouldResolveCourseAccess } from '../lib/courseRollout';
import { hasRealGoogleAuthSync, waitForCourseGoogleAuth } from '../lib/courseAuthReal';

const ENTITLEMENTS_TIMEOUT_MS = 18_000;

export function useCourseEntitlements(identityOverrides?: Partial<CourseIdentity>) {
  const [activeProfileId, setActiveProfileId] = useState(() =>
    typeof window !== 'undefined' ? getStoredStudentId() : '',
  );

  useEffect(() => {
    const syncProfile = () => setActiveProfileId(getStoredStudentId());
    window.addEventListener('sg-student-profile', syncProfile);
    return () => window.removeEventListener('sg-student-profile', syncProfile);
  }, []);

  const cacheKey = useMemo(
    () =>
      [
        activeProfileId,
        identityOverrides?.documento?.trim() || '',
        identityOverrides?.emailLower?.trim() || '',
        identityOverrides?.studentId?.trim() || '',
      ].join('|'),
    [
      activeProfileId,
      identityOverrides?.documento,
      identityOverrides?.emailLower,
      identityOverrides?.studentId,
    ],
  );

  const cachedOnMount = useMemo(
    () => peekCachedStudentEntitlements(identityOverrides),
    [cacheKey, identityOverrides],
  );

  const [entitlements, setEntitlements] = useState<CourseEntitlementsResult | null>(
    () => cachedOnMount,
  );
  const [loading, setLoading] = useState(() => !cachedOnMount);
  const [error, setError] = useState<string | null>(null);
  const refreshGenRef = useRef(0);

  const refresh = useCallback(async () => {
    const gen = ++refreshGenRef.current;
    const cached = peekCachedStudentEntitlements(identityOverrides);
    const hadData = Boolean(cached?.courses.length);

    if (!hadData) setLoading(true);
    setError(null);

    try {
      const hasGoogle = hasRealGoogleAuthSync() || (await waitForCourseGoogleAuth());
      const syncIdentity = buildIdentityFromSession(identityOverrides);
      if (!hasGoogle || !shouldResolveCourseAccess(syncIdentity)) {
        writeCachedCourseNavVisible(false);
        const hasSimPanel = readSimulacroPanelEnabled();
        const empty: CourseEntitlementsResult = {
          courses: [],
          mode: 'results_only',
          hasSimulacros: hasSimPanel,
          features: {
            miCurso: false,
            seguimiento: false,
            herramientas: hasSimPanel,
            panelSimulacro: hasSimPanel,
          },
        };
        if (gen === refreshGenRef.current) setEntitlements(empty);
        return;
      }

      const identity = await buildIdentityFromSessionAsync(identityOverrides);
      const result = await withTimeout(
        resolveStudentEntitlements(identity),
        ENTITLEMENTS_TIMEOUT_MS,
        'Entitlements timeout',
      );
      if (gen !== refreshGenRef.current) return;
      setEntitlements(result);
    } catch {
      if (gen !== refreshGenRef.current) return;
      setError('No pudimos verificar tu acceso al curso.');
      if (!hadData && cached) {
        setEntitlements(cached);
      } else if (!hadData) {
        setEntitlements(null);
      }
    } finally {
      if (gen === refreshGenRef.current) setLoading(false);
    }
  }, [cacheKey, identityOverrides]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    let authInitialized = false;

    const unsub = onAuthStateChanged(auth, (user) => {
      if (!authInitialized || cancelled) return;
      if (user && !user.isAnonymous) {
        void refresh();
        return;
      }
      writeCachedCourseNavVisible(false);
      setEntitlements(null);
      setLoading(false);
    });

    void waitForAuth()
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
        authInitialized = true;
        if (hasRealGoogleAuthSync()) void refresh();
      });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [refresh]);

  return {
    entitlements,
    loading,
    error,
    refresh,
    hasCourses: (entitlements?.courses.length ?? 0) > 0,
    mode: entitlements?.mode ?? 'results_only',
  };
}
