/**
 * Fase 2: datos sensibles fuera del deploy.
 * - Canonical: data-local/ (gitignored)
 * - Dev: junction/symlink public/data → data-local (Windows: mklink /J)
 *
 * Uso:
 *   node scripts/ensure-data-local.mjs          # crea data-local desde public/data si falta
 *   node scripts/ensure-data-local.mjs --link   # enlaza public/data → data-local (admin)
 */
import { existsSync, cpSync, mkdirSync, renameSync, rmSync, lstatSync, symlinkSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const publicData = join(root, 'public', 'data');
const dataLocal = join(root, 'data-local');
const repoCourseDir = join(root, '..', 'data', 'course');
const repoAttendanceDir = join(repoCourseDir, 'attendance');
const repoCalendarDir = join(repoCourseDir, 'calendar');
const repoGeminiNotesDir = join(repoCourseDir, 'gemini-notes');
const repoStudentMaterialsDir = join(repoCourseDir, 'student-materials');
const localCoursesDir = join(dataLocal, 'courses');
const localAttendanceDir = join(dataLocal, 'attendance');
const localCalendarDir = join(dataLocal, 'calendar');
const localGeminiNotesDir = join(dataLocal, 'gemini-notes');
const localStudentMaterialsDir = join(dataLocal, 'student-materials');
const linkMode = process.argv.includes('--link');

function isSymlink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

function isJunction(path) {
  try {
    return lstatSync(path).isDirectory() && spawnSync('cmd', ['/c', 'fsutil', 'reparsepoint', 'query', path], {
      encoding: 'utf8',
    }).stdout.includes('Reparse Tag');
  } catch {
    return false;
  }
}

function migrateToDataLocal() {
  if (existsSync(dataLocal)) {
    console.log('[ensure-data-local] data-local/ ya existe.');
    return;
  }
  if (!existsSync(publicData)) {
    mkdirSync(dataLocal, { recursive: true });
    console.log('[ensure-data-local] creado data-local/ vacío.');
    return;
  }
  console.log('[ensure-data-local] moviendo public/data → data-local/ …');
  renameSync(publicData, dataLocal);
  console.log('[ensure-data-local] OK. public/data eliminado; datos en data-local/.');
}

function linkPublicData() {
  if (existsSync(publicData) && !isSymlink(publicData) && !isJunction(publicData)) {
    console.error('[ensure-data-local] public/data existe como carpeta real. Migra primero (sin --link).');
    process.exit(1);
  }
  if (!existsSync(dataLocal)) {
    console.error('[ensure-data-local] Falta data-local/. Ejecuta sin --link primero.');
    process.exit(1);
  }
  if (existsSync(publicData)) {
    console.log('[ensure-data-local] public/data ya enlazado.');
    return;
  }
  if (process.platform === 'win32') {
    const r = spawnSync('cmd', ['/c', 'mklink', '/J', publicData, dataLocal], { stdio: 'inherit' });
    if (r.status !== 0) {
      console.error('[ensure-data-local] mklink falló. Ejecuta terminal como Administrador o copia manual.');
      process.exit(r.status ?? 1);
    }
  } else {
    symlinkSync(dataLocal, publicData, 'dir');
  }
  console.log('[ensure-data-local] public/data → data-local/');
}

/** Copia JSON de curso del monorepo → data-local/courses/ (dev Mi Curso). */
function syncRepoCourses() {
  if (!existsSync(repoCourseDir)) {
    console.log('[ensure-data-local] sin ../data/course — omitiendo sync cursos.');
    return;
  }
  mkdirSync(localCoursesDir, { recursive: true });
  let copied = 0;
  for (const name of readdirSync(repoCourseDir)) {
    if (!name.endsWith('.json')) continue;
    const src = join(repoCourseDir, name);
    const dest = join(localCoursesDir, name);
    cpSync(src, dest, { force: true });
    copied += 1;
  }
  console.log(`[ensure-data-local] cursos sync → data-local/courses/ (${copied} archivos)`);
}

/** Sin junction: copia a public/data/courses para que Next sirva /data/courses/*.json en dev. */
function mirrorCoursesToPublic() {
  if (!existsSync(localCoursesDir)) return;
  if (existsSync(publicData) && (isSymlink(publicData) || isJunction(publicData))) return;

  const publicCourses = join(publicData, 'courses');
  mkdirSync(publicCourses, { recursive: true });
  let copied = 0;
  for (const name of readdirSync(localCoursesDir)) {
    if (!name.endsWith('.json')) continue;
    cpSync(join(localCoursesDir, name), join(publicCourses, name), { force: true });
    copied += 1;
  }
  if (copied) {
    console.log(`[ensure-data-local] mirror → public/data/courses/ (${copied} archivos)`);
  }
}

function copyDirRecursive(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(from, to);
    } else {
      cpSync(from, to, { force: true });
    }
  }
}

