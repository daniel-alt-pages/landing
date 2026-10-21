/**
 * Dev: calendar-api (3099) + next dev + datos locales de curso.
 */
import { spawn, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

spawnSync('node', ['scripts/ensure-data-local.mjs'], { cwd: root, stdio: 'inherit' });

const prep = spawnSync('node', ['scripts/dev-prepare.mjs'], {
  cwd: root,
  encoding: 'utf8',
  stdio: ['inherit', 'pipe', 'inherit'],
});
if (prep.status !== 0) process.exit(prep.status ?? 1);
const buildId = prep.stdout.trim().split(/\r?\n/).pop()?.trim();
if (buildId) process.env.NEXT_PUBLIC_BUILD_ID = buildId;

function run(label, command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...extraEnv },
  });
  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[dev-with-calendar] ${label} exit ${code}`);
      process.exit(code ?? 1);
    }
  });
  return child;
}

const calendar = run('calendar-api', 'node', ['scripts/calendar-api-server.mjs']);
const next = run('next', 'npm', ['run', 'dev:next'], {
  env: { ...process.env, NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID || '' },
});

function shutdown() {
  calendar.kill();
  next.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
