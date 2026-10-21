import type { RecordingGroup, SimRecording, SimRecordingsCatalog } from './recordingsTypes';
import { sgAreaColor } from '@shared/lib/sgAreaColors';
import {
  CLASES_EXTRA_AREA_KEY,
  CLASES_EXTRA_AREA_LABEL,
  ICFES_RECORDING_AREA_KEYS,
  isClasesExtraAreaKey,
  isPlataformaAreaKey,
  PLATAFORMA_AREA_LABEL,
} from '@shared/lib/sgClasesExtra';

const AREA_ORDER = [
  'lectura crítica',
  'matemáticas',
  'sociales y ciudadanas',
  'ciencias naturales',
  'inglés',
  CLASES_EXTRA_AREA_KEY,
] as const;

const AREA_LABELS: Record<string, string> = {
  'lectura crítica': 'Lectura crítica',
  matemáticas: 'Matemáticas',
  'sociales y ciudadanas': 'Competencias ciudadanas',
  'ciencias naturales': 'Ciencias naturales',
  inglés: 'Inglés',
  [CLASES_EXTRA_AREA_KEY]: CLASES_EXTRA_AREA_LABEL,
};

export function drivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function driveViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function formatRecordingDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function recordingAreaLabel(areaKey: string): string {
  if (isPlataformaAreaKey(areaKey)) return PLATAFORMA_AREA_LABEL;
  if (isClasesExtraAreaKey(areaKey)) return CLASES_EXTRA_AREA_LABEL;
  return AREA_LABELS[areaKey] ?? areaKey;
}

export function isIcFesRecordingAreaKey(areaKey: string): boolean {
  return (ICFES_RECORDING_AREA_KEYS as readonly string[]).includes(areaKey);
}

export type RecordingsCatalogMode = 'simulation' | 'course';

function classTypeAbbrev(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'CL';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/** Tipo de clase en catálogo curso (partLabel o segmento tras «·» en title). */
export function recordingCourseClassType(rec: SimRecording): string {
  if (rec.partLabel?.trim()) return rec.partLabel.trim();
  const parts = rec.title.split('·').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts.slice(1).join(' · ');
  return rec.title;
}

export function recordingCoverBadge(
  rec: SimRecording,
  mode: RecordingsCatalogMode = 'simulation',
): string {
  if (mode === 'course') {
    if (rec.catalogSegment === 'induction' || /inducci[oó]n/i.test(recordingCourseClassType(rec))) {
      return 'IND';
    }
    const claseMatch = rec.title.match(/clase\s*#\s*(\d+)/i);
    if (claseMatch) return `#${claseMatch[1]}`;
    return classTypeAbbrev(recordingCourseClassType(rec));
  }
  if (rec.session === 1) return 'S1';
  if (rec.session === 2) return 'S2';
  return 'SU';
}

export function recordingListHeadline(
  rec: SimRecording,
  mode: RecordingsCatalogMode = 'simulation',
  sessionTitle?: string | null,
): string {
  if (mode === 'course') return recordingCourseCardHeadline(rec, sessionTitle);
  return 'Grabación de la clase';
}

export function recordingListSubtitle(
  rec: SimRecording,
  mode: RecordingsCatalogMode = 'simulation',
  sessionTitle?: string | null,
  eventDate?: string | null,
): string {
  if (mode === 'course') return recordingCourseCardSubtitle(rec, sessionTitle, eventDate);
  const areaLabel = recordingAreaLabel(rec.area);
  return `${areaLabel} · ${recordingClassLabel(rec, 'simulation')}`;
}

/** Título principal de tarjeta curso: nombre del evento en MAYÚSCULAS. */
export function recordingCourseCardHeadline(
  rec: SimRecording,
  sessionTitle?: string | null,
): string {
  const eventName = sessionTitle?.trim() || rec.title?.trim();
  if (eventName) return eventName.toLocaleUpperCase('es-CO');

  const classType = recordingCourseClassType(rec);
  const area = recordingAreaLabel(rec.area);
  return `${classType} · ${area}`.toLocaleUpperCase('es-CO');
}

/** Subtítulo de tarjeta curso: tipo (p. ej. Inducción) · área · fecha. */
export function recordingCourseCardSubtitle(
  rec: SimRecording,
  _sessionTitle?: string | null,
  eventDate?: string | null,
): string {
  const classType = recordingCourseClassType(rec);
  const area = recordingAreaLabel(rec.area);
  const dateLine = formatRecordingDate(eventDate ?? rec.recordedAt);

  const parts = [classType, area];
  if (dateLine) parts.push(dateLine);
  return parts.join(' · ');
}

export function recordingCoverFooterLine(
  rec: SimRecording,
  mode: RecordingsCatalogMode = 'simulation',
): string {
  const areaLabel = recordingAreaLabel(rec.area);
  if (mode === 'course') return `${recordingCourseClassType(rec)} · ${areaLabel}`;
  return `${areaLabel} · ${recordingClassLabel(rec, 'simulation')}`;
}

export function recordingPlayerMetaPrimary(
  rec: SimRecording,
  mode: RecordingsCatalogMode = 'simulation',
): string {
  if (mode === 'course') {
    return `${recordingCourseClassType(rec)} · ${recordingAreaLabel(rec.area)}`;
  }
  return `${recordingAreaLabel(rec.area)} · ${recordingClassLabel(rec, 'simulation')}`;
}

/** Línea de clase: sesión + parte opcional (simulacro) o solo área (curso vía recordingListSubtitle). */
export function recordingClassLabel(
  rec: SimRecording,
  mode: RecordingsCatalogMode = 'simulation',
): string {
  if (mode === 'course') return recordingCourseClassType(rec);
  const parts = [sessionLabel(rec.session)];
  if (rec.partLabel) parts.push(rec.partLabel);
  return parts.join(' · ');
}

export function recordingDisplayTitle(rec: SimRecording): string {
  const parts = [rec.title];
  if (rec.partLabel) parts.push(`(${rec.partLabel})`);
  return parts.join(' ');
}

export function sessionLabel(session: number | null): string {
  if (session === 1) return 'Sesión 1';
  if (session === 2) return 'Sesión 2';
  return 'Sesión única';
}

const CATALOG_FETCH_TIMEOUT_MS = 12_000;

export async function fetchSimRecordingsCatalog(simId: string): Promise<SimRecordingsCatalog | null> {
  if (!simId) return null;
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), CATALOG_FETCH_TIMEOUT_MS);
    const res = await fetch(`/data/recordings/${encodeURIComponent(simId)}.json`, {
      credentials: 'same-origin',
      cache: 'no-cache',
      signal: controller.signal,
    });
    window.clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as SimRecordingsCatalog;
    if (!data?.recordings?.length) return null;
    return {
      ...data,
      recordings: [...data.recordings].sort(
        (a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999),
      ),
    };
  } catch {
    return null;
  }
}

