/**
 * Ventanas académicas del vacacional (semana N → rango + reglas de sync).
 * Fuente: data/course/academic-weeks/{courseId}.json
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPlaceholderVacacionalSummary } from '../../lib/vacacional-ics.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../../../..');

function loadAcademicWeeksJson(courseId) {
  const path = join(repoRoot, 'data', 'course', 'academic-weeks', `${courseId}.json`);
  if (!existsSync(path)) return null;
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const weeks = data?.weeks;
  if (!Array.isArray(weeks) || !weeks.length) return null;
  const map = {};
  for (const w of weeks) {
    const n = Number(w.number);
    if (!Number.isFinite(n)) continue;
    map[n] = {
      start: w.start,
      end: w.end,
      label: w.label || `Semana ${n}`,
      sessionsOnly: 'clase',
    };
  }
  return map;
}

/** @type {Record<string, Record<number, { start: string; end: string; label: string; sessionsOnly?: 'clase' | 'all' }>>} */
export const COURSE_CALENDAR_WEEKS = {
  'preicfes-sg26': loadAcademicWeeksJson('preicfes-sg26') ?? {
    1: { start: '2026-06-08', end: '2026-06-13', label: 'Semana 1', sessionsOnly: 'clase' },
    2: { start: '2026-06-14', end: '2026-06-20', label: 'Semana 2', sessionsOnly: 'clase' },
    3: { start: '2026-06-22', end: '2026-06-28', label: 'Semana 3', sessionsOnly: 'clase' },
  },
};

export function resolveCourseCalendarWeek(courseId, weekNumber) {
  const n = Number(weekNumber);
  if (!Number.isFinite(n) || n < 1) return null;
  const spec = COURSE_CALENDAR_WEEKS[courseId]?.[n];
  if (!spec) return null;
  return { weekNumber: n, ...spec };
}

/** Sesión de clase numerada (excluye inducciones y placeholders). */
export function isVacacionalClaseSession(event) {
  if (isPlaceholderVacacionalSummary(event?.summary)) return false;
  const summary = String(event?.summary || '');
  if (/INDUCCIÓN/i.test(summary)) return false;
  return /CLASE\s*#\d+/i.test(summary);
}

export function filterEventsForWeekSpec(events, weekSpec) {
  let list = events.filter((e) => !isPlaceholderVacacionalSummary(e.summary));
  if (weekSpec?.sessionsOnly === 'clase') {
    list = list.filter(isVacacionalClaseSession);
  }
  return list;
}
