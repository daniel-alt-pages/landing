/**
 * Build estático para deploy sin landing (paneles + login + demo + mantenimiento).
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const env = {
    ...process.env,
    NEXT_PUBLIC_PANELS_ONLY: 'true',
    NEXT_PUBLIC_ADMIN_LOCAL_ONLY: 'true',
    NEXT_PUBLIC_STUDENT_DEMO_ENABLED: 'false',
    NEXT_PUBLIC_DEMO_DATA_SOURCE: process.env.NEXT_PUBLIC_DEMO_DATA_SOURCE || 'firebase',
    NODE_ENV: 'production',
};

console.log('[build-panels-only] NEXT_PUBLIC_PANELS_ONLY=true');
console.log('[build-panels-only] NEXT_PUBLIC_ADMIN_LOCAL_ONLY=true (sin /admin en hosting)');

const build = spawnSync('npm', ['run', 'build'], {
    cwd: root,
    env,
    stdio: 'inherit',
    shell: true,
});

if (build.status !== 0) {
    process.exit(build.status ?? 1);
}

const strip = spawnSync('node', ['scripts/strip-landing-from-out.mjs'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
});

process.exit(strip.status ?? 0);
