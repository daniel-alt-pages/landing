'use client';

import { useMemo } from 'react';
import type { CourseDoc, CourseSectionTab } from '../types/courseTypes';

export type CourseSearchResult = {
  id: string;
  kind: 'recording' | 'material' | 'class';
  title: string;
  subtitle?: string;
  tab: CourseSectionTab;
  recordingId?: string;
};

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function useCourseSearch(course: CourseDoc | null, query: string) {
  const index = useMemo((): CourseSearchResult[] => {
    if (!course) return [];
    const items: CourseSearchResult[] = [];

    for (const rec of course.recordings) {
      if (rec.visibleToStudents === false) continue;
      items.push({
        id: `rec-${rec.id}`,
        kind: 'recording',
        title: rec.title,
        subtitle: rec.area ?? rec.classType,
        tab: 'grabaciones',
        recordingId: rec.id,
      });
    }

    for (const mat of course.materials) {
      if (mat.visible === false) continue;
      items.push({
        id: `mat-${mat.id}`,
        kind: 'material',
        title: mat.label,
        subtitle: mat.description ?? mat.kind,
        tab: 'materiales',
      });
    }

    for (const link of course.classLinks) {
      if (link.visible === false) continue;
      items.push({
        id: `cls-${link.id}`,
        kind: 'class',
        title: link.label,
        subtitle: link.topic,
        tab: 'clases',
      });
    }

    return items;
  }, [course]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q || q.length < 2) return [];
    return index.filter((item) => {
      const haystack = normalize([item.title, item.subtitle ?? ''].join(' '));
      return haystack.includes(q);
    });
  }, [index, query]);

  return { results, hasQuery: query.trim().length >= 2 };
}
