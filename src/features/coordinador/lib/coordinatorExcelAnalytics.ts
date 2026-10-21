import type { Estudiante } from '@shared/types';
import type { InstitutionMetrics, QuestionStat } from '@features/coordinador/hooks/useCoordinadorData';
import type { ExecutiveSummary } from '@features/coordinador/lib/executiveModel';
import { NATIONAL_STATS, AREA_MAP, estimatePercentile } from '@features/benchmark/lib/nationalData';
import { questionLabel } from '@/lib/questionLabel';
import { MISSING_TEXT, NOT_APPLICABLE } from '@features/coordinador/lib/coordinatorExcelValues';

export const AREA_KEYS = [
    'matemáticas',
    'lectura crítica',
    'sociales y ciudadanas',
    'ciencias naturales',
    'inglés',
] as const;

export const AREA_SHORT = ['MAT', 'LEC', 'SOC', 'CIE', 'ING'] as const;

const mean = (nums: number[]) =>
    nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;

function areaScore(est: Estudiante, key: string): number {
    const raw = est.puntajes?.[key];
    if (raw == null) return 0;
    if (typeof raw === 'number') return Math.round(raw);
    const p = Number((raw as { puntaje?: number }).puntaje);
    return Number.isFinite(p) ? Math.round(p) : 0;
}

function nivelGlobal(p: number): string {
    if (p >= 400) return 'Superior';
    if (p >= 325) return 'Alto';
    if (p >= 250) return 'Medio';
    return 'Bajo';
}

function readDepartamento(est: Estudiante): string {
    const info = est.informacion_personal as unknown as Record<string, unknown> | undefined;
    const d = String(info?.departamento || info?.Departamento || '').trim();
    return d || MISSING_TEXT;
}

function pearson(xs: number[], ys: number[]): number {
    if (xs.length < 3 || xs.length !== ys.length) return 0;
    const mx = mean(xs);
    const my = mean(ys);
    let num = 0;
    let dx = 0;
    let dy = 0;
    for (let i = 0; i < xs.length; i++) {
        const a = xs[i] - mx;
        const b = ys[i] - my;
        num += a * b;
        dx += a * a;
        dy += b * b;
    }
    const den = Math.sqrt(dx * dy);
    return den === 0 ? 0 : num / den;
}

export function studentsWithAreaScores(students: Estudiante[]): Estudiante[] {
    return students.filter(s => {
        const g = Number(s.puntaje_global) || 0;
        if (g <= 0) return false;
        return AREA_KEYS.every(k => areaScore(s, k) > 0);
    });
}

export function computeCorrelationMatrix(students: Estudiante[]): {
    labels: string[];
    matrix: number[][];
    insights: { strongest: string; weakest: string };
} {
    const pool = studentsWithAreaScores(students);
    const labels = [...AREA_SHORT];
    const series = AREA_KEYS.map(k => pool.map(s => areaScore(s, k)));
    const matrix: number[][] = labels.map((_, i) =>
        labels.map((__, j) => (i === j ? 1 : pearson(series[i], series[j])))
    );

    let maxR = -2;
    let minR = 2;
    let strongest = 'MAT ↔ CIE';
    let weakest = 'LEC ↔ ING';
    for (let i = 0; i < labels.length; i++) {
        for (let j = i + 1; j < labels.length; j++) {
            const r = matrix[i][j];
            if (r > maxR) {
                maxR = r;
                strongest = `${labels[i]} ↔ ${labels[j]}`;
            }
            if (r < minR) {
                minR = r;
                weakest = `${labels[i]} ↔ ${labels[j]}`;
            }
        }
    }

    return {
        labels,
        matrix,
        insights: {
            strongest: `${strongest} (r = ${maxR.toFixed(2)})`,
            weakest: `${weakest} (r = ${minR.toFixed(2)})`,
        },
    };
}

export interface LevelProfileRow {
    nivel: string;
    count: number;
    avgGlobal: number;
    areaFuerte: string;
    areaDebil: string;
    brecha: number;
    recomendacion: string;
    areaAvgs: Record<string, number>;
}

