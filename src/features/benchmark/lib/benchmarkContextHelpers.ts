import type { InstitutionMetrics } from '@features/coordinador/hooks/coordinadorTypes';
import type { Estudiante } from '@shared/types';
import { lookupInstitutionTerritory } from './institutionTerritoryRegistry';
import { AREA_MAP, NATIONAL_STATS, estimatePercentile } from './nationalData';

export type InstitutionTerritoryResolved = {
    department: string;
    municipality: string;
    source: 'registry' | 'students' | 'unknown';
};

export type BenchmarkAreaRef = keyof typeof NATIONAL_STATS.areas | 'Global' | 'Promedio';

function nationalRef(area: BenchmarkAreaRef) {
    if (area === 'Global') return NATIONAL_STATS.global;
    if (area === 'Promedio') return NATIONAL_STATS.promedio;
    return NATIONAL_STATS.areas[area];
}

/** Promedio por área (escala ~0–100) comparable con ranking ICFES CSV. */
export function institutionAreaPromedio(inst: InstitutionMetrics): number {
    const avgs = inst.subjectStats.map((s) => s.avg).filter((v) => v > 0);
    return avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : 0;
}

export function resolveInstitutionTerritory(
    institutionName: string,
    students: Estudiante[],
): InstitutionTerritoryResolved {
    const fromRegistry = lookupInstitutionTerritory(institutionName);
    if (fromRegistry) {
        return { ...fromRegistry, source: 'registry' };
    }

    const deptCounts = new Map<string, number>();
    const muniCounts = new Map<string, number>();

    for (const student of students) {
        const dept = (student.informacion_personal?.departamento || '').trim();
        const muni = (student.informacion_personal?.municipio || '').trim();
        if (dept) deptCounts.set(dept, (deptCounts.get(dept) || 0) + 1);
        if (muni) muniCounts.set(muni, (muniCounts.get(muni) || 0) + 1);
    }

    const pickMajority = (counts: Map<string, number>) => {
        let best = '';
        let bestCount = 0;
        for (const [key, count] of counts) {
            if (count > bestCount) {
                best = key;
                bestCount = count;
            }
        }
        return best;
    };

    const department = pickMajority(deptCounts) || pickMajority(muniCounts);
    const municipality = pickMajority(muniCounts);

    if (department || municipality) {
        return {
            department: department || municipality,
            municipality: municipality || '',
            source: 'students',
        };
    }

    return { department: 'Colombia', municipality: '', source: 'unknown' };
}

/** Interpolación inversa de `estimatePercentile`. */
export function scoreAtPercentile(area: BenchmarkAreaRef, targetPct: number): number {
    const ref = nationalRef(area);
    if (!ref) return 0;

    const clamped = Math.min(99, Math.max(1, targetPct));
    const points = [
        { pct: 10, val: ref.p10 },
        { pct: 25, val: ref.p25 },
        { pct: 50, val: ref.p50 },
        { pct: 75, val: ref.p75 },
        { pct: 90, val: ref.p90 },
        { pct: 95, val: ref.p95 },
        { pct: 99, val: ref.p99 },
    ];

    if (clamped <= points[0].pct) return points[0].val;
    if (clamped >= points[points.length - 1].pct) return points[points.length - 1].val;

    for (let i = 0; i < points.length - 1; i += 1) {
        const left = points[i];
        const right = points[i + 1];
        if (clamped >= left.pct && clamped <= right.pct) {
            const frac = (clamped - left.pct) / (right.pct - left.pct);
            return left.val + frac * (right.val - left.val);
        }
    }

    return ref.p50;
}

export interface BenchmarkGoalRow {
    label: string;
    areaKey: BenchmarkAreaRef;
    current: number;
    percentile: number;
    p50Target: number;
    p75Target: number;
    gapToP50: number;
    gapToP75: number;
}

