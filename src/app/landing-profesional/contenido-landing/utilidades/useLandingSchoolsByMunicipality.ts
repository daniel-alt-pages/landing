'use client';

import { useEffect, useState } from 'react';
import type { ColombiaCatalogItem } from '../tipos';
import { readLandingSchoolsByMunicipality } from './landingReference';

export function useLandingSchoolsByMunicipality(
  departmentName: string,
  municipalityName: string,
  enabled: boolean,
) {
  const [schools, setSchools] = useState<ColombiaCatalogItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle');

  useEffect(() => {
    const trimmedDept = departmentName.trim();
    const trimmedMuni = municipalityName.trim();
    if (!enabled || !trimmedDept || trimmedMuni.length < 2) {
      setSchools([]);
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    readLandingSchoolsByMunicipality(trimmedDept, trimmedMuni)
      .then((doc) => {
        if (cancelled) return;
        const list = doc?.schools ?? [];
        setSchools(list);
        setStatus(list.length ? 'ready' : 'empty');
      })
      .catch(() => {
        if (!cancelled) {
          setSchools([]);
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [departmentName, municipalityName, enabled]);

  return { schools, schoolsStatus: status };
}
