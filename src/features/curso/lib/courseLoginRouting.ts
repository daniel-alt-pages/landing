import type { CourseIdentity } from '../types/courseTypes';
import type { StudentProfile } from '@features/simulacro/lib/firestoreService';
import { buildPublicStudentCode, normalizeDocumento } from './courseAccessKeys';
import {
  resolveStudentEntitlements,
  setCourseOnlySession,
  writeSimulacroPanelEnabled,
  writeStudentDocumentoCache,
} from './courseEntitlements';
import { fetchCourseAccessForIdentity } from './courseFirestore';
import { hasRealGoogleAuthSync } from './courseAuthReal';
import { courseBasePathForStudentCode } from './courseRoutePaths';

type NavigateFn = (href: string) => void | Promise<void>;

type StudentLoginProfile = {
  id: string;
  simulacros?: string[];
};

export type StudentPanelRoute = 'curso' | 'dashboard';

/** Simulacros con resultados visibles (no solo el array del perfil). */
export async function detectStudentSimulacroIds(
  studentId: string,
  simulacrosHint?: string[],
): Promise<string[]> {
  if (!studentId?.trim()) return [];
  const hinted = Array.isArray(simulacrosHint)
    ? simulacrosHint.map((simId) => String(simId).trim()).filter(Boolean)
    : [];
  if (hinted.length > 0) {
    try {
      const { cacheStudentSimList } = await import(
        '@features/simulacro/lib/firestoreService'
      );
      return cacheStudentSimList(studentId.trim(), hinted);
    } catch {
      return hinted;
    }
  }

  try {
    const { getStudentSimulations } = await import(
      '@features/simulacro/lib/firestoreService'
    );
    const ids = await getStudentSimulations(studentId.trim());
    return Array.isArray(ids) ? ids.filter(Boolean) : [];
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[detectStudentSimulacroIds]', studentId, err);
    }
    return [];
  }
}

async function resolveCourseCount(identity: Partial<CourseIdentity>): Promise<number> {
  try {
    const entitlements = await resolveStudentEntitlements(identity);
    return entitlements.courses.length;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[resolveCourseCount]', identity, err);
    }
    return 0;
  }
}

/**
 * Caso vacacional: el correo Google puede ser el del roster/pago, distinto al
 * correo del perfil de simulacros. El grant courseAccess (subido desde CSV)
 * trae el documento para unir curso + resultados cuando ya presentó simulacro.
 */
export async function resolveStudentProfileFromCourseAccess(
  identity: Partial<CourseIdentity>,
): Promise<StudentProfile | null> {
  try {
    const accessDocs = await fetchCourseAccessForIdentity(identity);
    if (!accessDocs.length) return null;

    const { lookupStudentById } = await import(
      '@features/simulacro/lib/firestoreService'
    );

    for (const access of accessDocs) {
      const studentId =
        String(access.studentId || '').trim() ||
        normalizeDocumento(access.documento);
      if (!studentId) continue;

      const lookup = await lookupStudentById(studentId);
      const simulacros = lookup?.simulacros?.filter(Boolean) ?? [];
      if (!lookup || simulacros.length === 0) continue;

      return {
        id: studentId,
        email: lookup.email,
        nombre: lookup.nombre || 'Estudiante',
        apellidos: '',
        simulacros,
      };
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[resolveStudentProfileFromCourseAccess]', identity, err);
    }
  }

  return null;
}

/**
 * Modo panel según simulacros + curso:
 * - sim + curso → unified (dashboard, ambos paneles)
 * - solo curso → course_only hasta que tenga simulacros
 * - solo sim → results_only
 */
export async function applyStudentPanelMode(
  studentId: string,
  identityExtras?: Partial<CourseIdentity>,
  simulacrosHint?: string[],
): Promise<{ hasSimulacros: boolean; courseCount: number; mode: StudentPanelRoute }> {
  const id = studentId.trim();
  const simIds = await detectStudentSimulacroIds(id, simulacrosHint);
  const hasSimulacros = simIds.length > 0;

  writeSimulacroPanelEnabled(hasSimulacros);
  writeStudentDocumentoCache(id);

  const courseCount = await resolveCourseCount({
    studentId: id,
    documento: id,
    ...identityExtras,
  });

  if (hasSimulacros) {
    setCourseOnlySession(false);
    return { hasSimulacros: true, courseCount, mode: 'dashboard' };
  }

  if (courseCount > 0 && hasRealGoogleAuthSync()) {
    setCourseOnlySession(true);
    return { hasSimulacros: false, courseCount, mode: 'curso' };
  }

  setCourseOnlySession(false);
  return { hasSimulacros: false, courseCount: 0, mode: 'dashboard' };
}

/** Re-evalúa sim+curso en sesión (p. ej. tras publicar resultados de simulacro). */
export async function reconcileStudentPanelMode(
  identityExtras?: Partial<CourseIdentity>,
): Promise<void> {
  if (typeof window === 'undefined') return;
  const studentId = identityExtras?.studentId || localStorage.getItem('student_id') || '';
  if (!studentId || studentId === 'demo') return;
  await applyStudentPanelMode(studentId, identityExtras);
}

/** Tras login: curso directo si no hay sim; dashboard si hay sim (± curso). */
export async function routeStudentAfterLogin(
  navigate: NavigateFn,
  student: StudentLoginProfile,
  identityExtras?: Partial<CourseIdentity>,
): Promise<StudentPanelRoute> {
  try {
    const { mode } = await applyStudentPanelMode(
      student.id,
      identityExtras,
      student.simulacros,
    );
    const publicStudentCode = buildPublicStudentCode({
      studentId: student.id,
      documento: student.id,
      ...identityExtras,
    });
    const target =
      mode === 'curso' && publicStudentCode
        ? courseBasePathForStudentCode(publicStudentCode)
        : mode === 'curso'
          ? '/estudiante/curso'
          : '/estudiante/dashboard';
    await navigate(target);
    return mode;
  } catch (err) {
    console.error('[routeStudentAfterLogin]', err);
    await navigate('/estudiante/dashboard');
    return 'dashboard';
  }
}
