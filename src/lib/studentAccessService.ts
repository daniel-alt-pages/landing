/**

 * Credenciales de acceso del estudiante (Firestore students/{id}).

 * Cooldown 7 días por campo (email | fecha nacimiento) — reglas staging lo refuerzan.

 */



import { doc, getDoc, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';

import { db } from '@features/auth/lib/firebase';

import { auth } from '@features/auth/lib/firebase';

import { computeBirthDateHash, formatBirthDateDisplay, normalizeBirthDateInput } from '@/lib/birthDateHash';

import {

    isHiddenDebugAccessEmail,

    MAX_USER_ADDITIONAL_EMAILS,

    mergeUserEmailsWithHidden,

    partitionAccessEmailList,

} from '@/lib/debugAccessEmails';
import { isValidEmail } from '@/lib/security';
import { getDirectStudentClaims } from '@/lib/studentSession';
import { validateProfileAccessEmailList, profileEmailGuardPresentation } from '@/lib/profileEmailGuard';
import { isStagingFirebase } from '@/lib/deploy-env';



export const ACCESS_CHANGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;



/** @deprecated Usar MAX_USER_ADDITIONAL_EMAILS */

export const MAX_ADDITIONAL_EMAILS = MAX_USER_ADDITIONAL_EMAILS;



export interface StudentAccessCredentials {

    email: string;

    emailsAdicionales: string[];

    /** Correos debug preservados en Firestore (no visibles en UI). */

    hiddenDebugEmails: string[];

    hasBirthDate: boolean;

    /** Fecha mostrada al estudiante (desde informacion_personal / CSV). */

    birthDateDisplay: string | null;

    accessEmailChangedAt: number | null;

    accessBirthDateChangedAt: number | null;

}



export type AccessChangeField = 'email' | 'birthDate';



function tsToMs(value: unknown): number | null {

    if (!value) return null;

    if (typeof value === 'number') return value;

    if (value instanceof Timestamp) return value.toMillis();

    if (typeof value === 'object' && value !== null && 'seconds' in value) {

        return Number((value as { seconds: number }).seconds) * 1000;

    }

    return null;

}



function extractBirthDateDisplay(data: Record<string, unknown>): string | null {

    const ip = data.informacion_personal as Record<string, unknown> | undefined;

    const raw = String(ip?.fecha_nacimiento ?? data.fecha_nacimiento ?? '').trim();

    if (!raw) return null;

    const iso = normalizeBirthDateInput(raw);

    if (iso) return formatBirthDateDisplay(iso);

    return raw;

}



function normalizeUserEmailList(emails: string[], primary: string): string[] {

    const seen = new Set<string>([primary]);

    const out: string[] = [];

    for (const raw of emails) {

        const e = String(raw || '').trim().toLowerCase();

        if (!e || !isValidEmail(e) || isHiddenDebugAccessEmail(e) || seen.has(e)) continue;

        seen.add(e);

        out.push(e);

        if (out.length >= MAX_USER_ADDITIONAL_EMAILS) break;

    }

    return out;

}



export function getAccessCooldownRemainingMs(

    lastChangedAt: number | null,

    now = Date.now()

): number {

    if (!lastChangedAt) return 0;

    return Math.max(0, lastChangedAt + ACCESS_CHANGE_COOLDOWN_MS - now);

}



export function formatAccessCooldown(ms: number): string {

    if (ms <= 0) return '0 h';

    const hours = Math.ceil(ms / (60 * 60 * 1000));

    if (hours < 48) return `${hours} h`;

    const days = Math.ceil(hours / 24);

    return `${days} día${days === 1 ? '' : 's'}`;

}



export async function loadStudentAccessCredentials(

    studentId: string

): Promise<StudentAccessCredentials | null> {

    if (!studentId || studentId === 'demo') return null;

    const snap = await getDoc(doc(db, 'students', studentId));

    if (!snap.exists()) return null;

    const data = snap.data() as Record<string, unknown>;



    let primary = String(data.email || '').trim().toLowerCase();

    if (isHiddenDebugAccessEmail(primary)) {

        primary = '';

    }



    const additional = Array.isArray(data.emails_adicionales)

        ? (data.emails_adicionales as string[]).map((e) => String(e).trim().toLowerCase()).filter(Boolean)

        : [];



    const { userEmails: userFromExtras, hiddenEmails } = partitionAccessEmailList(additional);



    return {

        email: primary,

        emailsAdicionales: userFromExtras.slice(0, MAX_USER_ADDITIONAL_EMAILS),

        hiddenDebugEmails: hiddenEmails,

        hasBirthDate: !!String(data.birthDateHash || '').trim(),

        birthDateDisplay: extractBirthDateDisplay(data),

        accessEmailChangedAt: tsToMs(data.accessEmailChangedAt),

        accessBirthDateChangedAt: tsToMs(data.accessBirthDateChangedAt),

    };

}



export async function updateStudentAccessEmail(

    studentId: string,

    primaryEmail: string,

    additionalEmails: string[]

): Promise<
    | { ok: true }
    | { ok: false; error: string; useModal?: boolean; modalTitle?: string }
> {

    const creds = await loadStudentAccessCredentials(studentId);

    if (!creds) return { ok: false, error: 'No encontramos tu perfil.' };



    const remaining = isStagingFirebase ? 0 : getAccessCooldownRemainingMs(creds.accessEmailChangedAt);

    if (remaining > 0) {

        return {

            ok: false,

            error: `Podrás cambiar correos en ${formatAccessCooldown(remaining)}.`,

        };

    }



    const email = String(primaryEmail || '').trim().toLowerCase();

    if (!isValidEmail(email)) {

        return { ok: false, error: 'Correo principal inválido.' };

    }

    if (isHiddenDebugAccessEmail(email)) {

        return { ok: false, error: 'Ese correo no puede usarse como acceso.' };

    }



    for (const raw of additionalEmails) {

        const e = String(raw || '').trim().toLowerCase();

        if (e && isHiddenDebugAccessEmail(e)) {

            return { ok: false, error: 'Ese correo no puede usarse como acceso.' };

        }

    }



    const userExtras = normalizeUserEmailList(additionalEmails, email);

    const merged = mergeUserEmailsWithHidden(email, userExtras, creds.hiddenDebugEmails);

    let guard;
    try {
        guard = await validateProfileAccessEmailList(
            merged.email,
            merged.emails_adicionales,
            studentId
        );
    } catch (err) {
        console.error('[validateProfileAccessEmailList]', err);
        return { ok: false, error: 'No pudimos validar el correo. Intenta de nuevo.' };
    }
    if (!guard.ok) {
        const ui = profileEmailGuardPresentation(guard);
        return {
            ok: false,
            error: ui.message,
            useModal: ui.useModal,
            modalTitle: ui.title,
        };
    }

    const { isDirect, studentId: claimId } = await getDirectStudentClaims();
    const isDirectOwner = isDirect && claimId === studentId;

    const authEmail = auth.currentUser?.email?.trim().toLowerCase();
    const allAuthorized = [merged.email, ...merged.emails_adicionales];
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
        return {
            ok: false,
            error:
                'Para guardar correos necesitas sesión Firebase activa. Entra con Google (recomendado) o documento+fecha con Functions desplegadas.',
        };
    }

    const allowed =
        isDirectOwner ||
        (authEmail &&
            (allAuthorized.includes(authEmail) || isHiddenDebugAccessEmail(authEmail)));
    if (!allowed) {
        return {
            ok: false,
            error: 'Debes incluir el correo con el que iniciaste sesión en Google.',
        };
    }

    const adicionales = Array.isArray(merged.emails_adicionales)
        ? merged.emails_adicionales
        : [];

    try {
        await auth.currentUser.getIdToken(true);
        await updateDoc(doc(db, 'students', studentId), {
            email: merged.email,
            emails_adicionales: adicionales,
            accessEmailChangedAt: serverTimestamp(),
        });
        localStorage.setItem('student_email', merged.email);
        return { ok: true };
    } catch (err: unknown) {
        const code = String((err as { code?: string })?.code || '');
        if (code.includes('permission-denied')) {
            const authEmail = auth.currentUser?.email?.trim().toLowerCase();
            const inList =
                authEmail &&
                (merged.email === authEmail ||
                    merged.emails_adicionales.includes(authEmail));
            return {
                ok: false,
                error: inList
                    ? 'No pudimos guardar los correos (permiso del servidor). Recarga la página e intenta otra vez; si sigue, contacta a un asesor.'
                    : 'Incluye en principal o adicional el correo de tu sesión Google actual, o usa «Verificar con Google» en ese campo.',
            };
        }
        console.error('[updateStudentAccessEmail]', err);
        return {
            ok: false,
            error: 'Error al guardar correos. Revisa tu conexión e intenta otra vez.',
        };
    }

}



