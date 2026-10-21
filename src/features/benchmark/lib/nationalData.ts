/**
 * Módulo de datos nacionales ICFES 2025
 * Carga y procesa rankings_2025_consolidated.csv y score_analysis_report.json
 * para ofrecer benchmarking institucional contra datos reales.
 */

// Estadísticas nacionales hardcoded del score_analysis_report.json (6KB, no cambian)
export const NATIONAL_STATS = {
    areas: {
        Lectura: { mean: 53.37, std: 6.60, p10: 45, p25: 49, p50: 53, p75: 58, p90: 62, p95: 65, p99: 69, max: 77 },
        Matematicas: { mean: 51.71, std: 8.31, p10: 41, p25: 46, p50: 51, p75: 57, p90: 62, p95: 66, p99: 73, max: 84 },
        Sociales: { mean: 47.18, std: 7.70, p10: 38, p25: 42, p50: 47, p75: 52, p90: 58, p95: 61, p99: 67, max: 75 },
        Ciencias: { mean: 50.17, std: 6.90, p10: 42, p25: 45, p50: 50, p75: 54, p90: 59, p95: 63, p99: 68, max: 78 },
        Ingles: { mean: 51.52, std: 9.13, p10: 41, p25: 45, p50: 50, p75: 56, p90: 64, p95: 69, p99: 78, max: 86 },
    },
    global: { mean: 253.51, std: 36.64, p10: 208, p25: 228, p50: 251, p75: 275, p90: 303, p95: 320, p99: 348, max: 388, count: 9880 },
    promedio: { mean: 50.68, std: 7.33, p10: 41.62, p25: 45.54, p50: 50.23, p75: 55.08, p90: 60.47, p95: 64.08, p99: 69.62, max: 77.54 },
};

/** Mapeo de claves del simulacro → columnas del CSV */
export const AREA_MAP: Record<string, string> = {
    'lectura crítica': 'Lectura',
    'matemáticas': 'Matematicas',
    'sociales y ciudadanas': 'Sociales',
    'ciencias naturales': 'Ciencias',
    'inglés': 'Ingles',
};

export interface SchoolRecord {
    departamento: string;
    puesto: number;
    codigo: string;
    colegio: string;
    lectura: number;
    matematicas: number;
    sociales: number;
    ciencias: number;
    ingles: number;
    promedio: number;
    global: number;
}

let _cachedSchools: SchoolRecord[] | null = null;
let _rankingsInflight: Promise<SchoolRecord[]> | null = null;

