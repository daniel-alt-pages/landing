import type { CourseCalendarAttachment } from './courseCalendarTypes';

/** Quién puede ver cada adjunto ICS del vacacional. */
export type VacacionalAttachmentAudience = 'recording' | 'chat' | 'gemini' | 'material';

export type VacacionalMaterialCategory = 'gemini' | 'documento' | 'presentacion' | 'hoja' | 'otro';

export function classifyVacacionalAttachment(
  att: CourseCalendarAttachment,
): VacacionalAttachmentAudience {
  const title = att.title.trim();

  if (att.kind === 'chat' || /\bchat\b/i.test(title)) return 'chat';
  if (att.kind === 'recording' || /\brecording\b/i.test(title)) return 'recording';
  if (att.kind === 'gemini' || /notas de gemini/i.test(title)) return 'gemini';

  return 'material';
}

export function isVacacionalChatAttachment(att: CourseCalendarAttachment): boolean {
  return classifyVacacionalAttachment(att) === 'chat';
}

export function isVacacionalRecordingAttachment(att: CourseCalendarAttachment): boolean {
  return classifyVacacionalAttachment(att) === 'recording';
}

/** Solo notas Gemini + docs/slides/etc. públicos (nunca chat ni grabación). */
export function isVacacionalPublicMaterialAttachment(att: CourseCalendarAttachment): boolean {
  const audience = classifyVacacionalAttachment(att);
  return audience === 'gemini' || audience === 'material';
}

export function vacacionalMaterialCategory(att: CourseCalendarAttachment): VacacionalMaterialCategory {
  if (classifyVacacionalAttachment(att) === 'gemini') return 'gemini';
  if (att.kind === 'slides') return 'presentacion';
  if (att.kind === 'sheet') return 'hoja';
  if (att.kind === 'doc' || /docs\.google\.com/i.test(att.url)) return 'documento';
  return 'otro';
}

export function vacacionalMaterialCategoryLabel(category: VacacionalMaterialCategory): string {
  if (category === 'gemini') return 'Notas de Gemini';
  if (category === 'documento') return 'Documento';
  if (category === 'presentacion') return 'Presentación';
  if (category === 'hoja') return 'Hoja de cálculo';
  return 'Material';
}

export function extractDriveFileId(url: string): string | null {
  const fileMatch = url.match(/\/file\/d\/([^/?#]+)/i);
  if (fileMatch?.[1]) return fileMatch[1];
  const idMatch = url.match(/[?&]id=([^&]+)/i);
  return idMatch?.[1] ?? null;
}
