import type { Estudiante } from '@shared/types';
import type { InstitutionMetrics } from '@features/coordinador/hooks/coordinadorTypes';
import { normalizePuntaje } from '@features/simulacro/lib/firestoreService';
import { buildScoreDistribution } from '@features/coordinador/lib/globalScoreStats';
import {
  COORD_STORAGE_KEYS,
  DEMO_COORDINADOR_DATA_OPTIONS,
  type CoordinadorDataOptions,
} from '@features/coordinador/hooks/coordinadorDataOptions';
import { isDemoCoordinadorRoute } from '@/app/demo/_shared/demoRoutePaths';
import { normalizeAnswerOption } from '@features/coordinador/lib/answerOptions';
import {
  canonicalInstitutionName,
  dedupeInstitutionKeysPreferCanonical,
  institutionsMatch,
} from '@shared/lib/institucionesAcondicionamiento';

export function distribucionToCounts(
    dist: Record<string, unknown> | undefined,
    totalRespuestas: number,
): Record<string, number> {
    const counts: Record<string, number> = {};
    if (!dist || totalRespuestas <= 0) return counts;
    const rawVals = Object.values(dist).map((v) => Number(v) || 0);
    const distSum = rawVals.reduce((s, v) => s + v, 0);
    const distEsPorcentaje =
        distSum > 0 && distSum <= 110 && Object.keys(dist).length >= 2;
    Object.entries(dist).forEach(([opt, val]) => {
        const n = Number(val) || 0;
        const key = normalizeAnswerOption(opt);
        counts[key] = (counts[key] || 0) + (distEsPorcentaje
            ? Math.round((n / 100) * totalRespuestas)
            : Math.round(n));
    });
    return counts;
}

export function normalizeCountsRecord(counts: Record<string, unknown> | undefined): Record<string, number> {
    const normalized: Record<string, number> = {};
    if (!counts) return normalized;

    Object.entries(counts).forEach(([opt, val]) => {
        const key = normalizeAnswerOption(opt);
        normalized[key] = (normalized[key] || 0) + (Number(val) || 0);
    });

    return normalized;
}

export const mean = (nums: number[]) =>
    nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;

export const median = (nums: number[]) => {
    if (nums.length === 0) return 0;
    const s = [...nums].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 !== 0 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export const stddev = (nums: number[]) => {
    if (nums.length <= 1) return 0;
    const m = mean(nums);
    return Math.sqrt(nums.reduce((s, n) => s + (n - m) ** 2, 0) / nums.length);
};

export const mode = (nums: number[]) => {
    if (nums.length === 0) return 0;
    const c: Record<number, number> = {};
    let best = nums[0];
    let max = 0;
    nums.forEach((n) => {
        c[n] = (c[n] || 0) + 1;
        if (c[n] > max) {
            max = c[n];
            best = n;
        }
    });
    return best;
};

export const clasificarNivel = (p: number) => {
    if (p >= 400) return 'Superior';
    if (p >= 325) return 'Alto';
    if (p >= 250) return 'Medio';
    return 'Bajo';
};

export const COORD_AREAS = [
    { name: 'Matemáticas', key: 'matemáticas' },
    { name: 'Lectura Crítica', key: 'lectura crítica' },
    { name: 'Sociales', key: 'sociales y ciudadanas' },
    { name: 'Ciencias', key: 'ciencias naturales' },
    { name: 'Inglés', key: 'inglés' },
] as const;

export const normalizeText = (s: string) =>
    String(s || '')
        .toUpperCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

export const hasDetailedAnswers = (student: Estudiante): boolean => {
    const rd = student.respuestas_detalladas as Record<string, unknown> | undefined;
    if (!rd || typeof rd !== 'object') return false;
    return Object.values(rd).some(
        (v) =>
            (Array.isArray(v) && v.length > 0) ||
            (v && typeof v === 'object' && Object.keys(v as object).length > 0),
    );
};

/** Enriquece respuestas_detalladas desde answerDetails cuando los chunks son slim.
 * Con TODAS / sin institución: no hidratar (Path B usa institution_question_stats).
 * Evita N lecturas Firestore que dejan el panel colgado en loading.
 */
export async function hydrateCoordinatorStudents(
    students: Estudiante[],
    simId: string,
    selectedInstitution: string,
    enrich: (student: Estudiante, simId: string) => Promise<Estudiante>,
    concurrency = 8,
): Promise<Estudiante[]> {
    if (students.length === 0) return students;
    const selectedKey = normalizeText(selectedInstitution);
    const loadAll = selectedKey === 'TODAS' || selectedKey === '*' || !selectedKey;
    // Resumen global: scores ya vienen en chunks/ranking. Detalle → loadFullStudents.
    if (loadAll) return students;
    const shouldHydrate = (student: Estudiante) => {
        if (hasDetailedAnswers(student)) return false;
        return institutionsMatch(
            student.informacion_personal?.institucion || '',
            selectedInstitution,
        );
    };
    if (!students.some(shouldHydrate)) return students;
    return mapWithConcurrency(students, concurrency, async (student) =>
        shouldHydrate(student) ? enrich(student, simId) : student,
    );
};

export async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
    const results = new Array<R>(items.length);
    let next = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (next < items.length) {
            const index = next++;
            results[index] = await mapper(items[index], index);
        }
    });
    await Promise.all(workers);
    return results;
}

