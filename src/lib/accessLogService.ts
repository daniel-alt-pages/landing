/**
 * 📊 Access Log Service — Monitoreo de logins en producción
 * 
 * Registra cada login exitoso en Firestore con mínimo consumo de reads.
 * Estructura: access_logs/{role}/{yyyy-mm-dd} → entries[] (array append)
 *   - access_logs/admin/2026-04-20
 *   - access_logs/coordinador/2026-04-20
 *   - access_logs/estudiante/2026-04-20
 * 
 * Diseño optimizado:
 *  - 1 doc por rol por día = 1 read para obtener todos los logins del día de un rol
 *  - Máximo 30 días de retención por rol
 *  - Agrupado por rol y fecha para facilitar análisis y limpieza
 */

import { db } from '@features/auth/lib/firebase';
import {
    doc,
    getDoc,
    setDoc,
    arrayUnion,
    collection,
    getDocs,
    deleteDoc,
    Timestamp,
} from 'firebase/firestore';

// ========================================
// Types
// ========================================

export type AccessRole = 'admin' | 'coordinador' | 'estudiante';

export interface AccessLogEntry {
    email: string;
    role: AccessRole;
    timestamp: string;
    userAgent: string;
    displayName?: string;
    institution?: string;
    uid?: string;
}

export interface DailyAccessLog {
    date: string;
    role: AccessRole;
    entries: AccessLogEntry[];
    totalLogins: number;
}

// ========================================
// Constants
// ========================================

const COLLECTION = 'access_logs';
const ROLES: AccessRole[] = ['admin', 'coordinador', 'estudiante'];
const MAX_RETENTION_DAYS = 30;

// ========================================
// Helpers
// ========================================

function getTodayKey(): string {
    return new Date().toISOString().split('T')[0]; // yyyy-mm-dd
}

function getUserAgent(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return ua.slice(0, 50);
}

/**
 * Ruta del documento: access_logs/{role}/{yyyy-mm-dd}
 * Subcollección por rol para separación clara en consola de Firebase.
 */
function getLogDocRef(role: AccessRole, dateKey: string) {
    return doc(db, COLLECTION, role, 'dias', dateKey);
}

// ========================================
// Core Functions
// ========================================

/**
 * Registra un login exitoso en Firestore.
 * Se llama después de una autenticación exitosa en login/page.tsx.
 * 
 * OPT-2: Optimizado para 0 reads.
 *  - sessionStorage dedup: solo 1 log por sesión de navegador (evita recargas)
 *  - setDoc con merge + arrayUnion: elimina el getDoc previo (0 reads, 1 write)
 *  - Idempotente: funciona si el doc existe o no
 * 
 * Estructura escrita:
 *   access_logs/{role}/dias/{yyyy-mm-dd}
 */
export async function logAccess(
    email: string,
    role: AccessRole,
    displayName?: string,
    institution?: string,
    uid?: string,
): Promise<void> {
    try {
        // ── OPT-2: Dedup por sesión de navegador ──
        if (typeof sessionStorage !== 'undefined') {
            const sessionKey = `sg_logged_${email}_${role}`;
            if (sessionStorage.getItem(sessionKey)) {
                console.log(`[AccessLog] ⏭️ Ya registrado en esta sesión: ${email} (${role})`);
                return;
            }
            sessionStorage.setItem(sessionKey, '1');
        }

        const dateKey = getTodayKey();
        const docRef = getLogDocRef(role, dateKey);

        const entry: AccessLogEntry = {
            email: email.toLowerCase(),
            role,
            timestamp: new Date().toISOString(),
            userAgent: getUserAgent(),
            ...(displayName && { displayName }),
            ...(institution && { institution }),
            ...(uid && { uid }),
        };

        // ── OPT-2: setDoc con merge — 0 reads, 1 write ──
        await setDoc(docRef, {
            date: dateKey,
            role,
            entries: arrayUnion(entry),
            createdAt: Timestamp.now(),
        }, { merge: true });

        console.log(`[AccessLog] ✅ Login registrado: ${email} (${role}) → access_logs/${role}/dias/${dateKey}`);
    } catch (error) {
        // No bloquear el login si falla el log
        console.error('[AccessLog] Error registrando acceso:', error);
    }
}

// ========================================
// OPT-3: Cache para Admin Reads (10 min TTL)
// ========================================

const LOG_CACHE = {
    _data: null as DailyAccessLog[] | null,
    _ts: 0,
    _days: 0,
    TTL: 10 * 60 * 1000, // 10 minutos
    LS_KEY: 'sg_access_logs_cache_v2', // v2 = nueva estructura

    get(days: number): DailyAccessLog[] | null {
        // 1. Memory cache
        if (this._data && this._days === days && Date.now() - this._ts < this.TTL) {
            return this._data;
        }
        // 2. localStorage cache
        try {
            const raw = localStorage.getItem(this.LS_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.days === days && Date.now() - parsed.ts < this.TTL) {
                    this._data = parsed.data;
                    this._ts = parsed.ts;
                    this._days = parsed.days;
                    return parsed.data;
                }
            }
        } catch { /* ignore */ }
        return null;
    },

    set(days: number, data: DailyAccessLog[]): void {
        this._data = data;
        this._ts = Date.now();
        this._days = days;
        try {
            localStorage.setItem(this.LS_KEY, JSON.stringify({
                data, ts: this._ts, days,
            }));
        } catch { /* storage full */ }
    },

    invalidate(): void {
        this._data = null;
        this._ts = 0;
        try { localStorage.removeItem(this.LS_KEY); } catch { /* ignore */ }
    },
};

