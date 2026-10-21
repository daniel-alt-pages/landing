/**
 * Despliega firestore.rules en simulacros-sg (PRODUCCIÓN).
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const projectId = 'simulacros-sg';

console.log(`[deploy:firestore:prod] project=${projectId}`);
console.log('[deploy:firestore:prod] rules=firestore.rules\n');

const r = spawnSync(
  'npx',
  ['firebase', 'deploy', '--only', 'firestore:rules', '--project', projectId],
  { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' }
);

process.exit(r.status === 0 ? 0 : r.status ?? 1);
