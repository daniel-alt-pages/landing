import { ICFES_AREA_COLORS, icfesAreaGradient } from '@features/coordinador/lib/icfesAreaColors';

export const MATERIAS = [
    {
        key: 'lectura crítica',
        label: 'Lectura Crítica',
        color: ICFES_AREA_COLORS['lectura crítica'],
        gradient: icfesAreaGradient('lectura crítica'),
    },
    {
        key: 'matemáticas',
        label: 'Matemáticas',
        color: ICFES_AREA_COLORS['matemáticas'],
        gradient: icfesAreaGradient('matemáticas'),
    },
    {
        key: 'sociales y ciudadanas',
        label: 'Sociales',
        color: ICFES_AREA_COLORS['sociales y ciudadanas'],
        gradient: icfesAreaGradient('sociales y ciudadanas'),
    },
    {
        key: 'ciencias naturales',
        label: 'Ciencias Nat.',
        color: ICFES_AREA_COLORS['ciencias naturales'],
        gradient: icfesAreaGradient('ciencias naturales'),
    },
    {
        key: 'inglés',
        label: 'Inglés',
        color: ICFES_AREA_COLORS['inglés'],
        gradient: icfesAreaGradient('inglés'),
    },
];

/** Nombres completos para UI (filtros, tablas). */
const AREA_DISPLAY_NAMES: Record<string, string> = {
    'lectura crítica': 'Lectura Crítica',
    'lectura critica': 'Lectura Crítica',
    'matemáticas': 'Matemáticas',
    'matematicas': 'Matemáticas',
    'sociales y ciudadanas': 'Sociales y Ciudadanas',
    'ciencias naturales': 'Ciencias Naturales',
    'inglés': 'Inglés',
    'ingles': 'Inglés',
};

const TITLE_CASE_LOWER_WORDS = new Set(['y', 'e', 'de', 'del', 'la', 'las', 'el', 'los', 'en', 'a']);

function toSpanishTitleCase(text: string): string {
    return text
        .trim()
        .toLocaleLowerCase('es-CO')
        .split(/\s+/)
        .filter(Boolean)
        .map((word, index) => {
            if (index > 0 && TITLE_CASE_LOWER_WORDS.has(word)) return word;
            if (!word) return word;
            return word.charAt(0).toLocaleUpperCase('es-CO') + word.slice(1);
        })
        .join(' ');
}

/** Etiqueta legible de área ICFES (tildes y mayúsculas correctas). */
export function formatAreaDisplayName(area: string): string {
    const key = area.trim().toLowerCase();
    return AREA_DISPLAY_NAMES[key] ?? toSpanishTitleCase(area);
}
