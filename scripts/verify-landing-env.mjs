/**
 * Variables de entorno de la landing en el build de producción.
 *
 * Sin NEXT_PUBLIC_EDUGENIOS_API_URL, `_contenido/contacto.ts` (tiendaLandingUrl/programasUrl) cae en
 * http://127.0.0.1:5000; sin NEXT_PUBLIC_ALIANZA_LEADS_URL el formulario B2B no tiene destino y
 * termina en el respaldo de WhatsApp. Antes ocurría en silencio.
 *
 * - Por defecto: AVISO muy visible y el build sigue (build:pages debe pasar en entornos sin secretos).
 * - LANDING_REQUIRE_ENV=1 (CI / despliegue real): el build FALLA si falta alguna.
 * Lee también env/landing.env, igual que next.config.ts, sin pisar las del sistema.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const file = path.join(root, 'env', 'landing.env');
const env = { ...process.env };
if (fs.existsSync(file)) {
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    if (env[key] === undefined) env[key] = line.slice(eq + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}

const REQUIRED = {
  NEXT_PUBLIC_ALIANZA_LEADS_URL: 'destino del formulario de instituciones (sin ella el envío cae al respaldo de WhatsApp)',
  NEXT_PUBLIC_EDUGENIOS_API_URL: 'API de la tienda/programas (sin ella el código usa http://127.0.0.1:5000)',
};
const isLoopback = (v) => /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:|\/|$)/i.test(v);
const problems = [];
for (const [key, why] of Object.entries(REQUIRED)) {
  const v = (env[key] || '').trim();
  if (!v) problems.push(`${key} no está definida: ${why}`);
  else if (isLoopback(v)) problems.push(`${key}=${v} apunta a loopback: ${why}`);
}

if (problems.length) {
  const strict = env.LANDING_REQUIRE_ENV === '1';
  const bar = '='.repeat(78);
  const msg = [
    bar,
    `[verify:landing-env] ${strict ? 'ERROR' : 'AVISO'}: build de producción sin variables de la landing`,
    ...problems.map((p) => `  - ${p}`),
    '  Defínalas en el entorno o en env/landing.env. Para que esto FALLE el build: LANDING_REQUIRE_ENV=1.',
    bar,
  ].join('\n');
  // En GitHub Actions, además, anotación visible en el resumen del job.
  if (env.GITHUB_ACTIONS === 'true') {
    for (const p of problems) console.log(`::${strict ? 'error' : 'warning'} title=Variables de la landing::${p}`);
  }
  if (strict) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(msg);
}
