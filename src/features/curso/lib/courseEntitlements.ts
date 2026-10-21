import { getStoredStudentId, resolveStudentSessionEmail } from '@/lib/studentSession';
import type {
  CourseEntitlement,
  CourseEntitlementsResult,
  CourseIdentity,
  StudentPanelMode,
} from '../types/courseTypes';
import { COURSE_SESSION_STORAGE_KEYS } from '../types/courseTypes';
import { fetchCourseAccessForIdentity } from './courseFirestore';
import { isCourseAccessExpired } from './courseMappers';
import {
  normalizeDocumento,
  normalizeEmailLower,
  resolveCourseAccessPublicCode,
} from './courseAccessKeys';
import { readDocumentoFromStudentData } from './courseStudentSession';
import { shouldResolveCourseAccess } from './courseRollout';
import { readCachedAuthEmail, readCachedAuthStudentId } from './courseAuthSync';
import { hasRealGoogleAuthSync } from './courseAuthReal';

const ENTITLEMENTS_MEM_TTL_MS = 10 * 60 * 1000;
const entitlementsMem = new Map<string, { result: CourseEntitlementsResult; ts: number }>();
let entitlementsInFlight: Promise<CourseEntitlementsResult> | null = null;
let entitlementsInFlightKey = '';

export function clearEntitlementsMemoryCache(): void {
  entitlementsMem.clear();
  entitlementsInFlight = null;
  entitlementsInFlightKey = '';
}

function entitlementsCacheKey(identity: CourseIdentity): string {
  return [
    identity.emailLower ?? '',
    identity.studentId ?? '',
    identity.documento ?? '',
  ].join('|');
}

function emptyEntitlements(): CourseEntitlementsResult {
  const hasSimPanel = readSimulacroPanelEnabled();
  return {
    courses: [],
    mode: resolvePanelMode(0, { hasSimulacroPanel: hasSimPanel }),
    hasSimulacros: hasSimPanel,
    features: {
      miCurso: false,
      seguimiento: false,
      herramientas: hasSimPanel,
      panelSimulacro: hasSimPanel,
    },
  };
}

export function readCourseOnlyFlag(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(COURSE_SESSION_STORAGE_KEYS.courseOnly) === '1';
}

export function setCourseOnlySession(active: boolean): void {
  if (typeof window === 'undefined') return;
  if (active) {
    localStorage.setItem(COURSE_SESSION_STORAGE_KEYS.courseOnly, '1');
    localStorage.setItem(COURSE_SESSION_STORAGE_KEYS.panelMode, 'course_only');
  } else {
    localStorage.removeItem(COURSE_SESSION_STORAGE_KEYS.courseOnly);
  }
}

/** Entitlements en memoria (TTL 10 min) — evita spinner al re-entrar al panel. */
export function peekCachedStudentEntitlements(
  identityInput?: Partial<CourseIdentity>,
): CourseEntitlementsResult | null {
  const identity = buildIdentityFromSession(identityInput);
  if (!hasRealGoogleAuthSync() || !shouldResolveCourseAccess(identity)) return null;
  const memHit = entitlementsMem.get(entitlementsCacheKey(identity));
  if (memHit && Date.now() - memHit.ts < ENTITLEMENTS_MEM_TTL_MS) {
    return memHit.result;
  }
  return null;
}

export function writeSimulacroPanelEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    COURSE_SESSION_STORAGE_KEYS.simulacroPanel,
    enabled ? '1' : '0',
  );
}

/** false = estudiante solo curso (sin resultados de simulacro visibles). */
export function readSimulacroPanelEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const raw = localStorage.getItem(COURSE_SESSION_STORAGE_KEYS.simulacroPanel);
  if (raw === '0') return false;
  if (raw === '1') return true;
  return true;
}

