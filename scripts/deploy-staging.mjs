/**
 * Build (Firebase pruebas) + deploy hosting + reglas Firestore en pruebas-sg-aa586.
 * Requiere .env.staging.local (copiar desde .env.staging.example).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = join(root, '.env.staging.local');
const projectId = 'pruebas-sg-aa586';

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

function run(label, cmd, args, extraEnv = {}, optional = false) {
  console.log(`\n[deploy:staging] ${label}\n`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...extraEnv },
  });
  if (r.status !== 0) {
    if (optional) {
      console.warn(`[deploy:staging] SKIPPED (optional): ${label}`);
      return false;
    }
    console.error(`[deploy:staging] FAILED: ${label}`);
    process.exit(r.status ?? 1);
  }
  return true;
}

if (!existsSync(envFile)) {
  console.error(
    '[deploy:staging] Falta .env.staging.local\n' +
      '  Copy-Item .env.staging.example .env.staging.local'
  );
  process.exit(1);
}

const stagingVars = parseEnvFile(envFile);
if (stagingVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'simulacros-sg') {
  console.error('[deploy:staging] ABORT: .env.staging.local apunta a PROD.');
  process.exit(1);
}

const FIREBASE_ENV_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
];

const buildEnv = { ...process.env };
for (const [key, val] of Object.entries(stagingVars)) {
  buildEnv[key] = val;
}
for (const key of FIREBASE_ENV_KEYS) {
  if (stagingVars[key]) buildEnv[key] = stagingVars[key];
}
buildEnv.NEXT_PUBLIC_FIREBASE_ENV = 'staging';
buildEnv.NEXT_PUBLIC_COURSE_CALENDAR_SOURCE = 'firestore';
buildEnv.NEXT_PUBLIC_DEMO_DATA_SOURCE = stagingVars.NEXT_PUBLIC_DEMO_DATA_SOURCE || 'firebase';
buildEnv.NEXT_PUBLIC_BUILD_ID = String(Date.now());
buildEnv.NEXT_PUBLIC_PANELS_ONLY = 'true';
buildEnv.NEXT_PUBLIC_ADMIN_LOCAL_ONLY = 'true';
buildEnv.NEXT_PUBLIC_STUDENT_DEMO_ENABLED = 'false';
buildEnv.NODE_ENV = 'production';

console.log(`[deploy:staging] project=${projectId}`);
console.log(`[deploy:staging] Firebase PROJECT_ID=${buildEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID}\n`);

run('hide /api routes (static export)', 'node', ['scripts/static-export-api-routes.mjs', 'hide']);
let buildOk = false;
try {
  run('next build', 'npm', ['run', 'build'], buildEnv);
  buildOk = true;
} finally {
  run('restore /api routes', 'node', ['scripts/static-export-api-routes.mjs', 'restore'], {}, true);
}
if (!buildOk) process.exit(1);
run(`verify Firebase project=${projectId}`, 'node', [
  'scripts/verify-build-firebase-project.mjs',
  projectId,
], buildEnv);
run('strip private data + landing from out', 'node', ['scripts/strip-hosting-deploy.mjs'], buildEnv);
run('verify no private data in out', 'node', ['scripts/verify-hosting-no-private-data.mjs'], buildEnv);
run('verify hosting export budget', 'node', ['scripts/verify-hosting-export-budget.mjs'], buildEnv);
run('prepare hosting config (no-cache staging)', 'node', [
  'scripts/prepare-firebase-hosting-staging.mjs',
]);
run('hosting → pruebas-sg-aa586', 'npx', [
  'firebase',
  'deploy',
  '--only',
  'hosting',
  '--project',
  projectId,
  '--config',
  'firebase.hosting.staging.json',
]);
run('firestore rules (staging)', 'node', ['scripts/deploy-firestore-staging.mjs']);

console.log('\n[deploy:staging] OK');
console.log(`  Hosting: https://${projectId}.web.app`);
console.log(`  Alt:     https://${projectId}.firebaseapp.com`);
console.log('  Login estudiante: solo Google (Firebase Auth, plan Spark)');
