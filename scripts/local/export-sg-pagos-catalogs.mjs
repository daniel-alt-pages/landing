import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore/lite';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
const outputDir = path.join(projectRoot, 'public/data/sales-catalogs');

const sourceFirebaseConfig = {
  apiKey: process.env.SG_PAGOS_FIREBASE_API_KEY || 'AIzaSyBHaz4baWpuvPIwXdB3pt_PcOdccxQjSjE',
  authDomain: process.env.SG_PAGOS_FIREBASE_AUTH_DOMAIN || 'sg-pagos-platform.firebaseapp.com',
  projectId: process.env.SG_PAGOS_FIREBASE_PROJECT_ID || 'sg-pagos-platform',
  storageBucket: process.env.SG_PAGOS_FIREBASE_STORAGE_BUCKET || 'sg-pagos-platform.firebasestorage.app',
  messagingSenderId: process.env.SG_PAGOS_FIREBASE_MESSAGING_SENDER_ID || '558135018215',
  appId: process.env.SG_PAGOS_FIREBASE_APP_ID || '1:558135018215:web:903c9152a83a9671e9d842',
};

const collectionsToExport = [
  'colombia_dept_index',
  'colombia_locations',
];

function normalizeForSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function findFirstString(source, keys) {
  if (!source || typeof source !== 'object') return '';
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}

function buildSalesCatalog(raw) {
  const departmentMap = new Map();
  const municipalityMap = new Map();
  const schoolMap = new Map();

  for (const row of raw.colombia_dept_index || []) {
    const department =
      findFirstString(row, ['name', 'nombre', 'department', 'departamento', 'depto']) ||
      findFirstString(row.data, ['name', 'nombre', 'department', 'departamento', 'depto']);
    if (department) {
      departmentMap.set(normalizeForSearch(department), { name: department });
    }
  }

  for (const row of raw.colombia_locations || []) {
    const department =
      findFirstString(row, ['department', 'departamento', 'depto', 'departmentName']) ||
      findFirstString(row.data, ['department', 'departamento', 'depto', 'departmentName']);
    const municipality =
      findFirstString(row, ['municipality', 'municipio', 'city', 'ciudad', 'name', 'nombre']) ||
      findFirstString(row.data, ['municipality', 'municipio', 'city', 'ciudad', 'name', 'nombre']);

    if (department) {
      departmentMap.set(normalizeForSearch(department), { name: department });
    }
    if (municipality) {
      const key = `${normalizeForSearch(department)}::${normalizeForSearch(municipality)}`;
      municipalityMap.set(key, { name: municipality, department });
    }

    const schoolCandidates = [
      ...asArray(row.schools),
      ...asArray(row.colegios),
      ...asArray(row.instituciones),
      ...asArray(row.institutions),
      ...asArray(row.data?.schools),
      ...asArray(row.data?.colegios),
      ...asArray(row.data?.instituciones),
      ...asArray(row.data?.institutions),
    ];

    for (const school of schoolCandidates) {
      const schoolName =
        typeof school === 'string'
          ? school
          : findFirstString(school, ['name', 'nombre', 'institution', 'institucion', 'colegio']);
      if (!schoolName) continue;
      const key = [
        normalizeForSearch(department),
        normalizeForSearch(municipality),
        normalizeForSearch(schoolName),
      ].join('::');
      schoolMap.set(key, {
        name: schoolName,
        department,
        municipality,
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    sourceProjectId: sourceFirebaseConfig.projectId,
    departments: Array.from(departmentMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'es')),
    municipalities: Array.from(municipalityMap.values()).sort((a, b) =>
      `${a.department} ${a.name}`.localeCompare(`${b.department} ${b.name}`, 'es'),
    ),
    schools: Array.from(schoolMap.values()).sort((a, b) =>
      `${a.department} ${a.municipality} ${a.name}`.localeCompare(`${b.department} ${b.municipality} ${b.name}`, 'es'),
    ),
  };
}

async function exportCollection(db, collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

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

function groupMunicipalitiesByDepartment(municipalities) {
  const bySlug = new Map();
  for (const item of municipalities) {
    const department = item.department || 'Sin departamento';
    const slug = toDepartmentSlug(department);
    if (!bySlug.has(slug)) {
      bySlug.set(slug, { department, departmentSlug: slug, municipalities: [] });
    }
    bySlug.get(slug).municipalities.push({ name: item.name, department: item.department });
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

async function writeCatalogShards(catalog) {
  const shardsDir = path.join(outputDir, 'shards');
  await mkdir(shardsDir, { recursive: true });

  await writeFile(
    path.join(outputDir, 'colombia_departments.json'),
    JSON.stringify(
      {
        generatedAt: catalog.generatedAt,
        departments: catalog.departments,
      },
      null,
      2,
    ),
    'utf8',
  );

  const municipalityGroups = groupMunicipalitiesByDepartment(catalog.municipalities);
  for (const [, payload] of municipalityGroups) {
    await writeFile(
      path.join(shardsDir, `municipalities__${payload.departmentSlug}.json`),
      JSON.stringify(payload, null, 2),
      'utf8',
    );
  }

  const schoolGroups = groupSchoolsByDepartmentMunicipality(catalog.schools);
  for (const [, payload] of schoolGroups) {
    await writeFile(
      path.join(shardsDir, `schools__${payload.departmentSlug}__${payload.municipalitySlug}.json`),
      JSON.stringify(payload, null, 2),
      'utf8',
    );
  }

  console.log(
    `[catalogs] shards: ${municipalityGroups.size} dept-muni, ${schoolGroups.size} dept-muni-colegios`,
  );
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const app = initializeApp(sourceFirebaseConfig, 'sg-pagos-source');
  const db = getFirestore(app);
  const raw = {};

  for (const collectionName of collectionsToExport) {
    const rows = await exportCollection(db, collectionName);
    raw[collectionName] = rows;
    await writeFile(
      path.join(outputDir, `${collectionName}.json`),
      JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2),
      'utf8',
    );
    console.log(`[catalogs] ${collectionName}: ${rows.length} docs`);
  }

  const catalog = buildSalesCatalog(raw);
  await writeFile(path.join(outputDir, 'colombia_sales_catalog.json'), JSON.stringify(catalog, null, 2), 'utf8');
  await writeCatalogShards(catalog);
  console.log(
    `[catalogs] catalogo: ${catalog.departments.length} departamentos, ${catalog.municipalities.length} municipios, ${catalog.schools.length} colegios`,
  );
}

main().catch((error) => {
  console.error('[catalogs] export failed:', error);
  process.exitCode = 1;
});
