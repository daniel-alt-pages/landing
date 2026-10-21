'use client';

import { useEffect, useState } from 'react';
import type { LandingReferenceIndexDoc } from './landingReference';
import { readLandingIndex } from './landingReference';

export function useLandingReferenceIndex(enabled: boolean) {
  const [index, setIndex] = useState<LandingReferenceIndexDoc | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setStatus((current) => (current === 'ready' ? 'ready' : 'loading'));

    readLandingIndex()
      .then((data) => {
        if (cancelled) return;
        if (data?.impactSummary?.totals) {
          setIndex(data);
          setStatus('ready');
        } else {
          setStatus('error');
        }
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[landing] readLandingIndex failed', err);
        }
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { index, indexStatus: status };
}
