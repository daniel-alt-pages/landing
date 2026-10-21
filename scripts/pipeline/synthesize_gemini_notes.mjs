#!/usr/bin/env node
/**
 * Genera síntesis cortas desde JSON con texto completo → JSON liviano para la app.
 *
 * Uso:
 *   npm run course:synthesize-gemini-notes -- --course preicfes-sg26
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCliArgs } from './lib/firebase-admin-env.mjs';
import { synthesizeGeminiClassDescription } from './lib/gemini-notes-synthesis.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../../..');

const cli = parseCliArgs();
const courseId = cli.course || 'preicfes-sg26';

const fullPath = join(repoRoot, 'data', 'course', 'gemini-notes', `${courseId}.full.json`);
const litePath = join(repoRoot, 'data', 'course', 'gemini-notes', `${courseId}.json`);

const sourcePath = existsSync(fullPath) ? fullPath : litePath;
if (!existsSync(sourcePath)) {
  console.error(`[synthesize] no existe ${sourcePath}`);
  console.error('  Ejecuta: npm run course:download-gemini-notes');
  process.exit(1);
}

const raw = JSON.parse(readFileSync(sourcePath, 'utf8'));
const notes = raw.notes || [];
if (!notes.length) {
  console.error('[synthesize] sin notas en el archivo');
  process.exit(1);
}

const byRecordingId = {};
const liteNotes = [];

for (const note of notes) {
  const text = note.text || note.description || '';
  if (!text.trim()) continue;

  const { short, extended } = synthesizeGeminiClassDescription(text);
  liteNotes.push({
    eventId: note.eventId,
    summary: note.summary,
    geminiDocId: note.geminiDocId,
    geminiUrl: note.geminiUrl,
    summaryShort: short,
    summaryExtended: extended,
    recordingIds: note.recordingIds || [],
  });

  const geminiNote = {
    sessionTitle: note.summary?.trim() || 'Clase',
    description: short,
    extendedDescription: extended !== short ? extended : undefined,
    attachmentTitle: 'Notas de Gemini',
    url: note.geminiUrl || '',
  };

  for (const recordingId of note.recordingIds || []) {
    byRecordingId[recordingId] = { recordingId, ...geminiNote };
  }

  console.log(`✓ ${note.summary?.slice(0, 50)}…`);
  console.log(`  corta: ${short}`);
}

const payload = {
  courseId,
  version: Date.now(),
  syncedAt: new Date().toISOString(),
  source: 'gemini_synthesis',
  archiveSource: sourcePath,
  count: liteNotes.length,
  notes: liteNotes,
  byRecordingId,
};

writeFileSync(litePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`\n[synthesize] escrito ${litePath} (${liteNotes.length} clases)`);