function syncRepoCalendar() {
  if (!existsSync(repoCalendarDir)) {
    console.log('[ensure-data-local] sin ../data/course/calendar — omitiendo sync calendario.');
    return;
  }
  mkdirSync(localCalendarDir, { recursive: true });
  let copied = 0;
  for (const name of readdirSync(repoCalendarDir)) {
    if (!name.endsWith('.json')) continue;
    cpSync(join(repoCalendarDir, name), join(localCalendarDir, name), { force: true });
    copied += 1;
  }
  console.log(`[ensure-data-local] calendario sync → data-local/calendar/ (${copied} archivos)`);
}

function syncRepoGeminiNotes() {
  if (!existsSync(repoGeminiNotesDir)) {
    console.log('[ensure-data-local] sin ../data/course/gemini-notes — omitiendo sync Gemini.');
    return;
  }
  mkdirSync(localGeminiNotesDir, { recursive: true });
  let copied = 0;
  for (const name of readdirSync(repoGeminiNotesDir)) {
    if (!name.endsWith('.json')) continue;
    cpSync(join(repoGeminiNotesDir, name), join(localGeminiNotesDir, name), { force: true });
    copied += 1;
  }
  console.log(`[ensure-data-local] gemini-notes sync → data-local/gemini-notes/ (${copied} archivos)`);
}

function mirrorGeminiNotesToPublic() {
  if (!existsSync(localGeminiNotesDir)) return;
  if (existsSync(publicData) && (isSymlink(publicData) || isJunction(publicData))) return;

  const publicGeminiNotes = join(publicData, 'gemini-notes');
  mkdirSync(publicGeminiNotes, { recursive: true });
  let copied = 0;
  for (const name of readdirSync(localGeminiNotesDir)) {
    if (!name.endsWith('.json')) continue;
    cpSync(join(localGeminiNotesDir, name), join(publicGeminiNotes, name), { force: true });
    copied += 1;
  }
  if (copied) {
    console.log(`[ensure-data-local] mirror → public/data/gemini-notes/ (${copied} archivos)`);
  }
}

function syncRepoStudentMaterials() {
  if (!existsSync(repoStudentMaterialsDir)) {
    console.log('[ensure-data-local] sin ../data/course/student-materials — omitiendo sync compilados.');
    return;
  }
  mkdirSync(localStudentMaterialsDir, { recursive: true });
  let copied = 0;
  for (const name of readdirSync(repoStudentMaterialsDir)) {
    if (!name.endsWith('.json')) continue;
    cpSync(join(repoStudentMaterialsDir, name), join(localStudentMaterialsDir, name), { force: true });
    copied += 1;
  }
  console.log(`[ensure-data-local] student-materials sync → data-local/student-materials/ (${copied} archivos)`);
}

