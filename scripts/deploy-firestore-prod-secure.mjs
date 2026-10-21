/**
 * Fase 4: despliega firestore.rules.prod en simulacros-sg (opt-in).
 * Validar login estudiante + coordinador antes de usar en prod.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const projectId = 'simulacros-sg';

console.log(`[deploy:firestore:prod:secure] project=${projectId}`);
console.log('[deploy:firestore:prod:secure] rules=firestore.rules.prod\n');

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
    'firebase.prod-secure.json',
  ],
  { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' }
);

process.exit(r.status === 0 ? 0 : r.status ?? 1);
