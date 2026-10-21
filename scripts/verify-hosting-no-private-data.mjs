/**
 * Falla si out/ aún contiene JSON/CSV privados de simulacros (post-strip, pre-deploy).
 * Uso: node scripts/verify-hosting-no-private-data.mjs
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const outDir = join(root, 'out');
const dataDir = join(outDir, 'data');

const BLOCKED_DIRS = ['simulations', 'estudiantes', 'student-materials', 'analysis_results'];
const BLOCKED_FILES = new Set([
  'auth_index.json',
  'resultados_finales.json',
  'ranking_index.json',
  'rankings_nacionales.json',
  'estadisticas_grupo.json',
  'coordinator_summary.json',
  'coordinator_tokens.json',
  'invalidaciones.json',
  'current_simulation.json',
]);

const SENSITIVE_EXT = new Set(['.json', '.csv']);

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function walkSensitiveFiles(dir, base = outDir, hits = []) {
  if (!existsSync(dir)) return hits;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSensitiveFiles(full, base, hits);
      continue;
    }
    const ext = extname(entry.name).toLowerCase();
    if (!SENSITIVE_EXT.has(ext)) continue;
    const rel = full.slice(base.length + 1).replace(/\\/g, '/');
    hits.push({ rel, bytes: statSync(full).size });
  }
  return hits;
}

function main() {
  console.log('\n[verify-hosting-no-private-data]\n');

  if (!existsSync(outDir)) {
    console.error('❌ Falta out/. Ejecuta build + strip-hosting-deploy primero.\n');
    process.exit(1);
  }

  const violations = [];

  if (existsSync(dataDir)) {
    for (const name of BLOCKED_DIRS) {
      const full = join(dataDir, name);
      if (existsSync(full)) {
        violations.push({ rel: `data/${name}/`, bytes: walkSize(full) });
      }
    }
    for (const name of BLOCKED_FILES) {
      const full = join(dataDir, name);
      if (existsSync(full)) {
        violations.push({ rel: `data/${name}`, bytes: statSync(full).size });
      }
    }
  }

  const largeJson = walkSensitiveFiles(dataDir).filter((h) => h.bytes > 50 * 1024);

  if (violations.length === 0 && largeJson.length === 0) {
    const dataSize = existsSync(dataDir) ? walkSize(dataDir) : 0;
    console.log('✅ out/ sin rutas privadas bloqueadas.');
    if (existsSync(dataDir)) {
      console.log(`   out/data restante: ${formatBytes(dataSize)}`);
    } else {
      console.log('   out/data/ ausente (OK).');
    }
    console.log('');
    return;
  }

  console.error('❌ Datos privados detectados en out/ (no desplegar):\n');
  for (const v of violations) {
    console.error(`   ${v.rel}  (${formatBytes(v.bytes)})`);
  }
  for (const h of largeJson.slice(0, 10)) {
    console.error(`   ${h.rel}  (${formatBytes(h.bytes)})`);
  }
  if (largeJson.length > 10) {
    console.error(`   … y ${largeJson.length - 10} JSON/CSV más >50KB`);
  }
  console.error('\n   Ejecuta: node scripts/strip-hosting-deploy.mjs\n');
  process.exit(1);
}

function walkSize(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) total += walkSize(full);
    else total += statSync(full).size;
  }
  return total;
}

main();
