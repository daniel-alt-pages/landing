/**
 * Firestore Service — Arquitectura de Ambientes Separados
 * 
 * LOCAL (desarrollo: `next dev`):
 *   - JSON estáticos en public/data/ (incluye hostname de túnel / reenvío de puerto)
 *   - 0 reads de Firestore en ese modo
 *   - No usar solo `hostname === 'localhost'`: Cursor/VS Code/Codespaces cambian el host
 * 
 * PRODUCCIÓN:
 *   - Todo se lee desde Firestore
 *   - 0 descargas de hosting (no se sirven JSON estáticos grandes)
 *   - localStorage cache (30d sims cerrados, 24h sim activo) + invalidación simVersions/dataVersion
 *   - ~1 read por sesión recurrente (config); ~5 en primera carga fría
 * 
 * MIGRACIÓN:
 *   - Script upload_to_firestore.py sube datos locales a Firestore
 *   - Ambiente controlado, no afecta producción hasta que se ejecuta
 */

import { db, waitForAuth, auth, isRealAuthUser } from '@features/auth/lib/firebase';
import { assertNoRemoteFirestore } from '@features/simulacro/lib/localOnlyGuard';
import { ADMIN_EMAILS, COORDINATOR_MAP, getCoordinatorInstitution } from '@features/auth/lib/admin-auth';
import {
    canAccessMultipleProfiles,
    getMultiProfileStudentIds,
} from '@features/auth/lib/multiProfileAccess';
import { canReadStudentFirestoreResults } from '@/lib/studentSession';
import {
    doc,
    getDoc,
    getDocFromServer,
    getDocs,
    runTransaction,
    collection,
    query,
    where,
    DocumentData,
    QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { Estudiante, EstadisticasGrupo } from '@shared/types';
import {
    getStudentSourceSimulation,
    tagStudentForSimulation,
} from '@shared/lib/studentDisplay';
import { isDemoEstudianteRoute, isDemoCoordinadorRoute } from '@/app/demo/_shared/demoRoutePaths';
import {
    STUDENT_AUTH_COLLECTION,
    studentAuthDocumentoDocId,
    studentAuthEmailDocId,
} from '@features/curso/lib/courseAccessKeys';
import {
    DEMO_STUDENT_ID,
    DEMO_STUDENT_DEFAULT_SIM,
    DEMO_STUDENT_SIMS,
    isDemoInstitutionName,
    maskEstudianteForDemo,
    maskEstudianteListForDemo,
    maskPersonalForDemo,
} from '@/app/demo/_shared/demoPrivacy';
import { isAllowedDemoStudentSim } from '@/app/demo/_shared/bootstrapDemoStudentSession';
import { clientRateLimit, sanitizeInput, isValidEmail, isValidStudentId } from '@/lib/security';
import { normalizeBirthDateInput } from '@/lib/birthDateHash';
import { isStagingFirebase } from '@/lib/deploy-env';
import { shouldDemoRouteUseFirebase } from '@/lib/demoDataSource';
import type {
    PlannerCustomizationPayload,
    PlannerGlobalProfile,
    PlannerMergedProfile,
    PlannerQuotaState,
    PlannerSimulationOverride
} from '../types/simulation';
import {
  CACHE_TTL_ACTIVE_SIM_MS,
  CACHE_TTL_APP_CONFIG_MS,
  CACHE_TTL_CLOSED_SIM_MS,
  CACHE_TTL_DEFAULT_MS,
  CACHE_SWR_APP_CONFIG_MAX_AGE_MS,
  normalizeSimIdForCache,
  readCachedActiveSimulation,
} from '@shared/lib/cachePolicy';
import { invalidatePanelScreenCache, invalidatePanelScreenCacheForSim } from '@shared/lib/panelScreenCache';
import { checkCourseVersions } from '@features/curso/lib/courseVersioning';

export const CACHE_VERSION = 'sg_v48'; // Cache bust: SG11-23 claves Lec45/Cn70

/** Ocultos solo del panel estudiante. Coord/admin conservan acceso histórico. */
const PLATFORM_STUDENT_HIDDEN_SIMULATIONS = ['SG11-15'];
const CACHE_TTL_MS = CACHE_TTL_DEFAULT_MS;
const CACHE_TTL_LONG = CACHE_TTL_CLOSED_SIM_MS;
const CACHE_TTL_ACTIVE_SIM = CACHE_TTL_ACTIVE_SIM_MS;
const CACHE_TTL_APP_CONFIG = CACHE_TTL_APP_CONFIG_MS;

// ========================================
// Detección de Ambiente
// ========================================

/**
 * Modo “datos locales” (JSON en /data) vs Firestore en producción.
 * `next dev` con URL reenviada (p. ej. *.cursor*, ngrok) no usa hostname localhost;
 * ahí `NODE_ENV === 'development'` evita tratar el dev como producción.
 */
function isDemoRoute(): boolean {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    return (
        isDemoEstudianteRoute(path) ||
        isDemoCoordinadorRoute(path) ||
        path.startsWith('/acceso-demo/coordinador')
    );
}

function isDemoFirebaseRoute(): boolean {
    if (!isDemoRoute()) return false;
    return shouldDemoRouteUseFirebase();
}

function isDemoOfflineRoute(): boolean {
    return isDemoRoute() && !isDemoFirebaseRoute();
}

function isDemoStudentContext(): boolean {
    return isDemoRoute() && isDemoEstudianteRoute(window.location.pathname);
}

function applyDemoStudentPrivacy(student: Estudiante | null): Estudiante | null {
    if (!student || !isDemoRoute()) return student;
    if (!student.informacion_personal?.numero_identificacion) return null;
    const studentId = String(student.informacion_personal.numero_identificacion).trim();
    const isFeaturedDemoStudent =
        isDemoStudentContext() &&
        studentId === DEMO_STUDENT_ID &&
        isDemoFirebaseRoute();
    if (
        !isFeaturedDemoStudent &&
        !isDemoInstitutionName(student.informacion_personal?.institucion)
    ) {
        return null;
    }
    return maskEstudianteForDemo(student);
}

function finalizeDemoStudentResult(
    student: Estudiante | null,
    studentId: string,
    simId: string,
): Estudiante | null {
    if (!isDemoStudentContext()) return student;
    if (String(studentId).trim() !== DEMO_STUDENT_ID) return null;
    if (!isDemoFirebaseRoute() && !isAllowedDemoStudentSim(simId)) return null;
    return applyDemoStudentPrivacy(student);
}

function applyDemoStudentsPrivacy(students: Estudiante[]): Estudiante[] {
    if (!isDemoRoute()) return students;
    return maskEstudianteListForDemo(students, { force: true });
}

function applyDemoPrivacyOnStudent(
    student: Estudiante | null,
    studentId: string,
    simId: string,
): Estudiante | null {
    if (!student) return null;
    if (!isDemoRoute()) return student;
    if (typeof window !== 'undefined' && isDemoCoordinadorRoute(window.location.pathname)) {
        if (!isDemoInstitutionName(student.informacion_personal?.institucion)) return null;
        return maskEstudianteForDemo(student);
    }
    return finalizeDemoStudentResult(student, studentId, simId);
}

function finalizeAllStudentsList(students: Estudiante[]): Estudiante[] {
    return applyDemoStudentsPrivacy(students);
}

function maskRankingEntriesForDemo(entries: RankingEntry[]): RankingEntry[] {
    if (!isDemoRoute()) return entries;
    return entries
        .filter((entry) => isDemoInstitutionName(entry.institucion))
        .map((entry) => {
            const masked = maskPersonalForDemo({
                nombres: entry.nombre,
                apellidos: entry.apellidos,
                numero_identificacion: entry.numero_identificacion,
                institucion: entry.institucion,
            });
            return {
                ...entry,
                nombre: masked.nombres ?? entry.nombre,
                apellidos: masked.apellidos ?? entry.apellidos,
                numero_identificacion: masked.numero_identificacion ?? entry.numero_identificacion,
                institucion: masked.institucion ?? entry.institucion,
            };
        });
}

/**
 * Fork experimental: SIEMPRE local.
 * Firebase / rutas remotas están deshabilitadas por política del plan.
 */
const isLocal = true;

/** localhost + next dev (incl. dev:staging con Firebase remoto). */
function isLocalhostDevHost(): boolean {
    if (typeof window === 'undefined') return false;
    const h = window.location.hostname;
    return (
        process.env.NODE_ENV === 'development' &&
        (h === 'localhost' || h === '127.0.0.1' || h === '[::1]')
    );
}

/** localhost dev: mezclar JSON en public/data aunque Firebase sea staging/prod remoto. */
function useLocalStaticSimData(): boolean {
    return isLocal || isLocalhostDevHost();
}

async function loadStaticAvailableSimulations(): Promise<string[]> {
    try {
        const data = await fetchStaticJSON<{ available?: string[] }>('current_simulation.json');
        return sortSimulations(data.available || []);
    } catch {
        return [];
    }
}

async function resolveStudentSimCatalog(config: AppConfig): Promise<string[]> {
    if (!useLocalStaticSimData()) return config.availableSimulations;
    const fromJson = await loadStaticAvailableSimulations();
    return sortSimulations([...config.availableSimulations, ...fromJson]);
}

async function scanStudentSimsFromStaticJson(
    studentId: string,
    catalog: string[],
): Promise<string[]> {
    const found: string[] = [];
    for (const simId of catalog) {
        try {
            await fetchStaticJSON<unknown>(`simulations/${simId}/estudiantes/${studentId}.json`);
            found.push(simId);
            continue;
        } catch {
            /* individual JSON missing — fallback students.json */
        }
        try {
            const allData = await fetchStaticJSON<{ estudiantes?: Estudiante[] }>(
                `simulations/${simId}/students.json`,
            );
            const inGroup = allData.estudiantes?.some(
                (e) =>
                    String(e.informacion_personal?.numero_identificacion).trim() ===
                    String(studentId).trim(),
            );
            if (inGroup) found.push(simId);
        } catch {
            /* skip */
        }
    }
    return found;
}

const COURSE_CALENDAR_BUDGET_SOURCES = new Set([
    'fetchCourseRuntime',
    'fetchCourseCalendarSnapshot',
]);

/**
 * Ordena IDs de simulación numéricamente.
 * Extrae la parte numérica de IDs como "SG11-08", "SG11-12X" y ordena por ese número.
 * Ejemplo resultado: ["SG11-08", "SG11-09", "SG11-10", "SG11-11", "SG11-12X"]
 */
function normalizeSimulationId(simId: string): string {
    const raw = String(simId || '').trim();
    // Canonicalizar variantes internas de pipeline para no duplicar en UI.
    // Ej: SG11-17-T -> SG11-17
    return raw.replace(/-T$/i, '');
}

/** Cache: simId → visible en app (publicationStatus.visible o legacy sin doc). */
const publicationVisibleCache = new Map<string, boolean>();
const _filterVisibleSessionCache = new Map<string, string[]>();

/**
 * Simulacros en carga oculta tienen publicationStatus.visible=false.
 * Sin documento → visible (compatibilidad simulacros ya publicados).
 */
async function isSimulationVisibleInApp(simId: string): Promise<boolean> {
    const norm = normalizeSimulationId(simId);
    if (useLocalStaticSimData()) return true;
    if (publicationVisibleCache.has(norm)) {
        return publicationVisibleCache.get(norm)!;
    }
    try {
        const statusRef = doc(db, 'simulations', norm, 'data', 'publicationStatus');
        const snap = await gatedGetDoc(statusRef, 'publicationStatus');
        if (!snap?.exists()) {
            publicationVisibleCache.set(norm, true);
            return true;
        }
        const data = snap.data() as { visible?: boolean; status?: string };
        const visible =
            data.visible === true ||
            data.status === 'published';
        publicationVisibleCache.set(norm, visible);
        return visible;
    } catch {
        return true;
    }
}

function mergeStudentHiddenSimulationIds(hidden?: string[]): string[] {
    return sortSimulations([...PLATFORM_STUDENT_HIDDEN_SIMULATIONS, ...(hidden || [])]);
}

function filterStudentHiddenSimulations(
    simIds: string[],
    hidden?: string[],
): string[] {
    const blocked = mergeStudentHiddenSimulationIds(hidden);
    if (!blocked.length) return simIds;
    const blockedSet = new Set(blocked.map(normalizeSimulationId));
    return simIds.filter((id) => !blockedSet.has(normalizeSimulationId(id)));
}

function normalizeAppConfig(config: AppConfig): AppConfig {
    return {
        ...config,
        activeSimulation: normalizeSimulationId(config.activeSimulation || ''),
        availableSimulations: sortSimulations(config.availableSimulations || []),
        partialSimulations: sortSimulations(config.partialSimulations || []),
        studentHiddenSimulations: mergeStudentHiddenSimulationIds(config.studentHiddenSimulations),
    };
}

function filterCoordinatorSummaryData(data: Record<string, unknown>): Record<string, unknown> {
    return data;
}

function readStudentHiddenFromCachedConfig(): string[] {
    if (cache.appConfig?.studentHiddenSimulations?.length) {
        return mergeStudentHiddenSimulationIds(cache.appConfig.studentHiddenSimulations);
    }
    try {
        const raw = localStorage.getItem(`${CACHE_VERSION}_appConfig`);
        if (raw) {
            const { data } = JSON.parse(raw) as { data?: AppConfig };
            if (Array.isArray(data?.studentHiddenSimulations)) {
                return mergeStudentHiddenSimulationIds(data.studentHiddenSimulations);
            }
        }
    } catch {
        /* ignore */
    }
    return mergeStudentHiddenSimulationIds();
}

async function applyStudentFacingSimFilter(
    studentId: string,
    simIds: string[],
): Promise<string[]> {
    const config = await getAppConfig();
    return sortSimulations(
        filterStudentHiddenSimulations(
            normalizeDemoStudentSimList(studentId, simIds),
            config.studentHiddenSimulations,
        ),
    );
}

async function filterVisibleSimulations(simIds: string[]): Promise<string[]> {
    if (useLocalStaticSimData() || simIds.length === 0) return sortSimulations(simIds);
    const cacheKey = simIds.map(normalizeSimulationId).sort().join('|');
    const sessionCached = _filterVisibleSessionCache.get(cacheKey);
    if (sessionCached) return sessionCached;

    const visible: string[] = [];
    for (const id of simIds) {
        if (await isSimulationVisibleInApp(id)) visible.push(id);
    }
    const result = sortSimulations(visible);
    _filterVisibleSessionCache.set(cacheKey, result);
    return result;
}

function sortSimulations(sims: string[]): string[] {
    const deduped = Array.from(new Set(sims.map(normalizeSimulationId).filter(Boolean)));
    return deduped.sort((a, b) => {
        const numA = parseInt(a.replace(/[^0-9-]/g, '').split('-').pop() || '0');
        const numB = parseInt(b.replace(/[^0-9-]/g, '').split('-').pop() || '0');
        if (numA !== numB) return numA - numB;
        // Si mismo número, el que NO tiene sufijo va primero (SG11-12 < SG11-12X)
        return a.length - b.length;
    });
}

/**
 * 🛡️ FIX #2: Normaliza puntajes de cualquier formato a estructura completa
 * Maneja 3 casos:
 * 1. Objeto completo: {puntaje, correctas, total_preguntas}
 * 2. Legacy número: solo puntaje (convierte a objeto con 0s)
 * 3. undefined/null: objeto vacío con 0s
 * 
 * IMPORTANTE: Esta función centraliza la lógica de conversión para evitar
 * inconsistencias entre diferentes partes del código.
 */
export function normalizePuntaje(
    raw: any
): { puntaje: number; correctas: number; total_preguntas: number } {
    if (typeof raw === 'object' && raw !== null && 'puntaje' in raw) {
        // Formato completo: validar y normalizar
        return {
            puntaje: Number(raw.puntaje) || 0,
            correctas: Number(raw.correctas) || 0,
            total_preguntas: Number(raw.total_preguntas) || 0,
        };
    } else if (typeof raw === 'number') {
        // Legacy: solo número (puntaje)
        // NOTA: correctas y total_preguntas se pierden en este formato
        return {
            puntaje: raw,
            correctas: 0,
            total_preguntas: 0,
        };
    } else {
        // undefined, null, o formato inválido
        return {
            puntaje: 0,
            correctas: 0,
            total_preguntas: 0,
        };
    }
}

// ========================================
// Types
// ========================================

export interface AppConfig {
    activeSimulation: string;
    availableSimulations: string[];
    consoleEnabled?: boolean;
    dataVersion?: string; // Global: cambia todo → invalida todo el cache
    simVersions?: Record<string, number>; // Per-sim: {"SG11-11": 2} → invalida solo ese sim
    partialSimulations?: string[]; // Sims con calificación parcial (aún se están actualizando)
    /** Retirados de la UI (estudiante + coord + admin). Sincronizar con Firestore. */
    studentHiddenSimulations?: string[];
    coursesVersion?: string;
    courseVersions?: Record<string, number>;
    courseMetricsVersions?: Record<string, number>;
    simFeatures?: Record<string, { recordings?: boolean; planEstudio?: boolean }>;
}

export interface StudentProfile {
    id: string;
    email: string;
    nombre: string;
    apellidos: string;
    institucion?: string;
    departamento?: string;
    simulacros?: string[]; // OPT-3: Lista de simulacros del estudiante (precargada desde Firestore)
}

export interface InvalidacionItem {
    simulacro: string;
    sesion: string;
    numero_pregunta: number;
    materia: string;
    motivo?: string;
}

export interface SimulationManifest {
    id: string;
    name: string;
    date: string;
    totalStudents: number;
}

export interface RankingEntry {
    nombre: string;
    apellidos?: string;
    institucion?: string;
    departamento?: string;
    municipio?: string;
    correo_electronico?: string;
    telefono?: string;
    numero_identificacion: string;
    puntaje_global: number;
    posicion: number;
    puntajes?: Record<string, number | { puntaje: number; correctas: number; total_preguntas: number }>;
}

// ========================================
// LocalStorage Persistence (TTL inteligente)
// - 30 DÍAS simulacros cerrados (invalidación: simVersions / dataVersion)
// - 24h simulacro activo (+ simVersions en cada publish)
// - 30 min appConfig (1 read; dispara checkDataVersion / checkSimVersions)
// ========================================

const PLANNER_UPLOAD_LIMIT_PER_DAY = 3;
const COLOMBIA_TZ = 'America/Bogota';

function getColombiaDateKey(date: Date = new Date()): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: COLOMBIA_TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value || '1970';
    const month = parts.find(p => p.type === 'month')?.value || '01';
    const day = parts.find(p => p.type === 'day')?.value || '01';
    return `${year}${month}${day}`;
}

function plannerBaseKey(studentId: string, simId: string): string {
    return `planner_profile_${studentId}_${normalizeSimulationId(simId)}`;
}

function mergePlannerProfiles(
    globalProfile: PlannerGlobalProfile | null,
    simulationProfile: PlannerSimulationOverride | null
): PlannerCustomizationPayload | null {
    if (!globalProfile && !simulationProfile) return null;
    if (!globalProfile) return simulationProfile!;
    if (!simulationProfile) return globalProfile;
    const globalTs = Number(globalProfile.updatedAt || 0);
    const simTs = Number(simulationProfile.updatedAt || 0);
    // LWW para fallback global, pero manteniendo granularidad de override.
    if (simTs >= globalTs) {
        return {
            ...globalProfile,
            ...simulationProfile,
            sessionStates: {
                ...(globalProfile.sessionStates || {}),
                ...(simulationProfile.sessionStates || {})
            },
            source: 'cloud',
            updatedAt: simTs
        };
    }
    return {
        ...globalProfile,
        source: 'cloud',
        updatedAt: globalTs
    };
}

/** localStorage de datos solo en builds deploy (staging/prod). En `next dev` siempre JSON/Firestore fresco. */
function shouldPersistDataCache(): boolean {
    return process.env.NODE_ENV !== 'development';
}

