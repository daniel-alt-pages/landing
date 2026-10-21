import type { SgAreaKey } from '@/shared/lib/sgAreaColors';
import type { CourseMaterial } from '../types/courseTypes';
import type { CourseCalendarAttachment, CourseCalendarEventDto } from './courseCalendarTypes';
import {
  classifyVacacionalAttachment,
  isVacacionalPublicMaterialAttachment,
} from './courseVacacionalAttachmentPolicy';
import { vacacionalEventAreaKey } from './courseVacacionalEventArea';

/** IDs en `student-materials` por área ICFES del título de clase. */
const COMPILADO_ID_BY_AREA: Record<SgAreaKey, string> = {
  matemáticas: 'comp-matematicas',
  'lectura crítica': 'comp-lectura',
  'sociales y ciudadanas': 'comp-sociales',
  'ciencias naturales': 'comp-ciencias',
  inglés: 'comp-ingles',
};

const COMPILADO_LABEL_BY_AREA: Record<SgAreaKey, string> = {
  matemáticas: 'Compilado supremo de matemáticas',
  'lectura crítica': 'Compilado supremo de lectura crítica',
  'sociales y ciudadanas': 'Compilado supremo de sociales y ciudadanas',
  'ciencias naturales': 'Compilado supremo de ciencias naturales',
  inglés: 'Compilado supremo de inglés',
};

export function compiladoDisplayLabelForArea(areaKey: SgAreaKey): string {
  return COMPILADO_LABEL_BY_AREA[areaKey];
}

export type VacacionalQuestionRange = { from: number; to: number };

/** Extrae "RANGO DE PREGUNTAS (1 A 75)" del título ICS / grabación. */
export function parseVacacionalQuestionRange(title: string): VacacionalQuestionRange | null {
  const match = title.match(/RANGO DE PREGUNTAS\s*\(\s*(\d+)\s+A\s+(\d+)\s*\)/i);
  if (!match?.[1] || !match[2]) return null;
  const from = Number.parseInt(match[1], 10);
  const to = Number.parseInt(match[2], 10);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  return { from, to };
}

export function formatVacacionalQuestionRangeLabel(range: VacacionalQuestionRange): string {
  if (range.from === range.to) return `pregunta ${range.from}`;
  return `preguntas ${range.from} a ${range.to}`;
}

export function resolvePersonalizedCompiladoForArea(
  areaKey: SgAreaKey,
  studentMaterials: CourseMaterial[],
): CourseMaterial | null {
  const expectedId = COMPILADO_ID_BY_AREA[areaKey];
  const byId = studentMaterials.find((m) => m.id === expectedId && m.url);
  if (byId) return byId;

  const labelNeedle = COMPILADO_LABEL_BY_AREA[areaKey].toLowerCase();
  const byLabel = studentMaterials.find(
    (m) =>
      m.url &&
      m.visible !== false &&
      m.kind === 'pdf' &&
      m.label.trim().toLowerCase() === labelNeedle,
  );
  if (byLabel) return byLabel;

  return (
    studentMaterials.find(
      (m) =>
        m.url &&
        m.visible !== false &&
        /compilado supremo/i.test(m.label) &&
        m.label.toLowerCase().includes(areaKey.split(' ')[0].slice(0, 5)),
    ) ?? null
  );
}

export function resolvePersonalizedCompiladoForSessionTitle(
  sessionTitle: string,
  studentMaterials: CourseMaterial[],
): { areaKey: SgAreaKey | null; compilado: CourseMaterial | null; compiladoLabel: string | null } {
  const areaKey = vacacionalEventAreaKey(sessionTitle);
  if (!areaKey) {
    return { areaKey: null, compilado: null, compiladoLabel: null };
  }
  const compilado = resolvePersonalizedCompiladoForArea(areaKey, studentMaterials);
  return {
    areaKey,
    compilado,
    compiladoLabel: compiladoDisplayLabelForArea(areaKey),
  };
}

export function findVacacionalGeminiAttachment(
  event: CourseCalendarEventDto,
): CourseCalendarAttachment | null {
  for (const att of event.attachments ?? []) {
    if (classifyVacacionalAttachment(att) === 'gemini') return att;
  }
  return null;
}

/** Adjuntos públicos de la clase que no son notas Gemini (slides, docs, etc.). */
export function findVacacionalExtraClassAttachments(
  event: CourseCalendarEventDto,
): CourseCalendarAttachment[] {
  return (event.attachments ?? []).filter(
    (att) =>
      isVacacionalPublicMaterialAttachment(att) && classifyVacacionalAttachment(att) !== 'gemini',
  );
}

export function resolvePersonalizedCompiladoForEvent(
  event: CourseCalendarEventDto,
  studentMaterials: CourseMaterial[],
): CourseMaterial | null {
  const area = vacacionalEventAreaKey(event.summary ?? '');
  if (!area) return null;
  return resolvePersonalizedCompiladoForArea(area, studentMaterials);
}

export type ClassMaterialPickerOptions = {
  areaKey: SgAreaKey | null;
  sessionTitle: string;
  gemini: CourseCalendarAttachment | null;
  compilado: CourseMaterial | null;
  compiladoLabel: string | null;
  extraAttachments: CourseCalendarAttachment[];
};

export function buildClassMaterialPickerOptions(
  event: CourseCalendarEventDto,
  studentMaterials: CourseMaterial[],
): ClassMaterialPickerOptions {
  const areaKey = vacacionalEventAreaKey(event.summary ?? '');
  const compilado = resolvePersonalizedCompiladoForEvent(event, studentMaterials);
  return {
    areaKey,
    sessionTitle: event.summary ?? 'Clase',
    gemini: findVacacionalGeminiAttachment(event),
    compilado,
    compiladoLabel: areaKey ? compiladoDisplayLabelForArea(areaKey) : compilado?.label ?? null,
    extraAttachments: findVacacionalExtraClassAttachments(event),
  };
}
