/** IDs determinísticos para courseAccess — evita duplicados. */

export function hashKey(value: string): string {
  const normalized = String(value || '').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function normalizePublicStudentCode(code: string | undefined | null): string {
  return String(code || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');
}

/** Código público para URL. Opaco; la seguridad sigue siendo Google + courseAccess. */
export function buildPublicStudentCode(identity: {
  studentId?: string;
  emailLower?: string;
  documento?: string;
}): string {
  const doc = normalizeDocumento(identity.documento);
  const studentId = String(identity.studentId || '').trim();
  const email = normalizeEmailLower(identity.emailLower);
  const seed = studentId || doc || email;
  if (!seed) return '';
  const salt = `${seed.length}:${seed}:${email ? 'e' : ''}${doc ? 'd' : ''}${studentId ? 's' : ''}`;
  return `sg_${hashKey(salt).padStart(6, '0')}`;
}

export function resolveCourseAccessPublicCode(
  access: {
    publicStudentCode?: string;
    studentId?: string;
    emailLower?: string;
    documento?: string;
  },
): string {
  return (
    normalizePublicStudentCode(access.publicStudentCode) ||
    buildPublicStudentCode(access)
  );
}

export function courseAccessIdByEmail(courseId: string, emailLower: string): string {
  return `${courseId}__email_${hashKey(emailLower)}`;
}

/** Doc espejo para reglas Firestore (`canReadCourseDoc`). */
export function courseAccessGrantId(courseId: string, emailLower: string): string {
  return `${courseId}__grant__${normalizeEmailLower(emailLower)}`;
}

export function courseAccessIdByDocument(courseId: string, documento: string): string {
  const doc = String(documento || '').replace(/\D/g, '');
  return `${courseId}__doc_${hashKey(doc)}`;
}

export function courseAccessIdByStudent(courseId: string, studentId: string): string {
  return `${courseId}__student_${String(studentId || '').trim()}`;
}

/** Clave estable para courseMetrics/{courseId}/students/{personKey}. */
export function buildCoursePersonKey(identity: {
  studentId?: string;
  emailLower?: string;
  documento?: string;
}): string {
  if (identity.studentId?.trim()) {
    return `student_${identity.studentId.trim()}`;
  }
  if (identity.documento?.trim()) {
    return `doc_${identity.documento.replace(/\D/g, '')}`;
  }
  if (identity.emailLower?.trim()) {
    return `email_${hashKey(identity.emailLower)}`;
  }
  return 'unknown';
}

/** Candidatos de personKey en orden de preferencia (métricas Firestore). */
export function listCoursePersonKeyCandidates(identity: {
  studentId?: string;
  emailLower?: string;
  documento?: string;
}): string[] {
  const keys: string[] = [];
  const primary = buildCoursePersonKey(identity);
  if (primary !== 'unknown') keys.push(primary);

  const doc = normalizeDocumento(identity.documento);
  if (doc) keys.push(`doc_${doc}`);

  const email = normalizeEmailLower(identity.emailLower);
  if (email) keys.push(`email_${hashKey(email)}`);

  const sid = String(identity.studentId || '').trim();
  if (sid) keys.push(`student_${sid}`);

  return [...new Set(keys)];
}

export function normalizeEmailLower(email: string | undefined | null): string {
  return String(email || '').trim().toLowerCase();
}

export function normalizeDocumento(documento: string | undefined | null): string {
  return String(documento || '').replace(/\D/g, '').trim();
}

/** Colección studentAuth — índice O(1) por correo. */
export const STUDENT_AUTH_COLLECTION = 'studentAuth';

export function studentAuthEmailDocId(emailLower: string): string {
  return `email_${hashKey(normalizeEmailLower(emailLower))}`;
}

export function studentAuthDocumentoDocId(documento: string): string {
  return normalizeDocumento(documento);
}

/** IDs courseAccess a probar con getDoc directo. */
export function listCanonicalCourseAccessDocIds(
  courseIds: string[],
  identity: { studentId?: string; emailLower?: string; documento?: string },
): string[] {
  const email = normalizeEmailLower(identity.emailLower);
  const docNum = normalizeDocumento(identity.documento);
  const studentId = String(identity.studentId || '').trim();
  const ids: string[] = [];
  for (const courseId of courseIds) {
    if (email) ids.push(courseAccessGrantId(courseId, email));
    if (docNum) ids.push(courseAccessIdByDocument(courseId, docNum));
    if (studentId) ids.push(courseAccessIdByStudent(courseId, studentId));
  }
  return [...new Set(ids)];
}
