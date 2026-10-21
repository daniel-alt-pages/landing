import { normalizeDepartmentKey } from '../mapa-impacto/impactData';

/** Slug estable para doc id `schools__{slug}` en Firestore. */
export function toDepartmentSlug(departmentName: string) {
  const key = normalizeDepartmentKey(departmentName);
  return key.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'sin_departamento';
}

export function toMunicipalitySlug(municipalityName: string) {
  const key = normalizeDepartmentKey(municipalityName);
  return key.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'sin_municipio';
}

export function schoolsDocId(departmentName: string) {
  return `schools__${toDepartmentSlug(departmentName)}`;
}

/** Doc legacy: todos los colegios del departamento. */
export function schoolsByDepartmentDocId(departmentName: string) {
  return schoolsDocId(departmentName);
}

export function municipalitiesDocId(departmentName: string) {
  return `municipalities__${toDepartmentSlug(departmentName)}`;
}

export function schoolsByMunicipalityDocId(departmentName: string, municipalityName: string) {
  return `schools__${toDepartmentSlug(departmentName)}__${toMunicipalitySlug(municipalityName)}`;
}