function persistSet<T>(key: string, data: T, customTTL?: number): void {
    if (!shouldPersistDataCache()) return;
    const payload = JSON.stringify({ data, ts: Date.now(), ttl: customTTL });
    try {
        localStorage.setItem(`${CACHE_VERSION}_${key}`, payload);
    } catch {
        // ⚠️ QuotaExceededError — limpiar cachés y reintentar una vez
        try {
            import('@/lib/storageCleanup').then(({ clearDataCaches }) => {
                clearDataCaches();
                try {
                    localStorage.setItem(`${CACHE_VERSION}_${key}`, payload);
                } catch {
                    // Si aún falla, aceptar el dato sin persistir
                    console.warn('[Cache] persistSet: quota insuficiente aún después de limpiar.');
                }
            });
        } catch {
            // import dinámico falló — ignorar silenciosamente
        }
    }
}

function persistGet<T>(key: string): T | null {
    if (!shouldPersistDataCache()) return null;
    try {
        const raw = localStorage.getItem(`${CACHE_VERSION}_${key}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const { data, ts, ttl } = parsed;
        // Usar TTL custom si fue guardado, sino default 7 días
        const effectiveTTL = ttl || CACHE_TTL_MS;
        if (Date.now() - ts > effectiveTTL) {
            localStorage.removeItem(`${CACHE_VERSION}_${key}`);
            return null;
        }
        return data as T;
    } catch {
        return null;
    }
}

/**
 * Simulacro activo → TTL corto (24h). Históricos cerrados → 30 días.
 * checkSimVersions() invalida por sim si hay cambios en pipeline.
 */
function getSimTTL(simId: string): number {
    const active = cache.appConfig?.activeSimulation ?? readCachedActiveSimulation();
    if (active && normalizeSimIdForCache(simId) === normalizeSimIdForCache(active)) {
        return CACHE_TTL_ACTIVE_SIM;
    }
    return CACHE_TTL_LONG;
}

/** Clave canónica de cache para resultados de estudiante (memoria + localStorage). */
function studentResultCacheKey(studentId: string, simId: string): string {
    return `results_${studentId}_${normalizeSimulationId(simId)}`;
}

function persistClear(): void {
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('sg_v')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {
        // Ignore
    }
}

/**
 * Verifica si la versión global de datos cambió.
 * Si cambió, limpia TODO el cache (nuclear).
 */
function checkDataVersion(serverVersion: string | undefined): void {
    if (!serverVersion) return;
    try {
        const localVersion = localStorage.getItem('sg_data_version');
        if (localVersion && localVersion !== serverVersion) {
            console.log(`[Cache] dataVersion cambió: ${localVersion} → ${serverVersion}. Limpiando TODO el cache...`);
            persistClear();
            cache.appConfig = undefined;
            cache.studentProfiles.clear();
            cache.studentResults.clear();
            cache.allStudents.clear();
            cache.statistics.clear();
            cache.invalidaciones.clear();
            cache.rankings.clear();
            cache.manifests.clear();
            invalidatePanelScreenCache();
        }
        localStorage.setItem('sg_data_version', serverVersion);
    } catch {
        // Ignore storage errors
    }
}

/** Normaliza simVersions legacy (número, string numérico o JSON `{"t":…}` del pipeline viejo). */
function coerceSimVersion(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const asNum = Number(value);
        if (Number.isFinite(asNum)) return asNum;
        try {
            const parsed = JSON.parse(value) as { t?: number };
            if (typeof parsed?.t === 'number' && Number.isFinite(parsed.t)) return parsed.t;
        } catch {
            /* ignore */
        }
    }
    return 0;
}

/**
 * Verifica versiones por simulacro.
 * Si un sim específico cambió de versión, limpia SOLO el cache de ese sim.
 * Ejemplo: simVersions = {"SG11-11": 2} → si local tenía 1, limpia solo SG11-11.
 */
function checkSimVersions(serverVersions: Record<string, number> | undefined): void {
    if (!serverVersions || Object.keys(serverVersions).length === 0) return;
    try {
        const localRaw = localStorage.getItem('sg_sim_versions');
        const localParsed: Record<string, unknown> = localRaw ? JSON.parse(localRaw) : {};

        for (const [simId, rawServerVer] of Object.entries(serverVersions)) {
            const serverVer = coerceSimVersion(rawServerVer);
            const localVer = coerceSimVersion(localParsed[simId]);
            if (serverVer > localVer) {
                console.log(`[Cache] simVersion cambió para ${simId}: v${localVer} → v${serverVer}. Limpiando cache de ${simId}...`);
                // Limpiar datos de este sim específico de localStorage
                const keysToRemove: string[] = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(CACHE_VERSION) && key.includes(simId)) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));
                console.log(`[Cache] Eliminadas ${keysToRemove.length} entradas de cache para ${simId}`);

                // Limpiar cache in-memory de este sim
                cache.statistics.delete(simId);
                cache.rankings.delete(simId);
                cache.allStudents.delete(simId);
                cache.invalidaciones.delete(simId);
                cache.manifests.delete(simId);
                // Limpiar resultados de estudiantes de este sim
                for (const key of cache.studentResults.keys()) {
                    if (key.includes(simId)) cache.studentResults.delete(key);
                }
                invalidatePanelScreenCacheForSim(simId);
            }
        }

        // Guardar versiones normalizadas (solo números)
        const normalized: Record<string, number> = {};
        for (const [simId, raw] of Object.entries(serverVersions)) {
            normalized[simId] = coerceSimVersion(raw);
        }
        localStorage.setItem('sg_sim_versions', JSON.stringify(normalized));
    } catch (err) {
        console.warn('[Cache] Error checking sim versions:', err);
    }
}

// ========================================
// ========================================
// 🛡️ READ BUDGET — Protección con cooldown inteligente
// En vez de bloquear permanentemente, el sistema PAUSA
// temporalmente y luego se auto-reinicia. Esto evita que
// el usuario quede atrapado en un bucle infinito sin datos.
// ========================================

const READ_BUDGET = {
    /** 
     * Presupuestos diferenciados por rol:
     * - Coordinador: pocas sesiones/día (~5-10), necesita cargar muchos simulacros → límite alto
     * - Estudiante: miles de sesiones/día (~10,000), solo necesita SUS datos → límite bajo
     * 
     * cooldownMs: tiempo de pausa cuando se agota el presupuesto.
     *   Al finalizar el cooldown, el contador se reinicia automáticamente.
     */
    LIMITS: {
        // Coordinador: margen amplio para login + dashboard inicial sin abrir lecturas ilimitadas.
        admin: { session: 50_000, minute: 50_000, cooldownMs: 5_000 },
        // ponytail: sesión 2k saturaba cargas TODAS/multi-IE (chunks + hidratación + sondeo ranking) → "Sin datos".
        // Coordinadores son pocas sesiones/día; el techo diario (DAILY_BUDGET.coordinador=50k) sigue protegiendo costo.
        coordinador: { session: 20_000, minute: 8_000, cooldownMs: 5_000 },
        // ponytail: techo sesión/min subió para vacacional; diario estudiante = 340 reads (DAILY_BUDGET)
        estudiante: { session: 800, minute: 300, cooldownMs: 5_000 },
    },

    /** Contadores */
    _sessionReads: 0,
    _minuteReads: 0,
    _minuteStart: Date.now(),
    _cooldownUntil: 0,         // timestamp hasta cuando está en pausa
    _cooldownCycles: 0,        // cuántas veces se ha activado el cooldown en esta sesión
    _warnings: new Set<string>(),

    /** Límites efectivos (staging QA tiene techo más alto que prod). */
    _getLimits(): { session: number; minute: number; cooldownMs: number } {
        const role = this._getRole();
        const base = this.LIMITS[role];
        if (isStagingFirebase) {
            return {
                session: Math.max(base.session, 2_000),
                minute: Math.max(base.minute, 400),
                cooldownMs: base.cooldownMs,
            };
        }
        return base;
    },

    /** Detecta rol desde localStorage (con fallback a Firebase Auth email) */
    _getRole(): 'admin' | 'coordinador' | 'estudiante' {
        if (typeof window === 'undefined') return 'estudiante';
        if (localStorage.getItem('admin_session')) return 'admin';
        // Coordinadores pueden estar identificados por email O por institución (magic link)
        const isCoord = !!localStorage.getItem('coordinator_email') || !!localStorage.getItem('coordinator_institution');
        if (isCoord) return 'coordinador';
        // 🛡️ Fallback: verificar Firebase Auth email cuando localStorage está vacío
        // (ej: admin accediendo directo a /admin sin pasar por login)
        const firebaseUser = auth.currentUser;
        if (firebaseUser && firebaseUser.email && !firebaseUser.isAnonymous) {
            const email = firebaseUser.email.toLowerCase();
            if (ADMIN_EMAILS.includes(email)) return 'admin';
            if (email in COORDINATOR_MAP) return 'coordinador';
        }
        return 'estudiante';
    },

    /** Reinicia contadores después de un cooldown */
    _resetAfterCooldown(role: string) {
        this._sessionReads = 0;
        this._minuteReads = 0;
        this._minuteStart = Date.now();
        this._cooldownCycles++;
        // Limpiar warnings para permitir nuevas alertas si vuelve a pasar
        this._warnings.delete('session');
        this._warnings.delete('minute');
        this._warnings.delete('warning_80');
        console.log(`%c[ReadBudget] ✅ Cooldown finalizado [${role}]. Ciclo #${this._cooldownCycles}. Lecturas reiniciadas.`, 'color: #fff; background: #16a34a; padding: 2px 6px; border-radius: 4px;');
    },

    /** Registra un read y retorna true si está dentro del presupuesto */
    canRead(source: string): boolean {
        // Local = sin límite (todo es JSON estático)
        if (isLocal) return true;
        // Mi Curso calendario en localhost dev — no bloquear por presupuesto del dashboard
        if (isLocalhostDevHost() && COURSE_CALENDAR_BUDGET_SOURCES.has(source)) return true;

        const role = this._getRole();
        const limits = this._getLimits();
        const now = Date.now();

        // ── Si estamos en cooldown, verificar si ya expiró ──
        if (this._cooldownUntil > 0) {
            if (now < this._cooldownUntil) {
                // Aún en pausa — bloquear silenciosamente (ya se notificó)
                return false;
            }
            // Cooldown expiró → reiniciar todo
            this._cooldownUntil = 0;
            this._resetAfterCooldown(role);
        }

        // ── Reset del contador por minuto (ventana deslizante) ──
        if (now - this._minuteStart > 60_000) {
            this._minuteReads = 0;
            this._minuteStart = now;
            this._warnings.delete('minute');
        }

        // ── Verificar presupuesto de sesión ──
        if (this._sessionReads >= limits.session) {
            // Cooldown progresivo: entre más ciclos, más largo el cooldown (máx 60s)
            const cooldown = Math.min(limits.cooldownMs * (1 + this._cooldownCycles * 0.5), 60_000);
            this._cooldownUntil = now + cooldown;

            if (!this._warnings.has('session')) {
                const secs = Math.round(cooldown / 1000);
                const msg = `[ReadBudget] ⛔ Límite alcanzado [${role}] (${limits.session} reads). Pausa de ${secs}s → auto-reinicio.`;
                console.error(`%c${msg}`, 'color: #fff; background: #dc2626; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;');
                this._warnings.add('session');

                // 🔥 Evento para UI (banner)
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('sg-read-budget-alert', {
                        detail: { type: 'session_exhausted', role, limit: limits.session, source, cooldownSecs: secs }
                    }));
                }
            }
            return false;
        }

        // ── Verificar burst por minuto ──
        if (this._minuteReads >= limits.minute) {
            if (!this._warnings.has('minute')) {
                const msg = `[ReadBudget] ⚠️ Límite/min agotado [${role}] (${limits.minute} reads). Se reinicia en 60s.`;
                console.warn(`%c${msg}`, 'color: #000; background: #facc15; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;');
                this._warnings.add('minute');

                // 🔥 Evento para UI
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('sg-read-budget-alert', {
                        detail: { type: 'minute_limit_reached', role, limit: limits.minute, source }
                    }));
                }
            }
            return false;
        }

        // ── Registrar el read ──
        this._sessionReads++;
        this._minuteReads++;

        // Warning al 80% de la sesión
        if (this._sessionReads === Math.floor(limits.session * 0.8)) {
            if (!this._warnings.has('warning_80')) {
                console.warn(`%c[ReadBudget] ⚠️ 80% de lecturas consumidas [${role}] (${this._sessionReads}/${limits.session})`, 'color: #fff; background: #ea580c; padding: 2px 6px; border-radius: 4px;');
                this._warnings.add('warning_80');
            }
        }

        return true;
    },

    /**
     * Registra reads reales DESPUÉS de una query completada,
     * sin re-verificar límites (la verificación ya ocurrió antes de la query).
     * Esto evita el problema de contar N reads estimados en un loop síncrono.
     */
    registerExtraReads(count: number): void {
        if (count <= 0) return;
        this._sessionReads += count;
        this._minuteReads += count;
        // Warning al 80% si recién cruzamos ese umbral
        const role = this._getRole();
        const limits = this._getLimits();
        if (this._sessionReads >= Math.floor(limits.session * 0.8) && !this._warnings.has('warning_80')) {
            console.warn(`%c[ReadBudget] ⚠️ 80% de lecturas consumidas [${role}] (${this._sessionReads}/${limits.session})`, 'color: #fff; background: #ea580c; padding: 2px 6px; border-radius: 4px;');
            this._warnings.add('warning_80');
        }
    },

    /** Estado actual para debugging */
    getStatus() {
        const role = this._getRole();
        const limits = this._getLimits();
        const now = Date.now();
        const inCooldown = this._cooldownUntil > now;
        return {
            role,
            session: `${this._sessionReads}/${limits.session}`,
            minute: `${this._minuteReads}/${limits.minute}`,
            cooldownCycles: this._cooldownCycles,
            inCooldown,
            cooldownRemaining: inCooldown ? `${Math.round((this._cooldownUntil - now) / 1000)}s` : '0s',
        };
    }
};

// ========================================
// 🌐 OPT-6: Presupuesto Diario Global (localStorage compartido)
// ========================================

const DAILY_BUDGET = {
    /** Techo diario por rol (localStorage por navegador; estudiante = 340 reads/día). */
    LIMITS: {
        admin: { max: 50_000, warn: 35_000, degraded: 40_000 },
        coordinador: { max: 50_000, warn: 35_000, degraded: 40_000 },
        estudiante: { max: 340, warn: 238, degraded: 272 },
    },

    _key: 'sg_daily_reads',

    _getLimits(): { max: number; warn: number; degraded: number } {
        const role = READ_BUDGET.getStatus().role;
        return this.LIMITS[role] ?? this.LIMITS.estudiante;
    },

    _getToday(): { date: string; reads: number } {
        if (typeof window === 'undefined') return { date: '', reads: 0 };
        try {
            const raw = localStorage.getItem(this._key);
            if (raw) {
                const p = JSON.parse(raw);
                if (p.date === new Date().toISOString().split('T')[0]) return p;
            }
        } catch { /* ignore */ }
        return { date: new Date().toISOString().split('T')[0], reads: 0 };
    },

    track(count = 1): void {
        if (typeof window === 'undefined') return;
        try {
            const limits = this._getLimits();
            const s = this._getToday();
            const prev = s.reads;
            s.reads += count;
            localStorage.setItem(this._key, JSON.stringify(s));
            if (prev < limits.warn && s.reads >= limits.warn) {
                console.warn(`%c[DailyBudget] ⚠️ 70% consumido (${s.reads}/${limits.max})`, 'color:#fff;background:#ea580c;padding:2px 6px;border-radius:4px;');
            } else if (prev < limits.degraded && s.reads >= limits.degraded) {
                console.error(`%c[DailyBudget] ⛔ 80% consumido — modo degradado (${s.reads}/${limits.max})`, 'color:#fff;background:#dc2626;padding:4px 8px;border-radius:4px;font-weight:bold;');
                window.dispatchEvent(new CustomEvent('sg-daily-budget-alert', {
                    detail: { reads: s.reads, max: limits.max, degraded: true }
                }));
            } else if (prev < limits.max && s.reads >= limits.max) {
                console.error(`%c[DailyBudget] ⛔ Límite diario agotado (${s.reads}/${limits.max})`, 'color:#fff;background:#dc2626;padding:4px 8px;border-radius:4px;font-weight:bold;');
                window.dispatchEvent(new CustomEvent('sg-daily-budget-alert', {
                    detail: { reads: s.reads, max: limits.max, exhausted: true }
                }));
            }
        } catch { /* storage full */ }
    },

    isDegraded(): boolean { return this._getToday().reads >= this._getLimits().degraded; },

    isExhausted(): boolean { return this._getToday().reads >= this._getLimits().max; },

    getStatus() {
        const s = this._getToday();
        const limits = this._getLimits();
        const role = READ_BUDGET.getStatus().role;
        return {
            role,
            date: s.date,
            reads: s.reads,
            max: limits.max,
            warn: limits.warn,
            degradedThreshold: limits.degraded,
            percent: `${Math.round((s.reads / limits.max) * 100)}%`,
            degraded: this.isDegraded(),
            exhausted: this.isExhausted(),
        };
    }
};

// Exponer para debugging: window.__readBudget / window.__dailyBudget
if (typeof window !== 'undefined') {
    (window as any).__readBudget = READ_BUDGET;
    (window as any).__dailyBudget = DAILY_BUDGET;
}

/** true si el presupuesto está en pausa o al límite (evita reintentos inútiles en UI). */
export function isReadBudgetPaused(): boolean {
    if (isLocal) return false;
    const status = READ_BUDGET.getStatus();
    if (status.inCooldown) return true;
    const [used, cap] = status.session.split('/').map((v) => Number(v.trim()));
    return Number.isFinite(used) && Number.isFinite(cap) && used >= cap;
}

/**
 * Verifica si hay una sesión activa (estudiante o coordinador).
 * Las rutas /demo/ usan datos estáticos y nunca pasan por aquí.
 * Llamadas de auth (getCoordinatorByToken, getStudentByEmail) se permiten con whitelist.
 */
const AUTH_WHITELIST = [
    'getCoordinatorByToken',
    'getStudentByEmail',
    'getStudentsByEmail:primary',
    'getStudentsByEmail:additional',
    'getAppConfig',
    'lookupStudentById',
    'loginStudentByIdAndBirthDate',
    'lookupStudentById.sims',
    // Admin/Coordinator reads: these pages handle their own auth in layout.tsx
    // The session gate would falsely block them during Firebase Auth restore on refresh
    'getAllStudents',
    'getStatistics',
    'getRanking',
    'getRanking.chunks',
    'getInvalidaciones',
    'getStudentResults',
    'getAnswerDetails',
    'getCoordinatorSummary',
    'getNationalRankings',
    'getSimulationManifest',
    'getStudentSimulations',
    'getStudentSimulations.list',
    'getStudentSimulations.profileManifest',
    'getSimulationEstadisticas',
    'getInstitutionQuestionStats',
    'getPlannerCustomization',
    'getPlannerUploadQuota',
    'getStudentsByEmail:byId',
    'fetchCourseAccess:documento',
    'fetchCourseAccess:emailLower',
    'fetchCourseAccess:studentId',
    'fetchCourseById',
    'fetchCourseMetrics',
    'fetchCourseRuntime',
    'fetchCourseCalendarSnapshot',
    'courseLeaderboardMeta',
    'courseLeaderboardChunk',
    'fetchCourseAttendanceReport',
    'courseAttendanceReport',
    'loginStudentDirectClient',
    'getStudentResultsByName',
    'lookupStudentById.sims',
];

/** Bloquea lecturas no críticas en modo degradado o cuando el techo diario del rol se agotó. */
function isDailyDegradedReadBlocked(source: string): boolean {
    if (AUTH_WHITELIST.includes(source)) return false;
    if (DAILY_BUDGET.isExhausted()) return true;
    return DAILY_BUDGET.isDegraded();
}

