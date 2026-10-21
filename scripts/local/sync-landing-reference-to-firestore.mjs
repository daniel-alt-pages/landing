/**
 * Sube a Firestore (simulacros-sg) la referencia pública de la landing.
 *
 * Estructura en cascada (lecturas pequeñas):
 *   index                    → impacto + departamentos
 *   municipalities__{depto}  → municipios del departamento
 *   schools__{depto}__{muni} → colegios del municipio
 *
 * Fuentes locales (generadas antes):
 *   npm run catalogs:export:sg-pagos
 *   npm run landing:impact
 *   npm run landing:geo
 *
 * Uso: npm run landing:reference:sync
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const COLLECTION = 'landing_reference';
const BATCH_SIZE = 450;

const paths = {
  catalog: path.join(root, 'public/data/sales-catalogs/colombia_sales_catalog.json'),
  impact: path.join(root, 'src/app/landing-profesional/contenido-landing/mapa-impacto/datos-geo/landingImpactSummary.json'),
  geo: path.join(root, 'public/data/landing/colombia-departments-latlon.geo.json'),
};

function normalizeDepartmentKey(value) {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (normalized.includes('bogota')) return 'bogota';
  return normalized;
}

function toDepartmentSlug(departmentName) {
  const key = normalizeDepartmentKey(departmentName);
  return key.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'sin_departamento';
}

function toMunicipalitySlug(municipalityName) {
  const key = normalizeDepartmentKey(municipalityName);
  return key.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'sin_municipio';
}

async function readJson(filePath) {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

function groupMunicipalitiesByDepartment(municipalities) {
  const bySlug = new Map();
  for (const item of municipalities) {
    const department = item.department || 'Sin departamento';
    const slug = toDepartmentSlug(department);
    if (!bySlug.has(slug)) {
      bySlug.set(slug, { department, departmentSlug: slug, municipalities: [] });
    }
    bySlug.get(slug).municipalities.push({
      name: item.name,
      department: item.department,
    });
  }
  return bySlug;
}

function groupSchoolsByDepartmentMunicipality(schools) {
  const byKey = new Map();
  for (const school of schools) {
    const department = school.department || 'Sin departamento';
    const municipality = school.municipality || 'Sin municipio';
    const departmentSlug = toDepartmentSlug(department);
    const municipalitySlug = toMunicipalitySlug(municipality);
    const key = `${departmentSlug}::${municipalitySlug}`;
    if (!byKey.has(key)) {
      byKey.set(key, {
        department,
        departmentSlug,
        municipality,
        municipalitySlug,
        schools: [],
      });
    }
    byKey.get(key).schools.push({
      name: school.name,
      department: school.department,
      municipality: school.municipality,
    });
  }
  return byKey;
}

async function commitBatches(db, writes) {
  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const { ref, data } of writes.slice(i, i + BATCH_SIZE)) {
      batch.set(ref, data);
    }
    await batch.commit();
  }
}

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'simulacros-sg';

  if (!admin.apps.length) {
    admin.initializeApp({ projectId });
  }

  const db = admin.firestore();
  const [catalog, impactSummary, geo] = await Promise.all([
    readJson(paths.catalog),
    readJson(paths.impact),
    readJson(paths.geo),
  ]);

  const version = new Date().toISOString();
  const indexDoc = {
    version,
    updatedAt: version,
    impactSummary,
    departments: catalog.departments,
  };

  const mapGeoDoc = {
    version,
    updatedAt: version,
    features: geo.features,
  };

  const municipalityGroups = groupMunicipalitiesByDepartment(catalog.municipalities || []);
  const schoolGroups = groupSchoolsByDepartmentMunicipality(catalog.schools || []);

  const writes = [];

  writes.push({
    ref: db.collection(COLLECTION).doc('index'),
    data: indexDoc,
  });
  writes.push({
    ref: db.collection(COLLECTION).doc('map_geo'),
    data: mapGeoDoc,
  });

  for (const [, payload] of municipalityGroups) {
    writes.push({
      ref: db.collection(COLLECTION).doc(`municipalities__${payload.departmentSlug}`),
      data: {
        version,
        updatedAt: version,
        department: payload.department,
        departmentSlug: payload.departmentSlug,
        municipalities: payload.municipalities,
      },
    });
  }

  for (const [, payload] of schoolGroups) {
    writes.push({
      ref: db.collection(COLLECTION).doc(
        `schools__${payload.departmentSlug}__${payload.municipalitySlug}`,
      ),
      data: {
        version,
        updatedAt: version,
        department: payload.department,
        departmentSlug: payload.departmentSlug,
        municipality: payload.municipality,
        municipalitySlug: payload.municipalitySlug,
        schools: payload.schools,
      },
    });
  }

  await commitBatches(db, writes);

  console.log(`[landing:reference] project=${projectId}`);
  console.log(`[landing:reference] index: ${catalog.departments.length} dept (sin municipios embebidos)`);
  console.log(`[landing:reference] map_geo: ${geo.features?.length ?? 0} features`);
  console.log(`[landing:reference] municipalities docs: ${municipalityGroups.size}`);
  console.log(`[landing:reference] schools docs (por municipio): ${schoolGroups.size}`);
  console.log(`[landing:reference] total writes: ${writes.length}`);
}

main().catch((error) => {
  console.error('[landing:reference] sync failed:', error);
  process.exitCode = 1;
});
