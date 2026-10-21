import { getAppBuildId } from '@/lib/buildIdCache';
import { normalizeSimIdForCache } from '@shared/lib/cachePolicy';

type AppConfigBlob = {
  dataVersion?: string;
  simVersions?: Record<string, unknown>;
};

function readAppConfigData(): AppConfigBlob | null {
  if (typeof window === 'undefined') return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.endsWith('_appConfig')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { data?: AppConfigBlob };
      if (parsed?.data) return parsed.data;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function coerceSimVersion(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const asNum = Number(value);
    if (Number.isFinite(asNum)) return asNum;
  }
  return 0;
}

/** Versión global de datos (checkDataVersion / pipeline). */
export function readPanelDataVersion(): string {
  const fromStorage = localStorage.getItem('sg_data_version');
  if (fromStorage) return fromStorage;
  return readAppConfigData()?.dataVersion || '0';
}

/** Versión por simulacro (checkSimVersions / pipeline). */
export function readPanelSimVersion(simId: string): number {
  const norm = normalizeSimIdForCache(simId);
  if (!norm) return 0;

  try {
    const localRaw = localStorage.getItem('sg_sim_versions');
    if (localRaw) {
      const parsed = JSON.parse(localRaw) as Record<string, unknown>;
      const hit = parsed[norm] ?? parsed[simId];
      if (hit !== undefined) return coerceSimVersion(hit);
    }
    const cfg = readAppConfigData()?.simVersions;
    if (cfg) {
      const hit = cfg[norm] ?? cfg[simId];
      if (hit !== undefined) return coerceSimVersion(hit);
    }
  } catch {
    /* ignore */
  }
  return 0;
}

export type PanelCacheVersionInput = {
  simId?: string;
  institution?: string;
  studentId?: string;
};

/** Clave de versión para invalidar panel cache al cambiar build, dataVersion o simVersion. */
export function buildPanelCacheVersion(input: PanelCacheVersionInput = {}): string {
  const build = getAppBuildId() || 'dev';
  const dataVer = readPanelDataVersion();
  const simNorm = normalizeSimIdForCache(input.simId || '');
  const simVer = simNorm ? readPanelSimVersion(simNorm) : 0;
  const inst = (input.institution || '').trim().toUpperCase();
  const student = (input.studentId || '').trim();
  return ['panel-v1', build, dataVer, simVer, simNorm, inst, student].join(':');
}
