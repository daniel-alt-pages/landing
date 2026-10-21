/**
 * Fail deploy if static export bloated student routes (post-strip, pre-hosting).
 * Expect panels-only staging/prod: one sg_demo shell, not full roster.
 *
 * Uso: NEXT_PUBLIC_PANELS_ONLY=true node scripts/verify-hosting-export-budget.mjs
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const outDir = join(root, 'out');
const estudianteDir = join(outDir, 'estudiante');

const panelsOnly = process.env.NEXT_PUBLIC_PANELS_ONLY === 'true';
const MAX_SG_FOLDERS = 1;
const MAX_ESTUDIANTE_FILES = 1500;
const MAX_OUT_FILES = 3500;
const MAX_OUT_BYTES = 35 * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function countFiles(dir) {
  if (!existsSync(dir)) return 0;
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(full);
    else count += 1;
  }
  return count;
}

function totalOutBytes(dir) {
  if (!existsSync(dir)) return 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) bytes += totalOutBytes(full);
    else bytes += statSync(full).size;
  }
  return bytes;
}

function listSgStudentFolders() {
  if (!existsSync(estudianteDir)) return [];
  return readdirSync(estudianteDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('sg_'))
    .map((e) => e.name);
}

if (!existsSync(outDir)) {
  console.error('[verify-hosting-export-budget] missing out/ — run build first');
  process.exit(1);
}

const sgFolders = listSgStudentFolders();
const estudianteFiles = countFiles(estudianteDir);
const outFiles = countFiles(outDir);
const outBytes = totalOutBytes(outDir);

console.log('[verify-hosting-export-budget] summary');
console.log(`  panelsOnly=${panelsOnly}`);
console.log(`  sg_* folders=${sgFolders.length} (${sgFolders.slice(0, 5).join(', ')}${sgFolders.length > 5 ? ', …' : ''})`);
console.log(`  estudiante files=${estudianteFiles}`);
console.log(`  out files=${outFiles}`);
console.log(`  out size=${formatBytes(outBytes)}`);

const errors = [];

if (panelsOnly) {
  if (sgFolders.length > MAX_SG_FOLDERS) {
    errors.push(
      `out/estudiante has ${sgFolders.length} sg_* folders (max ${MAX_SG_FOLDERS}). ` +
        'Fix staticExportStudentCodes — do not publish full roster to hosting.',
    );
  }
  if (estudianteFiles > MAX_ESTUDIANTE_FILES) {
    errors.push(
      `out/estudiante has ${estudianteFiles} files (max ${MAX_ESTUDIANTE_FILES}). ` +
        'Student static export is bloated.',
    );
  }
  if (outFiles > MAX_OUT_FILES) {
    errors.push(`out/ has ${outFiles} files (max ${MAX_OUT_FILES}).`);
  }
  if (outBytes > MAX_OUT_BYTES) {
    errors.push(`out/ size ${formatBytes(outBytes)} exceeds ${formatBytes(MAX_OUT_BYTES)}.`);
  }
  if (!existsSync(join(estudianteDir, 'sg_demo'))) {
    errors.push('missing out/estudiante/sg_demo — technical shell required for deep-links.');
  }
}

if (errors.length > 0) {
  console.error('[verify-hosting-export-budget] FAILED');
  for (const msg of errors) console.error(`  - ${msg}`);
  process.exit(1);
}

console.log('[verify-hosting-export-budget] OK');
