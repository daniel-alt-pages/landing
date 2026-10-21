import { canAccessMultipleProfiles } from '@features/auth/lib/multiProfileAccess';
import type { CourseAccessDoc, CourseIdentity } from '../types/courseTypes';
import { normalizeDocumento, normalizeEmailLower } from './courseAccessKeys';
import { COURSE_VACACIONAL_ID } from './courseRollout';

function identityProfileKey(identity: CourseIdentity): string | null {
  const doc = normalizeDocumento(identity.documento);
  if (doc) return doc;
  const studentId = String(identity.studentId || '').trim();
  return studentId || null;
}

function grantMatchesProfileKey(access: CourseAccessDoc, profileKey: string): boolean {
  const accessDoc = normalizeDocumento(access.documento);
  const accessStudentId = String(access.studentId || '').trim();
  if (accessDoc && accessDoc === profileKey) return true;
  if (accessStudentId && accessStudentId === profileKey) return true;
  return false;
}

function grantHasProfileKey(access: CourseAccessDoc): boolean {
  return Boolean(normalizeDocumento(access.documento) || String(access.studentId || '').trim());
}

function vacacionalEnrollmentEmailMatches(
  access: CourseAccessDoc,
  identity: CourseIdentity,
): boolean {
  const email = normalizeEmailLower(identity.emailLower);
  const accessEmail = normalizeEmailLower(access.emailLower);
  if (!email || !accessEmail || email !== accessEmail) return false;

  // Soporte multi-perfil: un solo grant__email; el perfil activo va en localStorage.
  if (canAccessMultipleProfiles(email)) return true;

  const profileKey = identityProfileKey(identity);
  if (!profileKey || !grantHasProfileKey(access)) return true;
  return grantMatchesProfileKey(access, profileKey);
}

/**
 * Valida un doc courseAccess contra el perfil activo.
 * - preicfes-sg26: solo Gmail de inscripción (Raw Vacacional + Pruebas internas).
 *   Perfil simulacro con otro doc no abre el panel.
 * - Otros cursos: doc/studentId + email cuando aplique.
 */
export function courseAccessMatchesIdentity(
  access: CourseAccessDoc,
  identity: CourseIdentity,
): boolean {
  if (access.courseId === COURSE_VACACIONAL_ID) {
    return vacacionalEnrollmentEmailMatches(access, identity);
  }

  const email = normalizeEmailLower(identity.emailLower);
  const accessEmail = normalizeEmailLower(access.emailLower);
  const profileKey = identityProfileKey(identity);

  if (profileKey) {
    if (!grantMatchesProfileKey(access, profileKey)) {
      if (!grantHasProfileKey(access) && email && accessEmail) return accessEmail === email;
      return false;
    }
    if (email && accessEmail) return accessEmail === email;
    return Boolean(email && accessEmail && email === accessEmail);
  }

  if (email && accessEmail) return accessEmail === email;

  return false;
}

/** ponytail: assert demo — falla si simulacro con doc ajeno pasara vacacional. */
export function _courseAccessIdentityMatchSelfCheck(): void {
  const grant: CourseAccessDoc = {
    courseId: COURSE_VACACIONAL_ID,
    emailLower: 'vacacional@gmail.com',
    documento: '1046705164',
    studentId: '1046705164',
    role: 'student',
    source: 'grant',
    active: true,
  };
  const ok = courseAccessMatchesIdentity(grant, {
    emailLower: 'vacacional@gmail.com',
    documento: '1046705164',
  });
  const blocked = courseAccessMatchesIdentity(grant, {
    emailLower: 'otro@gmail.com',
    studentId: '1046705164',
  });
  const multi = courseAccessMatchesIdentity(
    { ...grant, emailLower: 'agenteno11sg@gmail.com', documento: '1005650933' },
    { emailLower: 'agenteno11sg@gmail.com', documento: '1097912847' },
  );
  if (!ok || blocked || !multi) {
    throw new Error('courseAccessIdentityMatch vacacional self-check failed');
  }
}
