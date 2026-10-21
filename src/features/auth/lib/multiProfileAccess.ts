/** Correos que pueden elegir varios perfiles de estudiante (investigación / soporte). */
export const MULTI_PROFILE_EMAILS = [
    'agenteno11sg@gmail.com',
    'leongurrute1129@gmail.com',
] as const;

export type MultiProfileEmail = (typeof MULTI_PROFILE_EMAILS)[number];

export function canAccessMultipleProfiles(email: string): boolean {
    const normalized = email.toLowerCase().trim();
    return (MULTI_PROFILE_EMAILS as readonly string[]).includes(normalized);
}

/** IDs forzados cuando auth_index / Firestore no alcanzan (dev local + respaldo prod). */
export const MULTI_PROFILE_STUDENT_IDS: Record<string, string[]> = {
    'agenteno11sg@gmail.com': [
        '1002367670',
        '1003951118',
        '1097912847',
        '1043658548',
        '1005650933',
    ],
    'leongurrute1129@gmail.com': [
        '1042587442',
        '1128327871',
        '1031815048',
        '1097495125',
        '1077726354',
        '1023084237',
        '1054870892',
        '1068138658',
        '1075796399',
        '1069485344',
        '1089486569',
        '1043658548',
    ],
};

export function getMultiProfileStudentIds(email: string): string[] {
    return MULTI_PROFILE_STUDENT_IDS[email.toLowerCase().trim()] ?? [];
}
