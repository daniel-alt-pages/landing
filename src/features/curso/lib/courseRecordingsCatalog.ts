import type { CourseRecording } from '../types/courseTypes';
import type { SimRecording } from '@features/recordings/lib/recordingsTypes';
import {
  CLASES_EXTRA_AREA_KEY,
  CLASES_EXTRA_AREA_LABEL,
  inferClasesExtraFromTitle,
  inferPlataformaFromTitle,
  isClasesExtraAreaKey,
  isPlataformaAreaKey,
  PLATAFORMA_AREA_KEY,
} from '@shared/lib/sgClasesExtra';
import { vacacionalRecordingCanon } from './courseVacacionalRecordingCanon';
import { extractVacacionalClaseNumber } from './courseVacacionalClaseTitle';
import type { CourseRecordingCatalogSegment } from '@features/recordings/lib/recordingsTypes';

const AREA_ORDER = [
  'lectura crítica',
  'matemáticas',
  'sociales y ciudadanas',
  'ciencias naturales',
  'inglés',
  PLATAFORMA_AREA_KEY,
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

const TITLE_AREA_RULES: Array<{ pattern: RegExp; key: string }> = [
  { pattern: /lectura\s*cr[ií]tica/i, key: 'lectura crítica' },
  { pattern: /competencias?\s*ciudadanas?|sociales\s*y\s*ciudadanas?/i, key: 'sociales y ciudadanas' },
  { pattern: /ciencias?\s*naturales?/i, key: 'ciencias naturales' },
  { pattern: /matem[aá]ticas?/i, key: 'matemáticas' },
  { pattern: /\bingl[eé]s\b/i, key: 'inglés' },
];

/** Fallback cuando Firestore trae área genérica pero el driveFileId es conocido. */
const DRIVE_FILE_AREA: Record<string, string> = {
  '1Kgi5OeJaik0EMNxoSUiJAKu1j7Tqv89_': 'lectura crítica',
  '1nRxd1TrN0MuMBH5jcUCU8TrZoL9Edng-': 'inglés',
  '1sZikyDK7Nt6I_sOxQY41PEgvdequnj3r': 'sociales y ciudadanas',
  '1VxL-MF5G53vGtLuQowCIhcg04n8pqE_O': 'sociales y ciudadanas',
  '107smw6JunhXHRXhK-K0DzV8nscfIPS4A': 'matemáticas',
  '14J0uV7jRYwnKmuBfv2zLt3Scr4PkzLDQ': 'inglés',
  '1tLQUQCNDPkhGIsp--iLrgHY4EDyqb-yu': 'sociales y ciudadanas',
  '1l8iyVnv4D1B8xNDjCH8ti3LTNFQNzjZB': 'inglés',
  '11ky4XsL3wr620TvQsvLQzG_owSqeCbHJ': 'sociales y ciudadanas',
  '1wmHeLCjRacDogFpMecb63kZA-LV_WqsV': PLATAFORMA_AREA_KEY,
  '1bwl5Pm_hUuFBhnr3Q0NFavVdmYsZ5_UL': PLATAFORMA_AREA_KEY,
  '1YZ0MUXiZbInOBjj5mdWC3Wp3pJPyErLn': 'ciencias naturales',
  '1tGQ3-QZ2drfx6QY0dejTFE1DgiRIoVxJ': 'matemáticas',
};

export type NormalizedCourseRecording = CourseRecording & {
  areaKey: string;
  areaLabel: string;
  classType: string;
  catalogSegment: CourseRecordingCatalogSegment;
};

export type CourseRecordingGroup = {
  key: string;
  label: string;
  items: NormalizedCourseRecording[];
};

export function drivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function formatCourseRecordingDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function courseAreaLabel(areaKey: string): string {
  if (isPlataformaAreaKey(areaKey)) return 'Plataforma';
  if (isClasesExtraAreaKey(areaKey)) return CLASES_EXTRA_AREA_LABEL;
  return AREA_LABELS[areaKey] ?? areaKey;
}

export function classTypeBadge(classType: string): string {
  const words = classType.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'CL';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function inferAreaKey(rec: CourseRecording, title: string): string {
  if (rec.area && isPlataformaAreaKey(rec.area)) return PLATAFORMA_AREA_KEY;
  if (inferPlataformaFromTitle(title)) return PLATAFORMA_AREA_KEY;
  if (rec.area && isClasesExtraAreaKey(rec.area)) return CLASES_EXTRA_AREA_KEY;
  if (rec.area && AREA_LABELS[rec.area]) return rec.area;
  if (rec.area && !/inducci[oó]n/i.test(rec.area)) {
    const byLabel = Object.entries(AREA_LABELS).find(
      ([, label]) => label.toLowerCase() === rec.area!.toLowerCase(),
    );
    if (byLabel) return byLabel[0];
  }
  if (rec.driveFileId && DRIVE_FILE_AREA[rec.driveFileId]) {
    return DRIVE_FILE_AREA[rec.driveFileId];
  }
  if (inferClasesExtraFromTitle(title)) return CLASES_EXTRA_AREA_KEY;
  for (const rule of TITLE_AREA_RULES) {
    if (rule.pattern.test(title)) return rule.key;
  }
  return CLASES_EXTRA_AREA_KEY;
}

function inferCatalogSegment(rec: CourseRecording, title: string): CourseRecordingCatalogSegment {
  if (rec.catalogSegment) return rec.catalogSegment;
  if (rec.classType && /inducci[oó]n/i.test(rec.classType)) return 'induction';
  if (/inducci[oó]n/i.test(title)) return 'induction';
  if (extractVacacionalClaseNumber(title) != null) return 'official';
  return 'official';
}

function inferClassType(rec: CourseRecording, title: string): string {
  if (rec.classType?.trim()) return rec.classType.trim();
  if (rec.partLabel?.trim()) return rec.partLabel.trim();

  const dotParts = title.split('·').map((p) => p.trim()).filter(Boolean);
  if (dotParts.length >= 2) return dotParts.slice(1).join(' · ');

  if (extractVacacionalClaseNumber(title) != null) return 'Clase oficial';

  const driveMatch = title.match(/inducci[oó]n\s*espec[ií]fica/i);
  if (driveMatch) return 'Inducción específica';

  const retroMatch = title.match(/retroalimentaci[oó]n|retro\s+en\s+vivo/i);
  if (retroMatch) return 'Retroalimentación';

  if (/repaso/i.test(title)) return 'Repaso';
  if (/simulacro/i.test(title)) return 'Simulacro';

  return 'Clase grabada';
}

export function normalizeCourseRecording(rec: CourseRecording): NormalizedCourseRecording {
  const canon = vacacionalRecordingCanon(rec.driveFileId);
  const title = canon?.title || rec.title?.trim() || 'Clase grabada';
  const recordedAt = canon?.recordedAt || rec.recordedAt;
  const areaKey = inferAreaKey(rec, title);
  const classType = inferClassType(rec, title);
  const catalogSegment = inferCatalogSegment(rec, title);

  return {
    ...rec,
    recordedAt,
    areaKey,
    areaLabel: courseAreaLabel(areaKey),
    classType,
    catalogSegment,
    title,
  };
}

export function normalizeCourseRecordings(recordings: CourseRecording[]): NormalizedCourseRecording[] {
  return recordings
    .filter((r) => r.visibleToStudents !== false && (r.driveFileId || r.videoUrl))
    .map(normalizeCourseRecording)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
}

export function groupCourseRecordingsByArea(
  recordings: NormalizedCourseRecording[],
): CourseRecordingGroup[] {
  const byArea = new Map<string, NormalizedCourseRecording[]>();
  for (const rec of recordings) {
    const list = byArea.get(rec.areaKey) ?? [];
    list.push(rec);
    byArea.set(rec.areaKey, list);
  }

  const keys = [...byArea.keys()].sort((a, b) => {
    const ia = AREA_ORDER.indexOf(a as (typeof AREA_ORDER)[number]);
    const ib = AREA_ORDER.indexOf(b as (typeof AREA_ORDER)[number]);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return keys.map((key) => ({
    key,
    label: courseAreaLabel(key),
    items: (byArea.get(key) ?? []).sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)),
  }));
}

/** Adapta grabación de curso al shape del catálogo compartido (mismo UI, títulos vía catalogMode=course). */
export function courseRecordingToSim(rec: NormalizedCourseRecording): SimRecording {
  return {
    id: rec.id,
    title: rec.title,
    area: rec.areaKey,
    session: null,
    partLabel: rec.classType,
    catalogSegment: rec.catalogSegment,
    driveFileId: rec.driveFileId || '',
    videoUrl: rec.videoUrl,
    recordedAt: rec.recordedAt,
    sortOrder: rec.sortOrder,
    visibleToStudents: rec.visibleToStudents,
    coverHideMascot: rec.coverHideMascot,
    coverTitleStyle: rec.coverTitleStyle,
  };
}

export function courseRecordingsToSim(recordings: CourseRecording[]): SimRecording[] {
  return normalizeCourseRecordings(recordings).map(courseRecordingToSim);
}
