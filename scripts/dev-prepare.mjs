/**
 * Antes de `next dev`: limpia .next corrupto (p. ej. tras deploy:staging en paralelo)
 * y fija NEXT_PUBLIC_BUILD_ID para bust de caché cliente + header X-SG-Build-Id.
 */
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nextDir = join(root, '.next');
const buildId = String(Date.now());

if (existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  console.log('[dev-prepare] limpiado .next (evita ENOENT en routes-manifest)');
}

writeFileSync(join(root, '.dev-build-id'), `${buildId}\n`, 'utf8');
console.log(`[dev-prepare] NEXT_PUBLIC_BUILD_ID=${buildId}`);

/** Última línea = id (scripts padre pueden parsear stdout). */
process.stdout.write(`${buildId}\n`);
