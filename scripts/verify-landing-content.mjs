#!/usr/bin/env node
/**
 * Busca `confirmar:` en el copy de la landing (/landing).
 * Con LANDING_STRICT=1 (o el viejo ALIANZA_STRICT=1) el proceso termina en error (build de producción).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(appRoot, 'src', 'app', 'landing', '_contenido');
const strict = process.env.LANDING_STRICT === '1' || process.env.ALIANZA_STRICT === '1';

const hits = [];

function walk(folder) {
  for (const ent of fs.readdirSync(folder, { withFileTypes: true })) {
    const full = path.join(folder, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.name.endsWith('.ts')) {
      const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/);
      lines.forEach((line, index) => {
        if (line.includes('confirmar:')) {
          hits.push(`${path.relative(appRoot, full)}:${index + 1}`);
        }
      });
    }
  }
}

if (!fs.existsSync(dir)) {
  console.error('[verify:landing] No existe', dir);
  process.exit(1);
}

walk(dir);

if (!hits.length) {
  console.log('[verify:landing] OK — sin pendientes de confirmación');
  process.exit(0);
}

const msg = `[verify:landing] ${hits.length} pendiente(s):\n` + hits.map((h) => ` - ${h}`).join('\n');
if (strict) {
  console.error(msg);
  process.exit(1);
}
console.warn(msg);
console.warn('[verify:landing] Modo aviso. LANDING_STRICT=1 hace fallar el build.');
