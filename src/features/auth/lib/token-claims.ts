import type { LocalUser } from "@features/auth/lib/firebase";
import {
    isAdmin,
    isCoordinator,
    getCoordinatorInstitution,
    parseCoordinatorScope,
} from "@features/auth/lib/admin-auth";

/** Compat: el stub local no usa firebase/auth.User */
type User = LocalUser;

/**
 * Avisos en consola si el JWT no trae claims (Fase 2).
 * No bloquea acceso — reglas y UI aún usan admin-auth / localStorage.
 */
/** Institución desde JWT (Fase 2). Permite acceso sin redeploy tras set_custom_claims. */
export async function getCoordinatorInstitutionFromClaims(
    user: User
): Promise<string | null> {
    try {
        const token = await user.getIdTokenResult();
        const claims = token.claims;
        if (claims.coordinator === true && typeof claims.institution === "string") {
            const inst = claims.institution.trim();
            if (inst) return inst;
        }
        if (claims.coordinator === true && Array.isArray(claims.institutions)) {
            const list = claims.institutions.filter(
                (item): item is string => typeof item === "string" && item.trim().length > 0,
            );
            if (list.length > 0) return list.join("|");
        }
    } catch {
        /* ignore */
    }
    return null;
}

export async function warnIfMissingSecurityClaims(user: User): Promise<void> {
    if (!user.email) return;

    const email = user.email.toLowerCase();
    let token;
    try {
        token = await user.getIdTokenResult();
    } catch {
        return;
    }

    const claims = token.claims;

    if (isAdmin(email) && claims.admin !== true) {
        console.warn(
            '[Security] Sesión admin sin custom claim "admin". ' +
                "Ejecutar: python scripts/admin/set_custom_claims.py --apply"
        );
    }

    if (isCoordinator(email)) {
        const expectedInst = getCoordinatorInstitution(email);
        if (claims.coordinator !== true) {
            console.warn(
                '[Security] Coordinador sin claim "coordinator". ' +
                    "Ejecutar: python scripts/admin/set_custom_claims.py --apply"
            );
        } else if (
            expectedInst &&
            claims.institution !== expectedInst
        ) {
            console.warn(
                `[Security] Claim institution="${String(claims.institution)}" ` +
                    `≠ esperado "${expectedInst}". Revisar set_custom_claims.py`
            );
        }
    }
}
