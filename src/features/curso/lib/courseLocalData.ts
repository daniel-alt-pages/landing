import type { CourseDoc } from '../types/courseTypes';
import { mapCourseDoc } from './courseMappers';

/** Dev / localhost: contenido del curso desde JSON estático (`public/data/courses/`). */
export function shouldLoadCourseFromLocal(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    process.env.NODE_ENV === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]'
  );
}

function pickCoursePayload(raw: unknown, courseId: string): Record<string, unknown> | null {
  if (Array.isArray(raw)) {
    const hit = raw.find(
      (item) =>
        item &&
        typeof item === 'object' &&
        String((item as { id?: string }).id || '').trim() === courseId,
    );
    return hit ? (hit as Record<string, unknown>) : null;
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const id = String(obj.id || courseId).trim();
    if (id === courseId) return obj;
  }
  return null;
}

/** `/data/courses/{courseId}.json` — servido vía `public/data` → `data-local/courses/`. */
export async function fetchLocalCourseById(courseId: string): Promise<CourseDoc | null> {
  if (!courseId || typeof window === 'undefined') return null;

  const url = `/data/courses/${encodeURIComponent(courseId)}.json`;
  try {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[courseLocal] missing', url, res.status);
      }
      return null;
    }
    const raw = (await res.json()) as unknown;
    const payload = pickCoursePayload(raw, courseId);
    if (!payload) {
      console.warn('[courseLocal] JSON sin curso', courseId);
      return null;
    }
    return mapCourseDoc(courseId, payload);
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[courseLocal] fetch failed', url, err);
    }
    return null;
  }
}