export function filterSummaryForDemo(
    summaryData: Record<string, unknown> | null,
    allowedIds?: readonly string[],
): Record<string, unknown> | null {
    if (!summaryData || !allowedIds?.length) return summaryData;
    const allow = new Set(allowedIds);
    return Object.fromEntries(
        Object.entries(summaryData).filter(([simId]) => allow.has(simId)),
    );
}

export function filterSimsForDemo(sims: string[], allowedIds?: readonly string[]): string[] {
    if (!allowedIds?.length) return sims;
    const allow = new Set(allowedIds);
    const filtered = sims.filter((id) => allow.has(id));
    return filtered.length > 0 ? filtered : [...allowedIds];
}

export function resolveCoordinadorDataOptions(
    pathname: string | null,
    options: CoordinadorDataOptions,
): CoordinadorDataOptions {
    if (!isDemoCoordinadorRoute(pathname)) {
        return options;
    }
    return {
        ...DEMO_COORDINADOR_DATA_OPTIONS,
        ...options,
        storageKeys: {
            ...COORD_STORAGE_KEYS,
            ...DEMO_COORDINADOR_DATA_OPTIONS.storageKeys,
            ...options.storageKeys,
        },
        allowedSimulationIds:
            options.allowedSimulationIds ?? DEMO_COORDINADOR_DATA_OPTIONS.allowedSimulationIds,
    };
}

/** ¿La institución aparece en el índice del summary? (aliases catálogo ≡ canónico). */
export function simulationHasInstitutionInSummary(
    summary: Record<string, { institutions?: Record<string, unknown> }> | null | undefined,
    simId: string,
    institutionName: string,
): boolean {
    const simData = summary?.[simId];
    if (!simData?.institutions || !institutionName) return false;
    return Object.keys(simData.institutions).some((k) => institutionsMatch(k, institutionName));
}

/** SG11-17 → SG11-16 (misma convención de IDs). */
export function inferPreviousSimulationId(simId: string): string {
    const m = String(simId || '').trim().match(/^(.*-)(\d+)([A-Z]*)$/i);
    if (!m) return '';
    const prefix = m[1];
    const n = parseInt(m[2] || '0', 10);
    if (!Number.isFinite(n) || n <= 0) return '';
    const suffix = (m[3] || '').toUpperCase();
    const prev = Math.max(0, n - 1);
    const pad = m[2].length;
    const prevStr = String(prev).padStart(pad, '0');
    return `${prefix}${prevStr}${suffix}`;
}

/**
 * Simulacro anterior para comparativa de ciclo (inicio vs cierre).
 * Prefiere el ítem previo en la lista; solo infiere numéricamente si ese ID está en availableSimulations.
 */
export function resolvePreviousSimulationId(
    currentSimulation: string,
    availableSimulations: string[],
): string {
    const sims = availableSimulations || [];
    const idx = sims.indexOf(currentSimulation);
    if (idx > 0) return sims[idx - 1]!;
    const inferred = inferPreviousSimulationId(currentSimulation);
    if (inferred && sims.includes(inferred)) return inferred;
    return '';
}

export function crossFilteredSimulationsForInstitution(
    summary: Record<string, { institutions?: Record<string, unknown> }> | null | undefined,
    availableSimulations: string[],
    selectedInstitution: string,
    /** Sims confirmados vía ranking cuando el summary está desactualizado (p. ej. SG11-18 recién subido). */
    rankingConfirmedSimIds: string[] = [],
): string[] {
    if (!summary) return availableSimulations;
    const instKey = selectedInstitution.toUpperCase().trim();
    if (instKey === 'TODAS' || instKey === '*' || !instKey) {
        return availableSimulations;
    }
    const confirmed = new Set(rankingConfirmedSimIds);
    const matched = availableSimulations.filter((simId) => {
        if (confirmed.has(simId)) return true;
        return simulationHasInstitutionInSummary(summary, simId, selectedInstitution);
    });
    return matched.length > 0 ? matched : availableSimulations;
}