function normalizeTerritoryKey(value: string) {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function matchesTerritory(schoolDept: string, territory: string) {
    const schoolNorm = normalizeTerritoryKey(schoolDept);
    const territoryNorm = normalizeTerritoryKey(territory);
    if (!schoolNorm || !territoryNorm) return false;
    return (
        schoolNorm === territoryNorm ||
        schoolNorm.includes(territoryNorm) ||
        territoryNorm.includes(schoolNorm)
    );
}

function schoolsInTerritory(schools: SchoolRecord[], territory: string) {
    if (!territory.trim()) return [];
    return schools.filter((school) => matchesTerritory(school.departamento, territory));
}

function sortByClosestPromedio(schools: SchoolRecord[], targetAvg: number) {
    return [...schools].sort(
        (a, b) => Math.abs(a.promedio - targetAvg) - Math.abs(b.promedio - targetAvg),
    );
}

// POST-MIGRACIÓN: Firestore es la única fuente de verdad
const _isLocal = false;

/** Carga y parsea el CSV de rankings (lazy, cacheado, dedup inflight). */
export async function loadNationalRankings(): Promise<SchoolRecord[]> {
    if (_cachedSchools) return _cachedSchools;
    if (_rankingsInflight) return _rankingsInflight;

    _rankingsInflight = (async () => {
        // Producción: intentar Firestore primero (0 hosting bandwidth)
        if (!_isLocal) {
            try {
                const { getNationalRankings } = await import('@features/simulacro/lib/firestoreService');
                const fsData = await getNationalRankings();
                if (fsData.length > 0) {
                    _cachedSchools = fsData as SchoolRecord[];
                    return _cachedSchools;
                }
            } catch (err) {
                console.warn('[NationalData] Firestore fallback failed:', err);
            }
        }

        // Local o fallback: leer CSV desde disco
        try {
            const res = await fetch('/data/analysis_results/rankings_2025_consolidated.csv');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();

            const lines = text.split('\n').filter((l) => l.trim());
            const schools: SchoolRecord[] = [];
            for (let i = 1; i < lines.length; i += 1) {
                const parts = parseCSVLine(lines[i]);
                if (parts.length < 12) continue;

                schools.push({
                    departamento: parts[0].trim(),
                    puesto: parseInt(parts[1], 10) || 0,
                    codigo: parts[2].trim(),
                    colegio: parts[3].trim(),
                    lectura: parseFloat(parts[5]) || 0,
                    matematicas: parseFloat(parts[6]) || 0,
                    sociales: parseFloat(parts[7]) || 0,
                    ciencias: parseFloat(parts[8]) || 0,
                    ingles: parseFloat(parts[9]) || 0,
                    promedio: parseFloat(parts[10]) || 0,
                    global: parseFloat(parts[11]) || 0,
                });
            }

            _cachedSchools = schools;
            return schools;
        } catch (err) {
            console.error('Error loading national rankings:', err);
            return [];
        }
    })();

    try {
        return await _rankingsInflight;
    } finally {
        _rankingsInflight = null;
    }
}

/** Simple CSV line parser that handles quoted fields */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

/** Estima en qué percentil cae un puntaje respecto a la distribución nacional */
export function estimatePercentile(area: keyof typeof NATIONAL_STATS.areas | 'Global' | 'Promedio', score: number): number {
    const ref = area === 'Global' ? NATIONAL_STATS.global : area === 'Promedio' ? NATIONAL_STATS.promedio : NATIONAL_STATS.areas[area];
    if (!ref) return 50;

    // Interpolación lineal entre percentiles conocidos
    const points = [
        { pct: 10, val: ref.p10 },
        { pct: 25, val: ref.p25 },
        { pct: 50, val: ref.p50 },
        { pct: 75, val: ref.p75 },
        { pct: 90, val: ref.p90 },
        { pct: 95, val: ref.p95 },
        { pct: 99, val: ref.p99 },
    ];

    if (score <= points[0].val) return Math.max(1, Math.round(10 * score / points[0].val));
    if (score >= points[points.length - 1].val) return 99;

    for (let i = 0; i < points.length - 1; i++) {
        if (score >= points[i].val && score <= points[i + 1].val) {
            const frac = (score - points[i].val) / (points[i + 1].val - points[i].val);
            return Math.round(points[i].pct + frac * (points[i + 1].pct - points[i].pct));
        }
    }
    return 50;
}

/** Encuentra los N colegios con promedio más cercano al dado (opcional: priorizar territorio). */
export function findSimilarSchools(
    schools: SchoolRecord[],
    targetAvg: number,
    n: number = 3,
    territory?: string,
): SchoolRecord[] {
    if (!schools.length) return [];

    const localPool = territory ? schoolsInTerritory(schools, territory) : [];
    const localMatches = sortByClosestPromedio(localPool, targetAvg).slice(0, n);

    if (localMatches.length >= n) return localMatches;

    const usedCodes = new Set(localMatches.map((s) => s.codigo));
    const nationalMatches = sortByClosestPromedio(
        schools.filter((s) => !usedCodes.has(s.codigo)),
        targetAvg,
    ).slice(0, n - localMatches.length);

    return [...localMatches, ...nationalMatches];
}

export function similarSchoolsScope(
    schools: SchoolRecord[],
    territory: string,
    matches: SchoolRecord[],
): 'territory' | 'mixed' | 'national' {
    if (!matches.length) return 'national';
    const localCount = matches.filter((s) => matchesTerritory(s.departamento, territory)).length;
    if (localCount === matches.length) return 'territory';
    if (localCount === 0) return 'national';
    return 'mixed';
}

/** Obtiene los colegios de un departamento y la posición estimada */
export function getDepartmentPosition(schools: SchoolRecord[], departamento: string, instAvg: number): {
    position: number;
    total: number;
    topSchools: SchoolRecord[];
} {
    const deptoSchools = schoolsInTerritory(schools, departamento).sort((a, b) => a.puesto - b.puesto);

    if (deptoSchools.length === 0) {
        return { position: 0, total: 0, topSchools: [] };
    }

    const aboveCount = deptoSchools.filter((s) => s.promedio > instAvg).length;

    return {
        position: aboveCount + 1,
        total: deptoSchools.length,
        topSchools: deptoSchools.slice(0, 8),
    };
}

/** Semáforo visual basado en percentil */
export function getPercentileEmoji(percentile: number): string {
    if (percentile >= 75) return '🟢';
    if (percentile >= 25) return '🟡';
    return '🔴';
}
