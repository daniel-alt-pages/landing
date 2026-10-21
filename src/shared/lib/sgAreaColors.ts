import type { CSSProperties } from 'react';

/**
 * Paleta oficial SG por área ICFES (MAT azul · LEC rojo · SOC naranja · CIEN verde · ING morado).
 * Fuente única para paneles coordinador y estudiante.
 */
export const SG_AREA_ORDER = [
  'lectura crítica',
  'matemáticas',
  'sociales y ciudadanas',
  'ciencias naturales',
  'inglés',
] as const;

/** Orden usado en chips MAT/LEC/SOC del dashboard coordinador. */
export const SG_DASHBOARD_AREA_ORDER = [
  'matemáticas',
  'lectura crítica',
  'sociales y ciudadanas',
  'ciencias naturales',
  'inglés',
] as const;

export type SgAreaKey = (typeof SG_AREA_ORDER)[number];

export type SgCoordAccent = 'blue' | 'red' | 'amber' | 'emerald' | 'violet';

export type SgAreaColorDef = {
  key: SgAreaKey;
  label: string;
  short: string;
  hex: string;
  hexDark: string;
  gradient: string;
  bg: string;
  text: string;
  border: string;
  coordAccent: SgCoordAccent;
};

export const SG_AREA_COLORS: Record<SgAreaKey, SgAreaColorDef> = {
  'lectura crítica': {
    key: 'lectura crítica',
    label: 'Lectura Crítica',
    short: 'LEC',
    hex: '#EF4444',
    hexDark: '#DC2626',
    gradient: 'from-red-500 to-red-600',
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    coordAccent: 'red',
  },
  matemáticas: {
    key: 'matemáticas',
    label: 'Matemáticas',
    short: 'MAT',
    hex: '#2563EB',
    hexDark: '#1D4ED8',
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    coordAccent: 'blue',
  },
  'sociales y ciudadanas': {
    key: 'sociales y ciudadanas',
    label: 'Competencias ciudadanas',
    short: 'SOC',
    hex: '#F97316',
    hexDark: '#EA580C',
    gradient: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    coordAccent: 'amber',
  },
  'ciencias naturales': {
    key: 'ciencias naturales',
    label: 'Ciencias Naturales',
    short: 'CIEN',
    hex: '#22C55E',
    hexDark: '#16A34A',
    gradient: 'from-green-500 to-green-600',
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
    coordAccent: 'emerald',
  },
  inglés: {
    key: 'inglés',
    label: 'Inglés',
    short: 'ING',
    hex: '#8B5CF6',
    hexDark: '#7C3AED',
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    border: 'border-violet-200',
    coordAccent: 'violet',
  },
};

const SG_AREA_ALIASES: Record<string, SgAreaKey> = {
  'lectura critica': 'lectura crítica',
  lectura: 'lectura crítica',
  'lectura crítica': 'lectura crítica',
  matematicas: 'matemáticas',
  matemáticas: 'matemáticas',
  mat: 'matemáticas',
  sociales: 'sociales y ciudadanas',
  'sociales y ciudadanas': 'sociales y ciudadanas',
  'competencias ciudadanas': 'sociales y ciudadanas',
  ciencias: 'ciencias naturales',
  'ciencias naturales': 'ciencias naturales',
  ingles: 'inglés',
  inglés: 'inglés',
};

const SUBJECT_DISPLAY_TO_KEY: Record<string, SgAreaKey> = {
  Matemáticas: 'matemáticas',
  'Lectura Crítica': 'lectura crítica',
  Sociales: 'sociales y ciudadanas',
  'Sociales y Ciudadanas': 'sociales y ciudadanas',
  'Competencias ciudadanas': 'sociales y ciudadanas',
  Ciencias: 'ciencias naturales',
  'Ciencias Naturales': 'ciencias naturales',
  Inglés: 'inglés',
};

function normalizeAreaKey(areaKey: string): SgAreaKey | null {
  const k = areaKey.trim().toLowerCase();
  if (k in SG_AREA_COLORS) return k as SgAreaKey;
  return SG_AREA_ALIASES[k] ?? null;
}

export function sgAreaColor(areaKey: string): SgAreaColorDef {
  const key = normalizeAreaKey(areaKey);
  if (key) return SG_AREA_COLORS[key];
  return SG_AREA_COLORS['lectura crítica'];
}

export function sgAreaHex(areaKey: string): string {
  return sgAreaColor(areaKey).hex;
}

export function sgAreaHexPair(areaKey: string): [string, string] {
  const c = sgAreaColor(areaKey);
  return [c.hex, c.hexDark];
}

export function sgAreaCoordAccent(areaKey: string): SgCoordAccent {
  return sgAreaColor(areaKey).coordAccent;
}

export function sgAreaHexBySubjectName(name: string): string {
  const key = SUBJECT_DISPLAY_TO_KEY[name.trim()];
  return key ? SG_AREA_COLORS[key].hex : '#818cf8';
}

export function sgAreaHexList(keys: readonly string[]): string[] {
  return keys.map((key) => sgAreaHex(key));
}

export const SG_MATERIAS_DASHBOARD = SG_AREA_ORDER.map((key) => {
  const c = SG_AREA_COLORS[key];
  return {
    key: c.key,
    label: c.label,
    color: c.hex,
    bg: c.bg,
    text: c.text,
    border: c.border,
  };
});

export function sgSessionSelectedStyle(hex: string, isDark: boolean): CSSProperties {
  return {
    boxShadow: `inset 3px 0 0 0 ${hex}`,
    borderColor: `${hex}${isDark ? '55' : '70'}`,
    backgroundColor: `${hex}${isDark ? '18' : '12'}`,
  };
}

export const SG_AREA_HEX: Record<string, string> = Object.fromEntries(
  SG_AREA_ORDER.map((key) => [key, SG_AREA_COLORS[key].hex]),
);

export const SG_AREA_HEX_BY_SUBJECT: Record<string, string> = Object.fromEntries(
  Object.entries(SUBJECT_DISPLAY_TO_KEY).map(([label, key]) => [label, SG_AREA_COLORS[key].hex]),
);
