import type { StyleSpecification } from 'maplibre-gl';
import type { LandingTone } from '../tipos';
import type {
  LandingImpactDepartmentRow,
  LandingImpactSubjectAverages,
  LandingImpactSubjectKey,
  LandingImpactSummary,
} from '../tipos/landingReference';

export const impactSubjectAreas = [
  { key: 'matemáticas' as const, short: 'Mat.', label: 'Matemáticas' },
  { key: 'lectura crítica' as const, short: 'Lect.', label: 'Lectura crítica' },
  { key: 'sociales y ciudadanas' as const, short: 'Soc.', label: 'Sociales' },
  { key: 'ciencias naturales' as const, short: 'Cien.', label: 'Ciencias' },
  { key: 'inglés' as const, short: 'Ing.', label: 'Inglés' },
] satisfies ReadonlyArray<{ key: LandingImpactSubjectKey; short: string; label: string }>;

const subjectScoreFormatter = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function formatSubjectAverageScore(value: number | null | undefined) {
  if (value == null || Number.isNaN(value) || value <= 0) return '—';
  return subjectScoreFormatter.format(value);
}

export function getDepartmentSubjectScores(
  subjectAverages?: LandingImpactSubjectAverages,
): Array<{ key: LandingImpactSubjectKey; short: string; label: string; score: number | null }> {
  return impactSubjectAreas.map((area) => ({
    ...area,
    score: subjectAverages?.[area.key] ?? null,
  }));
}

export function hasDepartmentSubjectScores(row: Pick<LandingImpactDepartmentRow, 'subjectAverages'>) {
  return getDepartmentSubjectScores(row.subjectAverages).some((item) => item.score != null && item.score > 0);
}

export const numberFormatter = new Intl.NumberFormat('es-CO');
export const scorePerformanceBands = [
  {
    id: 'inicial',
    label: 'Inicial',
    range: '<250',
    description: 'requiere refuerzo',
  },
  {
    id: 'basico',
    label: 'Básico',
    range: '250-299',
    description: 'en consolidación',
  },
  {
    id: 'alto',
    label: 'Alto',
    range: '300-349',
    description: 'desempeño favorable',
  },
  {
    id: 'superior',
    label: 'Superior',
    range: '350+',
    description: 'desempeño destacado',
  },
] as const;
export type ScorePerformanceId = (typeof scorePerformanceBands)[number]['id'];

export function getScorePerformance(score: number) {
  if (score >= 350) return scorePerformanceBands[3];
  if (score >= 300) return scorePerformanceBands[2];
  if (score >= 250) return scorePerformanceBands[1];
  return scorePerformanceBands[0];
}

export function getScorePerformanceClass(id: ScorePerformanceId, tone: LandingTone) {
  const darkClasses: Record<ScorePerformanceId, string> = {
    inicial: 'bg-rose-400/10 text-rose-100 ring-rose-300/20',
    basico: 'bg-amber-300/10 text-amber-100 ring-amber-200/20',
    alto: 'bg-sky-300/10 text-sky-100 ring-sky-200/20',
    superior: 'bg-emerald-300/10 text-emerald-100 ring-emerald-200/20',
  };
  const lightClasses: Record<ScorePerformanceId, string> = {
    inicial: 'bg-rose-50 text-rose-800 ring-rose-100',
    basico: 'bg-amber-50 text-amber-800 ring-amber-100',
    alto: 'bg-sky-50 text-sky-800 ring-sky-100',
    superior: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
  };
  return tone === 'light' ? lightClasses[id] : darkClasses[id];
}

export function buildImpactDepartmentRows(summary: LandingImpactSummary) {
  return summary.departments.filter((row) => row.department !== 'No especificado' && row.uniqueUsers > 0);
}

export function buildImpactMaxUsers(rows: ReturnType<typeof buildImpactDepartmentRows>) {
  return Math.max(...rows.map((row) => row.uniqueUsers), 1);
}

export type ImpactMetricCard = {
  label: string;
  value: string;
  detail: string;
  emphasis?: boolean;
};

/** Definiciones alineadas con `build-landing-impact-summary.mjs` (puntaje_global > 0). */
export const impactValidityDefinitions = [
  {
    term: 'Intento registrado',
    definition:
      'Cada estudiante listado en un ciclo de simulacro, aunque el puntaje global haya quedado en 0 o incompleto.',
  },
  {
    term: 'Simulacro válido',
    definition:
      'Intento con puntaje global mayor a 0: hubo calificación utilizable en ese ciclo (es lo que usamos para promedios y mapas).',
  },
  {
    term: 'Tasa de éxito',
    definition: 'Porcentaje de simulacros válidos con puntaje global igual o superior a 300 sobre 500.',
  },
] as const;

const percentFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 1,
});

