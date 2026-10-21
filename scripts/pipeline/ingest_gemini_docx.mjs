#!/usr/bin/env node
/**
 * Síntesis desde .docx locales (Notas de Gemini) → data/course/gemini-notes/{courseId}.json
 *
 * Uso:
 *   npm run course:ingest-gemini-docx -- --course preicfes-sg26
 *   npm run course:ingest-gemini-docx -- --dir "../docs de las clases"
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parseCliArgs } from './lib/firebase-admin-env.mjs';
import { synthesizeGeminiClassDescription } from './lib/gemini-notes-synthesis.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportesRoot = join(__dirname, '../..');
const repoRoot = join(reportesRoot, '..');

const DEFAULT_DIRS = [
  join(repoRoot, 'docs de las clases'),
  join(repoRoot, 'drive-download-20260610T080430Z-3-001'),
];

const extractDocxScript = join(repoRoot, 'scripts', 'pipeline', 'extract_docx_text.py');

function extractDocxPlainText(filePath) {
  const r = spawnSync('python', [extractDocxScript, filePath], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (r.status !== 0) {
    throw new Error(r.stderr?.trim() || `falló extracción ${filePath}`);
  }
  return r.stdout?.trim() || '';
}

function loadCalendar(courseId) {
  const path = join(repoRoot, 'data', 'course', 'calendar', `${courseId}.json`);
  if (!existsSync(path)) throw new Error(`Falta calendario: ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function stableRecordingId(eventId, url, driveFileId) {
  return `ics-${eventId}-${driveFileId || url}`;
}

function extractDriveFileId(url) {
  const fileMatch = String(url).match(/\/file\/d\/([^/?#]+)/i);
  if (fileMatch?.[1]) return fileMatch[1];
  const idMatch = String(url).match(/[?&]id=([^&]+)/i);
  return idMatch?.[1] ?? null;
}

function normalizeKey(s) {
  return String(s)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[_\-–—]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sessionKeyFromFilename(name) {
  const base = name.replace(/\s*-\s*Notas de Gemini\.docx$/i, '').trim();
  const cut = (base.split(/\s+\d{4}_\d{2}_\d{2}/)[0]?.trim() || base).replace(/_+$/g, '');
  return normalizeKey(cut);
}

function sessionKeyFromSummary(summary) {
  return normalizeKey(summary);
}

function findGeminiDocxFiles(dirs) {
  const files = [];
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      console.warn(`⚠ omitido (no existe): ${dir}`);
      continue;
    }
    for (const name of readdirSync(dir)) {
      if (!/notas de gemini\.docx$/i.test(name)) continue;
      const full = join(dir, name);
      if (statSync(full).isFile()) files.push(full);
    }
  }
  return files;
}

const AREA_TOKENS = [
  'ingles',
  'lectura critica',
  'competencias ciudadanas',
  'ciencias naturales',
  'matematicas',
  'plataforma de simulacros',
  'clase #1',
  'clase #2',
];

function areaTail(key) {
  for (const area of AREA_TOKENS) {
    if (key.includes(area)) return area;
  }
  const idx = key.lastIndexOf('induccion especifica');
  return idx >= 0 ? key.slice(idx + 'induccion especifica'.length).trim() : key;
}

function matchScore(fileKey, eventKey) {
  if (fileKey === eventKey) return 1000;
  const fileTail = areaTail(fileKey);
  const eventTail = areaTail(eventKey);
  if (fileTail && eventTail && fileTail === eventTail) return 900;
  if (fileTail && eventKey.includes(fileTail)) return 800;

  const fileTokens = new Set(fileKey.split(' ').filter((t) => t.length >= 4));
  let score = 0;
  for (const t of eventKey.split(' ')) {
    if (t.length >= 4 && fileTokens.has(t)) score += t.length;
  }
  return score;
}

function matchEvent(events, fileKey) {
  let best = null;
  let bestScore = 0;
  for (const event of events) {
    const eventKey = sessionKeyFromSummary(event.summary?.trim() || '');
    const score = matchScore(fileKey, eventKey);
    if (score > bestScore) {
      bestScore = score;
      best = event;
    }
  }
  return bestScore >= 40 ? best : null;
}

function geminiUrlFromEvent(event) {
  const att = (event.attachments || []).find(
    (a) => a.kind === 'gemini' || /notas de gemini/i.test(a.title || ''),
  );
  return att?.url || '';
}

const cli = parseCliArgs();
const courseId = cli.course || 'preicfes-sg26';
const extraDir = process.argv.includes('--dir')
  ? resolve(process.cwd(), process.argv[process.argv.indexOf('--dir') + 1])
  : null;
const dirs = extraDir ? [extraDir, ...DEFAULT_DIRS] : DEFAULT_DIRS;

const calendar = loadCalendar(courseId);
const events = calendar.events || [];
const docxFiles = findGeminiDocxFiles(dirs);

if (!docxFiles.length) {
  console.error('[ingest-docx] sin archivos *Notas de Gemini.docx');
  process.exit(1);
}

const litePath = join(repoRoot, 'data', 'course', 'gemini-notes', `${courseId}.json`);
const existing = existsSync(litePath)
  ? JSON.parse(readFileSync(litePath, 'utf8'))
  : null;

const notes = [];
const byRecordingId = { ...(existing?.byRecordingId || {}) };
const fullArchive = [];
const ingestedEventIds = new Set();

for (const filePath of docxFiles) {
  const fileKey = sessionKeyFromFilename(filePath.split(/[/\\]/).pop() || '');
  const event = matchEvent(events, fileKey);
  const text = extractDocxPlainText(filePath);
  const { short, extended } = synthesizeGeminiClassDescription(text);

  const summary =
    event?.summary?.trim() ||
    filePath.split(/[/\\]/).pop()?.replace(/\s*-\s*Notas de Gemini\.docx$/i, '') ||
    'Clase';

  const recordingIds = [];
  if (event) {
    for (const att of event.attachments || []) {
      if (att.kind !== 'recording' && !/\brecording\b/i.test(att.title || '')) continue;
      const driveFileId = extractDriveFileId(att.url);
      recordingIds.push(stableRecordingId(event.id, att.url, driveFileId));
    }
  }

  const geminiUrl = event ? geminiUrlFromEvent(event) : '';

  notes.push({
    eventId: event?.id,
    summary,
    sourceFile: filePath,
    summaryShort: short,
    summaryExtended: extended,
    recordingIds,
    geminiUrl: geminiUrl || undefined,
  });

  fullArchive.push({
    summary,
    sourceFile: filePath,
    text,
    summaryShort: short,
    summaryExtended: extended,
    eventId: event?.id,
    recordingIds,
  });

  const geminiNote = {
    sessionTitle: summary,
    description: short,
    extendedDescription: extended !== short ? extended : undefined,
    attachmentTitle: 'Notas de Gemini',
    url: geminiUrl,
  };

  for (const recordingId of recordingIds) {
    byRecordingId[recordingId] = { recordingId, ...geminiNote };
  }
  if (event?.id) ingestedEventIds.add(event.id);

  console.log(`✓ ${summary.slice(0, 55)}…`);
  console.log(`   ${short}`);
  if (!event) console.warn('   ⚠ sin match en calendario (sin recordingIds)');
}

const outDir = join(repoRoot, 'data', 'course', 'gemini-notes');
mkdirSync(outDir, { recursive: true });
const version = Date.now();

if (existing?.notes?.length) {
  for (const prev of existing.notes) {
    if (prev.eventId && ingestedEventIds.has(prev.eventId)) continue;
    notes.push(prev);
  }
}

const deduped = [];
const seenEvents = new Set();
for (const note of notes) {
  const key = note.eventId || note.summary || note.sourceFile;
  if (seenEvents.has(key)) continue;
  seenEvents.add(key);
  deduped.push(note);
}
notes.length = 0;
notes.push(...deduped);

const litePayload = {
  courseId,
  version,
  syncedAt: new Date().toISOString(),
  source: 'gemini_docx_local',
  count: notes.length,
  notes,
  byRecordingId,
};

const fullPayload = {
  ...litePayload,
  source: 'gemini_docx_full',
  archive: fullArchive,
};

writeFileSync(join(outDir, `${courseId}.json`), `${JSON.stringify(litePayload, null, 2)}\n`, 'utf8');
writeFileSync(join(outDir, `${courseId}.full.json`), `${JSON.stringify(fullPayload, null, 2)}\n`, 'utf8');

console.log(`\n[ingest-docx] ${notes.length} clases → data/course/gemini-notes/${courseId}.json`);
