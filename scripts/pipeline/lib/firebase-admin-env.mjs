/**
 * Firebase Admin init para scripts pipeline (pruebas | prod).
 * Usa SG_FIREBASE_ENV o --env.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../../..');
const reportesRoot = join(repoRoot, 'reportes-sg-next');

const TARGETS = {
  pruebas: {
    projectId: 'pruebas-sg-aa586',
    saGlobPrefix: 'pruebas-sg',
  },
  prod: {
    projectId: 'simulacros-sg',
    saGlobPrefix: 'simulacros-sg-firebase-adminsdk',
    saFallbacks: [
      'simulacros-sg-firebase-adminsdk-fbsvc-c881254e5f.json',
      'simulacros-sg-firebase-adminsdk-fbsvc-525c58d41c.json',
      'simulacros-sg-firebase-adminsdk-fbsvc-71a98ec33e.json',
    ],
  },
};

const ENV_ALIASES = {
  pruebas: 'pruebas',
  staging: 'pruebas',
  test: 'pruebas',
  prod: 'prod',
  production: 'prod',
  produccion: 'prod',
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

export function resolveFirebaseEnv(explicit) {
  const raw = explicit || process.env.SG_FIREBASE_ENV || process.env.FIREBASE_ENV || '';
  const key = ENV_ALIASES[String(raw).trim().toLowerCase()];
  if (!key) {
    throw new Error(
      'Indica entorno: --env pruebas|prod o $env:SG_FIREBASE_ENV="pruebas"',
    );
  }
  return key;
}

function findServiceAccount(envKey) {
  const target = TARGETS[envKey];
  const envVar =
    envKey === 'pruebas'
      ? process.env.FIREBASE_STAGING_SERVICE_ACCOUNT
      : process.env.FIREBASE_PROD_SERVICE_ACCOUNT;
  const candidates = [];

  if (envVar?.trim()) candidates.push(resolve(envVar.trim()));
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) {
    candidates.push(resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS.trim()));
  }

  try {
    for (const name of readdirSync(repoRoot)) {
      if (name.startsWith(target.saGlobPrefix) && name.endsWith('.json')) {
        candidates.push(join(repoRoot, name));
      }
    }
  } catch {
    /* ignore */
  }

  for (const name of target.saFallbacks || []) {
    candidates.push(join(repoRoot, name));
  }

  for (const path of candidates) {
    if (existsSync(path)) {
      const parsed = JSON.parse(readFileSync(path, 'utf8'));
      if (parsed.project_id !== target.projectId) {
        throw new Error(
          `Service account ${path} es proyecto ${parsed.project_id}, esperado ${target.projectId}`,
        );
      }
      return path;
    }
  }

  throw new Error(
    `Falta service account para ${target.projectId}. Coloca JSON en ${repoRoot}`,
  );
}

export function findServiceAccountPath(explicitEnv) {
  loadEnvLocal();
  const envKey = resolveFirebaseEnv(explicitEnv);
  return findServiceAccount(envKey);
}

export function initFirestore(explicitEnv) {
  loadEnvLocal();
  const envKey = resolveFirebaseEnv(explicitEnv);
  const target = TARGETS[envKey];
  const saPath = findServiceAccount(envKey);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(saPath),
      projectId: target.projectId,
    });
  }

  console.log(`[firebase] env=${envKey} project=${target.projectId} sa=${saPath}`);
  const db = admin.firestore();
  db.settings({ ignoreUndefinedProperties: true });
  return { db, envKey, projectId: target.projectId, saPath };
}

export function parseCliArgs(argv = process.argv.slice(2)) {
  const args = {
    env: undefined,
    course: undefined,
    calendarId: undefined,
    start: undefined,
    end: undefined,
    source: undefined,
    week: undefined,
    dryRun: false,
    skipDryRun: false,
    includeCancelled: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--env') args.env = argv[++i];
    else if (token === '--course') args.course = argv[++i];
    else if (token === '--calendar-id') args.calendarId = argv[++i];
    else if (token === '--week') args.week = argv[++i];
    else if (token === '--start') args.start = argv[++i];
    else if (token === '--end') args.end = argv[++i];
    else if (token === '--source') args.source = argv[++i];
    else if (token === '--dry-run') args.dryRun = true;
    else if (token === '--skip-dry-run') args.skipDryRun = true;
    else if (token === '--include-cancelled') args.includeCancelled = true;
  }

  return args;
}