function buildWeightedSuccessRate(rows: ReturnType<typeof buildImpactDepartmentRows>) {
  let weighted = 0;
  let validTotal = 0;
  for (const row of rows) {
    if (row.validEvaluations <= 0) continue;
    weighted += row.successRate * row.validEvaluations;
    validTotal += row.validEvaluations;
  }
  return validTotal > 0 ? weighted / validTotal : 0;
}

function pickTopDepartmentByUsers(rows: ReturnType<typeof buildImpactDepartmentRows>) {
  return rows.reduce<(typeof rows)[number] | null>(
    (best, row) => (!best || row.uniqueUsers > best.uniqueUsers ? row : best),
    null,
  );
}

function pickTopDepartmentByScore(rows: ReturnType<typeof buildImpactDepartmentRows>, minValid = 30) {
  const eligible = rows.filter(
    (row) => row.averageScore != null && row.validEvaluations >= minValid,
  );
  if (!eligible.length) return null;
  return eligible.reduce<(typeof eligible)[number]>(
    (best, row) => ((row.averageScore ?? 0) > (best.averageScore ?? 0) ? row : best),
    eligible[0],
  );
}

export function buildImpactMetricCards(summary: LandingImpactSummary): ImpactMetricCard[] {
  const rows = buildImpactDepartmentRows(summary);
  const { totals } = summary;
  const validSharePct =
    totals.evaluations > 0 ? (totals.validEvaluations / totals.evaluations) * 100 : 0;
  const evalsPerUser = totals.uniqueUsers > 0 ? totals.validEvaluations / totals.uniqueUsers : 0;
  const globalSuccessRate = buildWeightedSuccessRate(rows);
  const topUsers = pickTopDepartmentByUsers(rows);
  const topScore = pickTopDepartmentByScore(rows);

  const cards: ImpactMetricCard[] = [
    {
      label: 'Usuarios únicos',
      value: numberFormatter.format(totals.uniqueUsers),
      detail: 'estudiantes sin duplicar documento entre todos los simulacros',
    },
    {
      label: 'Simulacros válidos',
      value: numberFormatter.format(totals.validEvaluations),
      detail: `${numberFormatter.format(totals.evaluations)} intentos registrados · válido = puntaje global > 0`,
    },
    {
      label: 'Simulacros acumulados',
      value: numberFormatter.format(totals.simulations),
      detail: `ciclos ${summary.simulations.slice(-3).join(', ')} y anteriores en la serie`,
    },
    {
      label: 'Promedio global',
      value: `${totals.averageScore}/500`,
      detail: 'puntaje medio solo sobre simulacros válidos (puntaje global > 0)',
      emphasis: true,
    },
    {
      label: 'Tasa de éxito',
      value: `${percentFormatter.format(globalSuccessRate)}%`,
      detail: 'simulacros válidos con puntaje ≥ 300/500 (promedio ponderado por departamento)',
      emphasis: true,
    },
    {
      label: 'Intentos por estudiante',
      value: percentFormatter.format(evalsPerUser),
      detail: 'promedio de simulacros válidos por usuario único',
    },
    {
      label: 'Calidad de intentos',
      value: `${percentFormatter.format(validSharePct)}%`,
      detail: 'intentos que pasan a simulacro válido (puntaje global > 0)',
    },
    {
      label: 'Departamentos',
      value: numberFormatter.format(totals.departments),
      detail: 'cobertura territorial con al menos un estudiante evaluado',
    },
  ];

  if (topUsers) {
    cards.push({
      label: 'Mayor concentración',
      value: topUsers.department,
      detail: `${numberFormatter.format(topUsers.uniqueUsers)} usuarios · ${percentFormatter.format(topUsers.successRate)}% éxito en el departamento`,
      emphasis: true,
    });
  }

  if (topScore?.averageScore != null) {
    cards.push({
      label: 'Mejor promedio regional',
      value: `${topScore.averageScore}/500`,
      detail: `${topScore.department} · ${numberFormatter.format(topScore.validEvaluations)} simulacros válidos`,
    });
  }

  return cards;
}

export function buildImpactDepartmentByKey(summary: LandingImpactSummary) {
  return new Map(summary.departments.map((row) => [normalizeDepartmentKey(row.department), row]));
}

export type LngLatPoint = [number, number];
export type ColombiaLatLonFeature = {
  type: 'Feature';
  properties: { DPTO?: string; NOMBRE_DPT?: string };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: LngLatPoint[][] | LngLatPoint[][][];
  };
};

export type ColombiaImpactFeature = ColombiaLatLonFeature & {
  type: 'Feature';
  properties: ColombiaLatLonFeature['properties'] & {
    departmentName: string;
    uniqueUsers: number;
    averageScore: number | null;
    intensity: number;
  };
};

export function normalizeDepartmentKey(value: string) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (normalized.includes('bogota')) return 'bogota';
  return normalized;
}

