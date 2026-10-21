import type { Estudiante, EstadisticasGrupo } from '@shared/types';
import type { InvalidacionItem } from '@features/simulacro/lib/firestoreService';
import { buildPanelCacheVersion } from '@shared/lib/panelCacheVersion';
import { resolveSimDataCacheTTL } from '@shared/lib/cachePolicy';
import { getPanelScreenCache, setPanelScreenCache } from '@shared/lib/panelScreenCache';

export type EstudianteAnalisisSnapshot = {
  estudiante: Estudiante;
  groupStatistics: EstadisticasGrupo | null;
  invalidaciones: InvalidacionItem[];
  simulacroActivo: string;
  updatedAt: number;
};

export function estudianteAnalisisCacheKey(studentId: string, simId: string): string {
  return `estudiante-analisis:${studentId}:${simId}`;
}

export function peekEstudianteAnalisisCache(
  studentId: string,
  simId: string,
): EstudianteAnalisisSnapshot | null {
  if (!studentId || !simId) return null;
  const key = estudianteAnalisisCacheKey(studentId, simId);
  const ttl = resolveSimDataCacheTTL(simId);
  const version = buildPanelCacheVersion({ studentId, simId });
  const cached = getPanelScreenCache<EstudianteAnalisisSnapshot>(key, ttl, version);
  if (!cached?.estudiante || cached.simulacroActivo !== simId) return null;
  return cached;
}

export function writeEstudianteAnalisisCache(snapshot: EstudianteAnalisisSnapshot): void {
  if (!snapshot.estudiante || !snapshot.simulacroActivo) return;
  const studentId = String(
    snapshot.estudiante.informacion_personal?.numero_identificacion || '',
  ).trim();
  if (!studentId) return;
  const key = estudianteAnalisisCacheKey(studentId, snapshot.simulacroActivo);
  const ttl = resolveSimDataCacheTTL(snapshot.simulacroActivo);
  const version = buildPanelCacheVersion({
    studentId,
    simId: snapshot.simulacroActivo,
  });
  setPanelScreenCache(key, { ...snapshot, updatedAt: Date.now() }, ttl, version);
}