export function computeLevelProfiles(students: Estudiante[]): LevelProfileRow[] {
    const groups = new Map<string, Estudiante[]>();
    students.forEach(s => {
        const g = Number(s.puntaje_global) || 0;
        if (g <= 0) return;
        const n = nivelGlobal(g);
        if (!groups.has(n)) groups.set(n, []);
        groups.get(n)!.push(s);
    });

    const order = ['Superior', 'Alto', 'Medio', 'Bajo'];
    return order.map(nivel => {
        if (!groups.has(nivel)) {
            return {
                nivel,
                count: 0,
                avgGlobal: NOT_APPLICABLE as unknown as number,
                areaFuerte: NOT_APPLICABLE,
                areaDebil: NOT_APPLICABLE,
                brecha: NOT_APPLICABLE as unknown as number,
                recomendacion: 'Sin estudiantes en este nivel',
                areaAvgs: Object.fromEntries(AREA_KEYS.map(k => [k, 0])) as Record<string, number>,
            };
        }
        const grp = groups.get(nivel)!;
        const globals = grp.map(s => Number(s.puntaje_global) || 0);
        const areaAvgs: Record<string, number> = {};
        AREA_KEYS.forEach(k => {
            const vals = grp.map(s => areaScore(s, k)).filter(v => v > 0);
            areaAvgs[k] = vals.length ? Math.round(mean(vals)) : 0;
        });

        let fuerte: (typeof AREA_KEYS)[number] = AREA_KEYS[0];
        let debil: (typeof AREA_KEYS)[number] = AREA_KEYS[0];
        let maxA = -1;
        let minA = 999;
        AREA_KEYS.forEach(k => {
            const v = areaAvgs[k];
            if (v > maxA) {
                maxA = v;
                fuerte = k;
            }
            if (v > 0 && v < minA) {
                minA = v;
                debil = k;
            }
        });

        const brecha = maxA - minA;
        const rec =
            nivel === 'Bajo'
                ? 'Intervención urgente e integral'
                : nivel === 'Medio'
                  ? `Refuerzo en ${debil}`
                  : nivel === 'Alto'
                    ? `Consolidar ${fuerte}`
                    : 'Programas de enriquecimiento';

        return {
            nivel,
            count: grp.length,
            avgGlobal: Math.round(mean(globals)),
            areaFuerte: `${fuerte} (${maxA})`,
            areaDebil: `${debil} (${minA})`,
            brecha,
            recomendacion: rec,
            areaAvgs,
        };
    });
}

export interface GapRow {
    nombre: string;
    id: string;
    institucion: string;
    global: number;
    fuerte: string;
    fuertePts: number;
    debil: string;
    debilPts: number;
    brecha: number;
    riesgo: string;
}

export function computeGapRows(students: Estudiante[]): {
    rows: GapRow[];
    avgGap: number;
    maxGap: number;
    highGaps: number;
} {
    const rows: GapRow[] = [];
    students.forEach(s => {
        const global = Number(s.puntaje_global) || 0;
        if (global <= 0) return;
        let fuerte = { label: '-', score: 0 };
        let debil = { label: '-', score: 100 };
        AREA_KEYS.forEach(k => {
            const p = areaScore(s, k);
            if (p > fuerte.score) fuerte = { label: k, score: p };
            if (p > 0 && p < debil.score) debil = { label: k, score: p };
        });
        const brecha = fuerte.score - debil.score;
        if (brecha <= 0) return;
        const riesgo =
            brecha >= 30 ? 'Crítica' : brecha >= 20 ? 'Alta' : brecha >= 10 ? 'Moderada' : 'Normal';
        rows.push({
            nombre: `${s.informacion_personal?.nombres || ''} ${s.informacion_personal?.apellidos || ''}`.trim(),
            id: s.informacion_personal?.numero_identificacion || '',
            institucion: s.informacion_personal?.institucion || '',
            global,
            fuerte: fuerte.label,
            fuertePts: fuerte.score,
            debil: debil.label,
            debilPts: debil.score,
            brecha,
            riesgo,
        });
    });
    rows.sort((a, b) => b.brecha - a.brecha);
    const gaps = rows.map(r => r.brecha);
    const avgGap = gaps.length ? Math.round(mean(gaps)) : 0;
    const maxGap = gaps.length ? Math.max(...gaps) : 0;
    const highGaps = rows.filter(r => r.brecha > 20).length;
    return { rows, avgGap, maxGap, highGaps };
}

export interface SessionRow {
    id: string;
    nombre: string;
    institucion: string;
    s1: string;
    s2: string;
    estado: string;
    global: number;
}

