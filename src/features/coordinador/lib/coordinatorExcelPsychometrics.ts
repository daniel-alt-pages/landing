/**
 * Análisis psicométrico de ítems para export Excel coordinador.
 */
import type { Estudiante } from '@shared/types';
import type { QuestionStat } from '@features/coordinador/hooks/useCoordinadorData';

export interface PsychometricItemRow {
    materia: string;
    num: number;
    clave: string;
    pctAcierto: number;
    pctError: number;
    discriminacion: number | null;
    poderDiscriminativo: string;
    desviacion: number;
    varianza: number;
    total: number;
    degraded: boolean;
}

function mean(nums: number[]): number {
    if (!nums.length) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stdDev(nums: number[]): number {
    if (nums.length < 2) return 0;
    const m = mean(nums);
    const v = nums.reduce((s, x) => s + (x - m) ** 2, 0) / (nums.length - 1);
    return Math.sqrt(v);
}

function poderFromDiscrimination(d: number): string {
    const abs = Math.abs(d);
    if (abs >= 0.4) return 'Excelente';
    if (abs >= 0.3) return 'Bueno';
    if (abs >= 0.2) return 'Regular';
    return 'Pobre';
}

/** Índice alto-bajo (27% superior vs 27% inferior por puntaje global). */
function discriminationHighLow(scores: { global: number; correct: boolean }[]): number | null {
    const pool = scores.filter(s => s.global > 0);
    if (pool.length < 10) return null;
    const sorted = [...pool].sort((a, b) => b.global - a.global);
    const n = Math.max(1, Math.floor(sorted.length * 0.27));
    const high = sorted.slice(0, n);
    const low = sorted.slice(-n);
    const pHigh = mean(high.map(s => (s.correct ? 1 : 0)));
    const pLow = mean(low.map(s => (s.correct ? 1 : 0)));
    return pHigh - pLow;
}

/** Point-biserial cuando hay suficientes respuestas por estudiante. */
function pointBiserial(scores: { global: number; correct: boolean }[]): number | null {
    const pool = scores.filter(s => s.global > 0);
    if (pool.length < 8) return null;
    const xs = pool.map(s => (s.correct ? 1 : 0));
    const ys = pool.map(s => s.global);
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
    return den === 0 ? null : num / den;
}

type ItemResponse = { numero: number; es_correcta: boolean };

function extractItemResponses(est: Estudiante, materia: string): ItemResponse[] {
    const rd = (est as Estudiante & { respuestas_detalladas?: Record<string, unknown> }).respuestas_detalladas;
    if (!rd?.[materia]) return [];
    const raw = rd[materia];
    const items: ItemResponse[] = [];
    if (Array.isArray(raw)) {
        raw.forEach(r => {
            const item = r as unknown as Record<string, unknown>;
            const num = Number(item.numero ?? item.num ?? 0);
            if (num <= 0) return;
            items.push({ numero: num, es_correcta: !!item.es_correcta });
        });
    } else if (typeof raw === 'object' && raw !== null) {
        Object.entries(raw as Record<string, unknown>).forEach(([k, v]) => {
            const num = Number(k);
            if (num <= 0) return;
            const r = v as unknown as Record<string, unknown>;
            items.push({ numero: num, es_correcta: !!(r.es_correcta ?? r.correct) });
        });
    }
    return items;
}

function buildStudentItemScores(
    students: Estudiante[],
    materia: string,
    num: number
): { global: number; correct: boolean }[] {
    const out: { global: number; correct: boolean }[] = [];
    students.forEach(est => {
        const global = Number(est.puntaje_global) || 0;
        const items = extractItemResponses(est, materia);
        const hit = items.find(i => i.numero === num);
        if (hit) out.push({ global, correct: hit.es_correcta });
    });
    return out;
}

export function computePsychometricRows(
    questionAnalysis: Record<string, QuestionStat[]>,
    students: Estudiante[]
): PsychometricItemRow[] {
    const rows: PsychometricItemRow[] = [];
    const hasDetailed = students.some(
        s =>
            (s as Estudiante & { respuestas_detalladas?: Record<string, unknown> }).respuestas_detalladas &&
            Object.keys(
                (s as Estudiante & { respuestas_detalladas?: Record<string, unknown> }).respuestas_detalladas || {}
            ).length > 0
    );

    Object.entries(questionAnalysis).forEach(([materia, items]) => {
        (items || []).forEach(q => {
            if (q.total <= 0) return;
            const aciertos = Math.max(0, q.total - q.failed);
            const pctAcierto = aciertos / q.total;
            const pctError = q.rate;
            const binaryScores = hasDetailed
                ? buildStudentItemScores(students, materia, q.num).map(s => (s.correct ? 1 : 0))
                : [];
            const desviacion =
                binaryScores.length >= 2 ? stdDev(binaryScores) : Math.sqrt(pctAcierto * (1 - pctAcierto));
            const varianza = desviacion ** 2;

            let discriminacion: number | null = null;
            if (hasDetailed) {
                const itemScores = buildStudentItemScores(students, materia, q.num);
                discriminacion =
                    discriminationHighLow(itemScores) ?? pointBiserial(itemScores);
            }

            rows.push({
                materia,
                num: q.num,
                clave: String(q.correct || '?').toUpperCase().slice(0, 1),
                pctAcierto,
                pctError,
                discriminacion,
                poderDiscriminativo:
                    discriminacion != null ? poderFromDiscrimination(discriminacion) : 'N/D (agregado)',
                desviacion,
                varianza,
                total: q.total,
                degraded: !hasDetailed,
            });
        });
    });

    return rows.sort((a, b) => b.pctError - a.pctError || a.materia.localeCompare(b.materia, 'es'));
}

export const AREA_MAX_SCORE = 100;

export interface PotencialRow {
    id: string;
    nombre: string;
    global: number;
    potencialLec: number;
    potencialMat: number;
    potencialSoc: number;
    potencialCie: number;
    potencialIng: number;
    totalPotencial: number;
}

const POTENCIAL_KEYS: { key: string; field: keyof Omit<PotencialRow, 'id' | 'nombre' | 'global' | 'totalPotencial'> }[] = [
    { key: 'lectura crítica', field: 'potencialLec' },
    { key: 'matemáticas', field: 'potencialMat' },
    { key: 'sociales y ciudadanas', field: 'potencialSoc' },
    { key: 'ciencias naturales', field: 'potencialCie' },
    { key: 'inglés', field: 'potencialIng' },
];

function areaScore(est: Estudiante, key: string): number {
    const raw = est.puntajes?.[key];
    if (raw == null) return 0;
    if (typeof raw === 'number') return Math.round(raw);
    const p = Number((raw as { puntaje?: number }).puntaje);
    return Number.isFinite(p) ? Math.round(p) : 0;
}

export function computePotencialRows(students: Estudiante[]): PotencialRow[] {
    return students
        .filter(s => (Number(s.puntaje_global) || 0) > 0)
        .map(est => {
            const row: PotencialRow = {
                id: est.informacion_personal?.numero_identificacion || '',
                nombre: `${est.informacion_personal?.nombres || ''} ${est.informacion_personal?.apellidos || ''}`.trim(),
                global: Number(est.puntaje_global) || 0,
                potencialLec: 0,
                potencialMat: 0,
                potencialSoc: 0,
                potencialCie: 0,
                potencialIng: 0,
                totalPotencial: 0,
            };
            let total = 0;
            POTENCIAL_KEYS.forEach(({ key, field }) => {
                const score = areaScore(est, key);
                const pot = score > 0 ? Math.max(0, AREA_MAX_SCORE - score) : 0;
                row[field] = pot;
                total += pot;
            });
            row.totalPotencial = total;
            return row;
        })
        .sort((a, b) => b.global - a.global);
}
