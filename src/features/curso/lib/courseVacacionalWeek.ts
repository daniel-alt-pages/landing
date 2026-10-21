const BOGOTA = 'America/Bogota';

/** Vacacional SG26 — fallback si el JSON del curso no trae fechas. */
export const PREICFES_SG26_COURSE_BOUNDS = {
  start: '2026-06-08',
  end: '2026-07-26',
} as const;

export type CourseDateBounds = { start: string; end: string };

function bogotaParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOGOTA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const parts = fmt.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return {
    y: Number(get('year')),
    m: Number(get('month')),
    d: Number(get('day')),
    weekday: get('weekday'),
  };
}

function ymdFromParts(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function ymdAddDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const cursor = new Date(Date.UTC(y, m - 1, d + days));
  return ymdFromParts(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, cursor.getUTCDate());
}

/** Lunes de la semana (zona Bogotá) que contiene `date`. */
export function bogotaWeekMonday(date = new Date()): string {
  const { y, m, d, weekday } = bogotaParts(date);
  const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const wd = wdMap[weekday] ?? 0;
  const diff = (wd + 6) % 7;
  const utc = Date.UTC(y, m - 1, d);
  const mon = new Date(utc);
  mon.setUTCDate(mon.getUTCDate() - diff);
  return ymdFromParts(mon.getUTCFullYear(), mon.getUTCMonth() + 1, mon.getUTCDate());
}

export function bogotaTodayKey(date = new Date()): string {
  const { y, m, d } = bogotaParts(date);
  return ymdFromParts(y, m, d);
}

export type BogotaWeekRange = { start: string; end: string; keys: string[] };

export type VacacionalAcademicWeekSpec = {
  number: number;
  label: string;
  start: string;
  end: string;
};

export type VacacionalAcademicWeekRange = BogotaWeekRange & {
  weekNumber: number;
  label: string;
};

/** Horario vacacional SG26 — sync con data/course/academic-weeks/preicfes-sg26.json */
export const PREICFES_SG26_ACADEMIC_WEEKS: VacacionalAcademicWeekSpec[] = [
  { number: 1, label: 'Semana 1', start: '2026-06-08', end: '2026-06-13' },
  { number: 2, label: 'Semana 2', start: '2026-06-14', end: '2026-06-20' },
  { number: 3, label: 'Semana 3', start: '2026-06-22', end: '2026-06-28' },
  { number: 4, label: 'Semana 4', start: '2026-06-29', end: '2026-07-05' },
  { number: 5, label: 'Semana 5', start: '2026-07-06', end: '2026-07-12' },
  { number: 6, label: 'Semana 6', start: '2026-07-13', end: '2026-07-19' },
  { number: 7, label: 'Semana 7', start: '2026-07-20', end: '2026-07-26' },
];

function dateKeysInclusive(start: string, end: string): string[] {
  if (start > end) return [];
  const keys: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    keys.push(cursor);
    cursor = ymdAddDays(cursor, 1);
  }
  return keys;
}

function clipRangeToBounds(
  start: string,
  end: string,
  bounds: CourseDateBounds,
): { start: string; end: string } | null {
  const clippedStart = start < bounds.start ? bounds.start : start;
  const clippedEnd = end > bounds.end ? bounds.end : end;
  if (clippedStart > clippedEnd) return null;
  return { start: clippedStart, end: clippedEnd };
}

/** Semanas del horario (no lun–dom genérico). Fallback: listCourseWeeks. */
export function listVacacionalAcademicWeekRanges(
  courseId: string,
  bounds?: CourseDateBounds,
): VacacionalAcademicWeekRange[] {
  const resolvedBounds = bounds ?? resolveCourseDateBounds();
  const specs =
    courseId === 'preicfes-sg26'
      ? PREICFES_SG26_ACADEMIC_WEEKS
      : [];

  if (!specs.length) {
    return listCourseWeeks(resolvedBounds).map((week, index) => ({
      ...week,
      weekNumber: index + 1,
      label: `Semana ${index + 1}`,
    }));
  }

  return specs
    .map((spec) => {
      const clipped = clipRangeToBounds(spec.start, spec.end, resolvedBounds);
      if (!clipped) return null;
      const keys = dateKeysInclusive(clipped.start, clipped.end);
      if (!keys.length) return null;
      return {
        weekNumber: spec.number,
        label: spec.label,
        start: clipped.start,
        end: clipped.end,
        keys,
      };
    })
    .filter((week): week is VacacionalAcademicWeekRange => week != null);
}

export function academicWeekForDate(
  courseId: string,
  dateKey: string,
  bounds?: CourseDateBounds,
): VacacionalAcademicWeekRange | null {
  const weeks = listVacacionalAcademicWeekRanges(courseId, bounds);
  return weeks.find((w) => dateKey >= w.start && dateKey <= w.end) ?? null;
}

