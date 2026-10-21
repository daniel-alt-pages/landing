import {
  collection,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@features/auth/lib/firebase';
import { gatedGetDoc, gatedGetDocs, getAppConfig } from '@features/simulacro/lib/firestoreService';
import type {
  CourseAccessDoc,
  CourseDoc,
  CourseIdentity,
  CourseStudentMetrics,
} from '../types/courseTypes';
import {
  buildCoursePersonKey,
  listCanonicalCourseAccessDocIds,
  listCoursePersonKeyCandidates,
  normalizeDocumento,
  normalizeEmailLower,
} from './courseAccessKeys';
import { mapCourseAccessDoc, mapCourseDoc, mapCourseStudentMetrics, isCourseAccessExpired } from './courseMappers';
import {
  CACHE_TTL_COURSE_ACCESS_MS,
  CACHE_TTL_COURSE_DOC_MS,
  CACHE_TTL_COURSE_METRICS_MS,
  courseAccessCacheKey,
  courseCacheGet,
  courseCacheSet,
  courseDocCacheKey,
  courseMetricsCacheKey,
  isCourseClientCacheEnabled,
} from './courseCache';
import { fetchMeetAttendanceMetrics } from './courseAttendanceLocal';
import { applyCourseStaticPatch } from './courseStaticFallback';
import { fetchLocalCourseById, shouldLoadCourseFromLocal } from './courseLocalData';
import { fetchCourseRuntime, isLocalCourseCalendarApiEnabled } from './courseRuntimeFirestore';
import { ensureCourseFirestoreAuth } from './ensureCourseFirestoreAuth';
import { hasRealGoogleAuthSync } from './courseAuthReal';
import { courseAccessMatchesIdentity } from './courseAccessIdentityMatch';

const accessMem = new Map<string, CourseAccessDoc[]>();
const courseMem = new Map<string, CourseDoc>();

function identityCacheKey(identity: CourseIdentity): string {
  return [
    normalizeEmailLower(identity.emailLower),
    normalizeDocumento(identity.documento),
    String(identity.studentId || '').trim(),
  ].join('|');
}

function buildSingleAccessQuery(field: 'emailLower' | 'documento' | 'studentId', value: string) {
  return query(collection(db, 'courseAccess'), where(field, '==', value));
}

async function resolveKnownCourseIds(): Promise<string[]> {
  try {
    const config = await getAppConfig();
    const ids = [
      ...Object.keys(config.courseVersions || {}),
      ...Object.keys(config.courseMetricsVersions || {}),
    ];
    if (ids.length) return [...new Set(ids)];
  } catch {
    /* ignore */
  }
  return ['preicfes-sg26'];
}

async function fetchDirectAccessDocs(identity: CourseIdentity): Promise<CourseAccessDoc[]> {
  const courseIds = await resolveKnownCourseIds();
  const docIds = listCanonicalCourseAccessDocIds(courseIds, identity);
  if (!docIds.length) return [];

  const seen = new Set<string>();
  const items: CourseAccessDoc[] = [];

  const snaps = await Promise.all(
    docIds.map((id) =>
      gatedGetDoc(doc(db, 'courseAccess', id), `fetchCourseAccess:direct:${id}`).catch(() => null),
    ),
  );

  snaps.forEach((snap, index) => {
    if (!snap?.exists()) return;
    const id = docIds[index];
    if (seen.has(id)) return;
    const mapped = mapCourseAccessDoc(id, snap.data() as Record<string, unknown>);
    if (!mapped.active || isCourseAccessExpired(mapped)) return;
    if (!courseAccessMatchesIdentity(mapped, identity)) return;
    seen.add(id);
    items.push(mapped);
  });

  return items;
}

async function queryAccessIndividually(identity: CourseIdentity): Promise<CourseAccessDoc[]> {
  const direct = await fetchDirectAccessDocs(identity);
  if (direct.length) return direct;
  const email = normalizeEmailLower(identity.emailLower);
  const docNum = normalizeDocumento(identity.documento);
  const studentId = String(identity.studentId || '').trim();

  const attempts: { field: 'documento' | 'emailLower' | 'studentId'; value: string }[] = [];
  // Primero email (grant canónico). Luego doc/studentId por si el grant__email
  // apunta a otro perfil (multi-perfil) o el doc espejo `__student_*` es legible.
  if (email) attempts.push({ field: 'emailLower', value: email });
  if (docNum) attempts.push({ field: 'documento', value: docNum });
  if (studentId && studentId !== docNum) {
    attempts.push({ field: 'studentId', value: studentId });
  }

  const seen = new Set<string>();
  const items: CourseAccessDoc[] = [];

  for (const attempt of attempts) {
    try {
      const singleSnap = await gatedGetDocs(
        buildSingleAccessQuery(attempt.field, attempt.value),
        `fetchCourseAccess:${attempt.field}`,
        20,
      );
      singleSnap?.docs.forEach((d) => {
        if (seen.has(d.id)) return;
        const mapped = mapCourseAccessDoc(d.id, d.data() as Record<string, unknown>);
        if (!mapped.active || isCourseAccessExpired(mapped)) return;
        if (!courseAccessMatchesIdentity(mapped, identity)) return;
        seen.add(d.id);
        items.push(mapped);
      });
      if (items.length) break;
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[courseAccess] query failed', attempt, err);
      }
    }
  }

  return items;
}

