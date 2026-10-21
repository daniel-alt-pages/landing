/**
 * Client-side persistence for student course tools (favorites, progress).
 * Always persists (including development). Prefix is NOT purged by courseVersioning.
 */

export const STUDENT_TOOLS_PREFIX = 'sg_v22_stool_';

export type CourseProgressState = {
  watchedIds: string[];
  inProgressId: string | null;
  lastOpenedAt: number | null;
};

export type CourseFavoritesState = {
  recordingIds: string[];
  materialIds: string[];
};

export type StudentToolsCourseData = {
  favorites: CourseFavoritesState;
  progress: CourseProgressState;
};

const EMPTY_COURSE_DATA: StudentToolsCourseData = {
  favorites: { recordingIds: [], materialIds: [] },
  progress: { watchedIds: [], inProgressId: null, lastOpenedAt: null },
};

function toolsKey(courseId: string): string {
  return `${STUDENT_TOOLS_PREFIX}${courseId}`;
}

function readRaw(courseId: string): StudentToolsCourseData {
  if (typeof window === 'undefined') return { ...EMPTY_COURSE_DATA };
  try {
    const raw = localStorage.getItem(toolsKey(courseId));
    if (!raw) return { ...EMPTY_COURSE_DATA };
    const parsed = JSON.parse(raw) as Partial<StudentToolsCourseData>;
    return {
      favorites: {
        recordingIds: parsed.favorites?.recordingIds ?? [],
        materialIds: parsed.favorites?.materialIds ?? [],
      },
      progress: {
        watchedIds: parsed.progress?.watchedIds ?? [],
        inProgressId: parsed.progress?.inProgressId ?? null,
        lastOpenedAt: parsed.progress?.lastOpenedAt ?? null,
      },
    };
  } catch {
    return { ...EMPTY_COURSE_DATA };
  }
}

function writeRaw(courseId: string, data: StudentToolsCourseData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(toolsKey(courseId), JSON.stringify(data));
  } catch {
    /* quota or private mode */
  }
}

export function studentToolsGet(courseId: string): StudentToolsCourseData {
  return readRaw(courseId);
}

export function studentToolsSet(courseId: string, data: StudentToolsCourseData): void {
  writeRaw(courseId, data);
}

export function studentToolsUpdate(
  courseId: string,
  updater: (prev: StudentToolsCourseData) => StudentToolsCourseData,
): StudentToolsCourseData {
  const next = updater(readRaw(courseId));
  writeRaw(courseId, next);
  notifyStudentTools(courseId);
  return next;
}

/** Quita IDs huérfanos tras cambios en catálogo de grabaciones/materiales. */
export function pruneStudentToolsFavorites(
  courseId: string,
  validRecordingIds: ReadonlySet<string>,
  validMaterialIds?: ReadonlySet<string>,
): void {
  studentToolsUpdate(courseId, (prev) => {
    const recordingIds = prev.favorites.recordingIds.filter((id) => validRecordingIds.has(id));
    const materialIds = validMaterialIds
      ? prev.favorites.materialIds.filter((id) => validMaterialIds.has(id))
      : prev.favorites.materialIds;
    if (
      recordingIds.length === prev.favorites.recordingIds.length &&
      materialIds.length === prev.favorites.materialIds.length
    ) {
      return prev;
    }
    return {
      ...prev,
      favorites: { recordingIds, materialIds },
    };
  });
}

export const COURSE_THEME_STORAGE_KEY = `${STUDENT_TOOLS_PREFIX}theme_dark`;

export function readCourseThemeDark(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(COURSE_THEME_STORAGE_KEY) === '1';
}

export function writeCourseThemeDark(dark: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COURSE_THEME_STORAGE_KEY, dark ? '1' : '0');
}

type ToolsListener = () => void;
const toolsListeners = new Map<string, Set<ToolsListener>>();

export function subscribeStudentTools(courseId: string, listener: ToolsListener): () => void {
  if (!toolsListeners.has(courseId)) toolsListeners.set(courseId, new Set());
  toolsListeners.get(courseId)!.add(listener);
  return () => {
    toolsListeners.get(courseId)?.delete(listener);
  };
}

function notifyStudentTools(courseId: string): void {
  toolsListeners.get(courseId)?.forEach((fn) => fn());
}