export function resolveCourseDateBounds(
  courseStartDate?: string,
  courseEndDate?: string,
): CourseDateBounds {
  const start =
    courseStartDate && /^\d{4}-\d{2}-\d{2}$/.test(courseStartDate)
      ? courseStartDate
      : PREICFES_SG26_COURSE_BOUNDS.start;
  const end =
    courseEndDate && /^\d{4}-\d{2}-\d{2}$/.test(courseEndDate)
      ? courseEndDate
      : PREICFES_SG26_COURSE_BOUNDS.end;
  return start <= end ? { start, end } : { start: end, end: start };
}

/** Semana lun–dom (7 columnas), recortada al rango del curso. */
export function bogotaWeekRange(date = new Date(), bounds?: CourseDateBounds): BogotaWeekRange {
  const monday = bogotaWeekMonday(date);
  const keys: string[] = [];
  let cursorKey = monday;
  for (let i = 0; i < 7; i += 1) {
    if (!bounds || (cursorKey >= bounds.start && cursorKey <= bounds.end)) {
      keys.push(cursorKey);
    }
    cursorKey = ymdAddDays(cursorKey, 1);
  }
  if (!keys.length) {
    const fallback = bounds?.start ?? monday;
    return { start: fallback, end: fallback, keys: [fallback] };
  }
  return { start: keys[0]!, end: keys[keys.length - 1]!, keys };
}

/** Todas las semanas lun–dom que intersectan el curso. */
export function listCourseWeeks(bounds: CourseDateBounds): BogotaWeekRange[] {
  const weeks: BogotaWeekRange[] = [];
  let monday = bogotaWeekMonday(new Date(`${bounds.start}T12:00:00-05:00`));
  const lastMonday = bogotaWeekMonday(new Date(`${bounds.end}T12:00:00-05:00`));

  while (monday <= lastMonday) {
    const week = bogotaWeekRange(new Date(`${monday}T12:00:00-05:00`), bounds);
    if (week.keys.length) weeks.push(week);
    monday = ymdAddDays(monday, 7);
  }

  return weeks;
}

export function weekIndexForDate(weeks: BogotaWeekRange[], dateKey: string): number {
  const idx = weeks.findIndex((w) => dateKey >= w.start && dateKey <= w.end);
  if (idx >= 0) return idx;
  if (!weeks.length) return 0;
  if (dateKey < weeks[0]!.start) return 0;
  return weeks.length - 1;
}

export function clampWeekIndex(index: number, weeks: BogotaWeekRange[]): number {
  if (!weeks.length) return 0;
  return Math.max(0, Math.min(weeks.length - 1, index));
}

/** Rango API = curso completo (1 jun – 26 jul). */
export function bogotaCourseApiRange(bounds: CourseDateBounds) {
  return {
    start: bounds.start,
    end: bounds.end,
    apiStart: `${bounds.start}T00:00:00-05:00`,
    apiEnd: `${bounds.end}T23:59:59.999-05:00`,
  };
}

/** @deprecated Usar bogotaCourseApiRange + listCourseWeeks */
export function bogotaCalendarViewRange(date = new Date()): BogotaWeekRange {
  const bounds = PREICFES_SG26_COURSE_BOUNDS;
  const weeks = listCourseWeeks(bounds);
  const idx = weekIndexForDate(weeks, bogotaTodayKey(date));
  return weeks[idx] ?? bogotaWeekRange(date, bounds);
}

export function bogotaWeekApiRange(date = new Date()) {
  return bogotaCalendarApiRange(date);
}

/** @deprecated Usar bogotaCourseApiRange */
export function bogotaCalendarApiRange(date = new Date()) {
  const week = bogotaCalendarViewRange(date);
  return {
    ...week,
    apiStart: `${week.start}T00:00:00-05:00`,
    apiEnd: `${week.end}T23:59:59.999-05:00`,
  };
}

export function formatWeekHeading(start: string, end: string): string {
  const s = new Date(`${start}T12:00:00-05:00`);
  const e = new Date(`${end}T12:00:00-05:00`);
  const fmt = (dt: Date, withMonth: boolean) =>
    dt.toLocaleDateString('es-CO', {
      timeZone: BOGOTA,
      day: 'numeric',
      ...(withMonth ? { month: 'long' } : {}),
    });
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  if (sameMonth) {
    return `Del ${fmt(s, false)} al ${fmt(e, true)}`;
  }
  return `Del ${fmt(s, true)} al ${fmt(e, true)}`;
}

export function formatCourseWeekNavLabel(
  weekIndex: number,
  totalWeeks: number,
  week: BogotaWeekRange,
  academicLabel?: string,
): string {
  const heading = formatWeekHeading(week.start, week.end);
  const title = academicLabel?.trim() || `Semana ${weekIndex + 1}`;
  return `${title} de ${totalWeeks} · ${heading}`;
}

export function formatAcademicWeekNavLabel(
  week: VacacionalAcademicWeekRange,
  totalWeeks: number,
): string {
  return formatCourseWeekNavLabel(0, totalWeeks, week, week.label);
}