/** Correo del formulario (courseAccess) por documento o studentId — sin exigir match de Gmail actual. */
export async function fetchEnrollmentEmailForIdentity(
  identity: Pick<CourseIdentity, 'documento' | 'studentId'>,
): Promise<string | null> {
  if (!hasRealGoogleAuthSync()) return null;
  if (!(await ensureCourseFirestoreAuth('fetchEnrollmentEmailForIdentity'))) return null;

  const docNum = normalizeDocumento(identity.documento);
  const studentId = String(identity.studentId || '').trim();
  const attempts: { field: 'documento' | 'studentId'; value: string }[] = [];
  if (docNum) attempts.push({ field: 'documento', value: docNum });
  if (studentId) attempts.push({ field: 'studentId', value: studentId });
  if (!attempts.length) return null;

  for (const attempt of attempts) {
    try {
      const singleSnap = await gatedGetDocs(
        buildSingleAccessQuery(attempt.field, attempt.value),
        `fetchEnrollmentEmail:${attempt.field}`,
        20,
      );
      for (const d of singleSnap?.docs ?? []) {
        const mapped = mapCourseAccessDoc(d.id, d.data() as Record<string, unknown>);
        if (!mapped.active || isCourseAccessExpired(mapped)) continue;
        const enrolled = normalizeEmailLower(mapped.emailLower);
        if (enrolled) return enrolled;
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[courseAccess] enrollment email lookup failed', attempt, err);
      }
    }
  }

  return null;
}

export async function fetchCourseAccessForIdentity(
  identity: CourseIdentity,
): Promise<CourseAccessDoc[]> {
  if (!hasRealGoogleAuthSync()) return [];
  if (!(await ensureCourseFirestoreAuth('fetchCourseAccessForIdentity'))) return [];

  const cacheKey = identityCacheKey(identity);
  const cacheEnabled = isCourseClientCacheEnabled();
  if (cacheEnabled && accessMem.has(cacheKey)) return accessMem.get(cacheKey)!;

  const cached = cacheEnabled
    ? courseCacheGet<CourseAccessDoc[]>(courseAccessCacheKey(cacheKey))
    : null;
  if (cached?.length) {
    accessMem.set(cacheKey, cached);
    return cached;
  }

  if (
    !identity.emailLower &&
    !normalizeDocumento(identity.documento) &&
    !String(identity.studentId || '').trim()
  ) {
    return [];
  }

  const items = await queryAccessIndividually(identity);

  if (process.env.NODE_ENV === 'development') {
    console.info('[courseAccess] identity', identity, 'matches', items.length);
  }

  if (items.length && cacheEnabled) {
    accessMem.set(cacheKey, items);
    courseCacheSet(courseAccessCacheKey(cacheKey), items, CACHE_TTL_COURSE_ACCESS_MS);
  }
  return items;
}

export function isEntitledCourseId(courseId: string, allowedCourseIds: string[]): boolean {
  if (!courseId || !allowedCourseIds.length) return false;
  return allowedCourseIds.includes(courseId);
}

export async function fetchEntitledCourseById(
  courseId: string,
  allowedCourseIds: string[],
): Promise<CourseDoc | null> {
  if (!isEntitledCourseId(courseId, allowedCourseIds)) return null;
  return fetchCourseById(courseId);
}

export async function fetchCourseById(courseId: string): Promise<CourseDoc | null> {
  if (!courseId) return null;
  if (!hasRealGoogleAuthSync()) return null;
  if (!(await ensureCourseFirestoreAuth('fetchCourseById'))) return null;
  const cacheEnabled = isCourseClientCacheEnabled();
  if (cacheEnabled && courseMem.has(courseId)) {
    return applyCourseStaticPatch(courseMem.get(courseId)!);
  }

  const cached = cacheEnabled ? courseCacheGet<CourseDoc>(courseDocCacheKey(courseId)) : null;
  if (cached) {
    const patched = applyCourseStaticPatch(cached);
    if (patched) courseMem.set(courseId, patched);
    return patched;
  }

  if (shouldLoadCourseFromLocal()) {
    const localDoc = await fetchLocalCourseById(courseId);
    const mapped = applyCourseStaticPatch(localDoc);
    if (mapped) {
      if (cacheEnabled) {
        courseMem.set(courseId, mapped);
        courseCacheSet(courseDocCacheKey(courseId), mapped, CACHE_TTL_COURSE_DOC_MS);
      }
      return mapped;
    }
    // ponytail: dev prefiere JSON local, pero si falta /data/courses/* → Firestore (no pantalla vacía).
  }

  const ref = doc(db, 'courses', courseId);
  const snap = await gatedGetDoc(ref, 'fetchCourseById');
  if (!snap?.exists()) return null;

  const mapped = applyCourseStaticPatch(
    mapCourseDoc(snap.id, snap.data() as Record<string, unknown>),
  );
  if (!mapped) return null;
  if (cacheEnabled) {
    courseMem.set(courseId, mapped);
    courseCacheSet(courseDocCacheKey(courseId), mapped, CACHE_TTL_COURSE_DOC_MS);
  }
  return mapped;
}

