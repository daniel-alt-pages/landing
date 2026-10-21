export type CourseCalendarView = 'MONTH' | 'WEEK' | 'AGENDA';

export type CourseCalendarEmbedOptions = {
  view?: CourseCalendarView;
  /** Oculta título Google duplicado (usamos el nuestro arriba). */
  showTitle?: boolean;
  showNav?: boolean;
  showDate?: boolean;
  showPrint?: boolean;
  showTabs?: boolean;
  showCalendars?: boolean;
  timezone?: string;
  /** Fondo del embed (#RRGGBB sin #). */
  bgColor?: string;
};

const DEFAULT_TIMEZONE = 'America/Bogota';

/** Opciones por defecto alineadas al panel Mi Curso. */
export const DEFAULT_CALENDAR_EMBED: Required<
  Pick<
    CourseCalendarEmbedOptions,
    | 'showTitle'
    | 'showNav'
    | 'showDate'
    | 'showPrint'
    | 'showTabs'
    | 'showCalendars'
    | 'timezone'
    | 'bgColor'
  >
> = {
  showTitle: false,
  showNav: true,
  showDate: true,
  showPrint: false,
  showTabs: true,
  showCalendars: false,
  timezone: DEFAULT_TIMEZONE,
  bgColor: 'ffffff',
};

export function extractCalendarSrc(embedUrl: string): string | null {
  try {
    return new URL(embedUrl).searchParams.get('src');
  } catch {
    return null;
  }
}

export function buildCalendarEmbedUrl(
  embedOrSrc: string,
  options: CourseCalendarEmbedOptions = {},
): string {
  const src =
    extractCalendarSrc(embedOrSrc) ||
    (embedOrSrc.includes('@') ? embedOrSrc : null);

  if (!src) return embedOrSrc;

  const merged = { ...DEFAULT_CALENDAR_EMBED, ...options };
  const params = new URLSearchParams();
  params.set('src', src);
  params.set('ctz', merged.timezone);
  params.set('mode', options.view ?? 'WEEK');
  params.set('wkst', '1');

  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const ymd = `${y}${m}${d}`;
  params.set('dates', `${ymd}/${ymd}`);

  params.set('showTitle', merged.showTitle ? '1' : '0');
  params.set('showNav', merged.showNav ? '1' : '0');
  params.set('showDate', merged.showDate ? '1' : '0');
  params.set('showPrint', merged.showPrint ? '1' : '0');
  params.set('showTabs', merged.showTabs ? '1' : '0');
  params.set('showCalendars', merged.showCalendars ? '1' : '0');
  params.set('bgcolor', merged.bgColor.replace(/^#/, ''));

  return `https://calendar.google.com/calendar/embed?${params.toString()}`;
}

export function calendarOpenUrl(embedUrl: string): string {
  const src = extractCalendarSrc(embedUrl);
  if (src) {
    return `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(src)}`;
  }
  return embedUrl;
}

export const CALENDAR_VIEW_LABELS: Record<CourseCalendarView, string> = {
  MONTH: 'Mes',
  WEEK: 'Semana',
  AGENDA: 'Agenda',
};
