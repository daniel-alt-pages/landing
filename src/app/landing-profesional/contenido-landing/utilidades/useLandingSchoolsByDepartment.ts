'use client';

import { useEffect, useState } from 'react';
import type { ColombiaCatalogItem } from '../tipos';
import { readLandingSchoolsByDepartment } from './landingReference';

export function useLandingSchoolsByDepartment(departmentName: string, enabled: boolean) {
  const [schools, setSchools] = useState<ColombiaCatalogItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle');

  useEffect(() => {
    const trimmed = departmentName.trim();
    if (!enabled || !trimmed) {
      setSchools([]);
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    readLandingSchoolsByDepartment(trimmed)
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
  }, [departmentName, enabled]);

  return { schools, schoolsStatus: status };
}
