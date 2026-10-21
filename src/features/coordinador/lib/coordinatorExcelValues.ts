/**
 * Helpers de completitud para export Excel coordinador.
 * Política: Sin dato (texto), No aplica (métrica), 0 solo si es medición real.
 */

export const MISSING_TEXT = 'Sin dato';
export const NOT_APPLICABLE = 'No aplica';

export function isBlank(value: unknown): boolean {
    if (value == null) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    return false;
}

export function displayText(value: unknown, fallback = MISSING_TEXT): string {
    if (isBlank(value)) return fallback;
    return String(value).trim();
}

export function displayMetric(value: unknown, fallback = NOT_APPLICABLE): string | number {
    if (value == null || value === '') return fallback;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '' || trimmed === '—' || trimmed === '-') return fallback;
        const n = Number(trimmed);
        if (Number.isFinite(n) && /^-?\d/.test(trimmed)) return n;
        return trimmed;
    }
    return fallback;
}

export function safePct(numerator: number, denominator: number, decimals = 1): string {
    if (!denominator || denominator <= 0 || !Number.isFinite(numerator)) return NOT_APPLICABLE;
    return `${((numerator / denominator) * 100).toFixed(decimals)}%`;
}

export function safeRatio(
    numerator: number,
    denominator: number,
    fallback: string | number = NOT_APPLICABLE
): string | number {
    if (!denominator || denominator <= 0 || !Number.isFinite(numerator)) return fallback;
    return numerator / denominator;
}

/** Puntaje de área: 0 real se conserva; null/undefined -> Sin dato */
export function displayAreaScore(score: number | null | undefined, hasAttempt = true): string | number {
    if (!hasAttempt) return NOT_APPLICABLE;
    if (score == null || score === undefined) return MISSING_TEXT;
    return score;
}

export function displayScoreOrDash(score: number, threshold = 0): string | number {
    if (score > threshold) return score;
    if (score === 0) return 0;
    return MISSING_TEXT;
}

export function correlationMagnitude(r: number): string {
    const abs = Math.abs(r);
    if (abs >= 0.7) return 'Fuerte';
    if (abs >= 0.4) return 'Moderada';
    if (abs >= 0.2) return 'Débil';
    return 'Muy débil';
}

export function cvInterpretation(cvPct: number): string {
    if (cvPct >= 25) return 'Alta dispersión relativa';
    if (cvPct >= 15) return 'Dispersión moderada';
    if (cvPct > 0) return 'Baja dispersión relativa';
    return NOT_APPLICABLE;
}

export function sampleSizeWarning(n: number, threshold = 30): string | null {
    if (n < threshold) {
        return `Advertencia: N=${n} (<${threshold}). Interpretar con cautela.`;
    }
    return null;
}