function hasActiveSession(source: string): boolean {
    // Whitelist: funciones de login/auth necesitan leer ANTES de que haya sesión
    if (AUTH_WHITELIST.includes(source)) return true;
    // Local: sin restricción (JSON estático)
    if (isLocal) return true;
    if (typeof window === 'undefined') return false;
    const hasStudent = !!localStorage.getItem('student_id');
    const hasCoordinator = !!localStorage.getItem('coordinator_institution');
    const hasAdmin = !!localStorage.getItem('admin_session');
    if (hasStudent || hasCoordinator || hasAdmin) return true;
    // 🛡️ Fallback: aceptar si hay un usuario Firebase Auth no-anónimo con email reconocido.
    // Esto cubre el caso donde localStorage fue limpiado pero el usuario sigue autenticado,
    // y el race condition donde el admin/coordinator llega al dashboard antes de que
    // onAuthStateChanged del layout escriba en localStorage.
    const firebaseUser = auth.currentUser;
    if (firebaseUser && !firebaseUser.isAnonymous && firebaseUser.email) {
        const email = firebaseUser.email.toLowerCase();
        if (ADMIN_EMAILS.includes(email)) {
            // Restaurar clave en localStorage para futuros checks síncronos
            try { localStorage.setItem('admin_session', 'true'); } catch { /* ignore */ }
            return true;
        }
        if (email in COORDINATOR_MAP) {
            // Restaurar clave coordinador si se perdió
            try {
                localStorage.setItem('coordinator_email', email);
                const inst = getCoordinatorInstitution(email) || '';
                if (inst) localStorage.setItem('coordinator_institution', inst);
            } catch { /* ignore */ }
            return true;
        }
        // Estudiantes autenticados también se consideran con sesión válida
        // (su student_id puede estar en otra clave o aún cargando)
        return true;
    }
    return false;
}

/**
 * OPT-5: Mapa de Firestore reads en vuelo para deduplicación.
 */
const _inflightFirestore = new Map<string, Promise<any>>();
const _inflightGetDocs = new Map<string, Promise<Awaited<ReturnType<typeof getDocs>> | null>>();

/** Dev: contador reads por pantalla — `window.__firestoreReadsBySource` */
function trackDevFirestoreRead(source: string, count = 1): void {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return;
    const w = window as Window & { __firestoreReadsBySource?: Record<string, number> };
    if (!w.__firestoreReadsBySource) w.__firestoreReadsBySource = {};
    w.__firestoreReadsBySource[source] = (w.__firestoreReadsBySource[source] || 0) + count;
}

/**
 * getDoc con presupuesto + dedup en vuelo — ÚNICA forma de leer un documento.
 * OPT-5: Si el mismo doc path ya está en vuelo, reutiliza la Promise.
 * OPT-6: Registra cada read en el presupuesto diario global.
 */
type GatedGetDocOptions = {
    /** Evita miss cacheado en IndexedDB (login doc+fecha tras seed roster). */
    preferServer?: boolean;
};

export async function gatedGetDoc(
    docRef: ReturnType<typeof doc>,
    source: string,
    opts?: GatedGetDocOptions,
) {
    // 🔍 DIAGNOSTIC LOGGING
    if (isLocal) {
        console.log('[gatedGetDoc] START', {
            path: docRef.path,
            source,
            hasAuth: !!auth.currentUser,
            isAnonymous: auth.currentUser?.isAnonymous,
            uid: auth.currentUser?.uid,
            email: auth.currentUser?.email
        });
    }
    
    if (!hasActiveSession(source)) {
        console.warn(`[GatedRead] ⛔ Bloqueado — sin sesión activa. Fuente: ${source}`);
        return null;
    }
    if (isDailyDegradedReadBlocked(source)) {
        console.warn(`[GatedRead] ⛔ Bloqueado — modo degradado diario. Fuente: ${source}`);
        return null;
    }
    if (!READ_BUDGET.canRead(source)) {
        if (isLocal) console.warn('[GatedRead] ⛔ Bloqueado — presupuesto agotado');
        return null;
    }

    // OPT-5: Dedup — reutilizar Promise si el mismo doc ya está en vuelo
    const docPath = docRef.path;
    if (_inflightFirestore.has(docPath)) {
        if (isLocal) console.log('[gatedGetDoc] Reusing inflight promise for', docPath);
        return _inflightFirestore.get(docPath)!;
    }

    const promise = (async () => {
        // Fork experimental: nunca leer Firestore remoto.
        assertNoRemoteFirestore(`gatedGetDoc:${source}:${docPath}`);

        if (isLocal) console.log('[gatedGetDoc] Waiting for auth...');
        await waitForAuth();
        
        if (isLocal) {
            console.log('[gatedGetDoc] Auth ready, fetching document...', {
                hasAuth: !!auth.currentUser,
                uid: auth.currentUser?.uid,
                isAnonymous: auth.currentUser?.isAnonymous
            });
        }
        
        DAILY_BUDGET.track(1);
        trackDevFirestoreRead(source, 1);
        const fetchSnap = opts?.preferServer
            ? getDocFromServer(docRef)
            : getDoc(docRef);
        // Evita hang sticky: getDoc sin settle deja inflight bloqueando panel curso.
        const snap = await Promise.race([
            fetchSnap,
            new Promise<never>((_, reject) => {
                setTimeout(
                    () => reject(new Error(`[gatedGetDoc] timeout ${docPath}`)),
                    12_000,
                );
            }),
        ]);
        
        if (isLocal) {
            console.log('[gatedGetDoc] Document fetched', {
                preferServer: !!opts?.preferServer,
                path: docRef.path,
                exists: snap.exists(),
                id: snap.id,
                metadata: {
                    hasPendingWrites: snap.metadata.hasPendingWrites,
                    fromCache: snap.metadata.fromCache
                },
                dataKeys: snap.exists() ? Object.keys(snap.data() || {}) : [],
                dataSize: snap.exists() ? JSON.stringify(snap.data()).length : 0,
                isEmpty: snap.exists() && Object.keys(snap.data() || {}).length === 0
            });
            
            // Log completo del objeto si está vacío
            if (snap.exists() && Object.keys(snap.data() || {}).length === 0) {
                console.error('[gatedGetDoc] ⚠️ EMPTY OBJECT DETECTED!', {
                    path: docRef.path,
                    rawData: snap.data(),
                    snapRef: snap.ref.path
                });
            }
        }
        
        return snap;
    })();

    _inflightFirestore.set(docPath, promise);
    try {
        return await promise;
    } catch (err) {
        if (isLocal) console.warn('[gatedGetDoc] failed', docPath, source, err);
        return null;
    } finally {
        _inflightFirestore.delete(docPath);
    }
}

/**
 * getDocs con presupuesto — ÚNICA forma de leer una colección.
 *
 * Estrategia de conteo REAL (no estimado):
 * 1. Verificar sesión activa y budget UNA sola vez (no N veces en loop).
 * 2. Ejecutar la query real contra Firestore.
 * 3. Registrar el número REAL de documentos devueltos en los contadores.
 *
 * Esto evita el problema anterior donde estimatedDocs=200 consumía
 * 200 reads del presupuesto de minuto de forma síncrona antes de la query.
 * El parámetro `estimatedDocs` ya no afecta el conteo — queda como
 * documentación/hint pero no se usa para contabilizar.
 */
export async function gatedGetDocs(queryRef: ReturnType<typeof query>, source: string, estimatedDocs = 1) {
    assertNoRemoteFirestore(`gatedGetDocs:${source}`);
    if (!hasActiveSession(source)) {
        console.warn(`[GatedRead] ⛔ Bloqueado — sin sesión activa. Fuente: ${source}`);
        return null;
    }
    if (isDailyDegradedReadBlocked(source)) {
        console.warn(`[GatedRead] ⛔ Bloqueado — modo degradado diario. Fuente: ${source}`);
        return null;
    }
    // Verificación de budget UNA SOLA VEZ (1 read de control, no N estimados)
    if (!READ_BUDGET.canRead(source)) return null;

    const inflightKey = `docs:${source}`;
    if (_inflightGetDocs.has(inflightKey)) {
        if (isLocal) console.log('[gatedGetDocs] Reusing inflight promise for', source);
        return _inflightGetDocs.get(inflightKey)!;
    }

    const promise = (async () => {
        await waitForAuth();
        const snapshot = await getDocs(queryRef);

        // Registrar reads REALES post-query (sin re-verificar límites)
        const realDocs = snapshot.size;
        if (realDocs > 1) {
            READ_BUDGET.registerExtraReads(realDocs - 1);
        }
        DAILY_BUDGET.track(realDocs);
        trackDevFirestoreRead(source, realDocs);

        return snapshot;
    })();

    _inflightGetDocs.set(inflightKey, promise);
    try {
        return await promise;
    } finally {
        _inflightGetDocs.delete(inflightKey);
    }
}

// ========================================
// In-Memory Cache
// ========================================

const cache: {
    appConfig?: AppConfig;
    studentProfiles: Map<string, StudentProfile>;
    studentResults: Map<string, Estudiante>;
    allStudents: Map<string, Estudiante[]>;
    statistics: Map<string, EstadisticasGrupo>;
    invalidaciones: Map<string, InvalidacionItem[]>;
    rankings: Map<string, RankingEntry[]>;
    manifests: Map<string, SimulationManifest>;
} = {
    studentProfiles: new Map(),
    studentResults: new Map(),
    allStudents: new Map(),
    statistics: new Map(),
    invalidaciones: new Map(),
    rankings: new Map(),
    manifests: new Map(),
};

/** Limpia caché en memoria al iniciar dev (HMR puede dejar estado viejo). */
export function clearDevRuntimeCaches(): void {
    cache.appConfig = undefined;
    cache.studentProfiles.clear();
    cache.studentResults.clear();
    cache.allStudents.clear();
    cache.statistics.clear();
    cache.invalidaciones.clear();
    cache.rankings.clear();
    cache.manifests.clear();
    _filterVisibleSessionCache.clear();
    publicationVisibleCache.clear();
    _estadisticasCache.clear();
}

// ========================================
// Helper: Fetch JSON Estático
// force-cache: los datos estáticos no cambian durante la sesión.
// _inflightFetch: dedup de fetches paralelos al mismo path.
// ========================================

const _inflightFetch = new Map<string, Promise<any>>();

async function fetchStaticJSON<T>(path: string): Promise<T> {
    // Dedup: si ya hay un fetch en vuelo al mismo path, reutilizar
    if (_inflightFetch.has(path)) {
        return _inflightFetch.get(path)! as Promise<T>;
    }

    const promise = (async () => {
        // ponytail: bust browser HTTP cache on reprocesed simulation JSON (e.g. clave q79)
        const bust =
            path.startsWith('simulations/') && !path.includes('?')
                ? `${path}?v=${CACHE_VERSION}`
                : path;
        const resp = await fetch(`/data/${bust}`);
        if (!resp.ok) {
            throw new Error(`Failed to fetch /data/${bust}: ${resp.status}`);
        }
        return resp.json();
    })();

    _inflightFetch.set(path, promise);
    try {
        const result = await promise;
        return result;
    } finally {
        // Limpiar después de resolver (permite refetch futuro si realmente necesario)
        _inflightFetch.delete(path);
    }
}

/** students.json SG11-24+ ~100MB+ tumba el tab — usar Firestore chunks. */
const LOCAL_STUDENTS_JSON_MAX_BYTES = 28_000_000;

async function localStudentsJsonTooLarge(simId: string): Promise<boolean> {
    try {
        const bust = `simulations/${simId}/students.json?v=${CACHE_VERSION}`;
        const head = await fetch(`/data/${bust}`, { method: 'HEAD' });
        if (!head.ok) return false;
        const len = Number(head.headers.get('content-length') || 0);
        return len > LOCAL_STUDENTS_JSON_MAX_BYTES;
    } catch {
        // Sin Content-Length fiable: sims conocidos grandes
        return /^SG11-2[4-9]$/i.test(simId) || /^SG11-[3-9]\d$/i.test(simId);
    }
}

// ========================================
// Coordinator Token Auth (Magic Links)
// ========================================

interface CoordinatorToken {
    email: string;
    institution: string;
    name: string;
    active: boolean;
}

let _coordinatorTokensCache: Record<string, CoordinatorToken> | null = null;

/**
 * Validates a coordinator access token.
 * Local: reads from /data/coordinator_tokens.json (0 Firestore reads)
 * Production: reads from config/coordinators (1 Firestore read, cached)
 */
export async function getCoordinatorByToken(token: string): Promise<CoordinatorToken | null> {
    // 🛡️ Rate limit: máximo 5 validaciones de token/minuto
    if (!clientRateLimit('getCoordinatorByToken', 5, 60000)) {
        console.warn('[Security] Rate limit exceeded for coordinator token validation');
        return null;
    }

    // 🛡️ Validar formato de token (debe ser alfanumérico, 8-64 chars)
    if (!token || !/^[a-zA-Z0-9_-]{8,64}$/.test(token)) {
        console.warn('[Security] Invalid coordinator token format');
        return null;
    }

    try {
        // Check in-memory cache first
        if (_coordinatorTokensCache) {
            const entry = _coordinatorTokensCache[token];
            return entry?.active ? entry : null;
        }

        let tokens: Record<string, CoordinatorToken>;

        if (isLocal) {
            const data = await fetchStaticJSON<{ tokens: Record<string, CoordinatorToken> }>('coordinator_tokens.json');
            tokens = data.tokens;
        } else {
            // Production: read from Firestore (gated)
            const snap = await gatedGetDoc(doc(db, 'config', 'coordinators'), 'getCoordinatorByToken');
            if (!snap?.exists()) return null;
            tokens = (snap.data() as { tokens: Record<string, CoordinatorToken> }).tokens || {};
        }

        // Cache for subsequent calls
        _coordinatorTokensCache = tokens;
        const entry = tokens[token];
        return entry?.active ? entry : null;
    } catch (err) {
        console.error('Error validating coordinator token:', err);
        return null;
    }
}

// ========================================
// App Config
// ========================================

export async function getAppConfig(): Promise<AppConfig> {
    // localhost dev (incl. dev:staging): JSON en public/data
    if (useLocalStaticSimData()) {
        if (isDemoStudentContext()) {
            const config = normalizeAppConfig({
                activeSimulation: DEMO_STUDENT_DEFAULT_SIM,
                availableSimulations: sortSimulations([...DEMO_STUDENT_SIMS]),
                consoleEnabled: true,
                partialSimulations: [],
            });
            cache.appConfig = config;
            return config;
        }
        const data = await fetchStaticJSON<any>('current_simulation.json');
        const config = normalizeAppConfig({
            activeSimulation: data.active,
            availableSimulations: sortSimulations(data.available || []),
            consoleEnabled: true,
            partialSimulations: data.partialSimulations || [],
            studentHiddenSimulations: data.studentHiddenSimulations || [],
        });
        cache.appConfig = config;
        return config;
    }

    if (cache.appConfig) return cache.appConfig;

    // ─── OPT-4: SWR (Stale-While-Revalidate) ───
    // Sirve datos cacheados inmediatamente (incluso si están stale)
    // y revalida en background sin bloquear la UI.
    const APP_CONFIG_TTL = CACHE_TTL_APP_CONFIG;
    const SWR_MAX_AGE = CACHE_SWR_APP_CONFIG_MAX_AGE_MS;
    let staleConfig: AppConfig | null = null;

    try {
        const raw = localStorage.getItem(`${CACHE_VERSION}_appConfig`);
        if (raw) {
            const { data, ts } = JSON.parse(raw);
            const age = Date.now() - ts;

            if (age < APP_CONFIG_TTL) {
                // ✅ FRESH: servir directo, no revalidar
                data.availableSimulations = sortSimulations(data.availableSimulations || []);
                cache.appConfig = normalizeAppConfig(data);
                return cache.appConfig;
            }
            if (age < SWR_MAX_AGE) {
                // ⏳ STALE: servir inmediatamente, revalidar en background
                data.availableSimulations = sortSimulations(data.availableSimulations || []);
                staleConfig = normalizeAppConfig(data);
                cache.appConfig = staleConfig;
                // Background revalidation (fire-and-forget)
                _swrRevalidateAppConfig().catch(() => {});
                return staleConfig;
            }
            // 🔴 EXPIRED: caído fuera de SWR window, forzar fetch
        }
    } catch { /* ignore */ }

    // PRODUCCIÓN: Firestore (1 read — gated)
    const freshConfig = await _fetchAppConfigFromFirestore();
    if (freshConfig) return freshConfig;

    // Fallback: si teníamos stale, usarlo como último recurso
    if (staleConfig) {
        cache.appConfig = staleConfig;
        return staleConfig;
    }

    // Fallback mínimo
    const fallback = normalizeAppConfig({
        activeSimulation: 'SG11-09',
        availableSimulations: ['SG11-08', 'SG11-09'],
        consoleEnabled: true,
    });
    cache.appConfig = fallback;
    return fallback;
}

/** Fetch directo desde Firestore — usado tanto por SWR como por primera carga */
async function _fetchAppConfigFromFirestore(): Promise<AppConfig | null> {
    try {
        const docRef = doc(db, 'config', 'app');
        const snap = await gatedGetDoc(docRef, 'getAppConfig');
        if (snap?.exists()) {
            const d = snap.data();
            let config = normalizeAppConfig({
                activeSimulation: d.activeSimulation || 'SG11-09',
                availableSimulations: sortSimulations(d.availableSimulations || []),
                consoleEnabled: d.consoleEnabled !== false,
                dataVersion: d.dataVersion,
                simVersions: d.simVersions,
                partialSimulations: d.partialSimulations || [],
                studentHiddenSimulations: sortSimulations(d.studentHiddenSimulations || []),
                coursesVersion: d.coursesVersion,
                courseVersions: d.courseVersions,
                courseMetricsVersions: d.courseMetricsVersions,
                simFeatures: d.simFeatures,
            });
            config = {
                ...config,
                availableSimulations: await filterVisibleSimulations(
                    config.availableSimulations,
                ),
            };

            // ✅ Smart cache invalidation:
            // 1. Global: si dataVersion cambió → limpiar TODO
            checkDataVersion(config.dataVersion);
            // 2. Per-sim: si un sim específico cambió → limpiar solo ese
            checkSimVersions(config.simVersions);
            checkCourseVersions(config);

            cache.appConfig = config;
            persistSet('appConfig', config);
            return config;
        }
    } catch (err) {
        console.warn('[Firestore] getAppConfig error:', err);
    }
    return null;
}

/** SWR background revalidation — silencioso, no bloquea UI */
let _swrInFlight = false;
async function _swrRevalidateAppConfig(): Promise<void> {
    if (_swrInFlight) return; // evitar revalidaciones paralelas
    _swrInFlight = true;
    try {
        const fresh = await _fetchAppConfigFromFirestore();
        if (fresh) {
            cache.appConfig = fresh;
            console.log('[SWR] AppConfig revalidado en background');
        }
    } finally {
        _swrInFlight = false;
    }
}

// ========================================
// Remote Config (siempre Firestore — flag remoto)
// ========================================

export async function getRemoteConfig(): Promise<{ consoleEnabled: boolean }> {
    // En local, siempre habilitar consola
    if (isLocal || isStagingFirebase) return { consoleEnabled: true };

    // 🚀 Reutiliza getAppConfig() en vez de hacer otro read al mismo doc config/app
    // Esto elimina 1 Firestore read duplicado por sesión
    try {
        const config = await getAppConfig();
        return { consoleEnabled: config.consoleEnabled !== false };
    } catch {
        return { consoleEnabled: true };
    }
}

// ========================================
// Console Protection
// ========================================

export async function applyConsoleProtection(): Promise<void> {
    try {
        if (isStagingFirebase) return;
        const { consoleEnabled } = await getRemoteConfig();
        if (!consoleEnabled) {
            const noop = () => { };
            window.console.log = noop;
            window.console.warn = noop;
            window.console.error = noop;
            window.console.info = noop;
            window.console.debug = noop;
            window.console.table = noop;
            window.console.dir = noop;
            window.console.trace = noop;
            (function block() {
                setInterval(() => {
                    (function () { return false; })
                    ['constructor']('debugger')
                    ['call']();
                }, 50);
            })();
        }
    } catch {
        // Si falla, no bloquear
    }
}

