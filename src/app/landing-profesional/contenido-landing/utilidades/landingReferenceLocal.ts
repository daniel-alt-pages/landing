'use client';

import { normalizeDepartmentKey } from '../mapa-impacto/impactData';
import bundledImpactJson from '../mapa-impacto/datos-geo/landingImpactSummary.json';
import bundledColombiaGeoJson from '../../../../../public/data/landing/colombia-departments-latlon.geo.json';
import type { ColombiaCatalogItem, ColombiaSalesCatalog } from '../tipos';
import type { LandingImpactSummary } from '../tipos/landingReference';
import { toDepartmentSlug, toMunicipalitySlug } from './departmentSlug';
import {
  fetchCachedJson,
  isLandingGeoJson,
  LANDING_DEPARTMENTS_URL,
  LANDING_GEO_URL,
  LANDING_IMPACT_URL,
  LANDING_SALES_CATALOG_URL,
  landingMunicipalitiesShardUrl,
  landingSchoolsShardUrl,
} from './landingAssetCache';
import type {
  LandingMapGeoDoc,
  LandingMunicipalitiesDoc,
  LandingReferenceIndexDoc,
  LandingSchoolsDoc,
} from './landingFirestore';

const bundledColombiaGeo = bundledColombiaGeoJson as { features: LandingMapGeoDoc['features'] };

const bundledImpactSummary = bundledImpactJson as LandingImpactSummary;

let departmentsMemory: ColombiaCatalogItem[] | null = null;
let departmentsInflight: Promise<ColombiaCatalogItem[] | null> | null = null;

let catalogMemory: ColombiaSalesCatalog | null = null;
let catalogInflight: Promise<ColombiaSalesCatalog | null> | null = null;

async function getLocalDepartments(): Promise<ColombiaCatalogItem[] | null> {
  if (departmentsMemory) return departmentsMemory;
  if (departmentsInflight) return departmentsInflight;

  departmentsInflight = fetchCachedJson<{ departments?: ColombiaCatalogItem[] }>(LANDING_DEPARTMENTS_URL)
    .then((data) => {
      if (data?.departments?.length) {
        departmentsMemory = data.departments;
        departmentsInflight = null;
        return data.departments;
      }
      return getLocalCatalog().then((catalog) => {
        departmentsMemory = catalog?.departments ?? null;
        departmentsInflight = null;
        return departmentsMemory;
      });
    })
    .catch(() =>
      getLocalCatalog().then((catalog) => {
        departmentsMemory = catalog?.departments ?? null;
        departmentsInflight = null;
        return departmentsMemory;
      }),
    );

  return departmentsInflight;
}

/** Fallback legacy: catálogo completo (solo si shard no existe). */
async function getLocalCatalog(): Promise<ColombiaSalesCatalog | null> {
  if (catalogMemory) return catalogMemory;
  if (catalogInflight) return catalogInflight;

  catalogInflight = fetchCachedJson<ColombiaSalesCatalog>(LANDING_SALES_CATALOG_URL)
    .then((data) => {
      catalogMemory = data;
      catalogInflight = null;
      return data;
    })
    .catch(() => {
      catalogInflight = null;
      return null;
    });

  return catalogInflight;
}

function filterByDepartment(items: ColombiaCatalogItem[], departmentName: string) {
  const deptKey = normalizeDepartmentKey(departmentName);
  return items.filter((item) => normalizeDepartmentKey(item.department || '') === deptKey);
}

function filterByMunicipality(items: ColombiaCatalogItem[], municipalityName: string) {
  const muniKey = normalizeDepartmentKey(municipalityName);
  return items.filter((item) => normalizeDepartmentKey(item.municipality || '') === muniKey);
}

/** Dev/local: métricas + solo departamentos (sin municipios/colegios en index). */
export async function readLandingIndexLocal(): Promise<LandingReferenceIndexDoc | null> {
  if (!bundledImpactSummary?.totals) return null;

  let impactSummary: LandingImpactSummary = bundledImpactSummary;
  try {
    const fetchedImpact = await fetchCachedJson<LandingImpactSummary>(LANDING_IMPACT_URL);
    if (fetchedImpact?.totals) impactSummary = fetchedImpact;
  } catch {
    // `public/data/landing/` opcional si ya tenemos bundle
  }

  const departments = (await getLocalDepartments()) ?? [];

  return {
    version: 'local',
    updatedAt: impactSummary.generatedAt,
    impactSummary,
    departments,
  };
}

export async function readLandingMapGeoLocal(): Promise<LandingMapGeoDoc | null> {
  if (isLandingGeoJson(bundledColombiaGeo)) {
    return { features: bundledColombiaGeo.features };
  }

  try {
    const geo = await fetchCachedJson<{ features: LandingMapGeoDoc['features'] }>(LANDING_GEO_URL, {
      networkOnly: true,
    });
    if (isLandingGeoJson(geo)) return { features: geo.features };
  } catch {
    // sin geo en public/
  }

  return null;
}

export async function readLandingMunicipalitiesByDepartmentLocal(
  departmentName: string,
): Promise<LandingMunicipalitiesDoc | null> {
  const trimmed = departmentName.trim();
  if (!trimmed) return null;

  const departmentSlug = toDepartmentSlug(trimmed);

  try {
    const shard = await fetchCachedJson<LandingMunicipalitiesDoc>(
      landingMunicipalitiesShardUrl(departmentSlug),
    );
    if (shard?.municipalities?.length) return shard;
  } catch {
    // shard ausente → fallback catálogo completo
  }

  const catalog = await getLocalCatalog();
  if (!catalog?.municipalities?.length) return null;

  const municipalities = filterByDepartment(catalog.municipalities, trimmed);
  if (!municipalities.length) return null;

  return { department: trimmed, departmentSlug, municipalities };
}

export async function readLandingSchoolsByMunicipalityLocal(
  departmentName: string,
  municipalityName: string,
): Promise<LandingSchoolsDoc | null> {
  const trimmedDept = departmentName.trim();
  const trimmedMuni = municipalityName.trim();
  if (!trimmedDept || !trimmedMuni) return null;

  const departmentSlug = toDepartmentSlug(trimmedDept);
  const municipalitySlug = toMunicipalitySlug(trimmedMuni);

  try {
    const shard = await fetchCachedJson<LandingSchoolsDoc>(
      landingSchoolsShardUrl(departmentSlug, municipalitySlug),
    );
    if (shard?.schools?.length) return shard;
  } catch {
    // shard ausente → fallback
  }

  const catalog = await getLocalCatalog();
  if (!catalog?.schools?.length) return null;

  const deptFiltered = filterByDepartment(catalog.schools, trimmedDept);
  const schools = filterByMunicipality(deptFiltered, trimmedMuni);
  if (!schools.length) return null;

  return {
    department: trimmedDept,
    departmentSlug,
    municipality: trimmedMuni,
    municipalitySlug,
    schools,
  };
}

/** Legacy local: todos los colegios del departamento. */
export async function readLandingSchoolsByDepartmentLocal(
  departmentName: string,
): Promise<LandingSchoolsDoc | null> {
  const trimmed = departmentName.trim();
  if (!trimmed) return null;

  const catalog = await getLocalCatalog();
  if (!catalog?.schools?.length) return null;

  const deptKey = normalizeDepartmentKey(trimmed);
  const schools = catalog.schools.filter(
    (item) => normalizeDepartmentKey(item.department || '') === deptKey,
  );

  return {
    department: trimmed,
    departmentSlug: toDepartmentSlug(trimmed),
    schools,
  };
}
