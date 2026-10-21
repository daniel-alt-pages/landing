'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { CourseSectionTab } from '../types/courseTypes';
import {
  courseBasePathForStudentCode,
  courseSectionPath,
  extractCourseStudentCodeFromPath,
  isCoursePath,
  isCourseSectionTab,
  parseCourseSectionFromPath,
} from '../lib/courseRoutePaths';

function readRecordingQueryParam(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('recording');
}

export function useCourseSectionRoute() {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [pendingRecordingId, setPendingRecordingId] = useState<string | null>(() =>
    readRecordingQueryParam(),
  );

  const tab = useMemo(() => parseCourseSectionFromPath(pathname), [pathname]);
  const studentCode = useMemo(() => extractCourseStudentCodeFromPath(pathname), [pathname]);

  useEffect(() => {
    setPendingRecordingId(readRecordingQueryParam());
  }, [pathname]);

  useEffect(() => {
    if (!isCoursePath(pathname)) return;
    const base = courseBasePathForStudentCode(studentCode);
    const rest = pathname.slice(base.length).replace(/^\//, '');
    if (!rest) return;
    const segment = rest.split('/')[0];
    if (segment === 'herramientas') {
      router.replace(courseSectionPath('resumen', null, studentCode));
      return;
    }
    if (!isCourseSectionTab(segment) || segment === 'resumen') {
      router.replace(courseSectionPath('resumen', null, studentCode));
    }
  }, [pathname, router, studentCode]);

  // Shallow routing (history API): cambiar de sección NO remonta la página,
  // así Grabaciones sigue montada (keep-alive) y el video no se reinicia.
  const navigateToTab = useCallback(
    (next: CourseSectionTab, opts?: { recordingId?: string | null }) => {
      const path = courseSectionPath(next, opts?.recordingId, studentCode);
      window.history.pushState(null, '', path);
    },
    [studentCode],
  );

  return { tab, pendingRecordingId, navigateToTab, studentCode };
}