// ========================================
// Student Auth / Profile (siempre Firestore — es auth)
// ========================================

/**
 * IDs de perfiles de prueba para Admins
 */
const CRISTIAN = '67b9319688463e26090c2e9b'; // Perfil Real Cristian
const SARA = 'SARA-DEMO-PROFILE-ID';         // Perfil Demo Sara
const ROSA = 'ROSA-DEMO-PROFILE-ID';         // Perfil Demo Rosa

/**
 * Busca TODOS los estudiantes vinculados a un email.
 * Consulta 2 campos en paralelo con 1 snapshot cada uno:
 *   1. `email == normalizedEmail` (email principal)
 *   2. `emails_adicionales array-contains normalizedEmail` (emails compartidos)
 * 
 * Cache: localStorage con TTL de 12h → logins repetidos = 0 reads.
 * Deduplicación por doc.id para evitar duplicados.
 * 
 * @returns StudentProfile[] — puede ser vacío, 1 o múltiples estudiantes
 */
const DEBUG_EMAIL_ALIASES: Record<string, string> = {};
const inFlightProfilesByEmail = new Map<string, Promise<StudentProfile[]>>();
let _authIndexCache: Array<{ i: string; n: string; e: string }> | null = null;

async function getAuthIndexLocal(): Promise<Array<{ i: string; n: string; e: string }>> {
    if (_authIndexCache) return _authIndexCache;
    try {
        const authIndex = await fetchStaticJSON<Array<{ i: string; n: string; e: string }>>(`auth_index.json?v=${CACHE_VERSION}`);
        _authIndexCache = Array.isArray(authIndex) ? authIndex : [];
    } catch {
        _authIndexCache = [];
    }
    return _authIndexCache;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _processStudentDoc = (docSnap: any, seenIds: Set<string>, profiles: StudentProfile[]) => {
    if (!docSnap.exists()) return;
    if (seenIds.has(docSnap.id)) return;
    seenIds.add(docSnap.id);
    const data = docSnap.data();
    profiles.push({
        id: docSnap.id,
        email: data.email,
        nombre: data.nombre,
        apellidos: data.apellidos,
        institucion: data.institucion,
        departamento: data.departamento,
        simulacros: Array.isArray(data.simulacros) ? data.simulacros : undefined,
    });
};

export async function getStudentsByEmail(email: string): Promise<StudentProfile[]> {
    let normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
        console.warn('[Security] Invalid email format rejected:', normalizedEmail);
        return [];
    }

    if (!clientRateLimit('getStudentsByEmail', 10, 60000)) {
        console.warn('[Security] Rate limit exceeded for getStudentsByEmail');
        return [];
    }

    // Evita lecturas duplicadas cuando múltiples componentes consultan el mismo email a la vez.
    const inFlightKey = normalizedEmail;
    if (inFlightProfilesByEmail.has(inFlightKey)) {
        return inFlightProfilesByEmail.get(inFlightKey)!;
    }

    const requestPromise = (async (): Promise<StudentProfile[]> => {

    // 🛡️ 1. GESTIÓN DE ADMINS (Hardcoded profiles)
    // Para los correos de ADMIN_EMAILS, siempre devolvemos los perfiles de prueba.
    if (ADMIN_EMAILS.includes(normalizedEmail)) {
        console.log('[Auth] Admin login detected. Serving hardcoded profiles.');
        const adminProfiles: StudentProfile[] = [];

        // Intentar cargar perfiles reales si existen, sino usar dummies
        const idsToFetch = [CRISTIAN, SARA, ROSA];
        const nombres = ['Cristian (Admin)', 'Sara (Prueba)', 'Rosa (Prueba)'];

        for (let index = 0; index < idsToFetch.length; index++) {
            const id = idsToFetch[index];
            try {
                const lookupResult = await lookupStudentById(id);
                if (lookupResult && lookupResult.found) {
                    // Convertir StudentLookupResult a StudentProfile
                    adminProfiles.push({
                        id,
                        email: lookupResult.email,
                        nombre: lookupResult.nombre.split(' ')[0] || nombres[index],
                        apellidos: lookupResult.nombre.split(' ').slice(1).join(' ') || 'Staff SG',
                        institucion: 'Saber Ganar - Admin',
                        departamento: 'ADMIN',
                        simulacros: lookupResult.simulacros
                    });
                } else {
                    // Fallback a perfiles dummy si Firestore no los tiene
                    adminProfiles.push({
                        id,
                        email: normalizedEmail,
                        nombre: nombres[index],
                        apellidos: 'Staff SG',
                        institucion: 'Saber Ganar - Admin',
                        departamento: 'ADMIN',
                        simulacros: []
                    });
                }
            } catch {
                // Fallback en caso de error
                adminProfiles.push({
                    id,
                    email: normalizedEmail,
                    nombre: nombres[index],
                    apellidos: 'Staff SG',
                    institucion: 'Saber Ganar - Admin',
                    departamento: 'ADMIN',
                    simulacros: []
                });
            }
        }

        return adminProfiles;
    }

    // Check localStorage cache first (12h TTL)
    const cacheKey = `${CACHE_VERSION}_multi_profiles_${normalizedEmail}`;
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached) as { ts: number; profiles: StudentProfile[] };
            const TWELVE_HOURS = 12 * 60 * 60 * 1000;
            if (Date.now() - parsed.ts < TWELVE_HOURS && parsed.profiles.length > 0) {
                return parsed.profiles;
            }
        }
    } catch { /* ignore corrupt cache */ }

    // Emails to search (original + alias)
    const searchEmails = [normalizedEmail];
    if (DEBUG_EMAIL_ALIASES[normalizedEmail]) {
        searchEmails.push(DEBUG_EMAIL_ALIASES[normalizedEmail]);
    }

    // LOCAL: evitar Firestore para login y usar mirror estático auth_index.json
    // Esto reduce latencia y evita inconsistencias de lectura en modo local.
    if (isLocal) {
        const authIndex = await getAuthIndexLocal();
        const seenIds = new Set<string>();
        const localProfiles: StudentProfile[] = [];

        const toProfile = (s: { i: string; n: string; e: string }): StudentProfile | null => {
            const sid = String(s.i || '').trim();
            if (!sid || seenIds.has(sid)) return null;
            const fullName = (s.n || '').trim();
            const parts = fullName.split(' ').filter(Boolean);
            let nombre = '';
            let apellidos = '';
            if (parts.length >= 4) {
                nombre = parts.slice(0, 2).join(' ');
                apellidos = parts.slice(2).join(' ');
            } else if (parts.length >= 2) {
                nombre = parts[0];
                apellidos = parts.slice(1).join(' ');
            } else {
                nombre = fullName || 'Estudiante';
            }
            seenIds.add(sid);
            return {
                id: sid,
                email: normalizedEmail,
                nombre,
                apellidos,
                institucion: 'PREICFES SEAMOSGENIOS',
                simulacros: []
            };
        };

        authIndex
            .filter((s) => (s.e || '').toLowerCase().trim() === normalizedEmail)
            .forEach((s) => {
                const p = toProfile(s);
                if (p) localProfiles.push(p);
            });

        // Dev local / túnel: perfiles por ID (emails_adicionales solo están en Firestore)
        if (canAccessMultipleProfiles(normalizedEmail)) {
            getMultiProfileStudentIds(normalizedEmail).forEach((sid) => {
                if (seenIds.has(sid)) return;
                const row = authIndex.find((a) => String(a.i || '').trim() === sid);
                if (row) {
                    const p = toProfile(row);
                    if (p) localProfiles.push(p);
                }
            });
        }

        if (localProfiles.length > 0) {
            try {
                localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), profiles: localProfiles }));
            } catch { /* ignore */ }
            localProfiles.forEach(p => {
                cache.studentProfiles.set(p.email, p);
                persistSet(`profile_${p.email}`, p);
            });
        }
        return localProfiles;
    }

    // Firestore: studentAuth O(1) primero, queries students como fallback
    const profiles: StudentProfile[] = [];
    const seenIds = new Set<string>();

    try {
        const authFetches = searchEmails.map(async (searchEmail) => {
            const authRef = doc(db, STUDENT_AUTH_COLLECTION, studentAuthEmailDocId(searchEmail));
            const authSnap = await gatedGetDoc(authRef, `getStudentsByEmail:studentAuth:${searchEmail}`);
            if (!authSnap?.exists()) return;
            const auth = authSnap.data() as Record<string, unknown>;
            const sid = String(auth.studentId || auth.documento || '').trim();
            if (!sid || seenIds.has(sid)) return;
            const profileSnap = await gatedGetDoc(
                doc(db, 'students', sid),
                `getStudentsByEmail:studentAuthProfile:${sid}`,
            );
            if (profileSnap) _processStudentDoc(profileSnap, seenIds, profiles);
        });
        await Promise.all(authFetches);
    } catch (err) {
        console.warn('[Firestore] getStudentsByEmail studentAuth error:', err);
    }

    try {
        if (profiles.length > 0) {
            // Índice auth resolvió — omitir queries amplias
        } else {
        const studentsRef = collection(db, 'students');
        const queryPromises = searchEmails.flatMap(searchEmail => [
            gatedGetDocs(query(studentsRef, where('email', '==', searchEmail)), `getStudentsByEmail:primary:${searchEmail}`),
            gatedGetDocs(query(studentsRef, where('emails_adicionales', 'array-contains', searchEmail)), `getStudentsByEmail:additional:${searchEmail}`),
        ]);

        const snapshots = await Promise.all(queryPromises);
        snapshots.forEach(snap => {
            if (snap) {
                snap.docs.forEach((docSnap) => _processStudentDoc(docSnap as QueryDocumentSnapshot<DocumentData>, seenIds, profiles));
            }
        });

        // Perfiles por ID si la query no los trae (soporte / investigación)
        if (canAccessMultipleProfiles(normalizedEmail)) {
            const specialIds = getMultiProfileStudentIds(normalizedEmail);
            const missingIds = specialIds.filter(id => !seenIds.has(id));

            if (missingIds.length > 0) {
                console.log(`[Firestore] Fetching missing multi-profile IDs for ${normalizedEmail}:`, missingIds);
                const fetchPromises = missingIds.map(id =>
                    gatedGetDoc(doc(db, 'students', id), 'getStudentsByEmail:byId')
                );
                const docSnaps = await Promise.all(fetchPromises);
                docSnaps.forEach(docSnap => {
                    if (docSnap) _processStudentDoc(docSnap, seenIds, profiles);
                });
            }
        }
        }

    } catch (err) {
        console.warn('[Firestore] getStudentsByEmail query error:', err);
    }

    // Soporte / investigación: aunque las queries por correo fallen por reglas,
    // los perfiles debugger se resuelven por ID explícito (allow get público).
    if (canAccessMultipleProfiles(normalizedEmail)) {
        const specialIds = getMultiProfileStudentIds(normalizedEmail);
        const missingIds = specialIds.filter(id => !seenIds.has(id));

        if (missingIds.length > 0) {
            const docSnaps = await Promise.all(
                missingIds.map(id => gatedGetDoc(doc(db, 'students', id), 'getStudentsByEmail:byId'))
            );
            docSnaps.forEach(docSnap => {
                if (docSnap) _processStudentDoc(docSnap, seenIds, profiles);
            });
        }
    }

    // Restricción: solo correos autorizados ven múltiples perfiles
    let finalProfiles = profiles;
    if (!canAccessMultipleProfiles(normalizedEmail) && profiles.length > 1) {
        console.warn(`[Security] Multiple profiles blocked for ${normalizedEmail}.`);
        const primary = profiles.find(p => p.email.toLowerCase().trim() === normalizedEmail);
        finalProfiles = primary ? [primary] : [profiles[0]];
    }

    // Cache resultado
    if (finalProfiles.length > 0) {
        try {
            localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), profiles: finalProfiles }));
        } catch { /* storage full */ }
        
        finalProfiles.forEach(p => {
            cache.studentProfiles.set(p.email, p);
            persistSet(`profile_${p.email}`, p);
        });
    }

    return finalProfiles;
    })();

    inFlightProfilesByEmail.set(inFlightKey, requestPromise);
    try {
        return await requestPromise;
    } finally {
        inFlightProfilesByEmail.delete(inFlightKey);
    }
}

export async function getStudentByEmail(email: string): Promise<StudentProfile | null> {

    let normalizedEmail = email.toLowerCase().trim();

    // 🛡️ Validar formato de email antes de consultar Firestore
    if (!isValidEmail(normalizedEmail)) {
        console.warn('[Security] Invalid email format rejected:', normalizedEmail);
        return null;
    }

    // 🛡️ Rate limit: máximo 10 búsquedas por email/minuto
    if (!clientRateLimit('getStudentByEmail', 10, 60000)) {
        console.warn('[Security] Rate limit exceeded for getStudentByEmail');
        return null;
    }

    if (DEBUG_EMAIL_ALIASES[normalizedEmail]) {
        console.warn(`[DEBUG] Email alias: ${normalizedEmail} → ${DEBUG_EMAIL_ALIASES[normalizedEmail]}`);
        normalizedEmail = DEBUG_EMAIL_ALIASES[normalizedEmail];
    }

    if (cache.studentProfiles.has(normalizedEmail)) {
        return cache.studentProfiles.get(normalizedEmail)!;
    }

    const persistKey = `profile_${normalizedEmail}`;
    const persisted = persistGet<StudentProfile>(persistKey);
    if (persisted) {
        cache.studentProfiles.set(normalizedEmail, persisted);
        return persisted;
    }

    // Firestore query (auth — gated)
    try {
        const studentsRef = collection(db, 'students');
        const q = query(studentsRef, where('email', '==', normalizedEmail));
        const snapshot = await gatedGetDocs(q, 'getStudentByEmail');

        if (snapshot && !snapshot.empty) {
            const docSnap = snapshot.docs[0];
            const data = docSnap.data() as DocumentData;
            const profile: StudentProfile = {
                id: docSnap.id,
                email: data.email,
                nombre: data.nombre,
                apellidos: data.apellidos,
                institucion: data.institucion,
                // OPT-3: Cargar lista de simulacros si existe en el perfil
                simulacros: Array.isArray(data.simulacros) ? data.simulacros : undefined,
            };
            cache.studentProfiles.set(normalizedEmail, profile);
            persistSet(persistKey, profile);
            return profile;
        }
    } catch (err) {
        console.warn('[Firestore] getStudentByEmail query error:', err);
    }

    // Fallback: buscar en auth_index.json local (para estudiantes recién añadidos)
    if (isLocal) {
        try {
            const authIndex = await fetchStaticJSON<Array<{ i: string; n: string; e: string }>>('auth_index.json');
            const found = authIndex.find(
                (s) => (s.e || '').toLowerCase().trim() === normalizedEmail
            );
            if (found) {
                const fullName = found.n || '';
                const parts = fullName.split(' ');
                let nombres: string, apellidos: string;
                if (parts.length >= 4) {
                    nombres = parts.slice(0, 2).join(' ');
                    apellidos = parts.slice(2).join(' ');
                } else if (parts.length >= 2) {
                    nombres = parts[0];
                    apellidos = parts.slice(1).join(' ');
                } else {
                    nombres = fullName;
                    apellidos = '';
                }
                const profile: StudentProfile = {
                    id: String(found.i).trim(),
                    email: normalizedEmail,
                    nombre: nombres,
                    apellidos: apellidos,
                    institucion: 'PREICFES SEAMOSGENIOS',
                };
                cache.studentProfiles.set(normalizedEmail, profile);
                persistSet(persistKey, profile);
                console.log(`[Local Fallback] Estudiante encontrado en auth_index.json: ${profile.nombre} ${profile.apellidos}`);
                return profile;
            }
        } catch {
            // auth_index.json no disponible
        }
    }

    return null;
}

// ========================================
// Lookup Student by ID Number (for login help)
// ========================================

export interface StudentLookupResult {
    found: boolean;
    nombre: string;
    email: string;
    emailMasked: string;
    simulacros: string[];
}

export type DirectStudentLoginError =
    | 'invalid-input'
    | 'invalid-document'
    | 'invalid-birth-date'
    | 'not-found'
    | 'birth-date-missing'
    | 'birth-date-mismatch'
    | 'rate-limited'
    | 'functions-unavailable'
    | 'client-blocked'
    | 'results-need-google';

export interface DirectStudentLoginResult {
    ok: boolean;
    student?: StudentProfile;
    error?: DirectStudentLoginError;
}

function normalizeStudentDocId(raw: string): string {
    return String(raw || '').replace(/\D/g, '').trim();
}

function hasMinimumResultPayload(data: Estudiante | null | undefined): boolean {
    return Boolean(data?.puntajes && Object.keys(data.puntajes).length > 0);
}

/** Evita servir cache/result de otro documento o sin puntajes mínimos. */
function validateStudentResultPayload(
    studentId: string,
    data: Estudiante | null | undefined,
    simId?: string,
): Estudiante | null {
    if (!data) return null;
    const docId = normalizeStudentDocId(data.informacion_personal?.numero_identificacion || '');
    if (!docId || docId !== normalizeStudentDocId(studentId)) {
        console.warn('[getStudentResults] ID mismatch — descartando', { studentId, docId, simId });
        return null;
    }
    if (!hasMinimumResultPayload(data)) {
        console.warn('[getStudentResults] Sin puntajes — descartando', { studentId, simId });
        return null;
    }
    return data;
}

function finalizeStudentResultForSession(
    student: Estudiante | null,
    studentId: string,
    simId: string,
): Estudiante | null {
    const priv = applyDemoPrivacyOnStudent(student, studentId, simId);
    return validateStudentResultPayload(studentId, priv, simId);
}

async function sha256Hex(input: string): Promise<string> {
    const bytes = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

async function loginStudentDirectCallable(
    _normalizedId: string,
    _normalizedBirthDate: string
): Promise<DirectStudentLoginResult | null> {
    // LOCAL-ONLY: Cloud Function remota deshabilitada.
    return { ok: false, error: 'functions-unavailable' };
}

async function loginStudentDirectClient(
    normalizedId: string,
    normalizedBirthDate: string
): Promise<DirectStudentLoginResult> {
    const isDevLanHost =
        typeof window !== 'undefined' &&
        process.env.NODE_ENV === 'development' &&
        !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);

    try {
        const docRef = doc(db, 'students', normalizedId);
        const snap = await gatedGetDoc(docRef, 'loginStudentDirectClient', { preferServer: true });
        if (snap === null) {
            return { ok: false, error: isDevLanHost ? 'client-blocked' : 'not-found' };
        }
        if (!snap.exists()) return { ok: false, error: 'not-found' };

        const data = snap.data() as DocumentData;
        const expectedHash = String(data.birthDateHash || '').trim();
        if (!expectedHash) return { ok: false, error: 'birth-date-missing' };

        const candidateHash = await sha256Hex(`${normalizedId}:${normalizedBirthDate}`);
        if (candidateHash !== expectedHash) {
            return { ok: false, error: 'birth-date-mismatch' };
        }

        return {
            ok: true,
            student: {
                id: snap.id,
                email: String(data.email || '').toLowerCase().trim(),
                nombre: String(data.nombre || ''),
                apellidos: String(data.apellidos || ''),
                institucion: data.institucion,
                departamento: data.departamento,
                simulacros: Array.isArray(data.simulacros) ? data.simulacros : undefined,
            },
        };
    } catch (err) {
        const code = String((err as { code?: string })?.code || '');
        if (code === 'permission-denied' || isDevLanHost) {
            return { ok: false, error: 'client-blocked' };
        }
        console.warn('[Firestore] loginStudentByIdAndBirthDate error:', err);
        return { ok: false, error: 'not-found' };
    }
}

