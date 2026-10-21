/**
 * Sesión estudiante: Google es el login canónico.
 * `direct` en localStorage es legacy (doc+fecha apagado por defecto).
 */

import { auth, waitForAuth } from '@features/auth/lib/firebase';
import { isValidEmail } from '@/lib/security';

export type StudentLoginMethod = 'google' | 'direct' | 'unknown';

const LOGIN_METHOD_KEY = 'login_method';
const STUDENT_EMAIL_KEY = 'student_email';
const STUDENT_ID_KEY = 'student_id';

export function getStoredStudentId(): string {
    if (typeof window === 'undefined') return '';
    return String(localStorage.getItem(STUDENT_ID_KEY) || '').trim();
}

export function getStoredLoginMethod(): StudentLoginMethod {
    if (typeof window === 'undefined') return 'unknown';
    const m = localStorage.getItem(LOGIN_METHOD_KEY);
    if (m === 'google' || m === 'direct') return m;
    return 'unknown';
}

export function setStoredLoginMethod(method: StudentLoginMethod): void {
    if (typeof window === 'undefined' || method === 'unknown') return;
    localStorage.setItem(LOGIN_METHOD_KEY, method);
}

/** Correo usable en UI (Google, Firestore cache o perfil). Ignora marcador direct:id. */
export function getStoredStudentEmail(): string | null {
    if (typeof window === 'undefined') return null;
    const raw = String(localStorage.getItem(STUDENT_EMAIL_KEY) || '').trim().toLowerCase();
    if (!raw || raw.startsWith('direct:') || !isValidEmail(raw)) return null;
    return raw;
}

export async function getFirebaseAuthEmail(): Promise<string | null> {
    await waitForAuth();
    const em = auth.currentUser?.email?.trim().toLowerCase();
    return em && isValidEmail(em) ? em : null;
}

/** Mejor correo disponible para rellenar campos (Google > localStorage). */
export async function resolveStudentSessionEmail(): Promise<string | null> {
    const google = await getFirebaseAuthEmail();
    if (google) return google;
    return getStoredStudentEmail();
}

export async function getDirectStudentClaims(): Promise<{
    isDirect: boolean;
    studentId: string | null;
}> {
    await waitForAuth();
    const user = auth.currentUser;
    if (!user) return { isDirect: false, studentId: null };
    try {
        const result = await user.getIdTokenResult();
        const isDirect = result.claims.studentDirect === true;
        const studentId = String(result.claims.studentId || '').trim() || null;
        return { isDirect, studentId };
    } catch {
        return { isDirect: false, studentId: null };
    }
}

/** Puede editar acceso en perfil propio (ya pasó login / selector de perfil). */
export async function canWriteStudentProfile(studentId: string): Promise<boolean> {
    if (!studentId || studentId === 'demo') return false;
    const storedId = getStoredStudentId();
    if (!storedId || storedId !== studentId) return false;

    await waitForAuth();
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return false;

    const { isDirect, studentId: claimId } = await getDirectStudentClaims();
    if (isDirect && claimId === studentId) return true;

    return !!user.email?.trim();
}

export async function hasGoogleAuthSession(): Promise<boolean> {
    await waitForAuth();
    const user = auth.currentUser;
    return !!user && !user.isAnonymous && !!user.email;
}

/** Custom token loginStudentDirect (claim studentDirect + studentId). */
export async function hasStudentDirectFirestoreAuth(studentId: string): Promise<boolean> {
    if (!studentId || studentId === 'demo') return true;
    const { isDirect, studentId: claimId } = await getDirectStudentClaims();
    return isDirect && claimId === String(studentId).trim();
}

/**
 * results/* en Firestore: sesión Google (email en token) o custom token studentDirect.
 * login_method=direct en localStorage NO alcanza — reglas no leen esa clave.
 */
export async function canReadStudentFirestoreResults(studentId: string): Promise<boolean> {
    if (!studentId || studentId === 'demo') return true;
    if (await hasGoogleAuthSession()) return true;
    return hasStudentDirectFirestoreAuth(studentId);
}

/** Doc+fecha sin token Firebase: pedir Google si hay correo, o reintentar callable. */
export async function needsGoogleLoginForResults(): Promise<boolean> {
    if (getStoredLoginMethod() !== 'direct') return false;
    const id = getStoredStudentId();
    if (!id) return false;
    return !(await canReadStudentFirestoreResults(id));
}

const ESTUDIANTE_SESSION_STORAGE_KEYS = [
    STUDENT_ID_KEY,
    STUDENT_EMAIL_KEY,
    'student_name',
    'student_data',
    'simulacro_selected',
    'linked_profiles',
    'selected_profile_id',
    LOGIN_METHOD_KEY,
    'student_last_panel',
    'course_selected',
    'course_only',
    'student_panel_mode',
    'student_documento',
    'sg_simulacro_panel',
    'sg_course_nav_visible',
] as const;

/** Limpia localStorage/sessionStorage de sesión estudiante (simulacro + curso). */
export function clearEstudianteLocalSession(): void {
    if (typeof window === 'undefined') return;
    ESTUDIANTE_SESSION_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    sessionStorage.removeItem('welcome_shown');
}

/** Cierra sesión estudiante: storage local + Firebase Auth si aplica. */
export async function logoutEstudianteSession(): Promise<void> {
    clearEstudianteLocalSession();
    try {
        await waitForAuth();
        if (auth.currentUser) await auth.signOut();
    } catch {
        /* ignore */
    }
}
