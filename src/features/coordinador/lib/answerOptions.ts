/**
 * Opciones canónicas ICFES + sin respuesta (simulacro físico).
 * Entrada cruda: N/A, NA, vacío, guiones → clave canónica `NA`.
 */
export const SIN_RESPUESTA_CODE = 'NA' as const;
export const NO_RESPONSE_CODE = SIN_RESPUESTA_CODE;

/** Etiqueta visible en tablas (NA = sin respuesta) */
export const NO_RESPONSE_LABEL = 'NA — sin respuesta';

export const LETTER_OPTIONS = ['A', 'B', 'C', 'D'] as const;

export const ALL_ANSWER_OPTIONS = [...LETTER_OPTIONS, SIN_RESPUESTA_CODE] as const;

/** A–D más E–Z presentes en counts, studentMap o respuesta correcta (p. ej. matching de inglés). */
export function resolveQuestionLetters(
    counts: Record<string, number> | undefined,
    correct?: string,
    studentMap?: Record<string, string[]>,
): string[] {
    const letters = new Set<string>(LETTER_OPTIONS);

    const maybeAdd = (key: string) => {
        const k = String(key ?? '').trim().toUpperCase();
        if (/^[A-Z]$/.test(k)) letters.add(k);
    };

    Object.keys(counts ?? {}).forEach(maybeAdd);
    Object.keys(studentMap ?? {}).forEach(maybeAdd);
    maybeAdd(String(correct ?? '').trim().toUpperCase().slice(0, 1));

    return Array.from(letters).sort();
}

const SIN_RESPUESTA_ALIASES = new Set([
    '',
    'N/A',
    '#N/A',
    'NA',
    'NAN',
    'NR',
    'SIN RESPUESTA',
    'SIN RESPUESTA.',
    'NO RESPONDIO',
    'NO RESPONDIÓ',
    '-',
    '—',
]);

export function isNoAnswerOption(opt: string): boolean {
    const key = String(opt ?? '').trim().toUpperCase();
    return !key || SIN_RESPUESTA_ALIASES.has(key);
}

export function normalizeAnswerOption(opt: string): string {
    if (isNoAnswerOption(opt)) return SIN_RESPUESTA_CODE;
    return String(opt).trim().toUpperCase();
}

/** Suma NA + N/A + NR + alias (compatible con datos antiguos y nuevos). */
export function noAnswerCount(counts: Record<string, number> | undefined): number {
    if (!counts) return 0;
    return Object.entries(counts).reduce(
        (sum, [key, val]) => (isNoAnswerOption(key) ? sum + (Number(val) || 0) : sum),
        0,
    );
}

export function noAnswerStudents(map: Record<string, string[]> | undefined): string[] {
    if (!map) return [];
    return Object.entries(map).flatMap(([key, names]) =>
        isNoAnswerOption(key) ? names : [],
    );
}

export function displayAnswerLabel(code: string | undefined | null): string {
    if (!code || isNoAnswerOption(code)) return SIN_RESPUESTA_CODE;
    return String(code).trim().toUpperCase();
}

/** Distractor académico: mayor opción incorrecta (incluye E–Z en ítems de matching). */
export function topAcademicDistractor(
    counts: Record<string, number> | undefined,
    correct: string,
): { option: string; count: number } {
    const correctKey = String(correct || '').trim().toUpperCase().slice(0, 1);
    let best = '—';
    let bestCount = 0;
    for (const l of resolveQuestionLetters(counts, correct)) {
        if (l === correctKey) continue;
        const c = counts?.[l] || 0;
        if (c > bestCount) {
            bestCount = c;
            best = l;
        }
    }
    return { option: best, count: bestCount };
}

/** True si NA supera a todas las opciones académicas. */
export function hasHighNoAnswerRate(
    counts: Record<string, number> | undefined,
    total: number,
    threshold = 0.25,
): boolean {
    if (total <= 0) return false;
    const na = noAnswerCount(counts);
    const maxLetter = Math.max(...LETTER_OPTIONS.map(l => counts?.[l] || 0), 0);
    return na / total >= threshold && na > maxLetter;
}