/** @deprecated Legacy doc+fecha. UI apagada por defecto (`NEXT_PUBLIC_DIRECT_LOGIN_ENABLED`). Usar Google. */
export async function loginStudentByIdAndBirthDate(
    idNumber: string,
    birthDate: string
): Promise<DirectStudentLoginResult> {
    const normalizedId = sanitizeInput(idNumber.trim());
    const normalizedBirthDate = normalizeBirthDateInput(birthDate);

    if (!normalizedId || !isValidStudentId(normalizedId)) {
        return { ok: false, error: 'invalid-document' };
    }
    if (!normalizedBirthDate) {
        return { ok: false, error: 'invalid-birth-date' };
    }

    if (!clientRateLimit('loginStudentByIdAndBirthDate', 6, 60000)) {
        console.warn('[Security] Rate limit exceeded for loginStudentByIdAndBirthDate');
        return { ok: false, error: 'rate-limited' };
    }

    if (isLocal) {
        return loginStudentDirectClient(normalizedId, normalizedBirthDate);
    }

    const callableResult = await loginStudentDirectCallable(normalizedId, normalizedBirthDate);
    if (callableResult?.ok) return callableResult;

    const definitiveCallableErrors = new Set<DirectStudentLoginError>([
        'invalid-document',
        'invalid-birth-date',
        'invalid-input',
        'birth-date-mismatch',
        'birth-date-missing',
        'rate-limited',
    ]);
    if (callableResult?.error && definitiveCallableErrors.has(callableResult.error)) {
        return callableResult;
    }

    // CF ausente → validar doc+fecha en cliente; sin custom token no se lee results/*
    const clientResult = await loginStudentDirectClient(normalizedId, normalizedBirthDate);
    if (!clientResult.ok || !clientResult.student) return clientResult;

    const canReadResults = await canReadStudentFirestoreResults(normalizedId);
    if (canReadResults) return clientResult;

    const assignedEmail = String(clientResult.student.email || '').trim().toLowerCase();
    if (assignedEmail && isValidEmail(assignedEmail)) {
        return { ok: false, error: 'results-need-google', student: clientResult.student };
    }
    return { ok: false, error: 'functions-unavailable' };
}

export async function lookupStudentById(idNumber: string): Promise<StudentLookupResult | null> {
    const normalizedId = sanitizeInput(idNumber.trim());
    if (!normalizedId) return null;

    // 🛡️ Validar formato de ID
    if (!isValidStudentId(normalizedId)) {
        console.warn('[Security] Invalid student ID format rejected:', normalizedId);
        return null;
    }

    // 🛡️ Rate limit: máximo 10 búsquedas por ID/minuto
    if (!clientRateLimit('lookupStudentById', 10, 60000)) {
        console.warn('[Security] Rate limit exceeded for lookupStudentById');
        return null;
    }

    const maskEmail = (email: string): string => {
        const [user, domain] = email.split('@');
        if (!user || !domain) return email;
        if (user.length <= 3) return user[0] + '***@' + domain;
        return user.slice(0, 3) + '***@' + domain;
    };

    // ═══════════════════════════════════════════════════════════════
    // ARQUITECTURA DE AUTENTICACIÓN POR ID
    // ═══════════════════════════════════════════════════════════════
    // FUENTE DE VERDAD: Firestore → students/{id}
    //   Campos: email, nombre, apellidos, simulacros[]
    //
    // LOCAL (dev): auth_index.json es un MIRROR de Firestore.
    //   Se regenera automáticamente con: python scripts/pipeline/rebuild_auth_index.py
    //   NO editar manualmente — editar en Firestore y regenerar.
    //
    // CRUD FUTURO: Para agregar/editar estudiantes, solo tocar:
    //   1. Firestore → students/{id} (email, nombre, apellidos)
    //   2. Firestore → students/{id}/results/{simId} (resultados)
    //   3. Regenerar auth_index.json para dev local
    // ═══════════════════════════════════════════════════════════════

    let studentEmail = '';
    let studentName = '';
    let simulacros: string[] = [];

    if (isLocal) {
        // LOCAL: auth_index.json es el mirror de Firestore students/{id}
        // Formato: [{i: id, n: nombre_completo, e: email}]
        try {
            const authIndex = await fetchStaticJSON<Array<{ i: string; n: string; e: string }>>('auth_index.json');
            const found = authIndex.find(s => String(s.i).trim() === normalizedId);
            if (found) {
                studentEmail = (found.e || '').toLowerCase().trim();
                studentName = found.n || '';
            }
        } catch { /* ignore */ }
    } else {
        // PRODUCCIÓN: studentAuth O(1) → students/{id}
        try {
            const authRef = doc(
                db,
                STUDENT_AUTH_COLLECTION,
                studentAuthDocumentoDocId(normalizedId),
            );
            const authSnap = await gatedGetDoc(authRef, 'lookupStudentById:studentAuth');
            if (authSnap?.exists()) {
                const auth = authSnap.data() as Record<string, unknown>;
                studentEmail = String(auth.emailLower || auth.email || '').toLowerCase().trim();
                studentName = `${auth.nombre || ''} ${auth.apellidos || ''}`.trim();
            }
        } catch { /* ignore */ }

        try {
            const docRef = doc(db, 'students', normalizedId);
            const snap = await gatedGetDoc(docRef, 'lookupStudentById');
            if (snap?.exists()) {
                const data = snap.data();
                studentEmail = (data.email || '').toLowerCase().trim();
                studentName = `${data.nombre || ''} ${data.apellidos || ''}`.trim();
                if (data.simulacros && Array.isArray(data.simulacros) && data.simulacros.length > 0) {
                    simulacros = data.simulacros;
                } else {
                    try {
                        const resultsRef = collection(db, 'students', normalizedId, 'results');
                        const resultsSnap = await gatedGetDocs(
                            query(resultsRef),
                            'lookupStudentById.sims',
                            12
                        );
                        if (resultsSnap) {
                            simulacros = resultsSnap.docs.map(d => d.id);
                        }
                    } catch { /* ignore */ }
                }
            }
        } catch (err) {
            console.warn('[Firestore] lookupStudentById error:', err);
        }
    }

    if (!studentEmail) return null;

    // LOCAL: detectar simulacros desde archivos estáticos
    if (isLocal && simulacros.length === 0) {
        try {
            const config = await getAppConfig();
            for (const simId of config.availableSimulations || []) {
                try {
                    await fetchStaticJSON<any>(`simulations/${simId}/estudiantes/${normalizedId}.json`);
                    simulacros.push(simId);
                } catch {
                    try {
                        const allData = await fetchStaticJSON<any>(`simulations/${simId}/students.json`);
                        const students = allData.estudiantes || Object.values(allData.students || {});
                        const found = (students as any[]).some(
                            (e: any) => String(e.informacion_personal?.numero_identificacion).trim() === normalizedId
                        );
                        if (found) simulacros.push(simId);
                    } catch { /* ignore */ }
                }
            }
        } catch { /* ignore */ }
    }

    return {
        found: true,
        nombre: studentName,
        email: studentEmail,
        emailMasked: maskEmail(studentEmail),
        simulacros,
    };
}

// ========================================
// Student Results
// ========================================

/** True si hay al menos una materia con ítems reales (no `{}` stub del upload liviano). */
export function hasRespuestasDetalladas(e: Estudiante | null | undefined): boolean {
    if (!e?.respuestas_detalladas) return false;
    return Object.values(e.respuestas_detalladas).some((v: any) =>
        (Array.isArray(v) && v.length > 0) ||
        (typeof v === 'object' && v !== null && Object.keys(v).length > 0)
    );
}

function _hasRespuestasDetalladas(e: Estudiante | null | undefined): boolean {
    return hasRespuestasDetalladas(e);
}

function mergeRespuestasDetalladasRecords(
    inline: Record<string, unknown> | undefined,
    fetched: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
    const out: Record<string, unknown> = { ...(inline || {}) };
    const materiaHasItems = (v: unknown) =>
        (Array.isArray(v) && v.length > 0) ||
        (typeof v === 'object' && v !== null && Object.keys(v as object).length > 0);

    if (fetched) {
        for (const [materia, items] of Object.entries(fetched)) {
            if (!materiaHasItems(items)) continue;
            if (!materiaHasItems(out[materia])) out[materia] = items;
        }
    }

    return Object.values(out).some(materiaHasItems) ? out : undefined;
}

/** Quita cachés locales de un estudiante+sim (p. ej. results sin detalle guardado antes del fix). */
export function clearStudentSimulationCaches(studentId: string, simId: string): void {
    const cacheKey = `results_${studentId}_${simId}`;
    const detailKey = `answerDetails_${studentId}_${simId}`;
    try {
        localStorage.removeItem(`${CACHE_VERSION}_${cacheKey}`);
        localStorage.removeItem(`${CACHE_VERSION}_${detailKey}`);
    } catch {
        /* ignore */
    }
    cache.studentResults.delete(cacheKey);
}

/** Al cambiar de estudiante vía doc+fecha: evita mezclar results/sims previos. */
export function clearDirectLoginPriorCaches(newStudentId: string): void {
    try {
        localStorage.removeItem('student_data');
        localStorage.removeItem('simulacro_selected');
        const prefix = `${CACHE_VERSION}_`;
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key?.startsWith(prefix)) continue;
            const suffix = key.slice(prefix.length);
            if (
                suffix.startsWith('results_') ||
                suffix.startsWith('answerDetails_') ||
                suffix.startsWith('studentSims_')
            ) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
        /* ignore */
    }

    cache.studentResults.clear();
    if ((cache as any)._simLists) {
        (cache as any)._simLists.clear();
    }
}

async function resolveRespuestasDetalladasForStudent(
    studentId: string,
    currentSim: string,
    inline?: Record<string, unknown>
): Promise<Record<string, unknown> | undefined> {
    if (hasRespuestasDetalladas({ respuestas_detalladas: inline } as Estudiante)) {
        return inline;
    }
    const fetched = await getAnswerDetailsForStudent(studentId, currentSim);
    const merged = mergeRespuestasDetalladasRecords(inline, fetched ?? undefined);
    if (merged && hasRespuestasDetalladas({ respuestas_detalladas: merged } as Estudiante)) {
        return merged;
    }
    return merged;
}

async function getAnswerDetailsForStudent(
    studentId: string,
    currentSim: string
): Promise<Record<string, any> | null> {
    const detailCacheKey = `answerDetails_${studentId}_${currentSim}`;

    const persisted = persistGet<Record<string, any>>(detailCacheKey);
    if (persisted && Object.keys(persisted).length > 0) return persisted;

    if (isLocal) return null;

    try {
        const detailRef = doc(db, 'students', studentId, 'answerDetails', currentSim);
        const snap = await gatedGetDoc(detailRef, 'getAnswerDetails');
        if (snap === null) return null;
        if (!snap.exists()) return null;

        const data = snap.data() as { respuestas_detalladas?: Record<string, any> };
        const respuestas = data?.respuestas_detalladas;
        if (respuestas && Object.keys(respuestas).length > 0) {
            persistSet(detailCacheKey, respuestas, getSimTTL(currentSim));
            return respuestas;
        }
    } catch (err) {
        console.warn('[getAnswerDetailsForStudent] error:', err);
    }

    return null;
}

function hasValidStudentResultShape(found: Estudiante | null | undefined): boolean {
    return Boolean(
        found &&
            found.informacion_personal &&
            found.informacion_personal.numero_identificacion,
    );
}

/** Completa informacion_personal desde students/{id} (get público) si results no la trae. */
async function hydratePersonalFromStudentDoc(
    studentId: string,
    data: Estudiante,
): Promise<Estudiante> {
    if (hasValidStudentResultShape(data)) return data;

    if (isLocal) return data;

    try {
        const profileSnap = await gatedGetDoc(
            doc(db, 'students', studentId),
            'hydratePersonalFromStudentDoc',
        );
        if (!profileSnap?.exists()) return data;

        const profile = profileSnap.data() as DocumentData;
        const merged: Estudiante = {
            ...data,
            informacion_personal: {
                nombres: String(
                    profile.nombre || data.informacion_personal?.nombres || '',
                ),
                apellidos: String(
                    profile.apellidos || data.informacion_personal?.apellidos || '',
                ),
                numero_identificacion: studentId,
                tipo_identificacion:
                    data.informacion_personal?.tipo_identificacion || 'CC',
                telefono: data.informacion_personal?.telefono || '',
                municipio: data.informacion_personal?.municipio || '',
                institucion: String(
                    profile.institucion || data.informacion_personal?.institucion || '',
                ),
            },
        };
        return hasValidStudentResultShape(merged) ? merged : data;
    } catch (err) {
        console.warn('[hydratePersonalFromStudentDoc] error:', err);
        return data;
    }
}

/** Firestore results: sesión Google o custom token studentDirect (misma regla que Firestore). */
async function canFetchStudentResultsFromFirestore(studentId: string): Promise<boolean> {
    if (isLocal) return true;
    return canReadStudentFirestoreResults(studentId);
}

export async function getStudentResults(
    studentId: string,
    simId?: string,
    requireDetalle = false   // true = saltar cache truncado, exigir respuestas_detalladas
): Promise<Estudiante | null> {
    const config = await getAppConfig();
    const currentSim = simId || config.activeSimulation;
    const cacheKey = `results_${studentId}_${currentSim}`;

    // Verificar cache en memoria — omitir si se necesitan detalles y el objeto está truncado
    if (cache.studentResults.has(cacheKey)) {
        const cached = cache.studentResults.get(cacheKey)!;
        if (!requireDetalle || _hasRespuestasDetalladas(cached)) {
            const finalized = finalizeStudentResultForSession(cached, studentId, currentSim);
            if (finalized) return finalized;
            cache.studentResults.delete(cacheKey);
        }
        // Está truncado → limpiar y volver a buscar
        cache.studentResults.delete(cacheKey);
    }

    // Verificar localStorage — omitir si se necesitan detalles y el objeto está truncado
    const persisted = persistGet<Estudiante>(cacheKey);
    if (persisted) {
        // 🛡️ Guardia de campo: si el cache no tiene secciones_completadas, forzar Firestore
        // Esto protege contra entradas cacheadas antes de que se añadiera el campo.
        const hasSeccionesField = Array.isArray((persisted as any).secciones_completadas);
        if (!hasSeccionesField) {
            console.log(`[getStudentResults] Cache sin secciones_completadas para ${studentId}@${currentSim}, forzando Firestore...`);
            // No retornar — dejar que caiga al fetch de Firestore
        } else if (!requireDetalle || _hasRespuestasDetalladas(persisted)) {
            const finalized = finalizeStudentResultForSession(persisted, studentId, currentSim);
            if (finalized) {
                cache.studentResults.set(cacheKey, finalized);
                return finalized;
            }
            persistSet(cacheKey, null as unknown as Estudiante, 0);
        } else {
            // Truncado en localStorage → limpiar para forzar fetch fresco
            console.log(`[getStudentResults] Cache truncado para ${studentId}@${currentSim}, forzando Firestore...`);
        }
    }

    if (useLocalStaticSimData()) {
        // LOCAL / dev:staging: resolver desde JSON estático (individual o students.json)
        try {
            const individual = await fetchStaticJSON<Estudiante>(
                `simulations/${currentSim}/estudiantes/${studentId}.json`,
            );
            const fromIndividual = finalizeStudentResultForSession(individual, studentId, currentSim);
            if (fromIndividual) {
                cache.studentResults.set(cacheKey, fromIndividual);
                persistSet(cacheKey, fromIndividual, getSimTTL(currentSim));
                return fromIndividual;
            }
        } catch {
            /* fallback students.json */
        }
        try {
            const allStudents = await getAllStudents(currentSim);
            const found = allStudents.find(
                (e: Estudiante) =>
                    String(e.informacion_personal?.numero_identificacion).trim() ===
                    String(studentId).trim(),
            ) || null;
            if (found) {
                const priv = finalizeStudentResultForSession(found, studentId, currentSim);
                if (priv) {
                    cache.studentResults.set(cacheKey, priv);
                    persistSet(cacheKey, priv, getSimTTL(currentSim));
                }
                return priv;
            }
        } catch {
            // No data available
        }
        return null;
    }

    // PRODUCCIÓN: Firestore documento individual (~5 KB, 1 read — gated)
    if (!(await canFetchStudentResultsFromFirestore(studentId))) {
        console.warn(
            `[getStudentResults] Sin sesión Firebase para leer results de ${studentId}@${currentSim}`,
        );
        return null;
    }

    try {
        const docRef = doc(db, 'students', studentId, 'results', currentSim);
        const snap = await gatedGetDoc(docRef, 'getStudentResults');

        // snap===null significa que gatedGetDoc bloqueó la lectura por presupuesto agotado
        // Es distinto a snap.exists()===false (doc realmente no existe en Firestore)
        if (snap === null) {
            // 🛡️ Antes de lanzar BUDGET_EXHAUSTED, intentar servir desde localStorage
            // Esto cubre el caso donde el presupuesto se agota en reintentos
            // pero el estudiante ya había cargado sus datos previamente.
            const staleCache = persistGet<Estudiante>(cacheKey);
            if (staleCache) {
                console.warn(`[getStudentResults] Budget agotado, sirviendo desde caché local para ${studentId}@${currentSim}`);
                cache.studentResults.set(cacheKey, staleCache);
                const finalized = finalizeStudentResultForSession(staleCache, studentId, currentSim);
                if (finalized) {
                    cache.studentResults.set(cacheKey, finalized);
                    return finalized;
                }
                return finalized ?? null;
            }
            console.warn(`[ReadBudget] Sin caché local — omitiendo lectura de ${studentId}@${currentSim}`);
            return null;
        }

        if (snap.exists()) {
            const data = snap.data() as Estudiante;
            
            // 🛡️ DEFENSIVE VALIDATION: Log if data is empty
            if (!data || Object.keys(data).length === 0) {
                console.error('[getStudentResults] ⚠️ snap.exists() is true but data is empty!', {
                    studentId,
                    simId: currentSim,
                    snapId: snap.id,
                    snapRef: snap.ref.path,
                    dataKeys: data ? Object.keys(data) : 'null'
                });
            }
            
            // 🛡️ DEFENSIVE VALIDATION: Log if informacion_personal is missing
            if (data && !data.informacion_personal) {
                console.error('[getStudentResults] ⚠️ Data missing informacion_personal!', {
                    studentId,
                    simId: currentSim,
                    dataKeys: Object.keys(data),
                    hasPuntajeGlobal: !!data.puntaje_global,
                    hasPuntajes: !!data.puntajes
                });
            }
            
            const resolvedRd = requireDetalle
                ? await resolveRespuestasDetalladasForStudent(
                      studentId,
                      currentSim,
                      data.respuestas_detalladas as Record<string, unknown> | undefined
                  )
                : data.respuestas_detalladas;
            const finalData: Estudiante = requireDetalle
                ? { ...data, respuestas_detalladas: resolvedRd as Estudiante['respuestas_detalladas'] }
                : data;

            const hydrated = await hydratePersonalFromStudentDoc(studentId, finalData);
            const finalized = finalizeStudentResultForSession(hydrated, studentId, currentSim);
            if (!finalized) return null;

            cache.studentResults.set(cacheKey, finalized);
            persistSet(cacheKey, finalized, getSimTTL(currentSim));
            return finalized;
        }
        // El documento realmente no existe en Firestore → el estudiante no presentó este simulacro
        return null;
    } catch (err) {
        // Re-lanzar errores de presupuesto para que el caller pueda distinguirlos
        if ((err as any)?.code === 'BUDGET_EXHAUSTED') throw err;
        console.warn('[Firestore] getStudentResults error:', err);
    }

    return null;
}

// ========================================
// Enriquecer Estudiante con Respuestas Detalladas (bajo demanda)
// ========================================

/**
 * Enriquece los datos de un estudiante con respuestas_detalladas.
 * En producción el detalle vive en `students/{id}/answerDetails/{simId}`;
 * `results` y `admin_students/chunks` son intencionalmente livianos.
 */
