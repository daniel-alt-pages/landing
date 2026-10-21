#!/usr/bin/env node
/**
 * Pipeline unificado: roster/accesos + calendar + attendance + studentAuth + materials + validate.
 *
 * Uso:
 *   $env:SG_FIREBASE_ENV='pruebas'
 *   npm run course:sync-full -- --course preicfes-sg26 --env pruebas
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCliArgs } from './lib/firebase-admin-env.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportesRoot = join(__dirname, '../..');
const repoRoot = join(reportesRoot, '..');

function runNode(script, extraArgs = []) {
  const res = spawnSync(process.execPath, [script, ...extraArgs], {
    cwd: reportesRoot,
    stdio: 'inherit',
    env: process.env,
  });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

function runPython(script, extraArgs = []) {
  const py = process.env.PYTHON || 'python';
  const res = spawnSync(py, [script, ...extraArgs], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

function main() {
  const args = parseCliArgs();
  const courseId = args.course || 'preicfes-sg26';
  const envFlag = args.env ? ['--env', args.env] : [];
  const weekFlag = args.week ? ['--week', String(args.week)] : [];
  const sourceFlag = args.source ? ['--source', args.source] : [];

  console.log('\n[sync-full] 1/8 build roster/access from vacacional - curso');
  runPython(join(repoRoot, 'scripts/pipeline/build_preicfes_sg26_data.py'));

  console.log('\n[sync-full] 2/8 enrollment index (municipio/depto/institución ranking)');
  runNode(join(__dirname, 'export_vacacional_enrollment_index.mjs'), ['--course', courseId]);

  console.log('\n[sync-full] 3/8 publish courseAccess (deactivate missing)');
  runPython(join(repoRoot, 'scripts/pipeline/upload_courses.py'), [
    ...envFlag,
    '--access',
    join(repoRoot, 'data/course/access_preicfes-sg26.csv'),
    '--deactivate-missing',
  ]);

  console.log('\n[sync-full] 4/8 seed course-only student login');
  runPython(join(repoRoot, 'scripts/pipeline/seed_course_roster.py'), [
    ...envFlag,
    '--roster',
    join(repoRoot, 'data/course/roster_preicfes-sg26.csv'),
    '--apply',
  ]);

  console.log('\n[sync-full] 5/8 calendar');
  runNode(join(__dirname, 'sync_course_calendar_to_firestore.mjs'), [
    ...envFlag,
    '--course',
    courseId,
    ...weekFlag,
    ...sourceFlag,
  ]);

  console.log('\n[sync-full] 6/8 attendance');
  runPython(join(repoRoot, 'scripts/pipeline/sync_course_attendance_to_firestore.py'), [
    ...envFlag,
    '--course',
    courseId,
  ]);

  console.log('\n[sync-full] 7/8 studentAuth');
  runPython(join(repoRoot, 'scripts/pipeline/sync_student_auth.py'), [
    ...envFlag,
    '--course',
    courseId,
    '--purge-missing',
  ]);

  console.log('\n[sync-full] 8/8 student materials (compilados + SG11-20)');
  runPython(join(repoRoot, 'scripts/pipeline/ingest_vacacional_student_materials.py'), [
    ...envFlag,
    '--course',
    courseId,
    '--firestore',
  ]);

  console.log('\n[sync-full] validate');
  runNode(join(__dirname, 'validate_course_sync.mjs'), [
    ...envFlag,
    '--course',
    courseId,
    '--skip-dry-run',
  ]);

  console.log('\n[sync-full] ✓ OK');
}

main();
