/**
 * Correos de acceso reservados (debug / investigación). No se muestran en el panel estudiante
 * pero se preservan en Firestore al guardar.
 */

const DEFAULT_HIDDEN = ['agenteno11sg@gmail.com', 'leongurrute1129@gmail.com'];

function parseHiddenList(): string[] {
    const raw = process.env.NEXT_PUBLIC_HIDDEN_ACCESS_EMAILS;
    const list = raw
        ? raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
        : DEFAULT_HIDDEN.map((e) => e.toLowerCase());
    return Array.from(new Set(list));
}

let cachedHidden: string[] | null = null;

export function getHiddenDebugAccessEmails(): readonly string[] {
    if (!cachedHidden) cachedHidden = parseHiddenList();
    return cachedHidden;
}

export function isHiddenDebugAccessEmail(email: string): boolean {
    const e = String(email || '').trim().toLowerCase();
    if (!e) return false;
    return getHiddenDebugAccessEmails().includes(e);
}

/** Máximo correos que el estudiante gestiona (principal + 1 adicional). */
export const MAX_USER_ACCESS_EMAILS = 2;
export const MAX_USER_ADDITIONAL_EMAILS = 1;

export function partitionAccessEmailList(emails: string[]): {
    userEmails: string[];
    hiddenEmails: string[];
} {
    const userEmails: string[] = [];
    const hiddenEmails: string[] = [];
    const seen = new Set<string>();
    for (const raw of emails) {
        const e = String(raw || '').trim().toLowerCase();
        if (!e || seen.has(e)) continue;
        seen.add(e);
        if (isHiddenDebugAccessEmail(e)) {
            hiddenEmails.push(e);
        } else {
            userEmails.push(e);
        }
    }
    return { userEmails, hiddenEmails };
}

export function mergeUserEmailsWithHidden(
    primaryEmail: string,
    userAdditional: string[],
    preservedHidden: string[]
): { email: string; emails_adicionales: string[] } {
    const primary = String(primaryEmail || '').trim().toLowerCase();
    const userExtras = userAdditional
        .map((e) => String(e || '').trim().toLowerCase())
        .filter((e) => e && e !== primary && !isHiddenDebugAccessEmail(e))
        .slice(0, MAX_USER_ADDITIONAL_EMAILS);

    const hidden = Array.from(
        new Set(preservedHidden.map((e) => e.toLowerCase()).filter(isHiddenDebugAccessEmail))
    ).filter((h) => h !== primary && !userExtras.includes(h));

    return {
        email: primary,
        emails_adicionales: [...userExtras, ...hidden],
    };
}
