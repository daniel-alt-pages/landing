#!/usr/bin/env node
/**
 * Sync calendario vacacional → Firestore (courseRuntime + courseCalendarSnapshots).
 *
 * Uso:
 *   $env:SG_FIREBASE_ENV='pruebas'
 *   npm run course:sync-calendar -- --course preicfes-sg26 --start 2026-06-01 --end 2026-07-26
 *
 * Fuentes (--source auto|google_api|ics):
 *   - google_api: Calendar API + service account (--calendar-id requerido)
 *   - ics: CALENDAR_VACACIONAL_ICS_URL en .env.local
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initFirestore, parseCliArgs } from './lib/firebase-admin-env.mjs';
import { bumpConfigCourseVersion } from './lib/course-version-manifest.mjs';
import {
  computeCalendarStats,
  filterCourseCalendarDisplayEvents,
  filterCourseScheduledClassEvents,
} from './lib/course-calendar-stats.mjs';
import {
  filterEventsForWeekSpec,
  resolveCourseCalendarWeek,
} from './lib/course-calendar-weeks.mjs';
import { listGoogleCalendarEvents } from './lib/google-calendar-fetch.mjs';
import {
  fetchAndParseVacacionalIcs,
  filterEventsByRange as filterIcsRange,
} from '../lib/vacacional-ics.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportesRoot = join(__dirname, '../..');

const DEFAULT_BOUNDS = {
  'preicfes-sg26': { start: '2026-06-08', end: '2026-07-26' },
};

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

function toApiRange(start, end) {
  return {
    start,
    end,
    apiStart: `${start}T00:00:00-05:00`,
    apiEnd: `${end}T23:59:59-05:00`,
  };
}

async function resolveEvents({ source, calendarId, range, saPath, includeCancelled }) {
  const preferred = source || process.env.COURSE_CALENDAR_SOURCE || 'auto';
  const icsUrl = process.env.CALENDAR_VACACIONAL_ICS_URL?.trim();
  const calId =
    calendarId ||
    process.env.CALENDAR_ID_VACACIONAL?.trim() ||
    process.env.GOOGLE_CALENDAR_ID?.trim();

  const tryGoogle = preferred === 'google_api' || (preferred === 'auto' && calId);
  if (tryGoogle && calId) {
    try {
      const events = await listGoogleCalendarEvents({
        calendarId: calId,
        timeMin: range.apiStart,
        timeMax: range.apiEnd,
        saPath,
        includeCancelled,
      });
      return { events, source: 'google_api', calendarId: calId };
    } catch (error) {
      if (preferred === 'google_api') throw error;
      console.warn('[calendar-sync] Google API falló, probando ICS:', error.message);
    }
  }

  if (!icsUrl) {
    throw new Error(
      'Sin fuente de calendario. Configura --calendar-id o CALENDAR_VACACIONAL_ICS_URL.',
    );
  }

  const all = await fetchAndParseVacacionalIcs(icsUrl);
  const timeMin = new Date(range.apiStart);
  const timeMax = new Date(range.apiEnd);
  const events = filterIcsRange(all, timeMin, timeMax, includeCancelled);
  return {
    events,
    source: 'ics',
    calendarId: calId || process.env.CALENDAR_ID_VACACIONAL?.trim() || 'vacacional',
  };
}

async function main() {
  loadEnvLocal();
  const args = parseCliArgs();
  const courseId = args.course || process.env.COURSE_ID || 'preicfes-sg26';
  const weekSpec = args.week ? resolveCourseCalendarWeek(courseId, args.week) : null;
  const bounds = DEFAULT_BOUNDS[courseId] || { start: '2026-06-01', end: '2026-07-26' };
  const range = toApiRange(
    args.start || weekSpec?.start || bounds.start,
    args.end || weekSpec?.end || bounds.end,
  );

  const { db, saPath } = initFirestore(args.env);
  const fetched = await resolveEvents({
    source: args.source,
    calendarId: args.calendarId,
    range,
    saPath,
    includeCancelled: args.includeCancelled,
  });

  const inRange = weekSpec
    ? filterEventsForWeekSpec(fetched.events, weekSpec)
    : fetched.events;
  const events = filterCourseCalendarDisplayEvents(inRange, courseId);
  const stats = computeCalendarStats(
    filterCourseScheduledClassEvents(inRange, courseId),
    Date.now(),
    courseId,
  );
  const runtimeRef = db.collection('courseRuntime').doc(courseId);
  const snapshotRef = db.collection('courseCalendarSnapshots').doc(courseId);
  const runtimeSnap = await runtimeRef.get();
  const prevVersion = Number(runtimeSnap.data()?.calendarVersion || 0);
  const nextVersion = prevVersion + 1;
  const nowIso = new Date().toISOString();

  const snapshotPayload = {
    courseId,
    version: nextVersion,
    source: fetched.source,
    calendarId: fetched.calendarId,
    label: process.env.CALENDAR_VACACIONAL_LABEL?.trim() || 'PREICFES Vacacional 2026',
    range: { start: range.start, end: range.end },
    ...(weekSpec
      ? {
          weekNumber: weekSpec.weekNumber,
          weekLabel: weekSpec.label,
        }
      : {}),
    events,
    stats,
    updatedAt: nowIso,
  };

  const runtimePayload = {
    courseId,
    calendarVersion: nextVersion,
    calendarUpdatedAt: nowIso,
    activeFrom: range.start,
    activeTo: range.end,
    ...(weekSpec
      ? {
          calendarWeekNumber: weekSpec.weekNumber,
          calendarWeekLabel: weekSpec.label,
        }
      : {}),
    calendarDocPath: `courseCalendarSnapshots/${courseId}`,
    calendarId: fetched.calendarId,
    label: snapshotPayload.label,
    stats,
    attendanceVersion: Number(runtimeSnap.data()?.attendanceVersion || 0),
    attendanceUpdatedAt: runtimeSnap.data()?.attendanceUpdatedAt || null,
  };

  console.log('[calendar-sync] course=', courseId);
  if (weekSpec) {
    console.log(
      '[calendar-sync] week=',
      weekSpec.weekNumber,
      weekSpec.label,
      `${range.start}→${range.end}`,
      'solo-clase',
    );
  }
  console.log(
    '[calendar-sync] source=',
    fetched.source,
    'events=',
    events.length,
    inRange.length !== events.length
      ? `(display filter: ${inRange.length - events.length} excl.)`
      : '',
  );
  console.log('[calendar-sync] stats=', stats);
  console.log('[calendar-sync] calendarVersion', prevVersion, '→', nextVersion);

  if (args.dryRun) {
    console.log('[calendar-sync] dry-run — no se escribió Firestore');
    return;
  }

  const batch = db.batch();
  batch.set(snapshotRef, snapshotPayload, { merge: false });
  batch.set(runtimeRef, runtimePayload, { merge: true });
  await batch.commit();
  await bumpConfigCourseVersion(db, courseId, nextVersion);

  console.log('[calendar-sync] ✓ Firestore actualizado (+ config/app.courseVersions)');
}

main().catch((error) => {
  console.error('[calendar-sync] ERROR:', error.message || error);
  process.exitCode = 1;
});
