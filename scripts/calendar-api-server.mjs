/**
 * API calendario vacacional (ICS) — local dev + compatible con output:export.
 * Puerto 3099 por defecto. Credenciales solo en .env.local.
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listVacacionalFromEnv } from './lib/vacacional-ics.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env.local');
const PORT = Number(process.env.CALENDAR_API_PORT || 3099);

function loadEnvFile(path) {
  if (!existsSync(path)) return;
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
    process.env[key] = val;
  }
}

loadEnvFile(envPath);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Content-Type': 'application/json; charset=utf-8',
};

async function handleVacacional(url) {
  const payload = await listVacacionalFromEnv(url.searchParams);
  return JSON.stringify(payload);
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, cors);
    res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
    return;
  }

  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  const isVacacional =
    url.pathname === '/api/events/vacacional' ||
    (url.pathname === '/api/curso/calendar/events' &&
      url.searchParams.get('program') === 'vacacional');

  if (!isVacacional) {
    res.writeHead(404, cors);
    res.end(JSON.stringify({ success: false, error: 'Not found' }));
    return;
  }

  try {
    const body = await handleVacacional(url);
    res.writeHead(200, cors);
    res.end(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    res.writeHead(500, cors);
    res.end(JSON.stringify({ success: false, error: message }));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[calendar-api] http://127.0.0.1:${PORT}/api/events/vacacional`);
  console.log('[calendar-api] ICS desde .env.local (CALENDAR_VACACIONAL_ICS_URL)');
});