export function computeBenchmarkGoals(inst: InstitutionMetrics): BenchmarkGoalRow[] {
    const rows: BenchmarkGoalRow[] = [];

    const pushRow = (label: string, areaKey: BenchmarkAreaRef, current: number) => {
        const percentile = estimatePercentile(areaKey, current);
        const p50Target = scoreAtPercentile(areaKey, 50);
        const p75Target = scoreAtPercentile(areaKey, 75);
        rows.push({
            label,
            areaKey,
            current,
            percentile,
            p50Target,
            p75Target,
            gapToP50: Math.max(0, p50Target - current),
            gapToP75: Math.max(0, p75Target - current),
        });
    };

    pushRow('Puntaje global', 'Global', inst.avg);

    for (const subject of inst.subjectStats) {
        const natKey = (AREA_MAP[subject.key] || subject.name) as BenchmarkAreaRef;
        if (natKey in NATIONAL_STATS.areas) {
            pushRow(subject.name, natKey, subject.avg);
        }
    }

    return rows;
}

export function countEvaluatedStudents(students: Estudiante[]): number {
    return students.filter((s) => (Number(s.puntaje_global) || 0) > 0).length;
}

export function percentileInterpretation(percentile: number): string {
    if (percentile >= 75) return 'Sobresaliente';
    if (percentile >= 50) return 'Por encima del promedio';
    if (percentile >= 25) return 'Por debajo del promedio';
    return 'Crítico';
}

export function percentileColor(percentile: number): string {
    if (percentile >= 75) return '#10b981';
    if (percentile >= 50) return '#6366f1';
    if (percentile >= 25) return '#f59e0b';
    return '#ef4444';
}

export function humanPercentileHeadline(percentile: number): string {
    return `Superas al ${percentile}% de los colegios del país`;
}

export function humanPercentileShort(percentile: number): string {
    if (percentile >= 75) return 'Entre los mejores del país';
    if (percentile >= 50) return 'Por encima del promedio nacional';
    if (percentile >= 25) return 'Por debajo del promedio nacional';
    return 'Requiere refuerzo urgente';
}

export function humanDepartmentBeatPct(pctSuperior: number): string {
    return `Mejor que el ${pctSuperior}% de colegios en tu departamento`;
}

export function humanGoalMessage(goal: BenchmarkGoalRow): {
    headline: string;
    sub: string;
    tone: 'good' | 'progress' | 'focus';
} {
    const scoreLabel =
        goal.areaKey === 'Global'
            ? `${goal.current.toFixed(0)} pts global`
            : `${goal.current.toFixed(1)} pts`;

    if (goal.gapToP75 <= 0) {
        return {
            headline: 'Ya estás en el top 25% nacional',
            sub: `${goal.label} · ${scoreLabel}`,
            tone: 'good',
        };
    }
    if (goal.gapToP50 <= 0) {
        return {
            headline: `Te faltan ${goal.gapToP75.toFixed(1)} pts para el top 25%`,
            sub: `${goal.label} · ${scoreLabel}`,
            tone: 'progress',
        };
    }
    return {
        headline: `Te faltan ${goal.gapToP50.toFixed(1)} pts para el promedio nacional`,
        sub: `${goal.label} · ${scoreLabel}`,
        tone: 'focus',
    };
}

/** Prioriza metas accionables (mayor brecha al top 25%). */
export function prioritizeBenchmarkGoals(goals: BenchmarkGoalRow[], limit = 3): BenchmarkGoalRow[] {
    const global = goals.find((g) => g.areaKey === 'Global');
    const areas = goals
        .filter((g) => g.areaKey !== 'Global')
        .sort((a, b) => b.gapToP75 - a.gapToP75 || b.gapToP50 - a.gapToP50);

    const picked: BenchmarkGoalRow[] = [];
    if (global) picked.push(global);
    for (const row of areas) {
        if (picked.length >= limit) break;
        if (row.gapToP75 > 0 || row.gapToP50 > 0) picked.push(row);
    }
    if (picked.length < limit) {
        for (const row of areas) {
            if (picked.length >= limit) break;
            if (!picked.includes(row)) picked.push(row);
        }
    }
    return picked.slice(0, limit);
}
