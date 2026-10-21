import { doc } from 'firebase/firestore';
import { db } from '@features/auth/lib/firebase';
import { gatedGetDoc } from '@features/simulacro/lib/firestoreService';
import type { CourseMaterial } from '../types/courseTypes';
import { COURSE_STUDENT_MATERIALS_COLLECTION } from '../types/courseRuntimeTypes';
import {
  listCoursePersonKeyCandidates,
  normalizeDocumento,
  normalizeEmailLower,
} from './courseAccessKeys';
import {
  CACHE_TTL_COURSE_STUDENT_MATERIALS_MS,
  courseCacheGet,
  courseCacheSet,
  courseStudentMaterialsCacheKey,
  isCourseClientCacheEnabled,
} from './courseCache';
import { ensureCourseFirestoreAuth } from './ensureCourseFirestoreAuth';
import { fetchCourseRuntime, isLocalCourseCalendarApiEnabled } from './courseRuntimeFirestore';
import { expandCourseMaterialsForLocalDev } from './courseSimulacroMaterials';
import { readCachedAuthStudentId } from './courseAuthSync';
import { readCourseAccessEmail, readDocumentoFromStudentData } from './courseStudentSession';

export type CourseStudentMaterialsIndex = {
  courseId: string;
  version?: number;
  syncedAt?: string;
  source?: string;
  count?: number;
  byDocumento: Record<
    string,
    {
      documento: string;
      nombreCarpeta?: string;
      institucion?: string;
      materials: CourseMaterial[];
    }
  >;
};

const materialsMem = new Map<string, CourseMaterial[]>();
const legacyIndexMem = new Map<string, CourseStudentMaterialsIndex>();

const isDev = process.env.NODE_ENV === 'development';

function materialsMemKey(
  courseId: string,
  personKey: string,
  materialsVersion?: number,
): string {
  return `${courseId}:${personKey}:${materialsVersion ?? 0}`;
}

function filterVisibleMaterials(raw: CourseMaterial[]): CourseMaterial[] {
  return expandCourseMaterialsForLocalDev(
    raw.filter((m) => m?.visible !== false && m.url),
  );
}

function readMaterialsIdentity(documento?: string | null): {
  studentId?: string;
  documento?: string;
  emailLower?: string;
} {
  const docNum = normalizeDocumento(documento ?? readDocumentoFromStudentData() ?? '');
  const email = readCourseAccessEmail();
  const studentId = readCachedAuthStudentId()?.trim();
  return {
    studentId: studentId || undefined,
    documento: docNum || undefined,
    emailLower: email ? normalizeEmailLower(email) : undefined,
  };
}

async function fetchStudentMaterialsIndex(
  courseId: string,
): Promise<CourseStudentMaterialsIndex | null> {
  if (!courseId) return null;

  try {
    const res = await fetch(`/data/student-materials/${encodeURIComponent(courseId)}.json`, {
      credentials: 'same-origin',
      cache: isDev || !isCourseClientCacheEnabled() ? 'no-store' : 'default',
    });
    if (!res.ok) return null;
    const parsed = (await res.json()) as CourseStudentMaterialsIndex;
    if (!parsed?.byDocumento) return null;
    if (isCourseClientCacheEnabled()) {
      legacyIndexMem.set(`${courseId}:${parsed.version ?? 0}`, parsed);
    }
    return parsed;
  } catch {
    return null;
  }
}

async function fetchFromLegacyPublicJson(
  courseId: string,
  documento: string,
): Promise<CourseMaterial[]> {
  const docNum = normalizeDocumento(documento);
  if (!docNum) return [];

  const index = await fetchStudentMaterialsIndex(courseId);
  if (!index) return [];

  const materialsVersion = index.version;

  if (isCourseClientCacheEnabled()) {
    const lsKey = courseStudentMaterialsCacheKey(courseId, `doc_${docNum}`, materialsVersion);
    const cached = courseCacheGet<CourseMaterial[]>(lsKey);
    if (cached) return cached;
  }

  const entry = index.byDocumento[docNum];
  if (!entry?.materials?.length) return [];

  const materials = filterVisibleMaterials(entry.materials);
  if (isCourseClientCacheEnabled()) {
    courseCacheSet(
      courseStudentMaterialsCacheKey(courseId, `doc_${docNum}`, materialsVersion),
      materials,
      CACHE_TTL_COURSE_STUDENT_MATERIALS_MS,
    );
  }
  return materials;
}

async function fetchFromFirestore(
  courseId: string,
  personKeys: string[],
  materialsVersion?: number,
): Promise<CourseMaterial[] | null> {
  if (!(await ensureCourseFirestoreAuth('fetchCourseStudentMaterials'))) {
    return null;
  }

  const cacheEnabled = isCourseClientCacheEnabled();

  for (const key of personKeys) {
    const cacheKey = courseStudentMaterialsCacheKey(courseId, key, materialsVersion);
    if (cacheEnabled) {
      const cached = courseCacheGet<CourseMaterial[]>(cacheKey);
      if (cached) return cached;

      const memKey = materialsMemKey(courseId, key, materialsVersion);
      if (materialsMem.has(memKey)) return materialsMem.get(memKey)!;
    }

    const ref = doc(
      db,
      COURSE_STUDENT_MATERIALS_COLLECTION,
      courseId,
      'students',
      key,
    );
    try {
      const snap = await gatedGetDoc(ref, 'fetchCourseStudentMaterials');
      if (!snap?.exists()) continue;

      const data = snap.data() as { materials?: CourseMaterial[] };
      const materials = filterVisibleMaterials(data.materials ?? []);
      if (cacheEnabled) {
        materialsMem.set(materialsMemKey(courseId, key, materialsVersion), materials);
        courseCacheSet(cacheKey, materials, CACHE_TTL_COURSE_STUDENT_MATERIALS_MS);
      }
      return materials;
    } catch {
      continue;
    }
  }

  return null;
}

/** Compilados personalizados — prod: Firestore; dev: JSON local primero. */
export async function fetchCourseStudentMaterials(
  courseId: string,
  documento?: string | null,
): Promise<CourseMaterial[]> {
  if (!courseId) return [];

  const identity = readMaterialsIdentity(documento);
  const personKeys = listCoursePersonKeyCandidates(identity);
  if (!personKeys.length) return [];

  const docNum = identity.documento ?? normalizeDocumento(documento ?? '');

  if (isDev && docNum) {
    const fromJson = await fetchFromLegacyPublicJson(courseId, docNum);
    if (fromJson.length) return fromJson;
  }

  let materialsVersion: number | undefined;
  if (!isLocalCourseCalendarApiEnabled()) {
    try {
      const runtime = await fetchCourseRuntime(courseId);
      materialsVersion = runtime?.materialsVersion;
    } catch {
      /* runtime opcional */
    }
  }

  if (isCourseClientCacheEnabled()) {
    for (const key of personKeys) {
      const cached = courseCacheGet<CourseMaterial[]>(
        courseStudentMaterialsCacheKey(courseId, key, materialsVersion),
      );
      if (cached) return cached;
    }
  }

  if (!isLocalCourseCalendarApiEnabled()) {
    const fromFirestore = await fetchFromFirestore(courseId, personKeys, materialsVersion);
    if (fromFirestore) return fromFirestore;
  }

  if (isLocalCourseCalendarApiEnabled() && docNum) {
    return fetchFromLegacyPublicJson(courseId, docNum);
  }

  return [];
}
