'use client';

import { useEffect, useState } from 'react';
import type { ColombiaCatalogItem } from '../tipos';
import { readLandingMunicipalitiesByDepartment } from './landingReference';

export function useLandingMunicipalitiesByDepartment(departmentName: string, enabled: boolean) {
  const [municipalities, setMunicipalities] = useState<ColombiaCatalogItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle');

  useEffect(() => {
    const trimmed = departmentName.trim();
    if (!enabled || !trimmed) {
      setMunicipalities([]);
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    readLandingMunicipalitiesByDepartment(trimmed)
      .then((doc) => {
        if (cancelled) return;
        const list = doc?.municipalities ?? [];
        setMunicipalities(list);
        setStatus(list.length ? 'ready' : 'empty');
      })
      .catch(() => {
        if (!cancelled) {
          setMunicipalities([]);
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [departmentName, enabled]);

  return { municipalities, municipalitiesStatus: status };
}