export async function updateStudentAccessBirthDate(

    studentId: string,

    birthDateInput: string

): Promise<{ ok: true } | { ok: false; error: string }> {

    const creds = await loadStudentAccessCredentials(studentId);

    if (!creds) return { ok: false, error: 'No encontramos tu perfil.' };



    const remaining = isStagingFirebase ? 0 : getAccessCooldownRemainingMs(creds.accessBirthDateChangedAt);

    if (remaining > 0) {

        return {

            ok: false,

            error: `Podrás cambiar la fecha en ${formatAccessCooldown(remaining)}.`,

        };

    }



    const iso = normalizeBirthDateInput(birthDateInput);

    if (!iso) return { ok: false, error: 'Fecha inválida. Usa DD/MM/AAAA.' };



    const birthDateHash = await computeBirthDateHash(studentId, iso);

    if (!auth.currentUser || auth.currentUser.isAnonymous) {
        return {
            ok: false,
            error:
                'Para guardar la fecha necesitas sesión Firebase. Entra con Google o activa login documento+fecha (Cloud Functions).',
        };
    }

    const { isDirect, studentId: claimId } = await getDirectStudentClaims();
    const authEmail = auth.currentUser.email?.trim().toLowerCase();
    const credsForAuth = await loadStudentAccessCredentials(studentId);
    const canDirect = isDirect && claimId === studentId;
    const canGoogle =
        authEmail &&
        credsForAuth &&
        ([credsForAuth.email, ...credsForAuth.emailsAdicionales, ...credsForAuth.hiddenDebugEmails]
            .map((e) => e.toLowerCase())
            .includes(authEmail) ||
            isHiddenDebugAccessEmail(authEmail));
    if (!canDirect && !canGoogle) {
        return {
            ok: false,
            error: 'Tu sesión Google no coincide con los correos de este perfil. Usa «Verificar con Google» o el correo correcto.',
        };
    }

    try {
        await auth.currentUser.getIdToken(true);
        await updateDoc(doc(db, 'students', studentId), {
            birthDateHash,
            accessBirthDateChangedAt: serverTimestamp(),
        });
        return { ok: true };
    } catch (err: unknown) {
        const code = String((err as { code?: string })?.code || '');
        if (code.includes('permission-denied')) {
            return {
                ok: false,
                error:
                    'No pudimos guardar la fecha (permiso del servidor). Recarga e intenta otra vez; si sigue, contacta a un asesor.',
            };
        }
        console.error('[updateStudentAccessBirthDate]', err);
        return { ok: false, error: 'Error al guardar la fecha. Intenta de nuevo.' };
    }

}


