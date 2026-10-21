'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  getPanelScreenCache,
} from '@shared/lib/panelScreenCache';
import { buildPanelCacheVersion } from '@shared/lib/panelCacheVersion';
import { resolveSimDataCacheTTL } from '@shared/lib/cachePolicy';
import { AsyncTimeoutError, withTimeout } from '@shared/lib/withTimeout';
import {
  estudiantePanelCacheKey,
  type EstudiantePanelBundle,
} from '@features/estudiante/lib/estudiantePanelTypes';
import { fetchEstudiantePanelBundle, persistEstudiantePanelBundle } from '@features/estudiante/lib/fetchEstudiantePanelBundle';

const FETCH_TIMEOUT_MS = 45_000;

function readInitialPanelBundle(): EstudiantePanelBundle | null {
  if (typeof window === 'undefined') return null;

  const studentId = localStorage.getItem('student_id');
  if (!studentId) return null;

  const simHint = localStorage.getItem('simulacro_selected');
  const cacheKey = estudiantePanelCacheKey(studentId, simHint || 'auto');
  const cacheTtlMs = resolveSimDataCacheTTL(simHint || '');
  const cacheVersion = buildPanelCacheVersion({ studentId, simId: simHint || undefined });
  const cached = getPanelScreenCache<EstudiantePanelBundle>(cacheKey, cacheTtlMs, cacheVersion);
  if (cached?.studentId === studentId) return cached;
  return null;
}

export type EstudiantePanelCacheValue = {
  bundle: EstudiantePanelBundle | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  refresh: (force?: boolean) => Promise<void>;
};

const EstudiantePanelCacheContext = createContext<EstudiantePanelCacheValue | null>(null);

export function EstudiantePanelCacheProvider({ children }: { children: ReactNode }) {
  const [bundle, setBundle] = useState<EstudiantePanelBundle | null>(() => readInitialPanelBundle());
  const [loading, setLoading] = useState(() => !readInitialPanelBundle());
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(() => Boolean(readInitialPanelBundle()));
  const fetchGenRef = useRef(0);
  const bundleRef = useRef<EstudiantePanelBundle | null>(null);

  bundleRef.current = bundle;

  const refresh = useCallback(async (force = false) => {
    if (typeof window === 'undefined') return;

    const studentId = localStorage.getItem('student_id');
    if (!studentId) {
      setLoading(false);
      setBundle(null);
      setError(null);
      return;
    }

    const simHint = localStorage.getItem('simulacro_selected');
    const cacheKey = estudiantePanelCacheKey(studentId, simHint || 'auto');
    const cacheTtlMs = resolveSimDataCacheTTL(simHint || '');
    const cacheVersion = buildPanelCacheVersion({ studentId, simId: simHint || undefined });
    const cached = !force
      ? getPanelScreenCache<EstudiantePanelBundle>(cacheKey, cacheTtlMs, cacheVersion)
      : null;

    if (cached && cached.studentId === studentId) {
      setBundle(cached);
      setFromCache(true);
      setLoading(false);
      setError(null);
      if (!force) return;
    } else if (!bundleRef.current) {
      setLoading(true);
    }

    const gen = ++fetchGenRef.current;

    try {
      const fresh = await withTimeout(
        fetchEstudiantePanelBundle(studentId, simHint),
        FETCH_TIMEOUT_MS,
      );
      if (gen !== fetchGenRef.current) return;

      const fullKey = estudiantePanelCacheKey(studentId, fresh.simId);
      persistEstudiantePanelBundle(fresh);
      setBundle(fresh);
      setFromCache(false);
      setError(null);

      if (fresh.simId && fresh.simId !== simHint) {
        localStorage.setItem('simulacro_selected', fresh.simId);
      }
    } catch (e) {
      if (gen !== fetchGenRef.current) return;
      if (!cached) {
        const budgetExhausted =
          (e as { code?: string })?.code === 'BUDGET_EXHAUSTED' ||
          (e instanceof Error && e.message.includes('[ReadBudget]'));
        setError(
          budgetExhausted
            ? 'Límite de lecturas alcanzado. Espera unos segundos y pulsa reintentar.'
            : e instanceof AsyncTimeoutError
              ? 'La carga tardó demasiado. Reintenta o recarga la página.'
              : 'Error al cargar datos del panel.',
        );
      }
    } finally {
      if (gen === fetchGenRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onSimChange = () => {
      const sim = localStorage.getItem('simulacro_selected') || '';
      if (bundleRef.current && bundleRef.current.simId !== sim) {
        void refresh(true);
      }
    };

    window.addEventListener('sg-simulacro-selected', onSimChange);
    window.addEventListener('storage', onSimChange);
    return () => {
      window.removeEventListener('sg-simulacro-selected', onSimChange);
      window.removeEventListener('storage', onSimChange);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ bundle, loading, error, fromCache, refresh }),
    [bundle, loading, error, fromCache, refresh],
  );

  return (
    <EstudiantePanelCacheContext.Provider value={value}>
      {children}
    </EstudiantePanelCacheContext.Provider>
  );
}

export function useEstudiantePanelCache(): EstudiantePanelCacheValue {
  const ctx = useContext(EstudiantePanelCacheContext);
  if (!ctx) {
    throw new Error('useEstudiantePanelCache debe usarse dentro de EstudiantePanelCacheProvider');
  }
  return ctx;
}
