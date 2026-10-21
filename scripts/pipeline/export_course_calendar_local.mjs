#!/usr/bin/env node
/**
 * Exporta snapshot ICS → data/course/calendar/{courseId}.json (fallback estático en app).
 *
 *   npm run course:export-calendar -- --course preicfes-sg26 --start 2026-06-08 --end 2026-06-13
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  fetchAndParseVacacionalIcs,
  filterEventsByRange,
} from '../lib/vacacional-ics.mjs';
import { parseCliArgs } from './lib/firebase-admin-env.mjs';
import {
  filterEventsForWeekSpec,
  resolveCourseCalendarWeek,
} from './lib/course-calendar-weeks.mjs';
import { filterCourseCalendarDisplayEvents } from './lib/course-calendar-stats.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportesRoot = join(__dirname, '../..');
const repoRoot = join(reportesRoot, '..');

function loadEnvLocal() {
  const envPath = join(reportesRoot, '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const DEFAULT_BOUNDS = {
  'preicfes-sg26': { start: '2026-06-08', end: '2026-07-26' },
};

loadEnvLocal();

const cli = parseCliArgs();
const courseId = cli.course || 'preicfes-sg26';
const weekSpec = cli.week ? resolveCourseCalendarWeek(courseId, cli.week) : null;
const defaults = DEFAULT_BOUNDS[courseId] || { start: '2026-06-01', end: '2026-07-26' };
const bounds = {
  start: cli.start || weekSpec?.start || defaults.start,
  end: cli.end || weekSpec?.end || defaults.end,
};
const icsUrl = process.env.CALENDAR_VACACIONAL_ICS_URL?.trim();

if (!icsUrl) {
  console.error('[export-calendar] Falta CALENDAR_VACACIONAL_ICS_URL en .env.local');
  process.exit(1);
}

const all = await fetchAndParseVacacionalIcs(icsUrl);
let events = filterEventsByRange(
  all,
  new Date(`${bounds.start}T00:00:00-05:00`),
  new Date(`${bounds.end}T23:59:59-05:00`),
  false,
);
if (weekSpec) {
  events = filterEventsForWeekSpec(events, weekSpec);
}
events = filterCourseCalendarDisplayEvents(events, courseId);

const outDir = join(repoRoot, 'data', 'course', 'calendar');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `${courseId}.json`);

const payload = {
  courseId,
  version: Date.now(),
  syncedAt: new Date().toISOString(),
  source: 'ics',
  bounds,
  ...(weekSpec
    ? { weekNumber: weekSpec.weekNumber, weekLabel: weekSpec.label }
    : {}),
  count: events.length,
  events,
};

writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`[export-calendar] ✓ ${events.length} eventos → ${outPath}`);
