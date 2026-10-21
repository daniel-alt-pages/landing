/**
 * Quita del export estático lo que no debe publicarse en Firebase Hosting:
 * - landing/admin (modo paneles)
 * - JSON/CSV con PII y datos de simulacros (prod/staging leen Firestore)
 *
 * Uso: tras `npm run build` con NEXT_PUBLIC_PANELS_ONLY=true
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../out');

const panelsOnlyDeploy = process.env.NEXT_PUBLIC_PANELS_ONLY === 'true';

/** Carpetas completas bajo out/ */
const dirsToRemove = [
  'landing-profesional',
  path.join('data', 'landing'),
  path.join('data', 'sales-catalogs'),
  path.join('data', 'simulations'),
  path.join('data', 'estudiantes'),
  path.join('data', 'student-materials'),
  path.join('data', 'analysis_results'),
  path.join('data', 'calendar'),
  'admin',
  'admin-panel',
  'debug-dashboard',
];

/** Demo estudiante off en deploy paneles (prod/staging). */
if (panelsOnlyDeploy) {
  dirsToRemove.push(
    path.join('demo', 'estudiante'),
    path.join('demo', 'dashboard'),
    path.join('demo', 'estadisticas'),
    path.join('demo', 'analisis'),
    path.join('demo', 'ranking'),
    path.join('demo', 'perfil'),
  );
}

/** Archivos sueltos sensibles bajo out/data/ */
const filesToRemove = [
  path.join('data', 'auth_index.json'),
  path.join('data', 'resultados_finales.json'),
  path.join('data', 'ranking_index.json'),
  path.join('data', 'rankings_nacionales.json'),
  path.join('data', 'estadisticas_grupo.json'),
  path.join('data', 'coordinator_summary.json'),
  path.join('data', 'coordinator_tokens.json'),
  path.join('data', 'invalidaciones.json'),
  path.join('data', 'current_simulation.json'),
  path.join('data', 'config', 'pifa_curso_por_documento.json'),
];

function rmRecursive(target) {
  if (!fs.existsSync(target)) return false;
  fs.rmSync(target, { recursive: true, force: true });
  return true;
}

function rmFile(target) {
  if (!fs.existsSync(target)) return false;
  fs.rmSync(target, { force: true });
  return true;
}

let removed = 0;

for (const rel of dirsToRemove) {
  const full = path.join(outDir, rel);
  if (rmRecursive(full)) {
    console.log(`[strip-hosting-deploy] removed dir: out/${rel.replace(/\\/g, '/')}`);
    removed += 1;
  }
}

for (const rel of filesToRemove) {
  const full = path.join(outDir, rel);
  if (rmFile(full)) {
    console.log(`[strip-hosting-deploy] removed file: out/${rel.replace(/\\/g, '/')}`);
    removed += 1;
  }
}

/** Bundles locales de notas (Firestore en prod/staging); no publicar .full.json */
function rmFullJsonBundles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += rmFullJsonBundles(full);
      continue;
    }
    if (!entry.name.endsWith('.full.json')) continue;
    fs.rmSync(full, { force: true });
    const rel = full.slice(outDir.length + 1).replace(/\\/g, '/');
    console.log(`[strip-hosting-deploy] removed file: out/${rel}`);
    count += 1;
  }
  return count;
}

removed += rmFullJsonBundles(path.join(outDir, 'data'));

/** Matrículas / enrollment (PII; staging y prod leen Firestore) */
function rmEnrollmentFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += rmEnrollmentFiles(full);
      continue;
    }
    if (!/^enrollment_.*\.json$/i.test(entry.name)) continue;
    fs.rmSync(full, { force: true });
    const rel = full.slice(outDir.length + 1).replace(/\\/g, '/');
    console.log(`[strip-hosting-deploy] removed file: out/${rel}`);
    count += 1;
  }
  return count;
}

removed += rmEnrollmentFiles(path.join(outDir, 'data'));

if (removed === 0) {
  console.log('[strip-hosting-deploy] nothing to remove (already stripped or full dev build).');
} else {
  console.log(`[strip-hosting-deploy] done (${removed} path(s)).`);
}
