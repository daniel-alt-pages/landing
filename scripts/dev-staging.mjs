/**
 * Next dev apuntando a Firebase staging (pruebas-sg-aa586).
 * Requiere .env.staging.local (copiar desde .env.staging.example).
 *
 * Las vars NEXT_PUBLIC_FIREBASE_* se fijan en process.env ANTES de arrancar Next;
 * Next no las sobrescribe con .env.local si ya existen en process.env.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function applyDevPrepare() {
  const prep = spawnSync('node', ['scripts/dev-prepare.mjs'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'inherit'],
  });
  if (prep.status !== 0) {
    console.error('[dev:staging] dev-prepare falló');
    process.exit(prep.status ?? 1);
  }
  const buildId = prep.stdout.trim().split(/\r?\n/).pop()?.trim();
  if (buildId) process.env.NEXT_PUBLIC_BUILD_ID = buildId;
}
const envFile = join(root, '.env.staging.local');
const exampleFile = join(root, '.env.staging.example');
const prodEnvLocal = join(root, '.env.local');

function parseEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
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
    out[key] = val;
  }
  return out;
}

if (!existsSync(envFile)) {
  console.error(
    '[dev:staging] Falta .env.staging.local\n' +
      `  Copy-Item .env.staging.example .env.staging.local\n` +
      `  (${exampleFile})`
  );
  process.exit(1);
}

const stagingVars = parseEnvFile(envFile);
for (const [key, val] of Object.entries(stagingVars)) {
  process.env[key] = val;
}

process.env.NEXT_PUBLIC_FIREBASE_ENV = 'staging';
process.env.NEXT_PUBLIC_COURSE_CALENDAR_SOURCE = 'firestore';
process.env.NEXT_PUBLIC_DEMO_DATA_SOURCE =
  process.env.NEXT_PUBLIC_DEMO_DATA_SOURCE || 'firebase';
process.env.NODE_ENV = 'development';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
console.log(`[dev:staging] Firebase project: ${projectId || '(sin PROJECT_ID)'}`);

if (projectId === 'simulacros-sg') {
  console.error('[dev:staging] ABORT: .env.staging.local apunta a PROD. Usa pruebas-sg-aa586.');
  process.exit(1);
}

const localVars = parseEnvFile(prodEnvLocal);
const localProject = localVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (localProject && localProject !== projectId) {
  console.log(
    `[dev:staging] .env.local tiene PROJECT_ID=${localProject} — ignorado para Firebase; ` +
      `gana staging (${projectId}).`
  );
} else if (existsSync(prodEnvLocal)) {
  console.log('[dev:staging] Next también carga .env.local (otras vars). Firebase = staging.');
}

applyDevPrepare();

// Sirve /data/calendar/*.json como respaldo cuando Firestore no entrega snapshot (ReadBudget, etc.)
spawnSync('node', ['scripts/ensure-data-local.mjs'], { cwd: root, stdio: 'inherit' });

const calendar = spawn('node', ['scripts/calendar-api-server.mjs'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
});

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(npx, ['next', 'dev', '--webpack'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
});

function shutdown() {
  calendar.kill();
  child.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

child.on('exit', (code) => {
  calendar.kill();
  process.exit(code ?? 0);
});