function mirrorStudentMaterialsToPublic() {
  // Compilados en Firestore (courseStudentMaterials) — no publicar JSON masivo en hosting.
  if (process.env.NODE_ENV === 'production') return;
  if (!existsSync(localStudentMaterialsDir)) return;
  if (existsSync(publicData) && (isSymlink(publicData) || isJunction(publicData))) return;

  const publicStudentMaterials = join(publicData, 'student-materials');
  mkdirSync(publicStudentMaterials, { recursive: true });
  let copied = 0;
  for (const name of readdirSync(localStudentMaterialsDir)) {
    if (!name.endsWith('.json')) continue;
    cpSync(join(localStudentMaterialsDir, name), join(publicStudentMaterials, name), { force: true });
    copied += 1;
  }
  if (copied) {
    console.log(`[ensure-data-local] mirror → public/data/student-materials/ (${copied} archivos)`);
  }
}

function mirrorCalendarToPublic() {
  if (!existsSync(localCalendarDir)) return;
  if (existsSync(publicData) && (isSymlink(publicData) || isJunction(publicData))) return;

  const publicCalendar = join(publicData, 'calendar');
  mkdirSync(publicCalendar, { recursive: true });
  let copied = 0;
  for (const name of readdirSync(localCalendarDir)) {
    if (!name.endsWith('.json')) continue;
    cpSync(join(localCalendarDir, name), join(publicCalendar, name), { force: true });
    copied += 1;
  }
  if (copied) {
    console.log(`[ensure-data-local] mirror → public/data/calendar/ (${copied} archivos)`);
  }
}

