import { SG_AREA_COLORS, SG_AREA_ORDER, type SgAreaKey } from '@shared/lib/sgAreaColors';

const ICFES_ASSET_BASE = 'https://resultadossaber11.icfes.gov.co/assets/images/dashboard';

export const ICFES_GLOBAL_TROPHY_ICON = `${ICFES_ASSET_BASE}/puntaje-global-modal.svg`;

export const ICFES_SUBJECT_ICONS: Record<SgAreaKey, string> = {
  'lectura crítica': `${ICFES_ASSET_BASE}/pruebasModal/lectura-critica.svg`,
  matemáticas: `${ICFES_ASSET_BASE}/pruebasModal/matematicas.svg`,
  'sociales y ciudadanas': `${ICFES_ASSET_BASE}/pruebasModal/sociales-ciudadanas.svg`,
  'ciencias naturales': `${ICFES_ASSET_BASE}/pruebasModal/ciencias-naturales.svg`,
  inglés: `${ICFES_ASSET_BASE}/pruebasModal/ingles.svg`,
};

/** Ponderación oficial Saber 11 (suma 13). */
export const ICFES_SUBJECT_WEIGHTS: Record<SgAreaKey, number> = {
  'lectura crítica': 3,
  matemáticas: 3,
  'sociales y ciudadanas': 3,
  'ciencias naturales': 3,
  inglés: 1,
};

export const ICFES_TOTAL_WEIGHT = 13;

/** Tope orientativo de puntaje por prueba con un solo error (calibración actual). */
export const ICFES_SINGLE_ERROR_SCORE_CAP = 89;

export const ICFES_SINGLE_ERROR_SCORE_MIN = 80;

export const ICFES_GLOBAL_SCALE_MAX = 500;

export type SubjectPuntaje = {
  puntaje: number;
  correctas?: number;
  total_preguntas?: number;
};

export type IcfesGlobalScoreRow = {
  key: SgAreaKey;
  label: string;
  short: string;
  hex: string;
  iconUrl: string;
  score: number;
  weight: number;
  weighted: number;
  hasData: boolean;
  /** % del total ponderado que aporta esta materia. */
  contributionPct: number;
  inSingleErrorRange: boolean;
};

export type IcfesGlobalScoreBreakdown = {
  rows: IcfesGlobalScoreRow[];
  sumWeighted: number;
  average: number;
  scaled: number;
  computedGlobal: number;
  /** Coincide fórmula simple con puntaje oficial del simulacro. */
  matchesOfficial: boolean;
  activeRowCount: number;
};

function readSubjectEntry(
  puntajes: Record<string, SubjectPuntaje | undefined>,
  key: SgAreaKey,
): { score: number; hasData: boolean } {
  const entry = puntajes[key];
  const total = entry?.total_preguntas ?? 0;
  const raw = entry?.puntaje;
  const hasData = total > 0 || (typeof raw === 'number' && raw > 0);
  if (!hasData) return { score: 0, hasData: false };
  const score = typeof raw === 'number' && Number.isFinite(raw) ? Math.round(raw) : 0;
  return { score, hasData: true };
}

export function isSingleErrorScoreRange(score: number): boolean {
  return score >= ICFES_SINGLE_ERROR_SCORE_MIN && score <= ICFES_SINGLE_ERROR_SCORE_CAP;
}

/** Desglose ICFES: (Σ puntaje×ponderación / 13) × 5, redondeado. */
export function buildIcfesGlobalScoreBreakdown(
  puntajes: Record<string, SubjectPuntaje | undefined>,
  officialGlobal?: number,
): IcfesGlobalScoreBreakdown {
  const rows: IcfesGlobalScoreRow[] = SG_AREA_ORDER.map((key) => {
    const { score, hasData } = readSubjectEntry(puntajes, key);
    const weight = ICFES_SUBJECT_WEIGHTS[key];
    const area = SG_AREA_COLORS[key];
    return {
      key,
      label: area.label,
      short: area.short,
      hex: area.hex,
      iconUrl: ICFES_SUBJECT_ICONS[key],
      score,
      weight,
      weighted: score * weight,
      hasData,
      contributionPct: 0,
      inSingleErrorRange: hasData && isSingleErrorScoreRange(score),
    };
  });

  const sumWeighted = rows.reduce((sum, row) => sum + row.weighted, 0);
  const average = sumWeighted / ICFES_TOTAL_WEIGHT;
  const scaled = average * 5;
  const computedGlobal = Math.round(scaled);
  const activeRowCount = rows.filter((r) => r.hasData).length;

  const rowsWithShare = rows.map((row) => ({
    ...row,
    contributionPct: sumWeighted > 0 ? (row.weighted / sumWeighted) * 100 : 0,
  }));

  const official =
    typeof officialGlobal === 'number' && Number.isFinite(officialGlobal)
      ? Math.round(officialGlobal)
      : computedGlobal;

  return {
    rows: rowsWithShare,
    sumWeighted,
    average,
    scaled,
    computedGlobal,
    matchesOfficial: official === computedGlobal,
    activeRowCount,
  };
}

export function formatIcfesDecimal(value: number, digits = 2): string {
  return value.toLocaleString('es-CO', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