/**
 * Hidrata un estudiante del listado (ranking) con `students/{id}/results` y, si aplica,
 * `answerDetails`. Necesario en staging: coordinadores no leen `admin_students/chunks`.
 */
export async function hydrateCoordinatorStudent(
    estudiante: Estudiante,
    simId?: string
): Promise<Estudiante> {
    const studentId = estudiante.informacion_personal?.numero_identificacion?.trim();
    if (!studentId) return estudiante;

    try {
        const full = await getStudentResults(studentId, simId, true);
        if (!full) {
            const enriched = await enrichStudentWithDetailedAnswers(estudiante, simId);
            return applyDemoPrivacyOnStudent(enriched, studentId, simId || '') ?? enriched;
        }

        const mergedPuntajes: Record<string, { puntaje: number; correctas: number; total_preguntas: number }> = {
            ...(estudiante.puntajes as Record<string, { puntaje: number; correctas: number; total_preguntas: number }>),
        };
        for (const [key, raw] of Object.entries(full.puntajes || {})) {
            mergedPuntajes[key] = normalizePuntaje(raw);
        }

        const merged: Estudiante = {
            ...estudiante,
            ...full,
            informacion_personal: {
                ...estudiante.informacion_personal,
                ...full.informacion_personal,
            },
            puntaje_global: full.puntaje_global ?? estudiante.puntaje_global,
            puntajes: mergedPuntajes,
            respuestas_detalladas:
                full.respuestas_detalladas ?? estudiante.respuestas_detalladas,
        };
        return applyDemoPrivacyOnStudent(merged, studentId, simId || '') ?? merged;
    } catch (err) {
        console.warn('[hydrateCoordinatorStudent] error:', err);
        const fallback = applyDemoPrivacyOnStudent(estudiante, studentId, simId || '');
        return fallback ?? estudiante;
    }
}

export async function enrichStudentWithDetailedAnswers(
    estudiante: Estudiante,
    simId?: string
): Promise<Estudiante> {
    const config = await getAppConfig();
    const currentSim = simId || config.activeSimulation;
    const studentId = estudiante.informacion_personal?.numero_identificacion;
    
    if (!studentId) {
        console.warn('[enrichStudentWithDetailedAnswers] No student ID found');
        return estudiante;
    }
    
    // Si ya tiene respuestas detalladas del mismo simulacro, no recargar
    const sourceSim = getStudentSourceSimulation(estudiante);
    if (_hasRespuestasDetalladas(estudiante)) {
        if (!sourceSim || normalizeSimulationId(sourceSim) === normalizeSimulationId(currentSim)) {
            return tagStudentForSimulation(estudiante, currentSim);
        }
        estudiante = {
            ...estudiante,
            respuestas_detalladas: undefined,
        };
    }
    
    console.log(`[enrichStudentWithDetailedAnswers] Cargando respuestas detalladas para ${studentId}@${currentSim}...`);
    
    if (isLocal) {
        // LOCAL: cargar desde archivo individual completo
        try {
            const fullData = await fetchStaticJSON<Estudiante>(
                `simulations/${currentSim}/estudiantes/${studentId}.json`
            );
            if (fullData?.respuestas_detalladas) {
                return tagStudentForSimulation(
                    { ...estudiante, respuestas_detalladas: fullData.respuestas_detalladas },
                    currentSim,
                );
            }
        } catch (err) {
            console.warn('[enrichStudentWithDetailedAnswers] Error cargando archivo local:', err);
        }
        return estudiante;
    }
    
    const merged = await resolveRespuestasDetalladasForStudent(
        studentId,
        currentSim,
        estudiante.respuestas_detalladas as Record<string, unknown> | undefined
    );
    if (merged && hasRespuestasDetalladas({ respuestas_detalladas: merged } as Estudiante)) {
        return tagStudentForSimulation(
            { ...estudiante, respuestas_detalladas: merged as Estudiante['respuestas_detalladas'] },
            currentSim,
        );
    }

    console.warn(`[enrichStudentWithDetailedAnswers] No se encontraron respuestas detalladas para ${studentId}@${currentSim}`);
    return tagStudentForSimulation(estudiante, currentSim);
}

// ========================================
// Student Results — Búsqueda por Nombre Completo (Fallback de Seguridad)
// ========================================

/**
 * Busca resultados de un estudiante usando su nombre completo normalizado.
 * Este es el fallback de seguridad para casos donde el estudiante pudo haber
 * cometido un error de un dígito en su número de identificación.
 *
 * Estrategia:
 * 1. Normaliza el nombre buscado (mayúsculas, sin tildes).
 * 2. Consulta en Firestore el perfil de la colección 'students' comparando
 *    'nombre' y 'apellidos'.
 * 3. Si hay coincidencia exacta, carga los resultados con el ID encontrado.
 *
 * ⚠️ Esta función consume reads de Firestore (hasta N+1 donde N = matches).
 *    Usar solo cuando la búsqueda por ID falla.
 */
export async function getStudentResultsByName(
    fullName: string,
    simId?: string
): Promise<{ studentId: string; data: Estudiante } | null> {
    const normalizedSearch = fullName
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // quitar tildes

    if (normalizedSearch.length < 4) return null;

    // 🛡️ Rate limit: máximo 5 búsquedas por nombre/minuto
    if (!clientRateLimit('getStudentResultsByName', 5, 60000)) {
        console.warn('[Security] Rate limit exceeded for getStudentResultsByName');
        return null;
    }

    const config = await getAppConfig();
    const currentSim = simId || config.activeSimulation;

    try {
        // Dividir nombre para intentar coincidencia en 'nombre' + 'apellidos'
        const parts = normalizedSearch.split(' ').filter(Boolean);
        if (parts.length < 2) return null;

        // Intentar buscar por primer apellido (campo 'apellidos') — más discriminante
        const apellidoBusqueda = parts[parts.length - 1];
        const studentsRef = collection(db, 'students');
        const q = query(
            studentsRef,
            where('apellidos_normalized', '>=', apellidoBusqueda),
            where('apellidos_normalized', '<=', apellidoBusqueda + '\uf8ff')
        );

        const snap = await gatedGetDocs(q, 'getStudentResultsByName', 25);
        if (!snap || snap.empty) {
            // Fallback: buscar sin normalizar (campo original)
            console.log(`[getStudentResultsByName] No match por apellidos_normalized para '${apellidoBusqueda}'`);
            return null;
        }

        // Comparar nombre completo normalizado contra cada resultado
        for (const docSnap of snap.docs) {
            const profileData = docSnap.data() as DocumentData;
            const storedNombre = ((profileData.nombre || '') + ' ' + (profileData.apellidos || ''))
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');

            // Coincidencia exacta o muy alta similaridad
            if (storedNombre.trim() === normalizedSearch) {
                const foundStudentId = docSnap.id;
                console.log(`[getStudentResultsByName] Coincidencia exacta para '${fullName}' → ID ${foundStudentId}`);

                // Cargar sus resultados con el ID real
                const results = await getStudentResults(foundStudentId, currentSim);
                if (results) {
                    return { studentId: foundStudentId, data: results };
                }
            }
        }

        console.log(`[getStudentResultsByName] Sin coincidencia exacta para '${fullName}'`);
    } catch (err) {
        console.warn('[Firestore] getStudentResultsByName error:', err);
    }

    return null;
}

// ========================================
// Statistics
// ========================================

export async function getStatistics(simId?: string): Promise<EstadisticasGrupo> {
    const config = await getAppConfig();
    const currentSim = simId || config.activeSimulation;
    const persistKey = `stats_${currentSim}`;

    if (cache.statistics.has(currentSim)) {
        return cache.statistics.get(currentSim)!;
    }

    const persisted = persistGet<EstadisticasGrupo>(persistKey);
    if (persisted) {
        cache.statistics.set(currentSim, persisted);
        return persisted;
    }

    if (useLocalStaticSimData()) {
        // LOCAL / dev:staging: JSON estático por simulacro
        for (const filename of ['estadisticas_grupo.json', 'statistics.json']) {
            try {
                const data = await fetchStaticJSON<EstadisticasGrupo>(`simulations/${currentSim}/${filename}`);
                cache.statistics.set(currentSim, data);
                persistSet(persistKey, data, getSimTTL(currentSim));
                return data;
            } catch {
                // Intentar siguiente nombre
            }
        }
        throw new Error(`Statistics not found locally for: ${currentSim}`);
    }

    // PRODUCCIÓN: Firestore (1 read — gated)
    try {
        const docRef = doc(db, 'simulations', currentSim, 'data', 'estadisticas');
        const snap = await gatedGetDoc(docRef, 'getStatistics');
        if (snap?.exists()) {
            const data = snap.data() as EstadisticasGrupo;
            cache.statistics.set(currentSim, data);
            persistSet(persistKey, data, getSimTTL(currentSim));
            return data;
        }
    } catch (err) {
        console.warn('[Firestore] getStatistics error:', err);
    }

    throw new Error(`Statistics not found for simulation: ${currentSim}`);
}

// ========================================
// Coordinator Summary (pre-computed per-sim stats)
// LOCAL: JSON estático (~11 KB)
// PRODUCCIÓN: Firestore doc (1 read, 0 bandwidth)
// ========================================

let _coordSummaryCache: Record<string, any> | null = null;

function coordSummaryLog(...args: unknown[]): void {
    if (useLocalStaticSimData()) console.log(...args);
}