export function groupRecordings(recordings: SimRecording[]): RecordingGroup[] {
  const byArea = new Map<string, SimRecording[]>();
  for (const rec of recordings) {
    const list = byArea.get(rec.area) ?? [];
    list.push(rec);
    byArea.set(rec.area, list);
  }

  const areas = [...byArea.keys()].sort((a, b) => {
    const ia = AREA_ORDER.indexOf(a as (typeof AREA_ORDER)[number]);
    const ib = AREA_ORDER.indexOf(b as (typeof AREA_ORDER)[number]);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return areas.map((area) => ({
    key: area,
    label: AREA_LABELS[area] ?? area,
    items: (byArea.get(area) ?? []).sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)),
  }));
}

export function knownRecordingSimIds(): string[] {
  return ['SG11-18', 'SG11-23'];
}

/** Deep link a /clases con área preseleccionada (clave ICFES o short LEC/MAT/…). */
export function buildRecordingsClasesHref(baseHref: string, areaKey?: string): string {
  if (!areaKey) return baseHref;
  const sep = baseHref.includes('?') ? '&' : '?';
  return `${baseHref}${sep}area=${encodeURIComponent(areaKey)}`;
}

export function parseRecordingsAreaParam(
  param: string | null,
  validAreaKeys: readonly string[],
): string | null {
  if (!param?.trim()) return null;
  let decoded = param;
  try {
    decoded = decodeURIComponent(param.trim());
  } catch {
    decoded = param.trim();
  }
  if (validAreaKeys.includes(decoded)) return decoded;
  const lower = decoded.toLowerCase();
  const byShort = validAreaKeys.find((key) => sgAreaColor(key).short.toLowerCase() === lower);
  return byShort ?? null;
}

export function applyRecordingsAreaSelection(
  areaKey: string,
  groups: RecordingGroup[],
): { areaKey: string; recordingId: string | null } | null {
  const group = groups.find((g) => g.key === areaKey);
  if (!group?.items.length) return null;
  return { areaKey: group.key, recordingId: group.items[0]?.id ?? null };
}
