import { COURSE_SESSION_STORAGE_KEYS } from '../types/courseTypes';
import { normalizeDocumento } from './courseAccessKeys';
import { readCachedAuthEmail } from './courseAuthSync';

/** Nombre completo para cruce con reportes Meet (Nombre + Apellido). */
export function readStudentDisplayName(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  const cached = localStorage.getItem('student_name');
  if (cached?.trim()) return cached.trim();

  try {
    const raw = localStorage.getItem('student_data');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as {
      informacion_personal?: { nombres?: string; apellidos?: string; nombre?: string };
    };
    const ip = parsed.informacion_personal;
    if (!ip) return undefined;
    const nombres = ip.nombres || ip.nombre || '';
    const apellidos = ip.apellidos || '';
    const full = `${nombres} ${apellidos}`.trim();
    return full || undefined;
  } catch {
    return undefined;
  }
}

/** Correo del formulario / Google con que tiene acceso al curso (para Drive y Docs). */
export function readCourseAccessEmail(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const fromAuth = readCachedAuthEmail();
  if (fromAuth) return fromAuth;
  const stored = localStorage.getItem('student_email')?.trim();
  if (stored && !stored.startsWith('direct:') && stored.includes('@')) {
    return stored.toLowerCase();
  }
  return undefined;
}

export function readDocumentoFromStudentData(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const cached = localStorage.getItem(COURSE_SESSION_STORAGE_KEYS.studentDocumento);
  if (cached) {
    const normalized = normalizeDocumento(cached);
    if (normalized) return normalized;
  }
  try {
    const raw = localStorage.getItem('student_data');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as {
      numero_identificacion?: string;
      documento?: string;
      id?: string;
      informacion_personal?: { numero_identificacion?: string };
    };
    const doc =
      parsed?.informacion_personal?.numero_identificacion ||
      parsed?.numero_identificacion ||
      parsed?.documento ||
      parsed?.id;
    return doc ? normalizeDocumento(String(doc)) : undefined;
  } catch {
    return undefined;
  }
}
