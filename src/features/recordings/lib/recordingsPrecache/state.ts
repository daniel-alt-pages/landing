import {
  RECORDINGS_PRECACHE_STORAGE_KEY,
  RECORDINGS_PRECACHE_TTL_MS,
} from '@features/recordings/lib/recordingsPrecache/constants';

export type RecordingsPrecacheRecord = {
  simulationId: string;
  catalogVersion: string;
  completedAt: number;
  recordingIds: string[];
};

type StoragePayload = {
  records: RecordingsPrecacheRecord[];
};

function readPayload(): StoragePayload {
  if (typeof window === 'undefined') return { records: [] };
  try {
    const raw = localStorage.getItem(RECORDINGS_PRECACHE_STORAGE_KEY);
    if (!raw) return { records: [] };
    const parsed = JSON.parse(raw) as StoragePayload;
    if (!Array.isArray(parsed.records)) return { records: [] };
    return parsed;
  } catch {
    return { records: [] };
  }
}

function writePayload(payload: StoragePayload): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RECORDINGS_PRECACHE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function getRecordingsPrecacheRecord(
  simulationId: string,
): RecordingsPrecacheRecord | null {
  const payload = readPayload();
  return payload.records.find((r) => r.simulationId === simulationId) ?? null;
}

export function isRecordingsPrecacheFresh(
  simulationId: string,
  catalogVersion: string,
): boolean {
  const record = getRecordingsPrecacheRecord(simulationId);
  if (!record) return false;
  if (record.catalogVersion !== catalogVersion) return false;
  return Date.now() - record.completedAt < RECORDINGS_PRECACHE_TTL_MS;
}

export function markRecordingsPrecacheComplete(
  simulationId: string,
  catalogVersion: string,
  recordingIds: string[],
): void {
  const payload = readPayload();
  const next: RecordingsPrecacheRecord = {
    simulationId,
    catalogVersion,
    completedAt: Date.now(),
    recordingIds,
  };
  payload.records = [
    next,
    ...payload.records.filter((r) => r.simulationId !== simulationId),
  ].slice(0, 8);
  writePayload(payload);
}
