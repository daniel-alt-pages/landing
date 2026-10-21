#!/usr/bin/env node
/**
 * Falla si el entorno o el código de arranque permiten Firebase / orígenes remotos.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(root, '..');
const errors = [];

const FORBIDDEN_ENV = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
  'NEXT_PUBLIC_FIREBASE_ENV',
  'FIREBASE_API_KEY',
  'FIREBASE_PROJECT_ID',
  'GOOGLE_APPLICATION_CREDENTIALS',
];

for (const key of FORBIDDEN_ENV) {
  if (process.env[key] && String(process.env[key]).trim()) {
    errors.push(`Env prohibida presente: ${key}`);
  }
}

for (const name of ['.env.local', '.env', '.env.production', '../../env/landing.env']) {
  const p = path.join(appRoot, name);
  if (!fs.existsSync(p)) continue;
  const text = fs.readFileSync(p, 'utf8');
  for (const key of FORBIDDEN_ENV) {
    if (new RegExp(`^\\s*${key}\\s*=\\s*\\S`, 'm').test(text)) {
      errors.push(`Archivo ${name} define ${key}`);
    }
  }
}

const forbiddenFiles = [
  'firebase.json',
  '.firebaserc',
  'firestore.rules',
  'firestore.rules.prod',
  'firestore.indexes.json',
];
for (const f of forbiddenFiles) {
  if (fs.existsSync(path.join(appRoot, f))) {
    errors.push(`Archivo Firebase prohibido: ${f}`);
  }
}

const dataDir = path.join(appRoot, 'public', 'data');
if (fs.existsSync(dataDir)) {
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (/\.(csv|xlsx)$/i.test(ent.name)) {
        errors.push(`Dato sensible en fixtures: ${path.relative(appRoot, full)}`);
      }
    }
  };
  walk(dataDir);
}

const firebaseTs = path.join(
  appRoot,
  'src',
  'features',
  'auth',
  'lib',
  'firebase.ts'
);
if (fs.existsSync(firebaseTs)) {
  const src = fs.readFileSync(firebaseTs, 'utf8');
  if (/initializeApp\s*\(/.test(src)) {
    errors.push('firebase.ts aún llama initializeApp (debe ser stub local)');
  }
}

const nextConfig = path.join(appRoot, 'next.config.ts');
if (fs.existsSync(nextConfig)) {
  const cfg = fs.readFileSync(nextConfig, 'utf8');
  for (const bad of [
    'firebaseio.com',
    'googleapis.com',
    'identitytoolkit.googleapis.com',
    'api.imgbb.com',
  ]) {
    if (cfg.includes(bad)) {
      errors.push(`next.config.ts aún permite origen remoto: ${bad}`);
    }
  }
  if (!cfg.includes('local-only') && !cfg.includes('X-Reports-Mode')) {
    errors.push('next.config.ts no marca modo local-only');
  }
}

if (errors.length) {
  console.error('[verify:local-only] FALLÓ\n' + errors.map((e) => ` - ${e}`).join('\n'));
  process.exit(1);
}

console.log('[verify:local-only] OK — sin Firebase env/archivos/init');