/** ASISTENCIAS DEL VACACIONAL → xlsx→csv + manifest + sessions. */
function ingestVacacionalAttendance() {
  const sourceDir = join(root, '..', 'ASISTENCIAS DEL VACACIONAL');
  const convertScript = join(root, '..', 'scripts', 'pipeline', 'convert_vacacional_xlsx_to_csv.py');
  const ingestScript = join(root, '..', 'scripts', 'pipeline', 'ingest_vacacional_attendance.py');
  if (!existsSync(sourceDir)) {
    return;
  }
  if (existsSync(convertScript)) {
    const r0 = spawnSync('python', [convertScript], {
      cwd: join(root, '..'),
      encoding: 'utf8',
      stdio: 'inherit',
    });
    if (r0.status !== 0) {
      console.warn('[ensure-data-local] convert xlsx→csv falló (código', r0.status, ')');
    }
  }
  if (!existsSync(ingestScript)) {
    return;
  }
  const r = spawnSync('python', [ingestScript], {
    cwd: join(root, '..'),
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    console.warn('[ensure-data-local] ingest vacacional falló (código', r.status, ')');
  }
}

function ingestVacacionalStudentMaterials() {
  const xlsxDir = join(root, '..', 'vacacional - curso', 'URL DE DOCUMENTOS');
  const ingestScript = join(root, '..', 'scripts', 'pipeline', 'ingest_vacacional_student_materials.py');
  if (!existsSync(xlsxDir) || !existsSync(ingestScript)) {
    return;
  }
  const r = spawnSync('python', [ingestScript], {
    cwd: join(root, '..'),
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    console.warn('[ensure-data-local] ingest compilados estudiante falló (código', r.status, ')');
  }
}

/** CSV Meet + manifest → data-local/attendance/{courseId}/ */
function syncRepoAttendance() {
  if (!existsSync(repoAttendanceDir)) {
    console.log('[ensure-data-local] sin ../data/course/attendance — omitiendo sync asistencia.');
    return;
  }
  mkdirSync(localAttendanceDir, { recursive: true });
  let courses = 0;
  for (const courseId of readdirSync(repoAttendanceDir, { withFileTypes: true })) {
    if (!courseId.isDirectory()) continue;
    copyDirRecursive(join(repoAttendanceDir, courseId.name), join(localAttendanceDir, courseId.name));
    courses += 1;
  }
  console.log(`[ensure-data-local] asistencia sync → data-local/attendance/ (${courses} cursos)`);
}

function mirrorAttendanceToPublic() {
  if (!existsSync(localAttendanceDir)) return;
  if (existsSync(publicData) && (isSymlink(publicData) || isJunction(publicData))) return;

  const publicAttendance = join(publicData, 'attendance');
  mkdirSync(publicAttendance, { recursive: true });
  let courses = 0;
  for (const courseId of readdirSync(localAttendanceDir, { withFileTypes: true })) {
    if (!courseId.isDirectory()) continue;
    copyDirRecursive(
      join(localAttendanceDir, courseId.name),
      join(publicAttendance, courseId.name),
    );
    courses += 1;
  }
  if (courses) {
    console.log(`[ensure-data-local] mirror → public/data/attendance/ (${courses} cursos)`);
  }
}

/** Roster CSV → public/data/course/ (panel admin seguimiento local). */
function syncRepoRoster() {
  if (!existsSync(repoCourseDir)) return;
  const localCourseMeta = join(dataLocal, 'course');
  mkdirSync(localCourseMeta, { recursive: true });
  let copied = 0;
  for (const name of readdirSync(repoCourseDir)) {
    if (!name.startsWith('roster_') || !name.endsWith('.csv')) continue;
    cpSync(join(repoCourseDir, name), join(localCourseMeta, name), { force: true });
    copied += 1;
  }
  for (const name of readdirSync(repoCourseDir)) {
    if (!name.startsWith('enrollment_') || !name.endsWith('.json')) continue;
    cpSync(join(repoCourseDir, name), join(localCourseMeta, name), { force: true });
    copied += 1;
  }
  if (copied) {
    console.log(`[ensure-data-local] roster sync → data-local/course/ (${copied} archivos)`);
  }
}

function mirrorRosterToPublic() {
  const localCourseMeta = join(dataLocal, 'course');
  if (!existsSync(localCourseMeta)) return;
  if (existsSync(publicData) && (isSymlink(publicData) || isJunction(publicData))) return;

  const publicCourseMeta = join(publicData, 'course');
  mkdirSync(publicCourseMeta, { recursive: true });
  let copied = 0;
  for (const name of readdirSync(localCourseMeta)) {
    if (name.startsWith('roster_') && name.endsWith('.csv')) {
      cpSync(join(localCourseMeta, name), join(publicCourseMeta, name), { force: true });
      copied += 1;
    }
    if (name.startsWith('enrollment_') && name.endsWith('.json')) {
      cpSync(join(localCourseMeta, name), join(publicCourseMeta, name), { force: true });
      copied += 1;
    }
  }
  if (copied) {
    console.log(`[ensure-data-local] mirror → public/data/course/ (${copied} roster)`);
  }
}

if (linkMode) {
  linkPublicData();
} else if (!existsSync(dataLocal) && existsSync(publicData)) {
  migrateToDataLocal();
} else if (!existsSync(dataLocal)) {
  mkdirSync(dataLocal, { recursive: true });
  console.log('[ensure-data-local] data-local/ creado (vacío).');
} else {
  console.log('[ensure-data-local] sin cambios.');
}

ingestVacacionalAttendance();
ingestVacacionalStudentMaterials();
syncRepoCourses();
syncRepoCalendar();
syncRepoGeminiNotes();
syncRepoStudentMaterials();
syncRepoAttendance();
syncRepoRoster();
mirrorCoursesToPublic();
mirrorCalendarToPublic();
mirrorGeminiNotesToPublic();
mirrorStudentMaterialsToPublic();
mirrorAttendanceToPublic();
mirrorRosterToPublic();

if (linkMode && !existsSync(publicData)) {
  linkPublicData();
} else if (!linkMode && existsSync(dataLocal) && !existsSync(publicData)) {
  console.log('[ensure-data-local] Tip: npm run data:link-local (Admin) para servir /data/* en dev.');
}
