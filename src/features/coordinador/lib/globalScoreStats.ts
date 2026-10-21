import type { Estudiante } from '@shared/types';
import { clasificarNivel } from '@features/coordinador/lib/coordinadorDataHelpers';

/** Umbral SG / panel coordinador para aprobación (puntaje global 0–500). */
export const APROBACION_UMBRAL = 300;

/** Rangos fijos de histograma (solo estudiantes con puntaje > 0). */
export const SCORE_RANGE_KEYS = [
    '0-199',
    '200-249',
    '250-299',
    '300-324',
    '325-349',
    '350-374',
    '375-399',
    '400-449',
    '450-500',
] as const;

export type ScoreRangeKey = (typeof SCORE_RANGE_KEYS)[number];

export type NivelDesempenoKey = 'superior' | 'alto' | 'medio' | 'bajo';

export const NIVEL_DESEMPENO_META: ReadonlyArray<{
    key: NivelDesempenoKey;
    label: string;
    rangeLabel: string;
    min: number;
    max: number;
    color: string;
    barClass: string;
}> = [
    { key: 'superior', label: 'Superior', rangeLabel: '≥400 pts', min: 400, max: 500, color: '#10b981', barClass: 'bg-emerald-500' },
    { key: 'alto', label: 'Alto', rangeLabel: '325–399 pts', min: 325, max: 399, color: '#6366f1', barClass: 'bg-indigo-500' },
    { key: 'medio', label: 'Medio', rangeLabel: '250–324 pts', min: 250, max: 324, color: '#f59e0b', barClass: 'bg-amber-500' },
    { key: 'bajo', label: 'Bajo', rangeLabel: '<250 pts', min: 0, max: 249, color: '#ef4444', barClass: 'bg-red-500' },
];

/** Nivel ICFES asociado a cada rango del histograma (visualización). */
export const LEVEL_FOR_SCORE_RANGE: Record<ScoreRangeKey, NivelDesempenoKey> = {
    '0-199': 'bajo',
    '200-249': 'bajo',
    '250-299': 'medio',
    '300-324': 'medio',
    '325-349': 'alto',
    '350-374': 'alto',
    '375-399': 'alto',
    '400-449': 'superior',
    '450-500': 'superior',
};

export function emptyScoreDistribution(): Record<ScoreRangeKey, number> {
    return Object.fromEntries(SCORE_RANGE_KEYS.map((k) => [k, 0])) as Record<ScoreRangeKey, number>;
}

export function scoreToRangeKey(p: number): ScoreRangeKey {
    if (p < 200) return '0-199';
    if (p < 250) return '200-249';
    if (p < 300) return '250-299';
    if (p < 325) return '300-324';
    if (p < 350) return '325-349';
    if (p < 375) return '350-374';
    if (p < 400) return '375-399';
    if (p < 450) return '400-449';
    return '450-500';
}

/** Histograma por rangos fijos; solo puntajes > 0. */
export function buildScoreDistribution(scores: number[]): Record<ScoreRangeKey, number> {
    const dist = emptyScoreDistribution();
    scores.filter((p) => p > 0).forEach((p) => {
        dist[scoreToRangeKey(p)]++;
    });
    return dist;
}

export function globalScores(students: Estudiante[]): number[] {
    return students.map((s) => s.puntaje_global || 0).filter((p) => p > 0);
}

/** Cohorte filtrada (incluye puntaje 0). */
export function cohortTotal(students: Estudiante[]): number {
    return students.length;
}

/** Porcentaje entero sobre la cohorte completa (spec hero / niveles). */
export function pctOfCohort(count: number, total: number): number {
    if (total <= 0) return 0;
    return Math.round((count / total) * 100);
}

export function countAprobados(scores: number[]): number {
    return scores.filter((p) => p >= APROBACION_UMBRAL).length;
}

/** Tasa sobre puntajes > 0, 1 decimal (spec §4.1). */
export function calcTasaAprobacion(scores: number[]): number {
    const n = scores.length;
    if (n === 0) return 0;
    return Math.round((countAprobados(scores) / n) * 1000) / 10;
}

/** Aproximación visual UI (spec §3.5 / §4.2). */
export function aprobadosDisplay(tasa: number, cohortSize: number): number {
    return Math.round((tasa / 100) * cohortSize);
}

export function approvalQualityLabel(tasa: number): {
    label: string;
    color: string;
    bg: string;
    border: string;
    textClass: string;
} {
    if (tasa >= 70)
        return {
            label: 'Excelente',
            color: '#34d399',
            bg: 'rgba(52,211,153,0.08)',
            border: 'rgba(52,211,153,0.2)',
            textClass: 'text-emerald-400',
        };
    if (tasa >= 50)
        return {
            label: 'Bueno',
            color: '#22d3ee',
            bg: 'rgba(34,211,238,0.08)',
            border: 'rgba(34,211,238,0.2)',
            textClass: 'text-cyan-400',
        };
    if (tasa >= 30)
        return {
            label: 'Regular',
            color: '#fbbf24',
            bg: 'rgba(251,191,36,0.08)',
            border: 'rgba(251,191,36,0.2)',
            textClass: 'text-amber-400',
        };
    return {
        label: 'Crítico',
        color: '#fb7185',
        bg: 'rgba(251,113,133,0.08)',
        border: 'rgba(251,113,133,0.2)',
        textClass: 'text-rose-400',
    };
}

export function nivelDesempenoRows(inst: {
    students: Estudiante[];
    niveles: Record<NivelDesempenoKey, number>;
}) {
    const total = cohortTotal(inst.students);
    return NIVEL_DESEMPENO_META.map((meta) => ({
        ...meta,
        count: inst.niveles[meta.key],
        pct: pctOfCohort(inst.niveles[meta.key], total),
    }));
}

/** Centro de un rango fijo sobre la escala 0–500 (p. ej. «200-249» → 224.5). */
export function scoreRangeCenter(range: ScoreRangeKey | string): number {
    const [lo, hi] = range.split('-').map(Number);
    return (lo + hi) / 2;
}

export function scoreRangeRows(distribucion: Record<string, number>) {
    const approvalRanges: ScoreRangeKey[] = ['300-324', '325-349', '350-374', '375-399', '400-449', '450-500'];
    return SCORE_RANGE_KEYS.map((range) => ({
        range,
        count: Number(distribucion[range]) || 0,
        level: LEVEL_FOR_SCORE_RANGE[range],
        aprobado: approvalRanges.includes(range),
    }));
}

export { clasificarNivel };
