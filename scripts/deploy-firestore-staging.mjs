/**
 * Despliega firestore.rules.staging en pruebas-sg-aa586 (NO toca simulacros-sg prod).
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const projectId = 'pruebas-sg-aa586';

console.log(`[deploy:firestore:staging] project=${projectId}`);
console.log('[deploy:firestore:staging] rules=firestore.rules.staging\n');

const r = spawnSync(
  'npx',
  [
    'firebase',
    'deploy',
    '--only',
    'firestore:rules',
    '--project',
    projectId,
    '--config',
    'firebase.staging.json',
  ],
  { cwd: root, stdio: 'inherit', shell: true }
);

process.exit(r.status === 0 ? 0 : r.status ?? 1);
