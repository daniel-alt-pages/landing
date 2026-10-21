import type { AppConfig } from '@features/simulacro/lib/firestoreService';
import {
  COURSE_CACHE_PREFIX,
  COURSE_CALENDAR_CACHE_PREFIX,
  courseCacheClearPrefix,
  courseDocCacheKey,
  courseMetricsCacheKey,
  courseAccessCacheKey,
} from './courseCache';

export function checkCourseVersions(
  config: Pick<AppConfig, 'coursesVersion' | 'courseVersions' | 'courseMetricsVersions'>,
): void {
  if (typeof window === 'undefined') return;

  try {
    const localCoursesVersion = localStorage.getItem('sg_courses_version');
    if (
      config.coursesVersion &&
      localCoursesVersion &&
      localCoursesVersion !== config.coursesVersion
    ) {
      courseCacheClearPrefix(COURSE_CACHE_PREFIX);
    }
    if (config.coursesVersion) {
      localStorage.setItem('sg_courses_version', config.coursesVersion);
    }

    const rawCourseVersions = localStorage.getItem('sg_course_versions');
    const localCourseVersions: Record<string, number> = rawCourseVersions
      ? JSON.parse(rawCourseVersions)
      : {};

    if (config.courseVersions) {
      Object.entries(config.courseVersions).forEach(([courseId, serverVer]) => {
        const localVer = localCourseVersions[courseId];
        if (localVer != null && localVer !== serverVer) {
          localStorage.removeItem(courseDocCacheKey(courseId));
          courseCacheClearPrefix(COURSE_CALENDAR_CACHE_PREFIX);
        }
      });
      localStorage.setItem('sg_course_versions', JSON.stringify(config.courseVersions));
    }

    const rawMetricsVersions = localStorage.getItem('sg_course_metrics_versions');
    const localMetricsVersions: Record<string, number> = rawMetricsVersions
      ? JSON.parse(rawMetricsVersions)
      : {};

    if (config.courseMetricsVersions) {
      Object.entries(config.courseMetricsVersions).forEach(([courseId, serverVer]) => {
        const localVer = localMetricsVersions[courseId];
        if (localVer != null && localVer !== serverVer) {
          const prefix = courseMetricsCacheKey(courseId, '');
          courseCacheClearPrefix(prefix.replace(/_$/, ''));
        }
      });
      localStorage.setItem(
        'sg_course_metrics_versions',
        JSON.stringify(config.courseMetricsVersions),
      );
    }
  } catch {
    /* ignore storage errors */
  }
}

export function invalidateCourseAccessCache(identityKey: string): void {
  localStorage.removeItem(courseAccessCacheKey(identityKey));
}

export function invalidateCourseDocCache(courseId: string): void {
  localStorage.removeItem(courseDocCacheKey(courseId));
}
