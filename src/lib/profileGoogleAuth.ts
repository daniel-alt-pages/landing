import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@features/auth/lib/firebase';
import { getStudentsByEmail } from '@features/simulacro/lib/firestoreService';
import { validateProfileAccessEmail, profileEmailGuardPresentation } from '@/lib/profileEmailGuard';
import { setStoredLoginMethod } from '@/lib/studentSession';

function mapGooglePopupError(err: unknown): string {
    const code = String((err as { code?: string })?.code || '');
    if (code.includes('popup-closed') || code.includes('cancelled-popup-request')) {
        return 'Cancelaste el inicio con Google.';
    }
    return 'No pudimos conectar Google. Intenta de nuevo.';
}

async function completeGoogleSignIn(): Promise<
    { ok: true; email: string } | { ok: false; error: string }
> {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const email = result.user.email?.trim().toLowerCase();
        if (!email) {
            return { ok: false, error: 'Google no devolvió un correo.' };
        }
        if (result.user.photoURL) {
            localStorage.setItem('google_photo_url', result.user.photoURL);
        }
        localStorage.setItem('student_email', email);
        setStoredLoginMethod('google');
        return { ok: true, email };
    } catch (err: unknown) {
        return { ok: false, error: mapGooglePopupError(err) };
    }
}

/** Desbloquear perfil: Google debe coincidir con un correo ya autorizado en Firestore. */
export async function linkGoogleToCurrentStudent(
    studentId: string
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
    const signed = await completeGoogleSignIn();
    if (!signed.ok) return signed;

    const students = await getStudentsByEmail(signed.email);
    const match = students.some((s) => s.id === studentId);
    if (!match) {
        return {
            ok: false,
            error: 'Ese Google no está en tus correos autorizados. Usa «Verificar con Google» en el campo del correo nuevo.',
        };
    }
    return signed;
}

/**
 * Verificar un correo con Google (puede ser nuevo). Rechaza staff y correos de otro estudiante.
 */
export async function verifyGoogleEmailForProfile(
    currentStudentId: string
): Promise<
    | { ok: true; email: string }
    | { ok: false; error: string; useModal?: boolean; modalTitle?: string }
> {
    const signed = await completeGoogleSignIn();
    if (!signed.ok) return signed;

    const guard = await validateProfileAccessEmail(signed.email, currentStudentId);
    if (!guard.ok) {
        const ui = profileEmailGuardPresentation(guard);
        return {
            ok: false,
            error: ui.message,
            useModal: ui.useModal,
            modalTitle: ui.title,
        };
    }
    return signed;
}