export function institutionMatchesScope(institutionName: string, allowed: readonly string[]): boolean {
    if (allowed.length === 0) return true;
    return allowed.some((allowedName) => institutionsMatch(institutionName, allowedName));
}

export function filterInstitutionKeys(keys: string[], allowed: readonly string[]): string[] {
    if (allowed.length === 0) return keys;
    return keys.filter((key) => institutionMatchesScope(key, allowed));
}

/** Unifica instituciones del simulacro desde summary, estudiantes y stats por ítem. */
export function collectSimulationInstitutionKeys(args: {
    summary: Record<string, unknown> | null;
    simulationId: string;
    students: readonly Estudiante[];
    institutionQuestionStats?: Record<string, unknown> | null;
}): string[] {
    const keys = new Set<string>();
    const { summary, simulationId, students, institutionQuestionStats } = args;

    if (summary && simulationId) {
        const simData = summary[simulationId] as { institutions?: Record<string, unknown> } | undefined;
        if (simData?.institutions) {
            Object.keys(simData.institutions).forEach((k) => {
                const trimmed = k.trim();
                if (trimmed) keys.add(canonicalInstitutionName(trimmed));
            });
        }
    }

    students.forEach((s) => {
        const inst = (s.informacion_personal?.institucion || '').trim();
        if (inst) keys.add(canonicalInstitutionName(inst));
    });

    if (institutionQuestionStats) {
        Object.keys(institutionQuestionStats).forEach((k) => {
            const trimmed = k.trim();
            if (trimmed) keys.add(canonicalInstitutionName(trimmed));
        });
    }

    return dedupeInstitutionKeysPreferCanonical(Array.from(keys));
}

const GLOBAL_INSTITUTION_KEYS = new Set(['TODAS', '*']);

/** Instituciones/nodos válidos para un simulacro (summary + catálogo de activación). */
export function getInstitutionsForSimulationFilter(
    summary: Record<string, { institutions?: Record<string, unknown> }> | null | undefined,
    simulationId: string,
    catalogInstitutions: readonly string[],
): string[] {
    const simId = simulationId.trim();
    if (!simId) return [...catalogInstitutions];

    const simData = summary?.[simId];
    const summaryKeys = simData?.institutions
        ? Object.keys(simData.institutions).filter(
              (key) => !GLOBAL_INSTITUTION_KEYS.has(key.toUpperCase().trim()),
          )
        : [];

    if (!summary) return [...catalogInstitutions];
    if (summaryKeys.length === 0) return [];

    const result: string[] = [];
    const seen = new Set<string>();

    for (const catalogItem of catalogInstitutions) {
        const display = canonicalInstitutionName(catalogItem);
        const eq = display;
        if (seen.has(eq)) continue;
        if (simulationHasInstitutionInSummary(summary, simId, catalogItem)) {
            seen.add(eq);
            result.push(display);
        }
    }

    for (const key of summaryKeys) {
        const display = canonicalInstitutionName(key);
        if (seen.has(display)) continue;
        seen.add(display);
        result.push(display);
    }

    return dedupeInstitutionKeysPreferCanonical(result);
}

/** Opciones únicas para selectores: «TODAS» una sola vez + instituciones concretas. */
export function buildCoordinatorInstitutionOptions(institutionKeys: readonly string[]): string[] {
    const concrete = dedupeInstitutionKeysPreferCanonical(
        institutionKeys.filter((raw) => {
            const key = String(raw || '').toUpperCase().trim();
            return key && !GLOBAL_INSTITUTION_KEYS.has(key);
        }),
    );
    return ['TODAS', ...concrete];
}

export function simulationHasInstitutionScope(
    summary: Record<string, { institutions?: Record<string, unknown> }> | null | undefined,
    simId: string,
    allowed: readonly string[],
): boolean {
    if (allowed.length === 0) return true;
    const simData = summary?.[simId];
    if (!simData?.institutions) return false;
    return Object.keys(simData.institutions).some((key) => institutionMatchesScope(key, allowed));
}

const RANKING_AREA_KEYS = [
    'matemáticas',
    'lectura crítica',
    'sociales y ciudadanas',
    'ciencias naturales',
    'inglés',
] as const;

type RankingLikeEntry = {
    nombre: string;
    apellidos?: string;
    institucion?: string;
    departamento?: string;
    municipio?: string;
    numero_identificacion?: string;
    puntaje_global?: number;
    puntajes?: Record<string, unknown>;
};