async function fetchLocalCoordinatorSummaryJson(
    cacheVersion: string,
): Promise<Record<string, any>> {
    const timestamp = Date.now();
    const url = `/data/coordinator_summary.json?v=${cacheVersion}&t=${timestamp}`;
    const response = await fetch(url, {
        cache: 'no-store',
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
        },
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return (await response.json()) as Record<string, any>;
}

export async function getCoordinatorSummary(): Promise<Record<string, any>> {
    const persistKey = 'coordinator_summary';
    const COORD_SUMMARY_CACHE_VERSION = '2026-07-13-v9';

    coordSummaryLog('[CoordinatorSummary] Iniciando carga...');

    // 🛡️ FIX #1: Usar caché normal con TTL, NO limpieza agresiva
    // Memory cache (siempre activo)
    if (_coordSummaryCache && Object.keys(_coordSummaryCache).length > 0) {
        coordSummaryLog('[CoordinatorSummary] ✅ Usando caché en memoria');
        return filterCoordinatorSummaryData(_coordSummaryCache);
    }

    // Persist cache con versión
    const versionedKey = `${persistKey}_${COORD_SUMMARY_CACHE_VERSION}`;
    if (!useLocalStaticSimData()) {
        const persisted = persistGet<Record<string, any>>(versionedKey);
        if (persisted && Object.keys(persisted).length > 0) {
            coordSummaryLog('[CoordinatorSummary] ✅ Usando caché persistente');
            _coordSummaryCache = persisted;
            return filterCoordinatorSummaryData(persisted);
        }
    }

    coordSummaryLog('[CoordinatorSummary] Cargando datos frescos...');

    if (useLocalStaticSimData()) {
        try {
            coordSummaryLog('[CoordinatorSummary] 📡 Fetching JSON local...');
            const localRaw = await fetchLocalCoordinatorSummaryJson(COORD_SUMMARY_CACHE_VERSION);
            let merged = filterCoordinatorSummaryData(localRaw);

            if (isLocalhostDevHost() && process.env.NEXT_PUBLIC_FIREBASE_ENV) {
                try {
                    const docRef = doc(db, 'app', 'coordinator_summary');
                    const snap = await gatedGetDoc(docRef, 'getCoordinatorSummary');
                    if (snap?.exists()) {
                        const remote = filterCoordinatorSummaryData(
                            snap.data() as Record<string, any>,
                        );
                        merged = { ...remote, ...merged };
                    }
                } catch {
                    /* JSON local manda para sims recientes */
                }
            }

            const simCount = Object.keys(merged).length;
            coordSummaryLog(`[CoordinatorSummary] ✅ JSON local: ${simCount} simulacros`);
            _coordSummaryCache = merged;
            persistSet(versionedKey, merged, 60 * 60 * 1000);
            return merged;
        } catch (e) {
            console.error('[CoordinatorSummary] ❌ Error cargando JSON local:', e);
        }
    }

    // PRODUCCIÓN: Firestore (1 read — gated)
    try {
        coordSummaryLog('[CoordinatorSummary] 📡 Cargando desde Firestore...');
        const docRef = doc(db, 'app', 'coordinator_summary');
        const snap = await gatedGetDoc(docRef, 'getCoordinatorSummary');
        if (snap?.exists()) {
            const data = snap.data() as Record<string, any>;
            const filtered = filterCoordinatorSummaryData(data);
            const simCount = Object.keys(filtered).length;
            coordSummaryLog(`[CoordinatorSummary] ✅ Firestore cargado: ${simCount} simulacros`);
            coordSummaryLog(`[CoordinatorSummary] Simulacros:`, Object.keys(filtered));
            _coordSummaryCache = filtered;
            persistSet(versionedKey, filtered, 60 * 60 * 1000); // TTL 1 hora
            return filtered;
        } else {
            console.warn('[CoordinatorSummary] ⚠️ Documento no existe en Firestore');
        }
    } catch (err) {
        console.error('[CoordinatorSummary] ❌ Error Firestore:', err);
    }

    // Fallback: intentar desde JSON hosting como último recurso
    try {
        coordSummaryLog('[CoordinatorSummary] 📡 Fallback: cargando desde JSON hosting...');
        const data = await fetchLocalCoordinatorSummaryJson(COORD_SUMMARY_CACHE_VERSION);
        const filtered = filterCoordinatorSummaryData(data);
        const simCount = Object.keys(filtered).length;
        coordSummaryLog(`[CoordinatorSummary] ✅ Fallback cargado: ${simCount} simulacros`);
        _coordSummaryCache = filtered;
        return filtered;
    } catch (e) {
        console.error('[CoordinatorSummary] ❌ Error en fallback:', e);
    }

    console.error('[CoordinatorSummary] ❌ No se pudo cargar desde ninguna fuente');
    return {};
}

// ========================================
// National Rankings (Benchmark vs ICFES)
// ========================================

let _nationalRankingsCache: any[] | null = null;

/**
 * Obtiene los rankings nacionales ICFES para benchmark.
 * Prod: 1 read Firestore (~200KB en chunks) con cache 7 días.
 * Local: Lee el CSV desde /data/analysis_results/.
 * Antes: descargaba CSV de 1.2 MB desde hosting cada vez.
 */
export async function getNationalRankings(): Promise<any[]> {
    // 1. Cache en memoria
    if (_nationalRankingsCache) return _nationalRankingsCache;

    // 2. localStorage cache (7 días)
    const lsKey = 'national_rankings_v1';
    try {
        const stored = localStorage.getItem(lsKey);
        if (stored) {
            const { data, ts } = JSON.parse(stored);
            if (Date.now() - ts < 7 * 24 * 60 * 60 * 1000 && Array.isArray(data)) {
                _nationalRankingsCache = data;
                return data;
            }
        }
    } catch { /* ignore */ }

    // 3. Local → CSV desde disco
    if (isLocal) {
        // Devolver vacío, el CSV se lee directo en nationalData.ts
        return [];
    }

    // 4. Producción → Firestore (chunked, ~200KB total)
    try {
        const chunksRef = query(collection(db, 'app', 'national_rankings', 'chunks'));
        const snapshot = await gatedGetDocs(chunksRef, 'getNationalRankings', 5);

        if (snapshot && !snapshot.empty) {
            const allSchools: any[] = [];
            const sortedDocs = snapshot.docs.sort((a, b) => {
                const ad = a.data() as any;
                const bd = b.data() as any;
                return (ad.index ?? 0) - (bd.index ?? 0);
            });
            for (const d of sortedDocs) {
                const dData = d.data() as any;
                const schools = dData.schools || [];
                allSchools.push(...schools);
            }

            _nationalRankingsCache = allSchools;
            try {
                localStorage.setItem(lsKey, JSON.stringify({
                    data: allSchools, ts: Date.now(),
                }));
            } catch { /* localStorage full */ }

            console.log(`[Firestore] National rankings loaded: ${allSchools.length} schools from ${sortedDocs.length} chunks`);
            return allSchools;
        }
    } catch (err) {
        console.warn('[Firestore] getNationalRankings error:', err);
    }

    // 5. Fallback: intentar CSV desde hosting
    try {
        const data = await fetchStaticJSON<any>('analysis_results/rankings_2025_consolidated.csv');
        // Si llega aquí, es texto plano no JSON, así que devolvemos vacío
        return [];
    } catch { /* nada */ }

    return [];
}

// ========================================
// Invalidaciones
// ========================================

export async function getInvalidaciones(simId?: string): Promise<InvalidacionItem[]> {
    const config = await getAppConfig();
    const currentSim = simId || config.activeSimulation;

    if (cache.invalidaciones.has(currentSim)) {
        return cache.invalidaciones.get(currentSim)!;
    }

    if (useLocalStaticSimData()) {
        // LOCAL / dev:staging: JSON estático por simulacro
        try {
            const data = await fetchStaticJSON<any>('invalidaciones.json');
            const normalize = (s: string) => s.replace(/[\s\-]/g, '').toLowerCase();
            const simNorm = normalize(currentSim);
            const items: InvalidacionItem[] = (data.invalidaciones || []).filter((inv: any) => {
                return normalize(inv.simulacro) === simNorm;
            });
            cache.invalidaciones.set(currentSim, items);
            return items;
        } catch {
            cache.invalidaciones.set(currentSim, []);
            return [];
        }
    }

    // PRODUCCIÓN: Firestore (1 read — gated)
    try {
        const docRef = doc(db, 'simulations', currentSim, 'data', 'invalidaciones');
        const snap = await gatedGetDoc(docRef, 'getInvalidaciones');
        if (snap?.exists()) {
            const data = snap.data();
            const items = (data.items || []) as InvalidacionItem[];
            cache.invalidaciones.set(currentSim, items);
            return items;
        }
    } catch (err) {
        console.warn('[Firestore] getInvalidaciones error:', err);
    }

    cache.invalidaciones.set(currentSim, []);
    return [];
}

// ========================================
// Simulation Manifest
// ========================================

export async function getSimulationManifest(simId: string): Promise<SimulationManifest> {
    if (cache.manifests.has(simId)) {
        return cache.manifests.get(simId)!;
    }

    if (useLocalStaticSimData()) {
        // LOCAL / dev:staging: JSON estático por simulacro
        try {
            const data = await fetchStaticJSON<any>(`simulations/${simId}/manifest.json`);
            const manifest: SimulationManifest = {
                id: simId,
                name: data.name,
                date: data.date,
                totalStudents: data.totalStudents,
            };
            cache.manifests.set(simId, manifest);
            return manifest;
        } catch {
            throw new Error(`Manifest not found locally for: ${simId}`);
        }
    }

    // PRODUCCIÓN: Firestore (1 read — gated)
    try {
        const docRef = doc(db, 'simulations', simId);
        const snap = await gatedGetDoc(docRef, 'getSimulationManifest');
        if (snap?.exists()) {
            const data = snap.data();
            const manifest: SimulationManifest = {
                id: simId,
                name: data.name,
                date: data.date,
                totalStudents: data.totalStudents,
            };
            cache.manifests.set(simId, manifest);
            return manifest;
        }
    } catch (err) {
        console.warn('[Firestore] getSimulationManifest error:', err);
    }

    throw new Error(`Manifest not found for simulation: ${simId}`);
}

// ========================================
// Rankings — pre-computado
// ========================================

export async function getRanking(simId?: string): Promise<RankingEntry[]> {
    const config = await getAppConfig();
    const currentSim = simId || config.activeSimulation;

    // Memory cache (siempre activo)
    if (cache.rankings.has(currentSim)) {
        return maskRankingEntriesForDemo(cache.rankings.get(currentSim)!);
    }

    // Persist cache — solo en producción remota (en localhost dev, JSON sin costo)
    const persistKey = `ranking_${currentSim}`;
    if (!useLocalStaticSimData()) {
        const persisted = persistGet<RankingEntry[]>(persistKey);
        if (persisted && persisted.length > 0 && persisted[0]?.puntajes && Object.keys(persisted[0].puntajes).length > 0) {
            cache.rankings.set(currentSim, persisted);
            return maskRankingEntriesForDemo(persisted);
        }
    }

    if (useLocalStaticSimData() && !(await localStudentsJsonTooLarge(currentSim))) {
        // LOCAL: ranking desde students.json (solo si cabe en memoria)
        try {
            const allData = await fetchStaticJSON<any>(`simulations/${currentSim}/students.json`);
            let students: any[] = [];
            if (allData.estudiantes && Array.isArray(allData.estudiantes)) {
                students = allData.estudiantes;
            } else if (allData.students && typeof allData.students === 'object') {
                students = Object.values(allData.students);
            }
            const ietacStudents = isDemoOfflineRoute()
                ? students.filter((s: Estudiante) =>
                      isDemoInstitutionName(s.informacion_personal?.institucion),
                  )
                : students;
            const sorted = [...ietacStudents].sort(
                (a, b) => (b.puntaje_global || 0) - (a.puntaje_global || 0),
            );
            const MATERIAS = ['matemáticas', 'lectura crítica', 'sociales y ciudadanas', 'ciencias naturales', 'inglés'];
            const entries: RankingEntry[] = sorted.map((s, i) => {
                const puntajes: Record<string, number | { puntaje: number; correctas: number; total_preguntas: number }> = {};
                const puntajesRaw = s.puntajes || {};
                
                for (const m of MATERIAS) {
                    const matData = puntajesRaw[m];
                    // 🛡️ FIX #2: Usar función centralizada de normalización
                    puntajes[m] = normalizePuntaje(matData);
                }
                return {
                    nombre: s.informacion_personal?.nombres || '',
                    apellidos: s.informacion_personal?.apellidos || '',
                    institucion: s.informacion_personal?.institucion || '',
                    departamento: String(s.informacion_personal?.departamento || '').trim(),
                    numero_identificacion: String(s.informacion_personal?.numero_identificacion || ''),
                    puntaje_global: s.puntaje_global || 0,
                    posicion: i + 1,
                    puntajes,
                };
            });
            const finalEntries = isDemoOfflineRoute()
                ? entries.map((entry) => {
                      const masked = maskPersonalForDemo({
                          nombres: entry.nombre,
                          apellidos: entry.apellidos,
                          numero_identificacion: entry.numero_identificacion,
                          institucion: entry.institucion,
                      });
                      return {
                          ...entry,
                          nombre: masked.nombres ?? entry.nombre,
                          apellidos: masked.apellidos ?? entry.apellidos,
                          numero_identificacion:
                              masked.numero_identificacion ?? entry.numero_identificacion,
                          institucion: masked.institucion ?? entry.institucion,
                      };
                  })
                : entries;
            cache.rankings.set(currentSim, finalEntries);
            persistSet(persistKey, finalEntries, getSimTTL(currentSim));
            return finalEntries;
        } catch (err) {
            // ponytail: no return [] — caer a Firestore (chunked ranking SG11-24+)
            console.warn('[Local] getRanking JSON falló; usando Firestore:', err);
        }
    }

    // Firestore pre-computado (1 read meta; +N chunks si ranking chunked)
    try {
        const docRef = doc(db, 'simulations', currentSim, 'data', 'ranking');
        const snap = await gatedGetDoc(docRef, 'getRanking');
        if (snap?.exists()) {
            const data = snap.data() as {
                entries?: RankingEntry[];
                chunked?: boolean;
                totalChunks?: number;
                total?: number;
            };
            let entries = (data.entries || []) as RankingEntry[];

            // SG11-24+ (casos grandes): meta.chunked + subcolección chunks
            if (data.chunked === true || (entries.length === 0 && (data.totalChunks || 0) > 0)) {
                const chunksRef = collection(db, 'simulations', currentSim, 'data', 'ranking', 'chunks');
                const estimated = Math.max(1, Number(data.totalChunks) || 3);
                const chunkSnap = await gatedGetDocs(chunksRef, 'getRanking.chunks', estimated);
                if (chunkSnap && !chunkSnap.empty) {
                    const sorted = [...chunkSnap.docs].sort((a, b) => {
                        const ai = Number((a.data() as { index?: number }).index ?? 0);
                        const bi = Number((b.data() as { index?: number }).index ?? 0);
                        return ai - bi;
                    });
                    entries = [];
                    for (const d of sorted) {
                        const part = ((d.data() as { entries?: RankingEntry[] }).entries || []) as RankingEntry[];
                        entries.push(...part);
                    }
                    entries.sort((a, b) => (a.posicion || 0) - (b.posicion || 0));
                    console.log(
                        `[Firestore] Ranking chunked ${currentSim}: ${entries.length} entries / ${sorted.length} chunks`,
                    );
                }
            }

            if (entries.length > 0) {
                cache.rankings.set(currentSim, entries);
                persistSet(persistKey, entries, getSimTTL(currentSim));
            }
            return maskRankingEntriesForDemo(entries);
        }
    } catch (err) {
        console.warn('[Firestore] getRanking error:', err);
    }

    return [];
}

// ========================================
// Pre-Aggregated Stats (estadisticas doc) — Fallback para coordinador
// Fuente: simulations/{simId}/data/estadisticas
// Coste: 1 read, TTL 7 días (misma política que ranking)
// ========================================

export interface PreguntaEstadistica {
    numero: number;
    aciertos: number;
    total_respuestas: number;
    porcentaje_acierto: number;
    respuesta_correcta: string;
    distribucion: Record<string, number>;
    distribucion_counts?: Record<string, number>;
}

export interface SimulacionEstadisticas {
    materias: Record<string, Record<string, PreguntaEstadistica>>;
}

export type InstitutionQuestionStats = Record<
    string,
    Record<
        string,
        Array<{
            num: number;
            failed: number;
            total: number;
            rate: number;
            correct: string;
            counts: Record<string, number>;
        }>
    >
>;

const _estadisticasCache = new Map<string, SimulacionEstadisticas>();
const _institutionQuestionStatsCache = new Map<string, InstitutionQuestionStats>();

function normalizeSimulacionEstadisticas(raw: Record<string, unknown>): SimulacionEstadisticas | null {
    const materiasRaw: Record<string, any> = (raw.materias as Record<string, any>) || {};
    if (Object.keys(materiasRaw).length === 0) return null;

    const materias: Record<string, Record<string, PreguntaEstadistica>> = {};
    for (const [materia, preguntas] of Object.entries(materiasRaw)) {
        materias[materia] = {};
        for (const [key, pregRaw] of Object.entries(preguntas as Record<string, any>)) {
            const p = pregRaw as any;
            const distribucionRaw: Record<string, any> = p.distribucion || {};
            const distribucion: Record<string, number> = {};
            for (const [opt, v] of Object.entries(distribucionRaw)) {
                distribucion[opt] = Number(v) || 0;
            }
            materias[materia][key] = {
                numero: Number(p.numero) || parseInt(key.replace('pregunta_', '')) || 0,
                aciertos: Number(p.aciertos) || 0,
                total_respuestas: Number(p.total_respuestas) || 0,
                porcentaje_acierto: Number(p.porcentaje_acierto) || 0,
                respuesta_correcta: String(p.respuesta_correcta || '?'),
                distribucion,
            };
        }
    }
    return { materias };
}

export async function getSimulationEstadisticas(simId: string): Promise<SimulacionEstadisticas | null> {
    if (_estadisticasCache.has(simId)) {
        return _estadisticasCache.get(simId)!;
    }

    const persistKey = `estadisticas_${simId}`;
    const cached = persistGet<SimulacionEstadisticas>(persistKey);
    if (cached) {
        _estadisticasCache.set(simId, cached);
        return cached;
    }

    try {
        const stats = await getStatistics(simId);
        const result = normalizeSimulacionEstadisticas(stats as unknown as Record<string, unknown>);
        if (result) {
            _estadisticasCache.set(simId, result);
            persistSet(persistKey, result, getSimTTL(simId));
            if (isLocal) {
                console.log(`[getSimulationEstadisticas] Reutilizó getStatistics: ${simId} (${Object.keys(result.materias).length} materias)`);
            }
            return result;
        }
    } catch (err) {
        console.warn('[Firestore] getSimulationEstadisticas error:', err);
    }

    return null;
}

export async function getInstitutionQuestionStats(simId: string): Promise<InstitutionQuestionStats | null> {
    if (_institutionQuestionStatsCache.has(simId)) {
        return _institutionQuestionStatsCache.get(simId)!;
    }

    const persistKey = `institutionQuestionStats_${simId}`;
    const cached = persistGet<InstitutionQuestionStats>(persistKey);
    if (cached && Object.keys(cached).length > 0) {
        _institutionQuestionStatsCache.set(simId, cached);
        return cached;
    }

    if (useLocalStaticSimData()) return null;

    try {
        const docRef = doc(db, 'simulations', simId, 'data', 'institution_question_stats');
        const snap = await gatedGetDoc(docRef, 'getInstitutionQuestionStats');
        if (!snap?.exists()) return null;

        const data = snap.data() as { institutions?: InstitutionQuestionStats };
        const institutions = data.institutions || {};
        if (Object.keys(institutions).length === 0) return null;

        _institutionQuestionStatsCache.set(simId, institutions);
        persistSet(persistKey, institutions, getSimTTL(simId));
        return institutions;
    } catch (err) {
        console.warn('[Firestore] getInstitutionQuestionStats error:', err);
    }

    return null;
}

// ========================================
// All Students — SOLO para admin/local
// NO usar en páginas de estudiante
// ========================================

export async function getAllStudents(simId?: string): Promise<Estudiante[]> {
    const config = await getAppConfig();
    const currentSim = simId || config.activeSimulation;

    // ── 1. Cache en memoria (más rápido, misma sesión) ──
    if (cache.allStudents.has(currentSim)) {
        console.log(`[getAllStudents] ✅ Cache memoria: ${currentSim}`);
        return finalizeAllStudentsList(cache.allStudents.get(currentSim)!);
    }

    // ── 2. Localhost: JSON estático solo si no es monstruo (SG11-24 ~126MB) ──
    if (useLocalStaticSimData() && !(await localStudentsJsonTooLarge(currentSim))) {
        try {
            const allData = await fetchStaticJSON<any>(`simulations/${currentSim}/students.json`);
            let students: Estudiante[] = [];
            if (allData.estudiantes && Array.isArray(allData.estudiantes)) {
                students = allData.estudiantes;
            } else if (allData.students && typeof allData.students === 'object') {
                students = Object.values(allData.students);
            }
            const demoStudents = applyDemoStudentsPrivacy(students);
            cache.allStudents.set(currentSim, demoStudents);
            return demoStudents;
        } catch (err) {
            console.warn('[Local] getAllStudents error:', err);
            // cae a localStorage / Firestore abajo
        }
    } else if (useLocalStaticSimData()) {
        console.log(
            `[getAllStudents] Skip local students.json (${currentSim} demasiado grande) → Firestore chunks`,
        );
    }

    // ── 3. Cache en localStorage (7 días TTL — 0 reads de Firestore) ──
    // Invalida automáticamente si dataVersion o simVersion cambia (checkDataVersion/checkSimVersions).
    const persistKey = `allStudents_${currentSim}`;
    const cached = persistGet<Estudiante[]>(persistKey);
    if (cached && cached.length > 0) {
        console.log(`[getAllStudents] ✅ Cache localStorage: ${currentSim} (${cached.length} estudiantes, 0 reads Firestore)`);
        cache.allStudents.set(currentSim, cached);
        return finalizeAllStudentsList(cached);
    }

    // ── 4. Firestore (solo si no hay cache) ──
    // gatedGetDocs ahora cuenta reads REALES post-query, no estimados.
    // Para un simulacro típico (3-5 chunks), esto consume 1 read de control
    // + (chunks-1) reads reales = 3-5 reads totales, nunca 10 pre-estimados.
    try {
        const chunksRef = collection(db, 'admin_students', currentSim, 'chunks');
        // SG11-24: 3 chunks; margen por sims más grandes
        const snapshot = await gatedGetDocs(chunksRef, 'getAllStudents', 8);
        if (!snapshot) return [];
        const students: Estudiante[] = [];
        snapshot.forEach((docSnap: any) => {
            const data = docSnap.data();
            if (data.estudiantes && Array.isArray(data.estudiantes)) {
                students.push(...data.estudiantes);
            }
        });
        if (students.length > 0) {
            console.log(`[getAllStudents] 🔥 Firestore: ${currentSim} (${students.length} estudiantes, ${snapshot.size} chunks leídos). Guardando en localStorage...`);
            cache.allStudents.set(currentSim, students);
            // Persistir para próximas sesiones (TTL según si el sim está cerrado o activo)
            persistSet(persistKey, students, getSimTTL(currentSim));
            return finalizeAllStudentsList(students);
        }
    } catch (err) {
        console.warn('[Firestore] getAllStudents error:', err);
    }

    return [];
}

// ========================================
// Available Simulations
// ========================================

export async function listAvailableSimulations(): Promise<string[]> {
    const config = await getAppConfig();
    return sortSimulations(config.availableSimulations);
}

// ========================================
// Detect simulations for a student
// ========================================

function normalizeDemoStudentSimList(studentId: string, sims: string[]): string[] {
    if (!isDemoStudentContext() || String(studentId).trim() !== DEMO_STUDENT_ID) {
        return sortSimulations(sims);
    }
    if (isDemoFirebaseRoute()) {
        return sortSimulations(sims);
    }
    return sortSimulations(sims.filter((simId) => isAllowedDemoStudentSim(simId)));
}

async function getStudentSimulationsFromFirestore(
    studentId: string,
    allowedSimulations: string[],
): Promise<string[]> {
    const available: string[] = [];
    const allowed = new Set(allowedSimulations.map(normalizeSimulationId));

    try {
        const resultsRef = collection(db, 'students', studentId, 'results');
        const snapshot = await gatedGetDocs(
            query(resultsRef),
            'getStudentSimulations.list',
            12
        );
        if (snapshot === null) {
            console.warn('[getStudentSimulations] Lectura bloqueada por presupuesto');
        } else {
            const fromFirestore = snapshot.docs.map(d => normalizeSimulationId(d.id));
            for (const simId of fromFirestore) {
                if (allowed.has(simId)) available.push(simId);
            }
        }
    } catch (err) {
        console.warn('[getStudentSimulations] Error listando results:', err);
    }

    // Fallback: manifest `simulacros` en students/{id}.
    // Cubre reglas que permiten perfil pero no list de subcolección.
    if (available.length === 0) {
        try {
            const studentRef = doc(db, 'students', studentId);
            const snap = await gatedGetDoc(studentRef, 'getStudentSimulations.profileManifest');
            if (snap?.exists()) {
                const data = snap.data();
                if (Array.isArray(data.simulacros) && data.simulacros.length > 0) {
                    for (const simId of data.simulacros) {
                        const norm = normalizeSimulationId(String(simId));
                        if (allowed.has(norm)) available.push(norm);
                    }
                    if (available.length > 0) {
                        console.log(
                            `[OPT-3b] Simulacros desde perfil Firestore (${available.length}): ${available.join(', ')}`
                        );
                    }
                }
            }
        } catch (err) {
            console.warn('[getStudentSimulations] Fallback manifest error:', err);
        }
    }

    return sortSimulations(available);
}

export async function getStudentSimulations(studentId: string): Promise<string[]> {
    // ── Memory cache ──
    const cacheKey = `sims_${studentId}`;
    const memCached = cache.studentResults.has(cacheKey + '_simList');
    if (!useLocalStaticSimData() && memCached) {
        if (isDemoStudentContext() && isDemoFirebaseRoute()) {
            cache.studentResults.delete(cacheKey + '_simList');
        } else {
        return await applyStudentFacingSimFilter(
            studentId,
            (cache as any)._simLists?.get(studentId) || [],
        );
        }
    }

    // ── localStorage cache (12h TTL) ──
    const persistKey = `studentSims_${studentId}`;
    const persisted = persistGet<string[]>(persistKey);
    if (persisted && !useLocalStaticSimData()) {
        if (isDemoStudentContext() && isDemoFirebaseRoute()) {
            persistSet(persistKey, null as unknown as string[], 0);
        } else {
        const normalized = await applyStudentFacingSimFilter(studentId, persisted);
        if (!(cache as any)._simLists) (cache as any)._simLists = new Map<string, string[]>();
        (cache as any)._simLists.set(studentId, normalized);
        cache.studentResults.set(cacheKey + '_simList', {} as any); // flag de "ya cacheado"
        if (normalized.length !== persisted.length) {
            cacheStudentSimList(studentId, normalized);
        }
        return normalized;
        }
    }

    // ── OPT-3: Manifest desde perfil del estudiante (0 reads adicionales) ──
    // Si el perfil ya está en cache y tiene el campo `simulacros`,
    // usarlo directamente sin consultar N documentos individuales.
    const profileManifest = _getSimulacrosFromProfile(studentId);
    if (!useLocalStaticSimData() && profileManifest && profileManifest.length > 0) {
        console.log(`[OPT-3] Simulacros obtenidos del perfil (0 reads): ${profileManifest.join(', ')}`);
        const visibleManifest = await applyStudentFacingSimFilter(
            studentId,
            await filterVisibleSimulations(profileManifest),
        );
        if (!(cache as any)._simLists) (cache as any)._simLists = new Map<string, string[]>();
        (cache as any)._simLists.set(studentId, visibleManifest);
        cache.studentResults.set(cacheKey + '_simList', {} as any);
        cacheStudentSimList(studentId, visibleManifest);
        return visibleManifest;
    }

    const config = await getAppConfig();
    const catalog = await resolveStudentSimCatalog(config);
    const available: string[] = [];

    if (useLocalStaticSimData()) {
        try {
            await waitForAuth();
        } catch {
            /* sin auth real: usar fallback estático local */
        }

        if (isRealAuthUser(auth.currentUser)) {
            available.push(
                ...(await getStudentSimulationsFromFirestore(studentId, catalog)),
            );
        }

        available.push(...(await scanStudentSimsFromStaticJson(studentId, catalog)));

        if (
            isDemoStudentContext() &&
            !isDemoFirebaseRoute() &&
            String(studentId).trim() === DEMO_STUDENT_ID
        ) {
            const demoSims = sortSimulations(
                available.filter((simId) => isAllowedDemoStudentSim(simId)),
            );
            if (!(cache as any)._simLists) (cache as any)._simLists = new Map<string, string[]>();
            (cache as any)._simLists.set(studentId, demoSims);
            cache.studentResults.set(cacheKey + '_simList', {} as any);
            cacheStudentSimList(studentId, demoSims);
            return demoSims;
        }

        const visibleLocal = await applyStudentFacingSimFilter(
            studentId,
            sortSimulations([...new Set(available.map(normalizeSimulationId))]),
        );
        if (!(cache as any)._simLists) (cache as any)._simLists = new Map<string, string[]>();
        (cache as any)._simLists.set(studentId, visibleLocal);
        cache.studentResults.set(cacheKey + '_simList', {} as any);
        cacheStudentSimList(studentId, visibleLocal);
        return visibleLocal;
    }

    available.push(...await getStudentSimulationsFromFirestore(
        studentId,
        config.availableSimulations,
    ));

    const visible = await applyStudentFacingSimFilter(
        studentId,
        await filterVisibleSimulations(sortSimulations(available)),
    );
    cacheStudentSimList(studentId, visible);
    return visible;
}

/**
 * OPT-3: Busca simulacros en el perfil cacheado del estudiante.
 * El campo `simulacros` se pre-calcula y almacena en Firestore students/{id}
 * durante el upload de datos. Si existe, elimina N reads por sesión.
 *
 * @returns string[] | null — null si el campo no existe (fallback al método actual)
 */
function _getSimulacrosFromProfile(studentId: string): string[] | null {
    // Buscar en memory cache de perfiles
    for (const [, profile] of cache.studentProfiles) {
        if (profile.id === studentId && Array.isArray(profile.simulacros)) {
            return profile.simulacros;
        }
    }

    // Buscar en localStorage cache de perfiles
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`${CACHE_VERSION}_profile_`)) {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    const profile = parsed.data as StudentProfile;
                    if (profile && profile.id === studentId && Array.isArray(profile.simulacros)) {
                        return profile.simulacros;
                    }
                }
            }
        }
    } catch { /* ignore */ }

    // También buscar en el cache multi-profiles de getStudentsByEmail
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`${CACHE_VERSION}_multi_profiles_`)) {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const parsed = JSON.parse(raw) as { profiles: StudentProfile[] };
                    const match = parsed.profiles?.find(p => p.id === studentId);
                    if (match && Array.isArray(match.simulacros)) {
                        return match.simulacros;
                    }
                }
            }
        }
    } catch { /* ignore */ }

    return null;
}

