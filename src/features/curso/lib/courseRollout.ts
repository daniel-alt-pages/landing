import type { CourseIdentity } from '../types/courseTypes';
import { normalizeDocumento, normalizeEmailLower } from './courseAccessKeys';

/** Curso vacacional activo (único en prod). */
export const COURSE_VACACIONAL_ID = 'preicfes-sg26';

/** @deprecated Usar COURSE_VACACIONAL_ID — alias histórico piloto. */
export const COURSE_PILOT_DEFAULT_COURSE_ID = COURSE_VACACIONAL_ID;

/** Acceso solo vía fila activa en Firestore `courseAccess` (pipeline vacacional). */
export function isCoursePilotIdentity(_identity: CourseIdentity): boolean {
  return false;
}

/** Consulta courseAccess si hay identidad (doc o email). Gate real = filas activas en Firestore. */
export function shouldResolveCourseAccess(identity: CourseIdentity): boolean {
  const doc = normalizeDocumento(identity.documento) || normalizeDocumento(identity.studentId);
  const email = normalizeEmailLower(identity.emailLower);
  return Boolean(doc || email);
}
