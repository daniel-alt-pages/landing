import type { CourseCalendarEventDto } from './courseCalendarTypes';
import { vacacionalEventCardTheme } from './courseVacacionalEventArea';
import {
  isVacacionalPublicMaterialAttachment,
  vacacionalMaterialCategory,
  vacacionalMaterialCategoryLabel,
  type VacacionalMaterialCategory,
} from './courseVacacionalAttachmentPolicy';
import { vacacionalAttachmentIcon, vacacionalAttachmentLabel } from './courseVacacionalAttachments';
import { vacacionalEventDayKey, vacacionalEventStartDate } from './courseVacacionalEventTime';

const BOGOTA = 'America/Bogota';

export type VacacionalClassMaterial = {
  id: string;
  eventId: string;
  sessionTitle: string;
  sessionWhen: string;
  sessionDateKey: string;
  materialCategory: VacacionalMaterialCategory;
  materialCategoryLabel: string;
  attachment: import('./courseCalendarTypes').CourseCalendarAttachment;
  attachmentLabel: string;
  attachmentIcon: ReturnType<typeof vacacionalAttachmentIcon>;
  cardStyle: ReturnType<typeof vacacionalEventCardTheme>['cardStyle'];
  titleColor: string;
  primaryActionStyle: ReturnType<typeof vacacionalEventCardTheme>['meetStyle'];
};

function formatSessionWhen(event: CourseCalendarEventDto): string {
  const d = vacacionalEventStartDate(event);
  if (!d) return '';
  return d.toLocaleString('es-CO', {
    timeZone: BOGOTA,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateFilterLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  return d.toLocaleDateString('es-CO', {
    timeZone: BOGOTA,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Solo notas Gemini y materiales públicos (sin chat ni grabaciones). */
export function buildVacacionalClassMaterials(
  events: CourseCalendarEventDto[],
  isDark = false,
): VacacionalClassMaterial[] {
  const rows: VacacionalClassMaterial[] = [];
  for (const event of events) {
    if (!event.attachments?.length) continue;
    const theme = vacacionalEventCardTheme(event.summary, isDark);
    const sessionWhen = formatSessionWhen(event);
    const sessionDateKey = vacacionalEventDayKey(event);
    for (const attachment of event.attachments) {
      if (!isVacacionalPublicMaterialAttachment(attachment)) continue;
      const materialCategory = vacacionalMaterialCategory(attachment);
      rows.push({
        id: `${event.id}-${attachment.url}`,
        eventId: event.id,
        sessionTitle: event.summary,
        sessionWhen,
        sessionDateKey,
        materialCategory,
        materialCategoryLabel: vacacionalMaterialCategoryLabel(materialCategory),
        attachment,
        attachmentLabel: vacacionalAttachmentLabel(attachment),
        attachmentIcon: vacacionalAttachmentIcon(attachment),
        cardStyle: theme.cardStyle,
        titleColor: theme.titleColor,
        primaryActionStyle: theme.meetStyle,
      });
    }
  }
  return rows;
}

export function buildVacacionalMaterialDateOptions(
  items: VacacionalClassMaterial[],
): Array<{ value: string; label: string }> {
  const keys = [...new Set(items.map((i) => i.sessionDateKey).filter(Boolean))].sort();
  return keys.map((value) => ({ value, label: formatDateFilterLabel(value) }));
}

export function buildVacacionalMaterialTypeOptions(
  items: VacacionalClassMaterial[],
): Array<{ value: VacacionalMaterialCategory | 'all'; label: string }> {
  const categories = [...new Set(items.map((i) => i.materialCategory))];
  const options: Array<{ value: VacacionalMaterialCategory | 'all'; label: string }> = [
    { value: 'all', label: 'Todos los tipos' },
  ];
  for (const cat of categories) {
    options.push({ value: cat, label: vacacionalMaterialCategoryLabel(cat) });
  }
  return options;
}

export function filterVacacionalClassMaterials(
  items: VacacionalClassMaterial[],
  filters: { dateKey?: string; category?: VacacionalMaterialCategory | 'all' },
): VacacionalClassMaterial[] {
  return items.filter((item) => {
    if (filters.dateKey && filters.dateKey !== 'all' && item.sessionDateKey !== filters.dateKey) {
      return false;
    }
    if (filters.category && filters.category !== 'all' && item.materialCategory !== filters.category) {
      return false;
    }
    return true;
  });
}

/** Cuenta adjuntos visibles en Materiales (sin chat/grabación). */
export function countVacacionalPublicMaterials(event: CourseCalendarEventDto): number {
  return (event.attachments ?? []).filter(isVacacionalPublicMaterialAttachment).length;
}