export function resolvePanelMode(
  courseCount: number,
  opts?: { hasStudentId?: boolean; hasSimulacroPanel?: boolean },
): StudentPanelMode {
  const hasStudentId = Boolean(opts?.hasStudentId);
  const hasSimPanel = opts?.hasSimulacroPanel ?? readSimulacroPanelEnabled();

  if (courseCount > 0 && !hasSimPanel) return 'course_only';
  if (hasSimPanel && courseCount > 0) return 'unified';
  if (hasSimPanel) return 'results_only';
  if (courseCount > 0) return 'course_only';
  if (readCourseOnlyFlag() && courseCount > 0 && !hasStudentId) return 'course_only';
  return 'results_only';
}

export { readStudentDisplayName } from './courseStudentSession';

export function writeStudentDocumentoCache(documento: string | undefined): void {
  if (typeof window === 'undefined') return;
  const normalized = normalizeDocumento(documento);
  if (normalized) {
    localStorage.setItem(COURSE_SESSION_STORAGE_KEYS.studentDocumento, normalized);
  }
}

export function buildIdentityFromSession(overrides?: Partial<CourseIdentity>): CourseIdentity {
  const authEmail = readCachedAuthEmail();
  const rawEmail =
    overrides?.emailLower ||
    authEmail ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('student_email') || ''
      : '');
  const normalizedRaw = normalizeEmailLower(rawEmail);
  const emailLower =
    (normalizedRaw && !normalizedRaw.startsWith('direct:') ? normalizedRaw : undefined) ||
    (authEmail && !overrides?.emailLower ? authEmail : undefined);

  const studentId =
    overrides?.studentId ||
    (typeof window !== 'undefined' ? getStoredStudentId() : '') ||
    readCachedAuthStudentId() ||
    undefined;

  let documento = overrides?.documento
    ? normalizeDocumento(overrides.documento)
    : undefined;
  if (!documento) documento = readDocumentoFromStudentData();
  if (!documento && studentId && /^\d{6,}$/.test(studentId.trim())) {
    documento = normalizeDocumento(studentId);
  }

  return { emailLower: emailLower || undefined, studentId, documento };
}

/** Identidad enriquecida con email de Firebase Auth (Google). */
export async function buildIdentityFromSessionAsync(
  overrides?: Partial<CourseIdentity>,
): Promise<CourseIdentity> {
  const sessionEmail = await resolveStudentSessionEmail();
  return buildIdentityFromSession({
    ...overrides,
    emailLower: overrides?.emailLower || sessionEmail || undefined,
  });
}

function dedupeEntitlements(accessList: CourseEntitlement[]): CourseEntitlement[] {
  const map = new Map<string, CourseEntitlement>();
  accessList.forEach((e) => {
    const prev = map.get(e.courseId);
    if (!prev || (e.active && !prev.active)) map.set(e.courseId, e);
  });
  return [...map.values()];
}

