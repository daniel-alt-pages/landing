import type { CSSProperties } from 'react';
import { SG_AREA_COLORS, type SgAreaKey } from '@/shared/lib/sgAreaColors';

const TITLE_AREA_PATTERNS: { pattern: RegExp; key: SgAreaKey }[] = [
  { pattern: /lectura\s*cr[ií]tica|area\s*\(\s*lectura\s*\)/i, key: 'lectura crítica' },
  { pattern: /matem[aá]ticas?/i, key: 'matemáticas' },
  {
    pattern:
      /competencias?\s*ciudadanas?|area\s*\(\s*sociales\s*\)|sociales\s*y\s*ciudadanas?/i,
    key: 'sociales y ciudadanas',
  },
  { pattern: /ciencias?\s*naturales?/i, key: 'ciencias naturales' },
  { pattern: /ingl[eé]s?/i, key: 'inglés' },
];

export function vacacionalEventAreaKey(title: string): SgAreaKey | null {
  for (const { pattern, key } of TITLE_AREA_PATTERNS) {
    if (pattern.test(title)) return key;
  }
  return null;
}

/** Color de título: área ICFES si coincide; negro si no. */
export function vacacionalEventTitleColor(title: string): string {
  const key = vacacionalEventAreaKey(title);
  return key ? SG_AREA_COLORS[key].hexDark : '#0f172a';
}

export type VacacionalEventCardTheme = {
  areaKey: SgAreaKey | null;
  titleColor: string;
  cardStyle: CSSProperties;
  meetStyle: CSSProperties;
};

/** Tarjeta completa con degradado del área (o neutro si no hay área). */
export function vacacionalEventCardTheme(
  title: string,
  isDark = false,
): VacacionalEventCardTheme {
  const key = vacacionalEventAreaKey(title);
  if (!key) {
    return {
      areaKey: null,
      titleColor: isDark ? 'var(--course-text)' : '#0f172a',
      cardStyle: isDark
        ? {
            background:
              'linear-gradient(145deg, var(--course-surface-muted) 0%, var(--course-surface) 100%)',
            borderColor: 'var(--course-border)',
          }
        : {
            background: 'linear-gradient(145deg, #ffffff 0%, #e2e8f0 100%)',
            borderColor: '#cbd5e1',
          },
      meetStyle: { backgroundColor: isDark ? 'var(--course-accent)' : '#334155' },
    };
  }
  const c = SG_AREA_COLORS[key];
  if (isDark) {
    return {
      areaKey: key,
      titleColor: 'var(--course-text)',
      cardStyle: {
        background: `linear-gradient(145deg, ${c.hexDark}cc 0%, ${c.hexDark} 52%, ${c.hex}88 100%)`,
        borderColor: `${c.hex}90`,
        boxShadow: '0 2px 10px rgb(0 0 0 / 0.35)',
      },
      meetStyle: { backgroundColor: c.hexDark },
    };
  }
  return {
    areaKey: key,
    titleColor: c.hexDark,
    cardStyle: {
      background: `linear-gradient(145deg, ${c.hex}22 0%, ${c.hex}38 48%, ${c.hexDark}28 100%)`,
      borderColor: `${c.hex}70`,
      boxShadow: `0 2px 8px ${c.hex}25`,
    },
    meetStyle: { backgroundColor: c.hexDark },
  };
}