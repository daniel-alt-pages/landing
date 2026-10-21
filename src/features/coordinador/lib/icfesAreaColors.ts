import type { IcfesAreaKey } from '@features/coordinador/lib/icfesCurricularModel';

/**
 * Paleta canónica por área ICFES (marca SG).
 * azul → matemáticas · rojo → lectura · salmón → ciudadanas · verde → ciencias · morado → inglés
 */
export const ICFES_AREA_COLORS: Record<IcfesAreaKey, string> = {
    'matemáticas': '#007AFF',
    'lectura crítica': '#EF4444',
    'sociales y ciudadanas': '#FF8566',
    'ciencias naturales': '#22C55E',
    'inglés': '#9333EA',
};

const ALIAS: Record<string, IcfesAreaKey> = {
    matematicas: 'matemáticas',
    'lectura critica': 'lectura crítica',
    sociales: 'sociales y ciudadanas',
    ciudadanas: 'sociales y ciudadanas',
    ciencias: 'ciencias naturales',
    ingles: 'inglés',
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const raw = hex.replace('#', '');
    const normalized =
        raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
    const n = Number.parseInt(normalized, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Mezcla un hex con blanco para texto legible sobre fondo oscuro (~WCAG AA). */
export function mixHexWithWhite(hex: string, whiteRatio = 0.55): string {
    const { r, g, b } = hexToRgb(hex);
    const mix = (c: number) => Math.round(c + (255 - c) * whiteRatio);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/** Tinte de acento legible sobre fondos oscuros (severidad, orden, etc.). */
export function accentTextOnDark(hex: string): string {
    return mixHexWithWhite(hex, 0.52);
}

export function resolveIcfesAreaKey(key: string): IcfesAreaKey | null {
    const k = key.trim().toLowerCase();
    if (k in ICFES_AREA_COLORS) return k as IcfesAreaKey;
    return ALIAS[k] ?? null;
}

export function getIcfesAreaColor(key: string | undefined | null, fallback = '#94a3b8'): string {
    if (!key) return fallback;
    const resolved = resolveIcfesAreaKey(key);
    if (resolved) return ICFES_AREA_COLORS[resolved];
    const lower = key.toLowerCase();
    for (const [areaKey, color] of Object.entries(ICFES_AREA_COLORS)) {
        if (lower.includes(areaKey) || areaKey.includes(lower)) return color;
    }
    return fallback;
}

export function icfesAreaRgba(key: string, alpha: number): string {
    const { r, g, b } = hexToRgb(getIcfesAreaColor(key));
    return `rgba(${r},${g},${b},${alpha})`;
}

export function icfesAreaTextOnDark(key: string): string {
    return mixHexWithWhite(getIcfesAreaColor(key), 0.55);
}

export function icfesAreaStyle(key: string) {
    const color = getIcfesAreaColor(key);
    return {
        color,
        textOnDark: icfesAreaTextOnDark(key),
        bg: icfesAreaRgba(key, 0.12),
        border: icfesAreaRgba(key, 0.28),
    };
}

export function icfesAreaGradient(key: string): string {
    const color = getIcfesAreaColor(key);
    return `linear-gradient(135deg, ${color}, ${icfesAreaRgba(key, 0.72)})`;
}

/** Variables CSS para shells/burbujas con acento por área activa. */
export function icfesAreaAccentVars(key: string): Record<string, string> {
    const hex = getIcfesAreaColor(key);
    const { r, g, b } = hexToRgb(hex);
    return {
        '--coord-area-accent': hex,
        '--coord-area-accent-rgb': `${r}, ${g}, ${b}`,
    };
}

export function icfesAreaItemAccentVars(key: string): Record<string, string> {
    const { r, g, b } = hexToRgb(getIcfesAreaColor(key));
    return { '--item-accent-rgb': `${r}, ${g}, ${b}` };
}
