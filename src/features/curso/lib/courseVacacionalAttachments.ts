import type { CourseCalendarAttachment } from './courseCalendarTypes';
import { classifyVacacionalAttachment } from './courseVacacionalAttachmentPolicy';

export function vacacionalAttachmentLabel(att: CourseCalendarAttachment): string {
  const title = att.title.trim();
  const audience = classifyVacacionalAttachment(att);
  if (audience === 'gemini') return 'Notas de Gemini';
  if (audience === 'recording') return 'Grabación';
  if (audience === 'chat') return 'Chat';
  if (title.length > 36) return `${title.slice(0, 33)}…`;
  return title || 'Adjunto';
}

export function vacacionalAttachmentIcon(att: CourseCalendarAttachment): 'doc' | 'video' | 'chat' | 'file' {
  const audience = classifyVacacionalAttachment(att);
  if (audience === 'recording') return 'video';
  if (audience === 'chat') return 'chat';
  if (audience === 'gemini' || att.kind === 'doc' || att.kind === 'slides' || att.kind === 'sheet') {
    return 'doc';
  }
  return 'file';
}
