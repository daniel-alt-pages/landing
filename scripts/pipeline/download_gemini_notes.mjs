#!/usr/bin/env node
/**
 * Descarga texto de Notas de Gemini (Google Docs del calendario) → data/course/gemini-notes/{courseId}.json
 *
 * Requisitos:
 *   - Snapshot calendario: npm run course:export-calendar
 *   - Service account con Drive readonly (mismo que Calendar sync)
 *   - Docs compartidos con el email del SA o visibles en dominio
 *
 * Uso:
 *   $env:SG_FIREBASE_ENV='pruebas'
 *   npm run course:download-gemini-notes -- --course preicfes-sg26
 *   npm run course:download-gemini-notes -- --course preicfes-sg26 --dry-run
 *   npm run course:download-gemini-notes -- --course preicfes-sg26 --event-id <ics-event-id>
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findServiceAccountPath, parseCliArgs } from './lib/firebase-admin-env.mjs';
import {
  exportGoogleDocAsText,
  extractGoogleDocId,
  probeDriveAccess,
} from './lib/google-drive-export.mjs';
import { synthesizeGeminiClassDescription } from './lib/gemini-notes-synthesis.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportesRoot = join(__dirname, '../..');
const repoRoot = join(reportesRoot, '..');

function stableRecordingId(eventId, url, driveFileId) {
  return `ics-${eventId}-${driveFileId || url}`;
}

function extractDriveFileId(url) {
  const fileMatch = String(url).match(/\/file\/d\/([^/?#]+)/i);
  if (fileMatch?.[1]) return fileMatch[1];
  const idMatch = String(url).match(/[?&]id=([^&]+)/i);
  return idMatch?.[1] ?? null;
}

function isRecordingAttachment(att) {
  const title = String(att.title || '');
  return att.kind === 'recording' || /\brecording\b/i.test(title);
}

function isGeminiAttachment(att) {
  return att.kind === 'gemini' || /notas de gemini/i.test(String(att.title || ''));
}

function loadCalendar(courseId) {
  const candidates = [
    join(repoRoot, 'data', 'course', 'calendar', `${courseId}.json`),
    join(reportesRoot, 'data-local', 'calendar', `${courseId}.json`),
    join(reportesRoot, 'public', 'data', 'calendar', `${courseId}.json`),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const data = JSON.parse(readFileSync(path, 'utf8'));
    if (data?.events?.length) return { path, data };
  }
  throw new Error(
    `Sin calendario local para ${courseId}. Ejecuta: npm run course:export-calendar`,
  );
}

const cli = parseCliArgs();
const courseId = cli.course || 'preicfes-sg26';
const dryRun = Boolean(cli.dryRun);
const onlyEventId = process.argv.includes('--event-id')
  ? process.argv[process.argv.indexOf('--event-id') + 1]
  : null;
const saPath = findServiceAccountPath(cli.env);

const { path: calendarPath, data: calendar } = loadCalendar(courseId);
console.log(`[gemini-notes] calendario: ${calendarPath}`);

let clientEmail = '';
if (!dryRun) {
  const probe = await probeDriveAccess(saPath);
  clientEmail = probe.clientEmail;
  console.log(`[gemini-notes] service account: ${clientEmail}`);
}

const notes = [];
const byRecordingId = {};
let ok = 0;
let skipped = 0;
let failed = 0;

for (const event of calendar.events) {
  if (onlyEventId && event.id !== onlyEventId) continue;

  const geminiAtt = (event.attachments || []).find(isGeminiAttachment);
  if (!geminiAtt?.url) continue;

  const docId = extractGoogleDocId(geminiAtt.url);
  if (!docId) {
    console.warn(`⚠ ${event.summary}: URL Gemini sin doc id — ${geminiAtt.url}`);
    skipped += 1;
    continue;
  }

  const recordingIds = [];
  for (const att of event.attachments || []) {
    if (!isRecordingAttachment(att)) continue;
    const driveFileId = extractDriveFileId(att.url);
    recordingIds.push(stableRecordingId(event.id, att.url, driveFileId));
  }

  const summary = String(event.summary || 'Clase').trim();
  console.log(`\n→ ${summary}`);
  console.log(`  doc: ${docId} · grabaciones: ${recordingIds.length}`);

  if (dryRun) {
    skipped += 1;
    continue;
  }

  try {
    const text = await exportGoogleDocAsText({ fileId: docId, saPath });
    if (!text) {
      console.warn('  ⚠ documento vacío');
      skipped += 1;
      continue;
    }

    const { short, extended } = synthesizeGeminiClassDescription(text);

    const entry = {
      eventId: event.id,
      summary,
      geminiDocId: docId,
      geminiUrl: geminiAtt.url,
      text,
      summaryShort: short,
      summaryExtended: extended,
      recordingIds,
    };
    notes.push(entry);

    const geminiNote = {
      sessionTitle: summary,
      description: short,
      extendedDescription: extended !== short ? extended : undefined,
      attachmentTitle: geminiAtt.title?.trim() || 'Notas de Gemini',
      url: geminiAtt.url,
    };

    for (const recordingId of recordingIds) {
      byRecordingId[recordingId] = { recordingId, ...geminiNote };
    }

    console.log(`  ✓ ${text.length} chars → síntesis ${short.length} chars`);
    ok += 1;
  } catch (err) {
    console.error(`  ✗ ${err.message}`);
    if (/403|404/.test(err.message)) {
      console.error(
        `    Tip: comparte el Doc con ${clientEmail} o usa cuenta de dominio con acceso.`,
      );
    }
    failed += 1;
  }
}

if (dryRun) {
  console.log(`\n[dry-run] eventos con Gemini listados. Sin escritura.`);
  process.exit(0);
}

if (ok === 0 && failed > 0) {
  console.error('\n[gemini-notes] nada descargado — JSON no actualizado.');
  console.error(
    '  1) Habilita Drive API en el proyecto GCP del service account',
  );
  console.error(
    `  2) Comparte cada Doc con ${clientEmail} (lector) o dominio Workspace`,
  );
  process.exit(1);
}

const outDir = join(repoRoot, 'data', 'course', 'gemini-notes');
mkdirSync(outDir, { recursive: true });

const fullPath = join(outDir, `${courseId}.full.json`);
const liteNotes = notes.map((n) => ({
  eventId: n.eventId,
  summary: n.summary,
  geminiDocId: n.geminiDocId,
  geminiUrl: n.geminiUrl,
  summaryShort: n.summaryShort,
  summaryExtended: n.summaryExtended,
  recordingIds: n.recordingIds,
}));

const fullPayload = {
  courseId,
  version: Date.now(),
  syncedAt: new Date().toISOString(),
  source: 'google_drive_export',
  calendarSource: calendarPath,
  count: notes.length,
  notes,
  byRecordingId,
};

const litePayload = {
  courseId,
  version: fullPayload.version,
  syncedAt: fullPayload.syncedAt,
  source: 'gemini_synthesis',
  count: liteNotes.length,
  notes: liteNotes,
  byRecordingId,
};

writeFileSync(fullPath, `${JSON.stringify(fullPayload, null, 2)}\n`, 'utf8');
const outPath = join(outDir, `${courseId}.json`);
writeFileSync(outPath, `${JSON.stringify(litePayload, null, 2)}\n`, 'utf8');
console.log(`\n[gemini-notes] archivo completo → ${fullPath}`);
console.log(`[gemini-notes] síntesis app → ${outPath}`);
console.log(`  ok=${ok} skipped=${skipped} failed=${failed}`);
if (failed > 0) process.exit(1);
