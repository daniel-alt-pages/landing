'use client';

import bundledImpactJson from '../mapa-impacto/datos-geo/landingImpactSummary.json';
import { normalizeDepartmentKey } from '../mapa-impacto/impactData';
import type { LandingImpactSummary } from '../tipos/landingReference';
import { toDepartmentSlug, toMunicipalitySlug } from './departmentSlug';
import { isLandingReferenceLocal } from './landingReferenceMode';
import {
  readLandingIndexFirestore,
  readLandingMapGeoFirestore,
  readLandingMunicipalitiesByDepartmentFirestore,
  readLandingSchoolsByDepartmentFirestore,
  readLandingSchoolsByMunicipalityFirestore,
  type LandingMapGeoDoc,
  type LandingMunicipalitiesDoc,
  type LandingReferenceIndexDoc,
  type LandingSchoolsDoc,
} from './landingFirestore';
import {
  readLandingIndexLocal,
  readLandingMapGeoLocal,
  readLandingMunicipalitiesByDepartmentLocal,
  readLandingSchoolsByDepartmentLocal,
  readLandingSchoolsByMunicipalityLocal,
} from './landingReferenceLocal';

export type {
  LandingMapGeoDoc,
  LandingMunicipalitiesDoc,
  LandingReferenceIndexDoc,
  LandingSchoolsDoc,
} from './landingFirestore';

const bundledImpactSummary = bundledImpactJson as LandingImpactSummary;

function bundledIndexDoc(): LandingReferenceIndexDoc {
  return {
    version: 'bundled',
    updatedAt: bundledImpactSummary.generatedAt,
    impactSummary: bundledImpactSummary,
    departments: [],
  };
}

function filterMunicipalitiesFromIndex(
  index: LandingReferenceIndexDoc,
  departmentName: string,
): LandingMunicipalitiesDoc | null {
  const embedded = index.municipalities;
  if (!embedded?.length) return null;

  const trimmed = departmentName.trim();
  const deptKey = normalizeDepartmentKey(trimmed);
  const municipalities = embedded.filter(
    (item) => normalizeDepartmentKey(item.department || '') === deptKey,
  );
  if (!municipalities.length) return null;

  return {
    department: trimmed,
    departmentSlug: toDepartmentSlug(trimmed),
    municipalities,
  };
}

function filterSchoolsFromDepartmentDoc(
  doc: LandingSchoolsDoc,
  municipalityName: string,
): LandingSchoolsDoc | null {
  const trimmedMuni = municipalityName.trim();
  const muniKey = normalizeDepartmentKey(trimmedMuni);
  const schools = doc.schools.filter(
    (item) => normalizeDepartmentKey(item.municipality || '') === muniKey,
  );
  if (!schools.length) return null;

  return {
    department: doc.department,
    departmentSlug: doc.departmentSlug,
    municipality: trimmedMuni,
    municipalitySlug: toMunicipalitySlug(trimmedMuni),
    schools,
  };
}

async function readLandingIndexProduction(maxAgeMs?: number) {
  try {
    const fromFs = await readLandingIndexFirestore(maxAgeMs);
    if (fromFs?.impactSummary?.totals) return fromFs;
  } catch {
    // sin doc o permisos
  }
  return null;
}

async function readLandingMapGeoProduction(maxAgeMs?: number) {
  const fromFs = await readLandingMapGeoFirestore(maxAgeMs);
  if (fromFs?.features?.length) return fromFs;
  return readLandingMapGeoLocal();
}

async function readLandingMunicipalitiesProduction(departmentName: string, maxAgeMs?: number) {
  try {
    const fromShard = await readLandingMunicipalitiesByDepartmentFirestore(departmentName, maxAgeMs);
    if (fromShard?.municipalities?.length) return fromShard;
  } catch {
    // sin shard
  }

  try {
    const index = await readLandingIndexFirestore(maxAgeMs);
    if (index) {
      const legacy = filterMunicipalitiesFromIndex(index, departmentName);
      if (legacy) return legacy;
    }
  } catch {
    // sin index
  }

  return null;
}

async function readLandingSchoolsByMunicipalityProduction(
  departmentName: string,
  municipalityName: string,
  maxAgeMs?: number,
) {
  try {
    const fromShard = await readLandingSchoolsByMunicipalityFirestore(
      departmentName,
      municipalityName,
      maxAgeMs,
    );
    if (fromShard?.schools?.length) return fromShard;
  } catch {
    // sin shard
  }

  try {
    const legacyDept = await readLandingSchoolsByDepartmentFirestore(departmentName, maxAgeMs);
    if (legacyDept?.schools?.length) {
      const filtered = filterSchoolsFromDepartmentDoc(legacyDept, municipalityName);
      if (filtered) return filtered;
    }
  } catch {
    // sin doc legacy
  }

  return null;
}

async function readLandingSchoolsProduction(departmentName: string, maxAgeMs?: number) {
  try {
    const fromFs = await readLandingSchoolsByDepartmentFirestore(departmentName, maxAgeMs);
    if (fromFs?.schools?.length) return fromFs;
  } catch {
    // sin doc
  }
  return null;
}

export async function readLandingIndex(maxAgeMs?: number): Promise<LandingReferenceIndexDoc | null> {
  try {
    let doc: LandingReferenceIndexDoc | null = null;

    if (isLandingReferenceLocal()) {
      doc = await readLandingIndexLocal();
    } else {
      doc = await readLandingIndexProduction(maxAgeMs);
    }

    if (doc?.impactSummary?.totals) return doc;
    if (bundledImpactSummary.totals) return bundledIndexDoc();
    return null;
  } catch {
    if (bundledImpactSummary.totals) return bundledIndexDoc();
    return null;
  }
}

export async function readLandingMapGeo(maxAgeMs?: number) {
  if (isLandingReferenceLocal()) {
    return readLandingMapGeoLocal();
  }
  return readLandingMapGeoProduction(maxAgeMs);
}

export async function readLandingMunicipalitiesByDepartment(departmentName: string, maxAgeMs?: number) {
  if (isLandingReferenceLocal()) {
    return readLandingMunicipalitiesByDepartmentLocal(departmentName);
  }
  return readLandingMunicipalitiesProduction(departmentName, maxAgeMs);
}

export async function readLandingSchoolsByMunicipality(
  departmentName: string,
  municipalityName: string,
  maxAgeMs?: number,
) {
  if (isLandingReferenceLocal()) {
    return readLandingSchoolsByMunicipalityLocal(departmentName, municipalityName);
  }
  return readLandingSchoolsByMunicipalityProduction(departmentName, municipalityName, maxAgeMs);
}

/** Legacy: colegios de todo el departamento. */
export async function readLandingSchoolsByDepartment(departmentName: string, maxAgeMs?: number) {
  if (isLandingReferenceLocal()) {
    return readLandingSchoolsByDepartmentLocal(departmentName);
  }
  return readLandingSchoolsProduction(departmentName, maxAgeMs);
}
