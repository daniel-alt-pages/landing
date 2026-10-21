/**
 * Evita mezclar localStorage entre Firebase prod (simulacros-sg) y staging (pruebas-sg-aa586).
 */
import { clearDataCaches } from '@/lib/storageCleanup';

const PROJECT_KEY = 'sg_firebase_project_id';

const SESSION_KEYS_ON_PROJECT_SWITCH = [
    'student_id',
    'student_name',
    'student_email',
    'student_data',
    'simulacro_selected',
    'linked_profiles',
    'selected_profile_id',
    'google_photo_url',
    'sg_data_version',
    'sg_sim_versions',
];

export function getFirebaseProjectId(): string {
    return process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
}

/** Limpia cachés de datos si el bundle apunta a otro proyecto Firebase. */
export function clearCachesIfFirebaseProjectChanged(): boolean {
    if (typeof window === 'undefined') return false;

    const current = getFirebaseProjectId();
    if (!current) return false;

    const stored = localStorage.getItem(PROJECT_KEY);
    if (stored === current) return false;

    clearDataCaches();
    for (const key of SESSION_KEYS_ON_PROJECT_SWITCH) {
        localStorage.removeItem(key);
    }

    localStorage.setItem(PROJECT_KEY, current);
    console.warn(
        `[FirebaseCache] Proyecto cambió (${stored || 'none'} → ${current}). Caché de sesión limpiada.`
    );
    return true;
}

export function touchFirebaseProjectCache(): void {
    if (typeof window === 'undefined') return;
    const current = getFirebaseProjectId();
    if (current) localStorage.setItem(PROJECT_KEY, current);
}
