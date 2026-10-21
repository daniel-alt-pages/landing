/**
 * Genera enlace AES para demo coordinador.
 * Uso: node scripts/generate-demo-coordinador-link.mjs [--days 30] [--origin http://localhost:3000]
 *
 * Requiere NEXT_PUBLIC_COORDINATOR_SECRET en .env.local o variable de entorno.
 */

import CryptoJS from 'crypto-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnvFile(filename) {
  const path = resolve(root, filename);
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function parseArgs(argv) {
  let days = 30;
  let origin = process.env.DEMO_LINK_ORIGIN || 'http://localhost:3000';
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--days' && argv[i + 1]) {
      days = Number(argv[++i]);
    } else if (argv[i] === '--origin' && argv[i + 1]) {
      origin = argv[++i].replace(/\/$/, '');
    }
  }
  return { days, origin };
}

function generateToken(secret, expirationDays) {
  const now = Date.now();
  const payload = {
    kind: 'demo_coord',
    createdAt: now,
    expiresAt: now + expirationDays * 24 * 60 * 60 * 1000,
  };
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(payload), secret).toString();
  return encodeURIComponent(encrypted);
}

const { days, origin } = parseArgs(process.argv);
loadEnvFile(origin.includes('pruebas-sg-aa586') ? '.env.staging.local' : '.env.local');
const secret = process.env.NEXT_PUBLIC_COORDINATOR_SECRET;

if (!secret || secret === 'sg-coord-secret-2026') {
  console.warn(
    '⚠ Usando clave por defecto. En producción define NEXT_PUBLIC_COORDINATOR_SECRET en .env.local',
  );
}

const key = secret || 'sg-coord-secret-2026';
const token = generateToken(key, days);
const url = `${origin}/d/c?token=${token}`;

console.log('');
console.log('Demo coordinador — enlace válido', days, 'días');
console.log('');
console.log(url);
console.log('');
console.log('Alternativa (desbloquea y limpia query):');
console.log(`${origin}/acceso-demo/coordinador?token=${token}`);
console.log('');