export function computeSessionStats(students: Estudiante[]): {
    ambas: number;
    soloS1: number;
    soloS2: number;
    incompletos: number;
    rows: SessionRow[];
} {
    let ambas = 0;
    let soloS1 = 0;
    let soloS2 = 0;
    let incompletos = 0;
    const rows: SessionRow[] = [];

    students.forEach(s => {
        const ses =
            (s as Estudiante & { secciones_completadas?: string[] }).secciones_completadas ||
            (s as Estudiante & { sesiones?: string[] }).sesiones ||
            [];
        const norm = ses.map(x => String(x).toUpperCase());
        const hasS1 = norm.some(x => x === 'S1' || x.includes('1'));
        const hasS2 = norm.some(x => x === 'S2' || x.includes('2'));
        const s1 = hasS1 ? 'Sí' : 'No';
        const s2 = hasS2 ? 'Sí' : 'No';
        let estado = 'Incompleto';
        if (hasS1 && hasS2) {
            estado = 'Completo';
            ambas++;
        } else if (hasS1) {
            soloS1++;
            estado = 'Falta S2';
        } else if (hasS2) {
            soloS2++;
            estado = 'Falta S1';
        } else {
            incompletos++;
        }
        rows.push({
            id: s.informacion_personal?.numero_identificacion || '',
            nombre: `${s.informacion_personal?.nombres || ''} ${s.informacion_personal?.apellidos || ''}`.trim(),
            institucion: s.informacion_personal?.institucion || '',
            s1,
            s2,
            estado,
            global: Number(s.puntaje_global) || 0,
        });
    });

    return { ambas, soloS1, soloS2, incompletos, rows };
}

export interface DepartmentRow {
    departamento: string;
    evaluados: number;
    promedio: number;
    max: number;
    min: number;
    tasaExito: number;
    mats: number;
    lec: number;
    soc: number;
    cie: number;
    ing: number;
}

export function computeDepartmentStats(students: Estudiante[]): DepartmentRow[] {
    const groups = new Map<string, Estudiante[]>();
    students.forEach(s => {
        const g = Number(s.puntaje_global) || 0;
        if (g <= 0) return;
        const d = readDepartamento(s);
        if (!groups.has(d)) groups.set(d, []);
        groups.get(d)!.push(s);
    });

    return Array.from(groups.entries())
        .map(([departamento, grp]) => {
            const globals = grp.map(s => Number(s.puntaje_global) || 0);
            const areaMean = (k: string) => {
                const v = grp.map(s => areaScore(s, k)).filter(x => x > 0);
                return v.length ? Math.round(mean(v) * 10) / 10 : 0;
            };
            return {
                departamento,
                evaluados: grp.length,
                promedio: Math.round(mean(globals) * 10) / 10,
                max: Math.max(...globals),
                min: Math.min(...globals),
                tasaExito: globals.length
                    ? Math.round((globals.filter(x => x >= 300).length / globals.length) * 1000) / 10
                    : 0,
                mats: areaMean('matemáticas'),
                lec: areaMean('lectura crítica'),
                soc: areaMean('sociales y ciudadanas'),
                cie: areaMean('ciencias naturales'),
                ing: areaMean('inglés'),
            };
        })
        .sort((a, b) => b.promedio - a.promedio);
}

export interface NationalBenchmarkRow {
    institucion: string;
    estudiantes: number;
    promSim: number;
    promNac: number;
    delta: number;
    percentil: number;
    indicador: string;
}

export function computeNationalBenchmarkRows(
    allInstitutions: InstitutionMetrics[]
): NationalBenchmarkRow[] {
    const promNac = Math.round(NATIONAL_STATS.global.mean);
    return allInstitutions.map(inst => {
        const evalN = inst.students.filter(s => (Number(s.puntaje_global) || 0) > 0).length;
        const promSim = inst.avg;
        const delta = Math.round(promSim - promNac);
        const pct = estimatePercentile('Promedio', promSim / 5);
        const indicador = pct >= 50 ? 'Alto' : pct >= 25 ? 'Medio' : 'Bajo';
        return {
            institucion: inst.name,
            estudiantes: evalN,
            promSim,
            promNac,
            delta,
            percentil: pct,
            indicador,
        };
    });
}

