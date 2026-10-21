'use client';

import { useMemo } from 'react';
import type { ColombiaSalesCatalog } from '../tipos';
import { useLandingMunicipalitiesByDepartment } from './useLandingMunicipalitiesByDepartment';
import { useLandingReferenceIndex } from './useLandingReferenceIndex';
import { useLandingSchoolsByMunicipality } from './useLandingSchoolsByMunicipality';

/**
 * Catálogo institucional en cascada (lecturas pequeñas).
 * - `index`: impacto + departamentos (~1 read).
 * - `municipalities__{depto}`: al elegir departamento.
 * - `schools__{depto}__{muni}`: al escribir/elegir municipio (≥2 chars).
 */
export function useColombiaSalesCatalog(
  enabled: boolean,
  selectedDepartment = '',
  selectedMunicipality = '',
) {
  const { index, indexStatus } = useLandingReferenceIndex(enabled);
  const deptTrimmed = selectedDepartment.trim();
  const muniTrimmed = selectedMunicipality.trim();

  const loadMunicipalities = enabled && deptTrimmed.length > 0;
  const { municipalities, municipalitiesStatus } = useLandingMunicipalitiesByDepartment(
    selectedDepartment,
    loadMunicipalities,
  );

  const loadSchools = enabled && deptTrimmed.length > 0 && muniTrimmed.length >= 2;
  const { schools, schoolsStatus } = useLandingSchoolsByMunicipality(
    selectedDepartment,
    selectedMunicipality,
    loadSchools,
  );

  const catalog = useMemo((): ColombiaSalesCatalog | null => {
    if (!index) return null;

    const resolvedMunicipalities = loadMunicipalities
      ? municipalities
      : (index.municipalities ?? []);

    return {
      departments: index.departments,
      municipalities: resolvedMunicipalities,
      schools: loadSchools ? schools : [],
    };
  }, [index, loadMunicipalities, municipalities, loadSchools, schools]);

  const catalogStatus = useMemo(() => {
    if (!enabled) return 'idle' as const;
    if (
      indexStatus === 'loading' ||
      (loadMunicipalities && municipalitiesStatus === 'loading') ||
      (loadSchools && schoolsStatus === 'loading')
    ) {
      return 'loading' as const;
    }
    if (indexStatus === 'error') return 'empty' as const;
    if (!index?.departments?.length) return 'empty' as const;
    return 'ready' as const;
  }, [
    enabled,
    index,
    indexStatus,
    loadMunicipalities,
    loadSchools,
    municipalitiesStatus,
    schoolsStatus,
  ]);

  return { catalog, catalogStatus };
}
