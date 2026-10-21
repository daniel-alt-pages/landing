/**
 * Guarda CALENDAR_VACACIONAL_ICS_URL en reportes-sg-next/.env.local (no imprime la URL).
 * Uso: npm run env:vacacional-ics -- "https://calendar.google.com/ical/..."
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const icsUrl = (process.argv[2] || process.env.ICS_URL || '').trim();
if (!icsUrl || !icsUrl.includes('calendar.google.com/ical/')) {
  console.error('Uso: npm run env:vacacional-ics -- "<url-ics-privada>"');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, '.env.local');

function upsertEnv(path, url) {
  const key = 'CALENDAR_VACACIONAL_ICS_URL';
  let raw = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const line = `${key}=${url}`;
  if (raw.includes(`${key}=`)) {
    raw = raw.replace(new RegExp(`^${key}=.*$`, 'm'), line);
  } else {
    raw = `${raw.replace(/\n*$/, '')}\n\n# ICS privado vacacional (secreto — no commitear)\n${line}\n`;
  }
  writeFileSync(path, raw, 'utf8');
}

upsertEnv(target, icsUrl);
console.log(`[set-vacacional-ics-url] OK → ${target}`);
