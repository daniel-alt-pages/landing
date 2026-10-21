export type GroupDifficultyLevel = 'alta' | 'media' | 'baja';

export type GroupDifficultyMeta = {
    level: GroupDifficultyLevel;
    label: string;
    shortLabel: string;
    successRate: number;
    failRatePct: number;
    bg: string;
    fg: string;
    border: string;
};

/** Dificultad grupal a partir de la tasa de fallo institucional (0–1). */
export function groupDifficultyFromFailRate(failRate: number): GroupDifficultyMeta {
    const clamped = Math.max(0, Math.min(1, failRate));
    const successRate = Math.round((1 - clamped) * 100);
    const failRatePct = Math.round(clamped * 100);

    if (clamped > 0.7) {
        return {
            level: 'alta',
            label: 'Alta',
            shortLabel: 'Alta',
            successRate,
            failRatePct,
            bg: 'rgba(239,68,68,0.2)',
            fg: '#f87171',
            border: 'rgba(239,68,68,0.35)',
        };
    }
    if (clamped > 0.3) {
        return {
            level: 'media',
            label: 'Media',
            shortLabel: 'Med',
            successRate,
            failRatePct,
            bg: 'rgba(251,191,36,0.15)',
            fg: '#fbbf24',
            border: 'rgba(251,191,36,0.3)',
        };
    }
    return {
        level: 'baja',
        label: 'Baja',
        shortLabel: 'Baja',
        successRate,
        failRatePct,
        bg: 'rgba(52,211,153,0.12)',
        fg: '#34d399',
        border: 'rgba(52,211,153,0.25)',
    };
}
