import type { CourseMaterial } from '../types/courseTypes';

/** Misma fusión que MaterialesSection: curso Prismic + compilados por documento. */
export function mergeCourseMaterials(
  courseMaterials: CourseMaterial[],
  studentMaterials: CourseMaterial[],
): CourseMaterial[] {
  const seen = new Set<string>();
  const merged = [...studentMaterials, ...courseMaterials];
  return merged.filter((m) => {
    const key = m.id || m.url;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return m.visible !== false;
  });
}

export function countVisibleMaterials(
  courseMaterials: CourseMaterial[],
  studentMaterials: CourseMaterial[],
): number {
  return mergeCourseMaterials(courseMaterials, studentMaterials).length;
}
