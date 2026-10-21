/**
 * Validación de correos en perfil — sin filtrar datos de otros estudiantes (habeas data).
 */

import { isAdmin, isCoordinator } from '@features/auth/lib/admin-auth';
import { getStudentsByEmail } from '@features/simulacro/lib/firestoreService';
import { isValidEmail } from '@/lib/security';

export type ProfileEmailBlockKind = 'staff' | 'other_profile' | 'duplicate' | 'invalid';

export type ProfileEmailGuardResult =
    | { ok: true }
    | { ok: false; kind: ProfileEmailBlockKind; message: string; useModal: boolean };

const STAFF_MESSAGE =
    'Este Gmail es de coordinación o administración. En el perfil del estudiante usa un correo personal del alumno, no el del panel institucional.';

const OTHER_PROFILE_MESSAGE =
    'Este correo ya está asociado a otro perfil de estudiante. Por privacidad no mostramos datos de otras cuentas. Usa otro Gmail o inicia sesión desde la pantalla de acceso con la cuenta correcta.';

export function profileEmailGuardPresentation(result: Extract<ProfileEmailGuardResult, { ok: false }>): {
    useModal: boolean;
    title: string;
    message: string;
} {
    const titles: Record<ProfileEmailBlockKind, string> = {
        staff: 'Correo no permitido',
        other_profile: 'Correo en uso',
        duplicate: 'Correo repetido',
        invalid: 'Correo inválido',
    };
    return {
        useModal: result.useModal,
        title: titles[result.kind],
        message: result.message,
    };
}

export async function validateProfileAccessEmail(
    email: string,
    currentStudentId: string
): Promise<ProfileEmailGuardResult> {
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized || !isValidEmail(normalized)) {
        return { ok: false, kind: 'invalid', message: 'Correo inválido.', useModal: false };
    }

    if (isAdmin(normalized) || isCoordinator(normalized)) {
        return { ok: false, kind: 'staff', message: STAFF_MESSAGE, useModal: true };
    }

    const profiles = await getStudentsByEmail(normalized);
    const linkedElsewhere = profiles.some((p) => p.id !== currentStudentId);

    if (linkedElsewhere) {
        return { ok: false, kind: 'other_profile', message: OTHER_PROFILE_MESSAGE, useModal: true };
    }

    return { ok: true };
}

export async function validateProfileAccessEmailList(
    primaryEmail: string,
    additionalEmails: string[],
    currentStudentId: string
): Promise<ProfileEmailGuardResult> {
    const all = [primaryEmail, ...additionalEmails]
        .map((e) => String(e || '').trim().toLowerCase())
        .filter(Boolean);
    const unique = [...new Set(all)];
    if (unique.length !== all.length) {
        return {
            ok: false,
            kind: 'duplicate',
            message: 'No repitas el mismo correo en principal y adicional.',
            useModal: false,
        };
    }
    for (const email of unique) {
        const check = await validateProfileAccessEmail(email, currentStudentId);
        if (!check.ok) return check;
    }
    return { ok: true };
}
