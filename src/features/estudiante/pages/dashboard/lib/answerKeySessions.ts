import { SG_AREA_HEX } from '@shared/lib/sgAreaColors';

export type ClavePregunta = {
    numero: number;
    respuesta_correcta: string;
    porcentaje_acierto: number;
    sesion?: string;
};

export const MATERIA_LABELS: Record<string, string> = {
    'matemáticas': 'Matemáticas',
    'lectura crítica': 'Lectura Crítica',
    'sociales y ciudadanas': 'Sociales y Ciudadanas',
    'ciencias naturales': 'Ciencias Naturales',
    'inglés': 'Inglés',
};

export const MATERIA_COLORS: Record<string, string> = { ...SG_AREA_HEX };

const MATERIA_ORDER = [
    'lectura crítica',
    'matemáticas',
    'sociales y ciudadanas',
    'ciencias naturales',
    'inglés',
];

/** Resuelve sesión S1/S2 cuando estadísticas no traen campo `sesion`. */
export function resolveSesionNum(materia: string, numero: number, sesion?: string): 1 | 2 {
    const sesionMatch = sesion?.match(/S([12])/i);
    if (sesionMatch) return Number(sesionMatch[1]) as 1 | 2;

    const m = materia.toLowerCase();
    if (m.includes('matemáticas') || m.includes('matematicas')) return numero <= 25 ? 1 : 2;
    if (m.includes('lectura')) return 1;
    if (m.includes('sociales') || m.includes('ciudadanas')) return numero <= 25 ? 2 : 1;
    if (m.includes('naturales') || m.includes('ciencias')) return numero >= 92 ? 1 : 2;
    if (m.includes('inglés') || m.includes('ingles')) return 2;
    return 1;
}

export function groupPreguntasBySesion(
    materia: string,
    preguntas: ClavePregunta[],
): { sesion: 1 | 2; items: ClavePregunta[] }[] {
    const buckets: Record<1 | 2, ClavePregunta[]> = { 1: [], 2: [] };
    for (const p of preguntas) {
        const s = resolveSesionNum(materia, p.numero, p.sesion);
        buckets[s].push(p);
    }
    return ([1, 2] as const)
        .map((sesion) => ({
            sesion,
            items: buckets[sesion].sort((a, b) => a.numero - b.numero),
        }))
        .filter((g) => g.items.length > 0);
}

export function sortMateriasClaves(entries: [string, ClavePregunta[]][]): [string, ClavePregunta[]][] {
    return [...entries].sort(([a], [b]) => {
        const ia = MATERIA_ORDER.indexOf(a);
        const ib = MATERIA_ORDER.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
    });
}

export function aciertoTone(pct: number): { bar: string; text: string } {
    if (pct >= 70) return { bar: 'bg-emerald-400', text: 'text-emerald-300' };
    if (pct >= 45) return { bar: 'bg-amber-400', text: 'text-amber-300' };
    return { bar: 'bg-rose-400', text: 'text-rose-300' };
}
