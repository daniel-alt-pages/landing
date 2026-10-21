/**
 * Exporta índice becado/pago desde CSV vacacional (sin montos ni refs de pago).
 *
 *   node scripts/pipeline/export_vacacional_enrollment_index.mjs
 *   node scripts/pipeline/export_vacacional_enrollment_index.mjs --course preicfes-sg26
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const repoRoot = join(root, '..');

function parseArgs() {
  const args = process.argv.slice(2);
  let course = 'preicfes-sg26';
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--course' && args[i + 1]) course = args[++i];
  }
  return { course };
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function normalizeDoc(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function classifyEnrollment(segmento, tipoRegistro, formaPago, grupoVacacional, registroId) {
  const id = String(registroId || '').toLowerCase();
  if (id.startsWith('beca_')) return 'becado';
  if (id.startsWith('pago_') || id.startsWith('pase_')) return 'pago';

  const blob = [segmento, tipoRegistro, formaPago, grupoVacacional]
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

  if (blob.includes('beca')) return 'becado';
  if (
    blob.includes('wompi') ||
    blob.includes('pago') ||
    blob.includes('105k') ||
    blob.includes('125k') ||
    blob.includes('confirmacion') ||
    blob.includes('instituciones') ||
    blob.includes('inscripcion')
  ) {
    return 'pago';
  }
  return 'unknown';
}

function mergeKind(current, next) {
  if (current === 'becado' || next === 'becado') return 'becado';
  if (current === 'pago' || next === 'pago') return 'pago';
  return 'unknown';
}

function mergeGeoField(current, next) {
  const a = String(current || '').trim();
  const b = String(next || '').trim();
  return a || b || undefined;
}

function mergeEntry(prev, kind, municipio, departamento, institucion) {
  return {
    kind: mergeKind(prev?.kind, kind),
    municipio: mergeGeoField(prev?.municipio, municipio),
    departamento: mergeGeoField(prev?.departamento, departamento),
    institucion: mergeGeoField(prev?.institucion, institucion),
  };
}

function buildGeoSummary(byDocument) {
  const deptMap = new Map();
  const muniMap = new Map();

  for (const entry of Object.values(byDocument)) {
    const dept = entry.departamento?.trim() || 'Sin departamento';
    const muni = entry.municipio?.trim() || 'Sin municipio';
    const deptRow = deptMap.get(dept) ?? { count: 0, becado: 0, pago: 0 };
    deptRow.count += 1;
    if (entry.kind === 'becado') deptRow.becado += 1;
    else if (entry.kind === 'pago') deptRow.pago += 1;
    deptMap.set(dept, deptRow);

    const muniKey = `${dept}::${muni}`;
    const muniRow = muniMap.get(muniKey) ?? { name: muni, departamento: dept, count: 0, becado: 0, pago: 0 };
    muniRow.count += 1;
    if (entry.kind === 'becado') muniRow.becado += 1;
    else if (entry.kind === 'pago') muniRow.pago += 1;
    muniMap.set(muniKey, muniRow);
  }

  const byDepartamento = [...deptMap.entries()]
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.count - a.count);

  const byMunicipio = [...muniMap.values()].sort((a, b) => b.count - a.count);

  return {
    byDepartamento,
    byMunicipio,
    departamentosCount: byDepartamento.filter((d) => d.name !== 'Sin departamento').length,
    municipiosCount: byMunicipio.filter((m) => m.name !== 'Sin municipio').length,
  };
}

function findEnrollmentCsv() {
  const vacDir = join(repoRoot, 'vacacional - curso');
  if (!existsSync(vacDir)) return null;

  const candidates = readdirSync(vacDir)
    .filter((name) => name.toLowerCase().includes('raw vacacional') && name.endsWith('.csv'))
    .map((name) => join(vacDir, name));

  return candidates[0] ?? null;
}

function loadEnrollmentOverrides(course) {
  const path = join(repoRoot, 'data', 'course', `enrollment_overrides_${course}.json`);
  if (!existsSync(path)) return { byDocument: {}, byEmail: {} };
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  return {
    byDocument: raw.byDocument ?? {},
    byEmail: raw.byEmail ?? {},
  };
}

function applyEnrollmentOverrides(byDocument, byEmail, overrides) {
  for (const [doc, entry] of Object.entries(overrides.byDocument ?? {})) {
    byDocument[doc] = mergeEntry(byDocument[doc], entry.kind, entry.municipio, entry.departamento, entry.institucion);
  }
  for (const [email, entry] of Object.entries(overrides.byEmail ?? {})) {
    byEmail[email] = mergeEntry(byEmail[email], entry.kind, entry.municipio, entry.departamento, entry.institucion);
  }
}

function main() {
  const { course } = parseArgs();
  const csvPath = findEnrollmentCsv();
  if (!csvPath) {
    console.error('[export-enrollment] No se encontró CSV Raw Vacacional en vacacional - curso/');
    process.exit(1);
  }

  const text = readFileSync(csvPath, 'utf8');
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    console.error('[export-enrollment] CSV vacío.');
    process.exit(1);
  }

  const header = parseCsvLine(lines[0]);
  const idx = {
    segmento: header.indexOf('Segmento vacacional'),
    tipo: header.indexOf('Tipo registro'),
    registroId: header.indexOf('ID registro'),
    documento: header.indexOf('Documento'),
    correo: header.indexOf('Correo'),
    formaPago: header.indexOf('Forma de pago'),
    grupo: header.indexOf('Grupo vacacional'),
    municipio: header.indexOf('Municipio'),
    departamento: header.indexOf('Departamento'),
    institucion: header.indexOf('Institución educativa'),
  };

  const byDocument = {};
  const byEmail = {};

  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    const doc = normalizeDoc(cells[idx.documento]);
    const email = normalizeEmail(cells[idx.correo]);
    const kind = classifyEnrollment(
      cells[idx.segmento],
      cells[idx.tipo],
      cells[idx.formaPago],
      cells[idx.grupo],
      cells[idx.registroId],
    );

    const municipio = cells[idx.municipio];
    const departamento = cells[idx.departamento];
    const institucion = cells[idx.institucion];

    if (doc) {
      byDocument[doc] = mergeEntry(byDocument[doc], kind, municipio, departamento, institucion);
    }
    if (email) {
      byEmail[email] = mergeEntry(byEmail[email], kind, municipio, departamento, institucion);
    }
  }

  applyEnrollmentOverrides(byDocument, byEmail, loadEnrollmentOverrides(course));

  const geoSummary = buildGeoSummary(byDocument);

  const inscritosTotal = Object.keys(byDocument).length;
  const inscritosBecado = Object.values(byDocument).filter((e) => e.kind === 'becado').length;
  const inscritosPago = Object.values(byDocument).filter((e) => e.kind === 'pago').length;
  const inscritosUnknown = inscritosTotal - inscritosBecado - inscritosPago;

  const payload = {
    courseId: course,
    generatedAt: new Date().toISOString(),
    source: 'vacacional-enrollment-csv',
    byDocument,
    byEmail,
    summary: {
      inscritosTotal,
      inscritosBecado,
      inscritosPago,
      inscritosUnknown,
    },
    geoSummary,
  };

  const outDir = join(repoRoot, 'data', 'course');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `enrollment_${course}.json`);
  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`[export-enrollment] ${outPath}`);
  console.log(
    `[export-enrollment] inscritos=${inscritosTotal} becado=${inscritosBecado} pago=${inscritosPago} sin_clasificar=${inscritosUnknown} deptos=${geoSummary.departamentosCount} munis=${geoSummary.municipiosCount}`,
  );
}

main();