/** Convierte ranking precomputado a estudiantes ligeros para el panel coordinador. */
export function rankingEntriesToEstudiantes(entries: RankingLikeEntry[]): Estudiante[] {
    const normalizeKey = (s: string) =>
        String(s || '')
            .toUpperCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

    return entries.map((entry) => {
        const puntajes: Record<string, { puntaje: number; correctas: number; total_preguntas: number }> = {};
        const lookupPuntaje = (k: string) => {
            const p = entry.puntajes || {};
            if (p && typeof p === 'object') {
                if (k in p) return (p as Record<string, unknown>)[k];
                const target = normalizeKey(k);
                const found = Object.keys(p).find((pk) => normalizeKey(pk) === target);
                if (found) return (p as Record<string, unknown>)[found];
            }
            return undefined;
        };
        for (const key of RANKING_AREA_KEYS) {
            puntajes[key] = normalizePuntaje(lookupPuntaje(key));
        }
        const instEntry = (entry.institucion || '').trim();
        const instFinal = instEntry.toUpperCase() || 'INDIVIDUAL (PROYECTO SECUNDARIO)';
        return {
            informacion_personal: {
                nombres: entry.nombre,
                apellidos: entry.apellidos || '',
                institucion: instFinal,
                departamento: String(entry.departamento || '').trim(),
                numero_identificacion: entry.numero_identificacion || '',
                municipio: String(entry.municipio || '').trim(),
                email: '',
            },
            puntaje_global: entry.puntaje_global,
            puntajes,
        } as unknown as Estudiante;
    });
}

export type SummaryInstitutionSnapshot = {
    count: number;
    avg: number;
    median: number;
    max: number;
    min: number;
    stdDev: number;
    tasaAprobacion: number;
    niveles: { superior: number; alto: number; medio: number; bajo: number };
    subjectAvgs: Record<string, number>;
};

/** Métricas institucionales desde coordinator_summary cuando aún no hay estudiantes en memoria. */
export function buildInstitutionMetricsFromSummary(
    snapshot: SummaryInstitutionSnapshot,
    name: string,
): InstitutionMetrics {
    const subjectStats = COORD_AREAS.map((area) => {
        const avg = Number(snapshot.subjectAvgs?.[area.key]) || 0;
        return {
            name: area.name,
            key: area.key,
            avg: Math.round(avg * 10) / 10,
            median: Math.round(avg * 10) / 10,
            mode: Math.round(avg),
            min: 0,
            max: 0,
            stdDev: 0,
            varPct: 0,
            correctas: 0,
            totalPreguntas: 0,
            countStudents: snapshot.count,
        };
    });

    const avg = snapshot.avg || 0;
    const stdDev = snapshot.stdDev || 0;

    return {
        name,
        students: [],
        avg: Math.round(avg),
        median: Math.round(snapshot.median || 0),
        stdDev: Math.round(stdDev * 10) / 10,
        coefVar: avg > 0 ? Math.round((stdDev / avg) * 1000) / 10 : 0,
        max: snapshot.max || 0,
        min: snapshot.min || 0,
        p25: 0,
        p75: 0,
        p90: 0,
        iqr: 0,
        tasaAprobacion: snapshot.tasaAprobacion || 0,
        niveles: snapshot.niveles || { superior: 0, alto: 0, medio: 0, bajo: 0 },
        distribucion: buildScoreDistribution([]),
        subjectStats,
        top5: [],
        enRiesgo: [],
    };
}

export function resolveSummaryInstitutionMetrics(
    summary: Record<string, unknown> | null,
    simulationId: string,
    institutionKey: string,
): InstitutionMetrics | null {
    if (!summary || !simulationId) return null;
    const simData = summary[simulationId] as {
        institutions?: Record<string, SummaryInstitutionSnapshot>;
        TODAS?: SummaryInstitutionSnapshot;
    } | undefined;
    if (!simData) return null;

    const instKey = institutionKey?.toUpperCase().trim();
    const showAll = !instKey || instKey === 'TODAS' || instKey === '*';
    let snapshot: SummaryInstitutionSnapshot | null = showAll ? simData.TODAS ?? null : null;

    if (!snapshot && !showAll) {
        const matchedKey = Object.keys(simData.institutions || {}).find((k) =>
            institutionsMatch(k, instKey),
        );
        snapshot = matchedKey ? simData.institutions![matchedKey] : null;
    }

    if (!snapshot) return null;
    const displayName = showAll ? 'TODAS LAS INSTITUCIONES' : canonicalInstitutionName(instKey);
    return buildInstitutionMetricsFromSummary(snapshot, displayName);
}