export async function resolveStudentEntitlements(
  identityInput?: Partial<CourseIdentity>,
): Promise<CourseEntitlementsResult> {
  const identity = buildIdentityFromSession(identityInput);
  const memKey = entitlementsCacheKey(identity);

  if (!hasRealGoogleAuthSync() || !shouldResolveCourseAccess(identity)) {
    writeCachedCourseNavVisible(false);
    return emptyEntitlements();
  }

  const memHit = entitlementsMem.get(memKey);
  if (memHit && Date.now() - memHit.ts < ENTITLEMENTS_MEM_TTL_MS) {
    return memHit.result;
  }

  if (entitlementsInFlight && entitlementsInFlightKey === memKey) {
    return entitlementsInFlight;
  }

  entitlementsInFlightKey = memKey;
  entitlementsInFlight = (async () => {
    let hasStudentId = Boolean(identity.studentId?.trim());
    const hasSimPanel = readSimulacroPanelEnabled();
    let accessDocs = await fetchCourseAccessForIdentity(identity);
    if (!accessDocs.length && identity.emailLower && (identity.studentId || identity.documento)) {
      // Curso vacacional: el Gmail de inscripción es el permiso canónico.
      // Un perfil de simulacro viejo en localStorage no debe bloquear Mi Curso.
      accessDocs = await fetchCourseAccessForIdentity({ emailLower: identity.emailLower });
      if (accessDocs.length) hasStudentId = false;
    }

    const courses: CourseEntitlement[] = dedupeEntitlements(
      accessDocs
        .filter((a) => a.active && !isCourseAccessExpired(a))
        .map((a) => ({
          courseId: a.courseId,
          role: a.role,
          active: true,
          publicStudentCode: resolveCourseAccessPublicCode(a),
        })),
    );

    const mode = resolvePanelMode(courses.length, {
      hasStudentId,
      hasSimulacroPanel: hasSimPanel,
    });
    const hasCourseAccess = courses.length > 0;

    const result: CourseEntitlementsResult = {
      courses,
      mode,
      hasSimulacros: hasSimPanel,
      features: {
        miCurso: hasCourseAccess,
        seguimiento: hasCourseAccess,
        herramientas: hasCourseAccess || hasSimPanel,
        panelSimulacro: hasSimPanel,
      },
    };

    writeCachedCourseNavVisible(result.features.miCurso);
    entitlementsMem.set(memKey, { result, ts: Date.now() });
    return result;
  })();

  try {
    return await entitlementsInFlight;
  } finally {
    entitlementsInFlight = null;
    entitlementsInFlightKey = '';
  }
}

export function readSelectedCourseId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(COURSE_SESSION_STORAGE_KEYS.selectedCourseId) || '';
}

export function writeSelectedCourseId(courseId: string): void {
  if (typeof window === 'undefined' || !courseId) return;
  localStorage.setItem(COURSE_SESSION_STORAGE_KEYS.selectedCourseId, courseId);
}

export function broadcastCourseSelection(courseId: string): void {
  if (typeof window === 'undefined' || !courseId) return;
  window.dispatchEvent(
    new CustomEvent('sg-student-course', { detail: { courseId } }),
  );
}

/** Tras elegir otro perfil simulacro — invalida entitlements en memoria y refresca UI. */
export function broadcastStudentProfileChange(studentId: string): void {
  if (typeof window === 'undefined') return;
  clearEntitlementsMemoryCache();
  writeCachedCourseNavVisible(false);
  window.dispatchEvent(
    new CustomEvent('sg-student-profile', { detail: { studentId } }),
  );
}

const COURSE_NAV_CACHE_KEY = 'sg_course_nav_visible';

/** Cache sync para tab Mi Curso — evita nav incompleto mientras carga Firestore. */
export function readCachedCourseNavVisible(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(COURSE_NAV_CACHE_KEY) === '1';
}

export function writeCachedCourseNavVisible(visible: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COURSE_NAV_CACHE_KEY, visible ? '1' : '0');
}

/** Muestra entrada a Mi Curso si hay acceso en Firestore o cache reciente. */
export function shouldShowCourseEntry(
  overrides?: Partial<CourseIdentity>,
  hasCourses?: boolean,
): boolean {
  const id = buildIdentityFromSession(overrides);
  if (!hasRealGoogleAuthSync() || !shouldResolveCourseAccess(id)) return false;
  if (hasCourses) return true;
  return false;
}

/** UI: tab/botón Mi Curso. Cache sync evita flash “desaparecido” mientras revalida. */
export function isCourseEntryVisible(
  loading: boolean,
  entitlements: CourseEntitlementsResult | null | undefined,
): boolean {
  if (entitlements?.features.miCurso) return true;
  if (loading && readCachedCourseNavVisible()) return true;
  return false;
}

export function hasStoredSimulacroSession(): boolean {
  return Boolean(getStoredStudentId()) && readSimulacroPanelEnabled();
}

export function isCourseOnlyShell(): boolean {
  if (readCourseOnlyFlag() && !getStoredStudentId()) return true;
  if (getStoredStudentId() && !readSimulacroPanelEnabled()) return true;
  return false;
}
