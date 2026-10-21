/**
 * Rutas /api/* no van en `output: export` (Firebase Hosting estático).
 * Oculta src/app/api durante el build y restaura después.
 */
import { cpSync, existsSync, renameSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = join(root, 'src', 'app', 'api');
const backupDir = join(root, 'src', 'app', '_api_dev_only');
const nextDir = join(root, '.next');

function moveDirSync(src, dest, label) {
  if (existsSync(dest)) {
    throw new Error(`[static-export] destino ya existe (${label}): ${dest}`);
  }
  try {
    renameSync(src, dest);
  } catch (err) {
    const code = err?.code;
    if (code !== 'EPERM' && code !== 'EBUSY' && code !== 'EXDEV') throw err;
    cpSync(src, dest, { recursive: true });
    rmSync(src, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

export function hideApiRoutesForStaticExport() {
  if (existsSync(nextDir)) {
    rmSync(nextDir, { recursive: true, force: true });
    console.log('[static-export] limpiado .next (evita tipos stale de /api)');
  }
  if (!existsSync(apiDir)) {
    console.log('[static-export] no src/app/api — skip hide');
    return false;
  }
  if (existsSync(backupDir)) {
    throw new Error('[static-export] backup _api_dev_only ya existe; restaura antes de build');
  }
  moveDirSync(apiDir, backupDir, 'hide');
  console.log('[static-export] oculto src/app/api → _api_dev_only (solo build estático)');
  return true;
}

export function restoreApiRoutesAfterStaticExport() {
  if (!existsSync(backupDir)) return false;
  if (existsSync(apiDir)) {
    console.warn('[static-export] src/app/api ya existe; no restauro backup');
    return false;
  }
  moveDirSync(backupDir, apiDir, 'restore');
  console.log('[static-export] restaurado src/app/api');
  return true;
}

const cmd = process.argv[2];
if (cmd === 'hide') {
  hideApiRoutesForStaticExport();
} else if (cmd === 'restore') {
  restoreApiRoutesAfterStaticExport();
} else if (cmd) {
  console.error('Uso: node scripts/static-export-api-routes.mjs hide|restore');
  process.exit(1);
}
