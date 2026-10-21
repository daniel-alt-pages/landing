import type { Estudiante } from '@shared/types';
import type {
  InstitutionQuestionStats,
  SimulacionEstadisticas,
} from '@features/simulacro/lib/firestoreService';
import { buildPanelCacheVersion } from '@shared/lib/panelCacheVersion';
import { resolveSimDataCacheTTL } from '@shared/lib/cachePolicy';
import { getPanelScreenCache, setPanelScreenCache, invalidatePanelScreenCache } from '@shared/lib/panelScreenCache';

export type CoordinadorPanelSnapshot = {
  baseInstitution: string;
  selectedInstitution: string;
  currentSimulation: string;
  summary: Record<string, unknown> | null;
  allSims: string[];
  availableSimulations: string[];
  allStudents: Estudiante[];
  aggregateStats: SimulacionEstadisticas | null;
  institutionQuestionStats: InstitutionQuestionStats | null;
  updatedAt: number;
};

export type CoordinadorSummarySnapshot = {
  baseInstitution: string;
  summary: Record<string, unknown> | null;
  allSims: string[];
  availableSimulations: string[];
  currentSimulation: string;
  updatedAt: number;
};

export function coordinadorSummaryCacheKey(baseInstitution: string): string {
  return `coordinador-summary:${(baseInstitution || 'TODAS').trim().toUpperCase()}`;
}

export function coordinadorPanelCacheKey(
  baseInstitution: string,
  simulationId: string,
  selectedInstitution: string,
): string {
  return `coordinador-panel:${(baseInstitution || 'TODAS').trim().toUpperCase()}:${simulationId}:${(selectedInstitution || 'TODAS').trim().toUpperCase()}`;
}

function summaryVersion(baseInstitution: string): string {
  return buildPanelCacheVersion({ institution: baseInstitution });
}

function panelVersion(
  baseInstitution: string,
  simulationId: string,
): string {
  return buildPanelCacheVersion({ institution: baseInstitution, simId: simulationId });
}

export function peekCoordinadorSummaryCache(
  baseInstitution: string,
): CoordinadorSummarySnapshot | null {
  if (!baseInstitution) return null;
  const key = coordinadorSummaryCacheKey(baseInstitution);
  return getPanelScreenCache<CoordinadorSummarySnapshot>(
    key,
    resolveSimDataCacheTTL(''),
    summaryVersion(baseInstitution),
  );
}

export function writeCoordinadorSummaryCache(snapshot: CoordinadorSummarySnapshot): void {
  if (!snapshot.baseInstitution) return;
  const key = coordinadorSummaryCacheKey(snapshot.baseInstitution);
  setPanelScreenCache(
    key,
    snapshot,
    resolveSimDataCacheTTL(''),
    summaryVersion(snapshot.baseInstitution),
  );
}

export function peekCoordinadorPanelCache(
  baseInstitution: string,
  simulationId: string,
  selectedInstitution: string,
): CoordinadorPanelSnapshot | null {
  if (!baseInstitution || !simulationId) return null;
  const key = coordinadorPanelCacheKey(baseInstitution, simulationId, selectedInstitution);
  const cached = getPanelScreenCache<CoordinadorPanelSnapshot>(
    key,
    resolveSimDataCacheTTL(simulationId),
    panelVersion(baseInstitution, simulationId),
  );
  if (!cached || cached.currentSimulation !== simulationId) return null;
  return cached;
}

export function writeCoordinadorPanelCache(snapshot: CoordinadorPanelSnapshot): void {
  if (!snapshot.baseInstitution || !snapshot.currentSimulation) return;
  const key = coordinadorPanelCacheKey(
    snapshot.baseInstitution,
    snapshot.currentSimulation,
    snapshot.selectedInstitution,
  );
  setPanelScreenCache(
    key,
    snapshot,
    resolveSimDataCacheTTL(snapshot.currentSimulation),
    panelVersion(snapshot.baseInstitution, snapshot.currentSimulation),
  );
}

/** Epoch de caché del panel coordinador — al cambiar, se limpia todo en el próximo acceso. */
export const COORD_PANEL_CACHE_EPOCH = 'sg_edu_v36';

const COORD_PANEL_CACHE_EPOCH_KEY = 'coord_panel_cache_epoch';

/**
 * Limpia cachés del panel coordinador (memoria, panel screen, Firestore persist).
 * Se ejecuta una vez por deploy cuando cambia COORD_PANEL_CACHE_EPOCH.
 */
export async function resetCoordinadorPanelCaches(): Promise<void> {
  if (typeof window === 'undefined') return;

  invalidatePanelScreenCache();

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (
      key.startsWith('sg_coord_ranking_inst_probe:') ||
      key.startsWith('coordinador-')
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));

  try {
    const { clearCache, clearDevRuntimeCaches } = await import(
      '@features/simulacro/lib/firestoreService'
    );
    clearCache();
    clearDevRuntimeCaches();
  } catch {
    /* ignore */
  }

  try {
    const { clearDataCaches } = await import('@/lib/storageCleanup');
    clearDataCaches();
  } catch {
    /* ignore */
  }

  console.info('[Coordinador] Cachés del panel reiniciados');
}

/** Si el epoch cambió (nuevo deploy), limpia cachés y marca el epoch actual. */
export async function ensureCoordinadorPanelCacheEpoch(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(COORD_PANEL_CACHE_EPOCH_KEY);
  if (stored === COORD_PANEL_CACHE_EPOCH) return false;
  await resetCoordinadorPanelCaches();
  localStorage.setItem(COORD_PANEL_CACHE_EPOCH_KEY, COORD_PANEL_CACHE_EPOCH);
  return true;
}