export function distributionChartData(inst: InstitutionMetrics): { label: string; count: number }[] {
    const order = [
        '0-199',
        '200-249',
        '250-299',
        '300-324',
        '325-349',
        '350-374',
        '375-399',
        '400-449',
        '450-500',
    ];
    return order.map(label => ({
        label,
        count: inst.distribucion[label] || 0,
    }));
}

export function nivelChartData(inst: InstitutionMetrics): { label: string; count: number }[] {
    return [
        { label: 'Superior', count: inst.niveles.superior },
        { label: 'Alto', count: inst.niveles.alto },
        { label: 'Medio', count: inst.niveles.medio },
        { label: 'Bajo', count: inst.niveles.bajo },
    ].filter(x => x.count > 0);
}

export function areaChartData(inst: InstitutionMetrics): { label: string; value: number }[] {
    return inst.subjectStats.map(s => ({ label: s.name.split(' ')[0], value: s.avg }));
}

export function institutionBenchmarkChartData(
    allInstitutions: InstitutionMetrics[]
): { label: string; value: number }[] {
    return [...allInstitutions]
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 12)
        .map(i => ({
            label: i.name.length > 22 ? `${i.name.slice(0, 20)}…` : i.name,
            value: i.avg,
        }));
}

export function departmentChartData(rows: DepartmentRow[]): { label: string; value: number }[] {
    return rows
        .filter(r => r.evaluados >= 2)
        .slice(0, 15)
        .map(r => ({
            label: r.departamento.length > 18 ? `${r.departamento.slice(0, 16)}…` : r.departamento,
            value: r.promedio,
        }));
}

export function buildRecomendacionesRows(summary: ExecutiveSummary): string[][] {
    const rows: string[][] = [];
    summary.recomendaciones.forEach((r, i) => rows.push([`${i + 1}`, r]));
    summary.preguntasCriticas.slice(0, 8).forEach(q => {
        rows.push([
            `${questionLabel(q.num)} ${q.materia}`,
            `${Math.round(q.failRate * 100)}% error · prioridad ${q.importance}`,
        ]);
    });
    if (!summary.preguntasCriticas.length && summary.competenciasDiagnostico.length) {
        summary.competenciasDiagnostico.forEach(d => {
            const urgent = d.competencias
                .filter(c => c.estado === 'urgente' || c.estado === 'por_reforzar')
                .sort((a, b) => a.prioridad - b.prioridad)
                .slice(0, 2);
            urgent.forEach(c => {
                rows.push([
                    `${d.areaNombre} · ${d.nivelEtiqueta}`,
                    `Reforzar: ${c.competenciaNombre} (${c.dominioPct}% dominio)`,
                ]);
            });
        });
    }
    return rows;
}

export function segmentacionRows(
    questionAnalysis: Record<string, QuestionStat[]>,
    minRate = 0.4
): { materia: string; num: number; opcion: string; estudiantes: string }[] {
    const out: { materia: string; num: number; opcion: string; estudiantes: string }[] = [];
    Object.entries(questionAnalysis).forEach(([materia, items]) => {
        (items || [])
            .filter(q => q.rate >= minRate && q.total > 0)
            .slice(0, 15)
            .forEach(q => {
                Object.entries(q.studentMap || {}).forEach(([opt, names]) => {
                    if (!names?.length) return;
                    const correct = String(q.correct || '')
                        .toUpperCase()
                        .slice(0, 1);
                    if (opt.toUpperCase() === correct) return;
                    out.push({
                        materia,
                        num: q.num,
                        opcion: opt,
                        estudiantes: names.slice(0, 12).join('; ') + (names.length > 12 ? '…' : ''),
                    });
                });
            });
    });
    return out.slice(0, 200);
}

export function nationalAreaComparisonRows(inst: InstitutionMetrics): string[][] {
    const rows: string[][] = [];
    inst.subjectStats.forEach(s => {
        const natKey = AREA_MAP[s.key] || s.name;
        const natMean = (NATIONAL_STATS.areas as Record<string, { mean: number }>)[natKey]?.mean ?? 50;
        rows.push([
            s.name,
            s.avg.toFixed(1),
            natMean.toFixed(1),
            (s.avg - natMean >= 0 ? '+' : '') + (s.avg - natMean).toFixed(1),
            `P${estimatePercentile(natKey as keyof typeof NATIONAL_STATS.areas, s.avg)}`,
        ]);
    });
    return rows;
}