// ========================================
// Admin Read Functions
// ========================================

/**
 * Obtiene los logs de acceso de los últimos N días para todos los roles.
 * 
 * Nueva estructura:
 *   access_logs/{role}/dias/{date}
 * 
 * Costo: roles(3) × días(N) reads máximo — con cache 10 min.
 * 
 * @param days - Número de días hacia atrás
 * @param roles - Filtrar por roles específicos (default: todos)
 * @param forceRefresh - Ignorar cache
 */
export async function getAccessLogs(
    days: number = 7,
    roles: AccessRole[] = ROLES,
    forceRefresh = false,
): Promise<DailyAccessLog[]> {
    // ── OPT-3: Verificar cache ──
    if (!forceRefresh) {
        const cached = LOG_CACHE.get(days);
        if (cached) {
            // Filtrar por roles pedidos si el cache tiene todos
            const filtered = cached.filter(l => roles.includes(l.role));
            console.log(`[AccessLog] 📦 Cache hit (${filtered.length} entradas, ${Math.round((LOG_CACHE.TTL - (Date.now() - LOG_CACHE._ts)) / 1000)}s restantes)`);
            return filtered;
        }
    }

    try {
        const logs: DailyAccessLog[] = [];
        const today = new Date();

        for (const role of ROLES) {
            for (let i = 0; i < days; i++) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const dateKey = d.toISOString().split('T')[0];
                const docRef = getLogDocRef(role, dateKey);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    logs.push({
                        date: dateKey,
                        role,
                        entries: data.entries || [],
                        totalLogins: (data.entries || []).length,
                    });
                }
            }
        }

        // Ordenar: más recientes primero
        logs.sort((a, b) => b.date.localeCompare(a.date) || a.role.localeCompare(b.role));

        // ── Guardar en cache (todos los roles) ──
        LOG_CACHE.set(days, logs);
        const total = logs.reduce((s, l) => s + l.entries.length, 0);
        console.log(`[AccessLog] 🔄 Datos frescos: ${logs.length} docs, ${total} entries`);

        // Filtrar por roles pedidos antes de retornar
        return logs.filter(l => roles.includes(l.role));
    } catch (error) {
        console.error('[AccessLog] Error obteniendo logs:', error);
        return [];
    }
}

/**
 * Invalida el cache de logs.
 */
export function invalidateLogCache(): void {
    LOG_CACHE.invalidate();
}

/**
 * Obtiene estadísticas resumidas de acceso.
 * No genera reads adicionales — calcula sobre datos ya obtenidos.
 */
export function computeAccessStats(logs: DailyAccessLog[]): {
    totalLogins: number;
    uniqueUsers: number;
    byRole: Record<string, number>;
    byDay: { date: string; count: number }[];
    recentLogins: AccessLogEntry[];
    topUsers: { email: string; count: number; role: string }[];
} {
    const allEntries = logs.flatMap(l => l.entries);
    const uniqueEmails = new Set(allEntries.map(e => e.email));

    const byRole: Record<string, number> = {};
    const userCounts: Record<string, { count: number; role: string }> = {};

    for (const entry of allEntries) {
        byRole[entry.role] = (byRole[entry.role] || 0) + 1;
        if (!userCounts[entry.email]) {
            userCounts[entry.email] = { count: 0, role: entry.role };
        }
        userCounts[entry.email].count++;
    }

    const topUsers = Object.entries(userCounts)
        .map(([email, data]) => ({ email, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

    // Agrupar por día (sumando todos los roles)
    const byDayMap: Record<string, number> = {};
    for (const log of logs) {
        byDayMap[log.date] = (byDayMap[log.date] || 0) + log.entries.length;
    }
    const byDay = Object.entries(byDayMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => b.date.localeCompare(a.date));

    // Últimos 20 logins
    const recentLogins = allEntries
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20);

    return {
        totalLogins: allEntries.length,
        uniqueUsers: uniqueEmails.size,
        byRole,
        byDay,
        recentLogins,
        topUsers,
    };
}

/**
 * Limpia logs antiguos (> MAX_RETENTION_DAYS) en todos los roles.
 * Se ejecuta manualmente desde el panel admin.
 */
export async function cleanupOldLogs(): Promise<number> {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - MAX_RETENTION_DAYS);
        const cutoffKey = cutoffDate.toISOString().split('T')[0];

        let deleted = 0;
        for (const role of ROLES) {
            const colRef = collection(db, COLLECTION, role, 'dias');
            const snapshot = await getDocs(colRef);

            for (const docSnap of snapshot.docs) {
                if (docSnap.id < cutoffKey) {
                    await deleteDoc(docSnap.ref);
                    deleted++;
                }
            }
        }

        console.log(`[AccessLog] Limpieza completada: ${deleted} documentos eliminados`);
        return deleted;
    } catch (error) {
        console.error('[AccessLog] Error en limpieza:', error);
        return 0;
    }
}
