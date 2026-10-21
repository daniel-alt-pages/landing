/**
 * 🧹 Storage Cleanup Utility
 *
 * Gestiona la limpieza del localStorage cuando se acerca al límite de quota (5MB típico).
 * Mantiene solo las claves esenciales de sesión; borra todos los cachés de datos.
 *
 * Prefijos de caché conocidos:
 *  - sg_v9_*          → Caché de simulacros (el más pesado — resultados detallados)
 *  - sg_v8_results_*  → Caché legacy de resultados (obsoleto)
 *  - sg_access_logs_cache_v2 → Logs de acceso (admin)
 *  - profile_*        → Caché de perfiles de estudiante
 *  - sg_profiles_*    → Caché de selección de perfiles múltiples
 *  - sg_img_usage_*   → Tracking de uso de imágenes
 *  - sg_url_cache_*   → Caché de previews de enlaces
 *  - sg_*             → Cualquier otro caché del proyecto
 *
 * Claves de sesión esenciales (NO se borran):
 *  - student_id, student_name, student_email
 *  - coordinator_email, coordinator_institution
 *  - admin_session
 *  - simulacro_selected
 *  - google_photo_url
 *  - linked_profiles
 *  - selected_profile_id
 *  - sg_data_version, sg_sim_versions
 *  - sg_login_form_draft_v1 → Borrador login (documento/fecha en este dispositivo)
 */
// ── Prefijos de caché que se pueden borrar de forma segura ──
const CACHE_PREFIXES = [
    'sg_v22_',
    'sg_v21_',
    'sg_v20_',
    'sg_v19_',
    'sg_v9_',
    'sg_v8_results_',
    'sg_access_logs_cache_v2',
    'profile_',
    'sg_profiles_',
    'sg_img_usage_',
    'sg_url_cache_',
    'sg_imgbb_usage_',
    'sg_budget_',
    'sg_linked_',
    'photo_changed_',
    'photo_sync_done_',
    'profile_write_budget',
];

// ── Claves individuales de caché que también se limpian ──
const CACHE_EXACT_KEYS = [
    'sg_access_logs_cache_v2',
    'profile_write_budget',
];

// ── Umbral: limpiar cuando localStorage esté a >80% del límite típico (5MB) ──
const QUOTA_THRESHOLD_BYTES = 4 * 1024 * 1024; // 4MB

/**
 * Calcula el uso aproximado del localStorage en bytes.
 */
export function getLocalStorageUsageBytes(): number {
    if (typeof window === 'undefined') return 0;
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        total += key.length + (localStorage.getItem(key)?.length ?? 0);
    }
    return total * 2; // UTF-16: 2 bytes por carácter
}

/**
 * Retorna un inventario de todos los ítems en localStorage con su tamaño.
 */
export function getLocalStorageInventory(): { key: string; bytes: number; isCache: boolean }[] {
    if (typeof window === 'undefined') return [];
    const items: { key: string; bytes: number; isCache: boolean }[] = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const value = localStorage.getItem(key) ?? '';
        const bytes = (key.length + value.length) * 2;
        const isCache =
            CACHE_PREFIXES.some(p => key.startsWith(p)) ||
            CACHE_EXACT_KEYS.includes(key);
        items.push({ key, bytes, isCache });
    }

    return items.sort((a, b) => b.bytes - a.bytes);
}

/**
 * Limpia todos los cachés de datos del localStorage.
 * NO borra claves de sesión (student_id, coordinator_email, etc.)
 *
 * @returns Número de bytes liberados
 */
export function clearDataCaches(): number {
    if (typeof window === 'undefined') return 0;

    const before = getLocalStorageUsageBytes();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        const isCache =
            CACHE_PREFIXES.some(p => key.startsWith(p)) ||
            CACHE_EXACT_KEYS.includes(key);

        if (isCache) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(k => localStorage.removeItem(k));

    const after = getLocalStorageUsageBytes();
    const freed = before - after;

    console.log(`[StorageCleanup] Liberados ${(freed / 1024).toFixed(1)} KB (${keysToRemove.length} ítems eliminados)`);
    return freed;
}

/**
 * Limpieza de emergencia: elimina TODO excepto claves de sesión críticas.
 * Usar solo cuando clearDataCaches() no sea suficiente.
 *
 * @returns Número de bytes liberados
 */
export function emergencyClearAll(): number {
    if (typeof window === 'undefined') return 0;

    // Claves de sesión que DEBEN sobrevivir
    const SESSION_KEYS = [
        'student_id', 'student_name', 'student_email',
        'coordinator_email', 'coordinator_institution',
        'coordinator_selected_institution', 'coordinator_selected_simulation',
        'admin_session',
        'simulacro_selected',
        'google_photo_url',
        'linked_profiles',
        'selected_profile_id',
        'sg_data_version',
        'sg_sim_versions',
    ];

    // Preservar valores antes de limpiar
    const preserved: Record<string, string> = {};
    for (const key of SESSION_KEYS) {
        const val = localStorage.getItem(key);
        if (val !== null) preserved[key] = val;
    }

    const before = getLocalStorageUsageBytes();

    // Limpiar todo
    localStorage.clear();

    // Restaurar sesión
    for (const [key, val] of Object.entries(preserved)) {
        try { localStorage.setItem(key, val); } catch { /* ignore */ }
    }

    const after = getLocalStorageUsageBytes();
    const freed = before - after;

    console.warn(`[StorageCleanup] ⚠️ Limpieza de emergencia: ${(freed / 1024).toFixed(1)} KB liberados`);
    return freed;
}

/**
 * Auto-limpieza: verifica el uso y limpia si supera el umbral.
 * Se puede llamar al inicio de sesión o desde un useEffect.
 *
 * @returns true si se realizó limpieza
 */
export function autoCleanIfNeeded(): boolean {
    if (typeof window === 'undefined') return false;

    const usage = getLocalStorageUsageBytes();
    if (usage > QUOTA_THRESHOLD_BYTES) {
        console.warn(`[StorageCleanup] ⚠️ localStorage al ${Math.round(usage / 1024)}KB — iniciando auto-limpieza`);
        clearDataCaches();
        return true;
    }
    return false;
}

/**
 * Formatea bytes a string legible (KB / MB).
 */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