const STUDENT_SIMS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Memoria + localStorage (también en `next dev`) para restaurar lista tras F5. */
export function cacheStudentSimList(studentId: string, sims: string[]): string[] {
    const normalized = sortSimulations(
        filterStudentHiddenSimulations(sims, readStudentHiddenFromCachedConfig()),
    );
    const persistKey = `studentSims_${studentId}`;
    const cacheKey = `sims_${studentId}`;

    if (!(cache as any)._simLists) (cache as any)._simLists = new Map<string, string[]>();
    (cache as any)._simLists.set(studentId, normalized);
    cache.studentResults.set(cacheKey + '_simList', {} as any);
    persistSet(persistKey, normalized);

    try {
        localStorage.setItem(
            `${CACHE_VERSION}_${persistKey}`,
            JSON.stringify({ data: normalized, ts: Date.now(), ttl: STUDENT_SIMS_TTL_MS }),
        );
    } catch {
        /* ignore quota */
    }
    return normalized;
}

/** Lectura síncrona para restore de UI (bootstrap / layout) antes de Firestore. */
export function readCachedStudentSimList(studentId: string): string[] {
    if (useLocalStaticSimData() && process.env.NODE_ENV === 'development' && !isDemoStudentContext()) {
        return [];
    }

    const hidden = readStudentHiddenFromCachedConfig();
    const finalize = (sims: string[]) =>
        sortSimulations(
            filterStudentHiddenSimulations(
                normalizeDemoStudentSimList(studentId, sims),
                hidden,
            ),
        );

    if ((cache as any)._simLists?.has(studentId)) {
        return finalize((cache as any)._simLists.get(studentId) as string[]);
    }

    try {
        const raw = localStorage.getItem(`${CACHE_VERSION}_studentSims_${studentId}`);
        if (raw) {
            const parsed = JSON.parse(raw) as { data?: string[]; ts?: number; ttl?: number };
            const ttl = parsed.ttl || STUDENT_SIMS_TTL_MS;
            if (parsed.ts && Date.now() - parsed.ts > ttl) {
                localStorage.removeItem(`${CACHE_VERSION}_studentSims_${studentId}`);
            } else if (Array.isArray(parsed.data)) {
                return finalize(parsed.data);
            }
        }
    } catch {
        /* ignore */
    }

    const profileSims = _getSimulacrosFromProfile(studentId);
    if (profileSims) return finalize(profileSims);

    const persisted = persistGet<string[]>(`studentSims_${studentId}`);
    if (persisted) return finalize(persisted);

    return [];
}

/**
 * Tras login directo (doc + fecha), deja lista de simulacros en cache antes de ir al dashboard.
 * Evita carrera con prefetch y el falso "sin resultados" cuando no hay sesión Firebase aún.
 */
export function seedDirectLoginStudentCache(student: StudentProfile): void {
    if (!student?.id) return;

    const email = (student.email || `direct:${student.id}`).toLowerCase().trim();
    const profile: StudentProfile = { ...student, email };
    cache.studentProfiles.set(email, profile);
    persistSet(`profile_${email}`, profile);

    try {
        localStorage.setItem(
            `${CACHE_VERSION}_profile_${email}`,
            JSON.stringify({ data: profile, ts: Date.now(), ttl: STUDENT_SIMS_TTL_MS }),
        );
    } catch {
        /* ignore */
    }

    if (Array.isArray(student.simulacros)) {
        cacheStudentSimList(student.id, student.simulacros);
    }
}

// ========================================
// OPT-7: Prefetch Inteligente — Carga anticipada de datos
// ========================================
// Cuando un estudiante inicia sesión, precarga TODOS sus datos
// en paralelo en lugar de esperar navegación lazy.
// Resultado: primera carga ~2-3s, luego navegación instantánea.
// ========================================

const _prefetchState = {
    inFlight: false,
    completedFor: null as string | null,
};

/**
 * Precarga datos del estudiante SOLO para sus propias simulaciones.
 * Llamar DESPUÉS de login exitoso (una sola vez por sesión).
 *
 * CRÍTICO: `studentSimulations` debe ser la lista de simulacros del
 * estudiante (obtenida de getStudentSimulations), NO config.availableSimulations.
 * Iterar todos los simulacros disponibles causaría explosión de reads.
 *
 * Estrategia de carga:
 *  - Resultados:   para cada sim del estudiante (N reads)
 *  - Estadísticas: para cada sim del estudiante (N reads)
 *  - Ranking:      SOLO para el simulacro más reciente (1 read)
 *    → Los rankings históricos se cargan on-demand al cambiar de sim.
 *
 * Ejemplo: estudiante con 3 de 14 simulacros disponibles
 *  - Antes (bug): 14×3 = 42 reads para TODOS los sims
 *  - Ahora (fix):  3×2 + 1 = 7 reads solo para los suyos
 *  - Segunda visita: 0 reads (todo servido desde cache)
 */
export async function prefetchStudentData(
    studentId: string,
    studentSimulations?: string[],  // ← lista real del estudiante (no todos los disponibles)
): Promise<void> {
    // Evitar prefetch duplicado
    if (_prefetchState.inFlight || _prefetchState.completedFor === studentId) {
        return;
    }
    _prefetchState.inFlight = true;

    try {
        const config = await getAppConfig();

        // 🛡️ IMPORTANTE: usar solo los simulacros DEL estudiante.
        // Si no se proporcionan, intentar obtenerlos del perfil (0 reads).
        // NO caer en config.availableSimulations — eso carga datos de todos.
        let simulations: string[] = studentSimulations || [];
        if (simulations.length === 0) {
            const profileSims = _getSimulacrosFromProfile(studentId);
            simulations = profileSims || [];
        }
        if (simulations.length === 0) {
            // Sin lista de sims propias → no podemos prefetch de forma segura
            console.log(`[Prefetch] ⚠️ Sin lista de simulacros para ${studentId} — skip para evitar reads innecesarios.`);
            return;
        }

        // El simulacro más reciente (último en orden cronológico) es el que
        // el estudiante verá primero → prioritario para ranking.
        const activeSim = sortSimulations(simulations).at(-1) || config.activeSimulation;

        console.log(`%c[Prefetch] 🚀 Precargando datos para ${studentId} (${simulations.length} de sus simulacros, ranking solo ${activeSim})`,
            'color: #fff; background: #7c3aed; padding: 2px 8px; border-radius: 4px;');

        const startTime = Date.now();

        // Cargar en paralelo: resultados + estadísticas por simulación del estudiante.
        // Rankings solo para el simulacro activo (el resto se cargan on-demand).
        const promises: Promise<any>[] = [];

        for (const simId of simulations) {
            const resultKey = studentResultCacheKey(studentId, simId);
            if (!cache.studentResults.has(resultKey) && !persistGet(resultKey)) {
                promises.push(
                    getStudentResults(studentId, simId).catch(() => null)
                );
            }

            // Estadísticas del simulacro (compartido, 1 read por sim)
            if (!cache.statistics.has(simId) && !persistGet(`stats_${simId}`)) {
                promises.push(
                    getStatistics(simId).catch(() => null)
                );
            }

            // Ranking: SOLO para el sim más reciente (donde el estudiante verá su posición).
            // Los rankings de simulacros históricos se cargan on-demand al navegar a ellos.
            if (simId === activeSim && !cache.rankings.has(simId) && !persistGet(`ranking_${simId}`)) {
                promises.push(
                    getRanking(simId).catch(() => null)
                );
            }
        }

        if (promises.length > 0) {
            await Promise.allSettled(promises);
            const elapsed = Date.now() - startTime;
            console.log(`%c[Prefetch] ✅ Completado en ${elapsed}ms — ${promises.length} recursos cargados. Navegación será instantánea.`,
                'color: #fff; background: #16a34a; padding: 2px 8px; border-radius: 4px;');
        } else {
            console.log(`[Prefetch] 📦 Todo ya está en cache — 0 reads necesarios.`);
        }

        _prefetchState.completedFor = studentId;
    } catch (err) {
        console.warn('[Prefetch] Error (no crítico):', err);
    } finally {
        _prefetchState.inFlight = false;
    }
}

/**
 * Warmup de cache para coordinadores.
 * Precarga datos que el coordinador va a necesitar:
 *  1. AppConfig
 *  2. Estadísticas del simulacro activo
 *  3. Rankings del simulacro activo
 *  4. National rankings (benchmark)
 * 
 * NO precarga getAllStudents (demasiado pesado, se carga on-demand).
 */
export async function warmupCoordinatorCache(): Promise<void> {
    try {
        console.log(`%c[Warmup] 🔄 Precargando datos para coordinador...`,
            'color: #fff; background: #0284c7; padding: 2px 8px; border-radius: 4px;');

        const config = await getAppConfig();
        const activeSim = config.activeSimulation;

        const promises: Promise<any>[] = [];

        // Estadísticas y rankings del simulacro activo
        if (!cache.statistics.has(activeSim)) {
            promises.push(getStatistics(activeSim).catch(() => null));
        }
        if (!cache.rankings.has(activeSim)) {
            promises.push(getRanking(activeSim).catch(() => null));
        }
        // National rankings (benchmark)
        if (!_nationalRankingsCache) {
            promises.push(getNationalRankings().catch(() => null));
        }

        if (promises.length > 0) {
            await Promise.allSettled(promises);
            console.log(`[Warmup] ✅ Coordinador cache listo (${promises.length} recursos)`);
        }
    } catch (err) {
        console.warn('[Warmup] Error (no crítico):', err);
    }
}

// ========================================
// Planner personalization (hybrid local + cloud)
// ========================================

function plannerPersistKey(studentId: string, simId: string): string {
    return `${plannerBaseKey(studentId, simId)}_merged`;
}

function plannerGlobalDocRef(studentId: string) {
    return doc(db, 'students', studentId, 'plannerProfile', 'global');
}

function plannerSimulationDocRef(studentId: string, simId: string) {
    const normalizedSim = normalizeSimulationId(simId);
    return doc(db, 'students', studentId, 'plannerProfile', `sim_${normalizedSim}`);
}

function plannerQuotaDocRef(studentId: string, dateKey: string) {
    return doc(db, 'students', studentId, 'plannerQuota', dateKey);
}

export async function getPlannerCustomization(
    studentId: string,
    simId: string
): Promise<PlannerMergedProfile> {
    const local = persistGet<PlannerMergedProfile>(plannerPersistKey(studentId, simId));
    let globalProfile: PlannerGlobalProfile | null = null;
    let simulationProfile: PlannerSimulationOverride | null = null;
    let cloudUpdatedAt = 0;
    let cloudReadFailed = false;

    if (!isLocal) {
        try {
            const [globalSnap, simSnap] = await Promise.all([
                gatedGetDoc(plannerGlobalDocRef(studentId), 'getPlannerCustomization'),
                gatedGetDoc(plannerSimulationDocRef(studentId, simId), 'getPlannerCustomization')
            ]);
            if (globalSnap && globalSnap.exists()) {
                globalProfile = globalSnap.data() as PlannerGlobalProfile;
            }
            if (simSnap && simSnap.exists()) {
                simulationProfile = simSnap.data() as PlannerSimulationOverride;
            }
            cloudUpdatedAt = Math.max(
                Number(globalProfile?.updatedAt || 0),
                Number(simulationProfile?.updatedAt || 0)
            );
        } catch (err) {
            cloudReadFailed = true;
            console.warn('[Planner] getPlannerCustomization cloud read failed:', err);
        }
    }
    // LEADS-first: sólo usamos cache local cuando hay fallo de lectura cloud o entorno local.
    if (isLocal || cloudReadFailed) {
        globalProfile = globalProfile || local?.global || null;
        simulationProfile = simulationProfile || local?.simulation || null;
        cloudUpdatedAt = Math.max(
            cloudUpdatedAt,
            Number(local?.cloudUpdatedAt || 0),
            Number(globalProfile?.updatedAt || 0),
            Number(simulationProfile?.updatedAt || 0)
        );
    }

    const merged = mergePlannerProfiles(globalProfile, simulationProfile);
    const result: PlannerMergedProfile = {
        global: globalProfile,
        simulation: simulationProfile,
        merged,
        cloudUpdatedAt
    };
    persistSet(plannerPersistKey(studentId, simId), result, CACHE_TTL_LONG);
    return result;
}

export function savePlannerCustomizationLocal(
    studentId: string,
    simId: string,
    payload: PlannerCustomizationPayload,
    scope: 'global' | 'simulation'
): PlannerMergedProfile {
    const cached = persistGet<PlannerMergedProfile>(plannerPersistKey(studentId, simId));
    const nowPayload: PlannerCustomizationPayload = {
        ...payload,
        source: 'local',
        updatedAt: Date.now()
    };
    const globalProfile = scope === 'global'
        ? ({ ...nowPayload, studentId } as PlannerGlobalProfile)
        : (cached?.global || null);
    const simulationProfile = scope === 'simulation'
        ? ({ ...nowPayload, studentId, simulationId: normalizeSimulationId(simId) } as PlannerSimulationOverride)
        : (cached?.simulation || null);
    const merged = mergePlannerProfiles(globalProfile, simulationProfile);
    const result: PlannerMergedProfile = {
        global: globalProfile,
        simulation: simulationProfile,
        merged,
        cloudUpdatedAt: Number(cached?.cloudUpdatedAt || 0)
    };
    persistSet(plannerPersistKey(studentId, simId), result, CACHE_TTL_LONG);
    return result;
}

export async function getPlannerUploadQuota(studentId: string): Promise<PlannerQuotaState> {
    const dateKey = getColombiaDateKey();
    if (isLocal) {
        return {
            dateKey,
            uploadsUsed: 0,
            uploadsLimit: PLANNER_UPLOAD_LIMIT_PER_DAY,
            remaining: PLANNER_UPLOAD_LIMIT_PER_DAY
        };
    }
    try {
        const snap = await gatedGetDoc(plannerQuotaDocRef(studentId, dateKey), 'getPlannerUploadQuota');
        const uploadsUsed = snap && snap.exists() ? Number(snap.data()?.uploadsUsed || 0) : 0;
        const remaining = Math.max(0, PLANNER_UPLOAD_LIMIT_PER_DAY - uploadsUsed);
        return { dateKey, uploadsUsed, uploadsLimit: PLANNER_UPLOAD_LIMIT_PER_DAY, remaining };
    } catch {
        return { dateKey, uploadsUsed: 0, uploadsLimit: PLANNER_UPLOAD_LIMIT_PER_DAY, remaining: PLANNER_UPLOAD_LIMIT_PER_DAY };
    }
}

export async function uploadPlannerCustomization(
    studentId: string,
    simId: string,
    payload: PlannerCustomizationPayload,
    scope: 'global' | 'simulation'
): Promise<{ ok: boolean; quota: PlannerQuotaState; reason?: string }> {
    const dateKey = getColombiaDateKey();
    if (isLocal) {
        return {
            ok: true,
            quota: {
                dateKey,
                uploadsUsed: 0,
                uploadsLimit: PLANNER_UPLOAD_LIMIT_PER_DAY,
                remaining: PLANNER_UPLOAD_LIMIT_PER_DAY
            }
        };
    }
    await waitForAuth();
    try {
        const quotaRef = plannerQuotaDocRef(studentId, dateKey);
        const targetRef = scope === 'global'
            ? plannerGlobalDocRef(studentId)
            : plannerSimulationDocRef(studentId, simId);
        const normalizeForCompare = (obj: Record<string, unknown> | null | undefined) => {
            if (!obj) return '{}';
            const entries = Object.entries(obj)
                .filter(([k]) => !['updatedAt', 'source', 'studentId', 'simulationId'].includes(k))
                .sort(([a], [b]) => a.localeCompare(b));
            return JSON.stringify(Object.fromEntries(entries));
        };

        const txResult = await runTransaction(db, async (tx) => {
            const targetSnap = await tx.get(targetRef);
            const quotaSnap = await tx.get(quotaRef);
            const used = quotaSnap.exists() ? Number(quotaSnap.data()?.uploadsUsed || 0) : 0;
            if (used >= PLANNER_UPLOAD_LIMIT_PER_DAY) {
                return { ok: false as const, used };
            }
            const normalizedPayload = {
                ...payload,
                source: 'cloud' as const,
                updatedAt: Date.now()
            };
            const incomingComparable = normalizeForCompare(normalizedPayload as unknown as Record<string, unknown>);
            const existingComparable = normalizeForCompare(
                (targetSnap.exists() ? (targetSnap.data() as Record<string, unknown>) : null)
            );
            if (targetSnap.exists() && incomingComparable === existingComparable) {
                return { ok: true as const, used, skipped: true as const };
            }
            const nextUsed = used + 1;
            tx.set(targetRef, {
                ...normalizedPayload,
                studentId,
                simulationId: normalizeSimulationId(simId)
            }, { merge: true });
            tx.set(quotaRef, {
                uploadsUsed: nextUsed,
                uploadsLimit: PLANNER_UPLOAD_LIMIT_PER_DAY,
                updatedAt: Date.now()
            }, { merge: true });
            return { ok: true as const, used: nextUsed, skipped: false as const };
        });

        const quota: PlannerQuotaState = {
            dateKey,
            uploadsUsed: txResult.used,
            uploadsLimit: PLANNER_UPLOAD_LIMIT_PER_DAY,
            remaining: Math.max(0, PLANNER_UPLOAD_LIMIT_PER_DAY - txResult.used)
        };
        if (!txResult.ok) {
            return { ok: false, quota, reason: 'quota_exceeded' };
        }
        if ('skipped' in txResult && txResult.skipped) {
            return { ok: true, quota, reason: 'no_changes' };
        }
        return { ok: true, quota };
    } catch (err) {
        console.warn('[Planner] upload failed:', err);
        const quota = await getPlannerUploadQuota(studentId);
        return { ok: false, quota, reason: 'upload_failed' };
    }
}

// ========================================
// OPT-8: Exportar estado de cache para monitoring
// ========================================

/**
 * Retorna un resumen del estado actual del cache.
 * Útil para debugging y para el panel admin.
 */
export function getCacheStatus(): {
    memory: Record<string, number>;
    budget: ReturnType<typeof READ_BUDGET.getStatus>;
    daily: ReturnType<typeof DAILY_BUDGET.getStatus>;
    prefetch: { inFlight: boolean; completedFor: string | null };
} {
    return {
        memory: {
            studentProfiles: cache.studentProfiles.size,
            studentResults: cache.studentResults.size,
            allStudents: cache.allStudents.size,
            statistics: cache.statistics.size,
            rankings: cache.rankings.size,
            invalidaciones: cache.invalidaciones.size,
            manifests: cache.manifests.size,
        },
        budget: READ_BUDGET.getStatus(),
        daily: DAILY_BUDGET.getStatus(),
        prefetch: { ..._prefetchState },
    };
}

// ========================================
// Cache Management
// ========================================

export function clearCache(): void {
    cache.appConfig = undefined;
    cache.studentProfiles.clear();
    cache.studentResults.clear();
    cache.allStudents.clear();
    cache.statistics.clear();
    cache.invalidaciones.clear();
    cache.rankings.clear();
    cache.manifests.clear();
    _prefetchState.completedFor = null;
    persistClear();
}