export function normalizeDisplayDepartment(value: string) {
  return value
    .toLocaleLowerCase('es-CO')
    .split(/\s+/)
    .map((part) => (part.length <= 2 ? part.toUpperCase() : part.charAt(0).toLocaleUpperCase('es-CO') + part.slice(1)))
    .join(' ')
    .replace('D.c', 'D.C.');
}

export function getLatLonRings(feature: ColombiaLatLonFeature): LngLatPoint[][] {
  if (feature.geometry.type === 'Polygon') return feature.geometry.coordinates as LngLatPoint[][];
  return (feature.geometry.coordinates as LngLatPoint[][][]).flat();
}

function isWgs84Point([lng, lat]: LngLatPoint) {
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
}

/** Rechaza GeoJSON Highcharts (coords proyectadas ~1000+) cacheado en Firestore. */
export function isValidWgs84Geo(geo: { features: unknown[] }) {
  const feature = geo.features[0] as ColombiaLatLonFeature | undefined;
  if (!feature?.geometry) return false;
  const ring = getLatLonRings(feature)[0];
  if (!ring?.length) return false;
  return isWgs84Point(ring[0]);
}

function ringArea(ring: LngLatPoint[]) {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area * 0.5);
}

function ringCentroid(ring: LngLatPoint[]): LngLatPoint {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    const cross = x1 * y2 - x2 * y1;
    area += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-12) {
    const count = ring.length || 1;
    return [
      ring.reduce((sum, [lng]) => sum + lng, 0) / count,
      ring.reduce((sum, [, lat]) => sum + lat, 0) / count,
    ];
  }
  return [cx / (6 * area), cy / (6 * area)];
}

export function featureCenter(feature: ColombiaLatLonFeature) {
  const rings = getLatLonRings(feature);
  if (!rings.length) {
    return { longitude: COLOMBIA_MAP_VIEW.center[0], latitude: COLOMBIA_MAP_VIEW.center[1] };
  }

  let mainRing = rings[0];
  let maxArea = ringArea(mainRing);
  for (let i = 1; i < rings.length; i += 1) {
    const area = ringArea(rings[i]);
    if (area > maxArea) {
      maxArea = area;
      mainRing = rings[i];
    }
  }

  if (!isWgs84Point(mainRing[0])) {
    const props = feature.properties as { longitude?: string | number; latitude?: string | number };
    const lng = Number(props.longitude);
    const lat = Number(props.latitude);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return { longitude: lng, latitude: lat };
    }
    return { longitude: COLOMBIA_MAP_VIEW.center[0], latitude: COLOMBIA_MAP_VIEW.center[1] };
  }

  const [longitude, latitude] = ringCentroid(mainRing);
  return { longitude, latitude };
}

export function buildImpactFeatureByDepartmentKey(features: ColombiaLatLonFeature[]) {
  return new Map(
    features.map((feature) => [normalizeDepartmentKey(feature.properties.NOMBRE_DPT || ''), feature]),
  );
}

/** Glyphs para capas `symbol` (etiquetas de departamento escaladas por zoom). */
export const IMPACT_MAP_GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';

/** Escala marcadores HTML según zoom relativo a la vista inicial. */
export function impactMarkerScaleFromZoom(zoom: number) {
  const base = COLOMBIA_MAP_VIEW.zoom;
  return Math.min(1.22, Math.max(0.45, Math.pow(1.16, zoom - base)));
}

/** Tamaño del punto y halo (px) proporcional a usuarios y zoom. */
export function impactMarkerSizes(uniqueUsers: number, maxUsers: number, zoom: number) {
  const scale = impactMarkerScaleFromZoom(zoom);
  const ratio = uniqueUsers / Math.max(maxUsers, 1);
  const size = (5 + ratio * 12) * scale;
  const haloSize = size * 1.65;
  return { size, haloSize };
}

/** Raster Carto @2x sin labels de tiles — tipografía propia en capas symbol. */
function cartoRetinaRasterStyle(variant: 'light_nolabels' | 'dark_nolabels'): StyleSpecification {
  const tile = `https://{host}.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}@2x.png`;
  return {
    version: 8,
    glyphs: IMPACT_MAP_GLYPHS,
    sources: {
      basemap: {
        type: 'raster',
        tiles: ['a', 'b', 'c', 'd'].map((host) => tile.replace('{host}', host)),
        tileSize: 512,
        attribution: '© CARTO © OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'basemap',
        type: 'raster',
        source: 'basemap',
        paint: { 'raster-resampling': 'linear' },
      },
    ],
  };
}

export const colombiaImpactMapStyles = {
  light: cartoRetinaRasterStyle('light_nolabels'),
  dark: cartoRetinaRasterStyle('dark_nolabels'),
} as const;

export const COLOMBIA_MAP_VIEW = {
  center: [-73.8, 4.9] as [number, number],
  zoom: 4.15,
  minZoom: 3.55,
  maxZoom: 8.5,
  maxBounds: [-84.8, -7.2, -64.2, 15.5] as [number, number, number, number],
} as const;

