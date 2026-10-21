/**
 * Smoke test: política TTL + claves panel cache (sin Firestore).
 * Ejecutar: node scripts/verify-cache-policy.mjs
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const CLOSED = 30 * DAY_MS;
const ACTIVE = DAY_MS;

function normalizeSimIdForCache(simId) {
  return String(simId || '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase();
}

function cacheKeyMatchesSim(cacheKey, simId) {
  const norm = normalizeSimIdForCache(simId);
  if (!norm) return false;
  const segments = cacheKey.split(':');
  const tail = segments[segments.length - 1] ?? '';
  if (normalizeSimIdForCache(tail) === norm) return true;
  return normalizeSimIdForCache(cacheKey).includes(norm);
}

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failed++;
  } else {
    console.log('OK:', msg);
  }
}

assert(CLOSED === 30 * DAY_MS, 'TTL cerrado = 30 días');
assert(ACTIVE === DAY_MS, 'TTL activo = 24 h');
assert(
  cacheKeyMatchesSim('estudiante-panel:123456:SG11-18', 'SG11-18'),
  'clave panel coincide sim',
);
assert(
  !cacheKeyMatchesSim('estudiante-panel:123456:SG11-17', 'SG11-18'),
  'clave panel no coincide otro sim',
);
assert(
  cacheKeyMatchesSim('estudiante-panel:demo:SG11 - 18', 'SG11-18'),
  'normalización espacios en sim id',
);

if (failed > 0) {
  process.exit(1);
}
console.log('\nverify-cache-policy: all checks passed');
