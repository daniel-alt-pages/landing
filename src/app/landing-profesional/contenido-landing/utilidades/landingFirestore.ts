'use client';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@features/auth/lib/firebase';
import type { ColombiaCatalogItem } from '../tipos';
import type { LandingImpactSummary } from '../tipos/landingReference';
import {
  municipalitiesDocId,
  schoolsByDepartmentDocId,
  schoolsByMunicipalityDocId,
} from './departmentSlug';

export const LANDING_REFERENCE_COLLECTION = 'landing_reference';

export const LANDING_REFERENCE_DOC_IDS = {
  index: 'index',
  mapGeo: 'map_geo',
} as const;

export type LandingReferenceIndexDoc = {
  version: string;
  updatedAt?: string;
  impactSummary: LandingImpactSummary;
  departments: ColombiaCatalogItem[];
  /** Legacy: index monolítico con todos los municipios. Preferir `municipalities__*`. */
  municipalities?: ColombiaCatalogItem[];
};

export type LandingMapGeoDoc = {
  features: Array<{
    type: 'Feature';
    properties: { DPTO?: string; NOMBRE_DPT?: string };
    geometry: {
      type: 'Polygon' | 'MultiPolygon';
      coordinates: number[] | number[][] | number[][][];
    };
  }>;
};

export type LandingSchoolsDoc = {
  department: string;
  departmentSlug: string;
  municipality?: string;
  municipalitySlug?: string;
  schools: ColombiaCatalogItem[];
};

export type LandingMunicipalitiesDoc = {
  department: string;
  departmentSlug: string;
  municipalities: ColombiaCatalogItem[];
};

const CACHE_VERSION = 'sg_landing_fs_v2';
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const memory = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

type StoredPayload<T> = { v: string; ts: number; data: T };

function lsKey(docId: string) {
  return `${CACHE_VERSION}_${docId}`;
}

function readLocalStorage<T>(docId: string, maxAgeMs: number): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(lsKey(docId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPayload<T>;
    if (parsed.v !== CACHE_VERSION) return null;
    if (Date.now() - parsed.ts > maxAgeMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeLocalStorage<T>(docId: string, data: T) {
  if (typeof window === 'undefined') return;
  try {
    const payload: StoredPayload<T> = { v: CACHE_VERSION, ts: Date.now(), data };
    window.localStorage.setItem(lsKey(docId), JSON.stringify(payload));
  } catch {
    // quota
  }
}

/**
 * 1 lectura Firestore por doc (con caché memoria + localStorage + IndexedDB vía SDK).
 */
export async function readLandingReferenceDoc<T>(
  docId: string,
  maxAgeMs = DEFAULT_TTL_MS,
): Promise<T | null> {
  if (memory.has(docId)) {
    return memory.get(docId) as T;
  }

  const cached = readLocalStorage<T>(docId, maxAgeMs);
  if (cached) {
    memory.set(docId, cached);
    return cached;
  }

  if (inflight.has(docId)) {
    return inflight.get(docId)! as Promise<T | null>;
  }

  const promise = (async () => {
    try {
      const snap = await getDoc(doc(db, LANDING_REFERENCE_COLLECTION, docId));
      if (!snap.exists()) return null;
      const data = snap.data() as T;
      memory.set(docId, data);
      writeLocalStorage(docId, data);
      return data;
    } catch {
      return null;
    }
  })();

  inflight.set(docId, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(docId);
  }
}

export async function readLandingIndexFirestore(maxAgeMs?: number) {
  return readLandingReferenceDoc<LandingReferenceIndexDoc>(LANDING_REFERENCE_DOC_IDS.index, maxAgeMs);
}

export async function readLandingMapGeoFirestore(maxAgeMs?: number) {
  return readLandingReferenceDoc<LandingMapGeoDoc>(LANDING_REFERENCE_DOC_IDS.mapGeo, maxAgeMs);
}

export async function readLandingMunicipalitiesByDepartmentFirestore(
  departmentName: string,
  maxAgeMs?: number,
) {
  if (!departmentName.trim()) return null;
  return readLandingReferenceDoc<LandingMunicipalitiesDoc>(municipalitiesDocId(departmentName), maxAgeMs);
}

export async function readLandingSchoolsByMunicipalityFirestore(
  departmentName: string,
  municipalityName: string,
  maxAgeMs?: number,
) {
  if (!departmentName.trim() || !municipalityName.trim()) return null;
  return readLandingReferenceDoc<LandingSchoolsDoc>(
    schoolsByMunicipalityDocId(departmentName, municipalityName),
    maxAgeMs,
  );
}

/** Legacy: doc con todos los colegios del departamento. */
export async function readLandingSchoolsByDepartmentFirestore(departmentName: string, maxAgeMs?: number) {
  if (!departmentName.trim()) return null;
  return readLandingReferenceDoc<LandingSchoolsDoc>(schoolsByDepartmentDocId(departmentName), maxAgeMs);
}
