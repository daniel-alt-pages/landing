'use client';

import { useEffect, useState } from 'react';
import { fetchSimRecordingsCatalog } from '@features/recordings/lib/recordingsCatalog';
import type { SimRecordingsCatalog } from '@features/recordings/lib/recordingsTypes';
import { buildPanelCacheVersion } from '@shared/lib/panelCacheVersion';
import { resolveSimDataCacheTTL } from '@shared/lib/cachePolicy';
import { getPanelScreenCache, setPanelScreenCache } from '@shared/lib/panelScreenCache';
import { withTimeout } from '@shared/lib/withTimeout';

const CATALOG_LOAD_TIMEOUT_MS = 12_000;

function recordingsCatalogCacheKey(simId: string): string {
  return `recordings-catalog:${simId}`;
}

function peekSimRecordingsCatalog(simId: string): SimRecordingsCatalog | null {
  if (!simId) return null;
  const version = buildPanelCacheVersion({ simId });
  const ttl = resolveSimDataCacheTTL(simId);
  const cached = getPanelScreenCache<SimRecordingsCatalog>(
    recordingsCatalogCacheKey(simId),
    ttl,
    version,
  );
  if (cached?.simulationId === simId && Array.isArray(cached.recordings)) return cached;
  return null;
}

function persistSimRecordingsCatalog(simId: string, catalog: SimRecordingsCatalog): void {
  const version = buildPanelCacheVersion({ simId });
  const ttl = resolveSimDataCacheTTL(simId);
  setPanelScreenCache(recordingsCatalogCacheKey(simId), catalog, ttl, version);
}

export function useSimRecordings(simId: string) {
  const cachedOnMount = peekSimRecordingsCatalog(simId);
  const [catalog, setCatalog] = useState<SimRecordingsCatalog | null>(() => cachedOnMount);
  const [loading, setLoading] = useState(Boolean(simId && !cachedOnMount));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!simId) {
      setCatalog(null);
      setLoading(false);
      setError(null);
      return;
    }

    const cached = peekSimRecordingsCatalog(simId);
    if (cached) {
      setCatalog(cached);
      setLoading(false);
      setError(null);
    }

    let cancelled = false;
    if (!cached) {
      setLoading(true);
    }
    setError(null);

    withTimeout(fetchSimRecordingsCatalog(simId), CATALOG_LOAD_TIMEOUT_MS, 'Catálogo timeout')
      .then((data) => {
        if (cancelled) return;
        if (data) persistSimRecordingsCatalog(simId, data);
        setCatalog(data);
        if (!data) setError('No hay grabaciones publicadas para este simulacro.');
      })
      .catch(() => {
        if (cancelled) return;
        if (!cached) {
          setCatalog(null);
          setError('No se pudo cargar el catálogo de clases.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [simId]);

  const recordings = catalog?.recordings ?? [];
  const hasRecordings = recordings.length > 0;
  const count = recordings.length;

  return {
    catalog,
    recordings,
    hasRecordings,
    count,
    loading,
    error,
  };
}