export async function fetchCourseMetrics(
  courseId: string,
  identity: CourseIdentity,
): Promise<CourseStudentMetrics | null> {
  const personKeys = listCoursePersonKeyCandidates(identity);
  const personKey = personKeys[0] ?? buildCoursePersonKey(identity);

  let attendanceVersion: number | undefined;
  if (!isLocalCourseCalendarApiEnabled()) {
    try {
      const runtime = await fetchCourseRuntime(courseId);
      attendanceVersion = runtime?.attendanceVersion;
      if (attendanceVersion && attendanceVersion > 0) {
        for (const key of personKeys) {
          const versionedKey = courseMetricsCacheKey(courseId, key, attendanceVersion);
          const versionedCached = courseCacheGet<CourseStudentMetrics>(versionedKey);
          if (versionedCached) return versionedCached;
        }
      }
    } catch {
      /* runtime opcional — no bloquear lectura de métricas */
    }
  }

  for (const key of personKeys) {
    const cacheKey = courseMetricsCacheKey(courseId, key, attendanceVersion);
    const cached = courseCacheGet<CourseStudentMetrics>(cacheKey);
    if (cached) return cached;
  }

  if (isLocalCourseCalendarApiEnabled()) {
    const meetMetrics = await fetchMeetAttendanceMetrics(courseId, identity);
    if (meetMetrics) {
      courseCacheSet(
        courseMetricsCacheKey(courseId, personKey, attendanceVersion),
        meetMetrics,
        CACHE_TTL_COURSE_METRICS_MS,
      );
      return meetMetrics;
    }
  }

  if (!(await ensureCourseFirestoreAuth('fetchCourseMetrics'))) {
    return null;
  }

  for (const key of personKeys) {
    const ref = doc(db, 'courseMetrics', courseId, 'students', key);
    let snap;
    try {
      snap = await gatedGetDoc(ref, 'fetchCourseMetrics');
    } catch {
      continue;
    }
    if (!snap?.exists()) continue;

    const mapped = mapCourseStudentMetrics(
      snap.data() as Record<string, unknown>,
      courseId,
      key,
    );
    const resolvedVersion = mapped.attendanceVersion ?? attendanceVersion;
    courseCacheSet(
      courseMetricsCacheKey(courseId, key, resolvedVersion),
      mapped,
      CACHE_TTL_COURSE_METRICS_MS,
    );
    return mapped;
  }

  return null;
}

/** Fallback JSON estático temporal — `/data/recordings/{courseId}.json`. */
export async function fetchCourseRecordingsFallback(
  courseId: string,
): Promise<CourseDoc['recordings']> {
  if (!courseId || typeof window === 'undefined') return [];
  try {
    const res = await fetch(`/data/recordings/${encodeURIComponent(courseId)}.json`, {
      credentials: 'same-origin',
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { recordings?: CourseDoc['recordings'] };
    return (data.recordings || []).filter((r) => r.visibleToStudents !== false);
  } catch {
    return [];
  }
}

/** Lectura sync desde mem/localStorage — solo si el curso está en entitlement. */
export function peekCachedCourseById(
  courseId: string,
  allowedCourseIds?: string[],
): CourseDoc | null {
  if (!courseId || !isCourseClientCacheEnabled()) return null;
  if (allowedCourseIds && !isEntitledCourseId(courseId, allowedCourseIds)) return null;
  if (courseMem.has(courseId)) {
    return applyCourseStaticPatch(courseMem.get(courseId)!);
  }
  const cached = courseCacheGet<CourseDoc>(courseDocCacheKey(courseId));
  if (!cached) return null;
  const patched = applyCourseStaticPatch(cached);
  if (patched) courseMem.set(courseId, patched);
  return patched;
}

export function clearCourseMemoryCache(): void {
  accessMem.clear();
  courseMem.clear();
}

/** Solo bonus SG11-20 desde Firestore (no reemplaza asistencia local). */
export async function fetchFirestoreSimulacroBonuses(
  courseId: string,
  identity: CourseIdentity,
): Promise<CourseStudentMetrics['simulacroBonuses']> {
  if (!(await ensureCourseFirestoreAuth('fetchFirestoreSimulacroBonuses'))) {
    return undefined;
  }
  for (const key of listCoursePersonKeyCandidates(identity)) {
    const ref = doc(db, 'courseMetrics', courseId, 'students', key);
    let snap;
    try {
      snap = await gatedGetDoc(ref, 'fetchFirestoreSimulacroBonuses');
    } catch {
      continue;
    }
    if (!snap?.exists()) continue;
    const raw = snap.data()?.simulacroBonuses;
    if (Array.isArray(raw)) return raw as CourseStudentMetrics['simulacroBonuses'];
  }
  return undefined;
}
