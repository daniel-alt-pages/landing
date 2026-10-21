'use client';

import { invalidatePanelScreenCache } from '@shared/lib/panelScreenCache';
import { CACHE_VERSION, courseCacheClearPrefix } from './courseCache';
import { clearCourseMemoryCache } from './courseFirestore';
import { clearEntitlementsMemoryCache, writeCachedCourseNavVisible } from './courseEntitlements';
import { invalidateCourseRuntimeMemory } from './courseRuntimeFirestore';
import { COURSE_SESSION_STORAGE_KEYS } from '../types/courseTypes';

const CACHE_PREFIX = `${CACHE_VERSION}_course`;

/** Limpia caches de curso al cambiar usuario o cerrar sesión. */
export function clearCourseSessionCaches(options?: { keepSelectedCourse?: boolean }): void {
  if (typeof window === 'undefined') return;

  clearCourseMemoryCache();
  invalidateCourseRuntimeMemory();
  invalidatePanelScreenCache('course-panel:');
  clearEntitlementsMemoryCache();
  writeCachedCourseNavVisible(false);
  courseCacheClearPrefix(CACHE_PREFIX);

  if (!options?.keepSelectedCourse) {
    localStorage.removeItem(COURSE_SESSION_STORAGE_KEYS.selectedCourseId);
  }

  try {
    const panelKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith('course-panel:')) panelKeys.push(key);
    }
    panelKeys.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}
