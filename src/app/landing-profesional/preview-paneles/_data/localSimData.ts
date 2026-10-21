/**
 * Datos reales locales en `public/data/simulations/{simId}/`.
 * Usado por firestoreMock (demo coordinador / previews) — sin seeds sintéticos.
 */

import type { Estudiante, EstadisticasGrupo } from '@shared/types';
import { getSubjectRespuestas, normalizeSubjectResp } from '@features/coordinador/lib/analisis/subjectAnswers';
import { PREVIEW_ACTIVE_SIM, PREVIEW_AVAILABLE_SIMS } from './seeds/constants';
import { normalizePuntaje } from './normalizePuntaje';
import type { InstitutionQuestionStats, SimulacionEstadisticas, SimulationManifest } from './firestoreMock';

export const DEMO_LOCAL_SIM_IDS = [...PREVIEW_AVAILABLE_SIMS] as string[];

const inflight = new Map<string, Promise<unknown>>();

async function fetchStaticJSON<T>(path: string): Promise<T> {
  if (inflight.has(path)) return inflight.get(path)! as Promise<T>;
  const promise = (async () => {
    const resp = await fetch(`/data/${path}`);
    if (!resp.ok) throw new Error(`No se pudo cargar /data/${path}: ${resp.status}`);
    return resp.json() as Promise<T>;
  })();
  inflight.set(path, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(path);
  }
}

function normalizeEstudianteRecord(raw: Record<string, unknown>): Estudiante | null {
  const info = raw.informacion_personal as Record<string, unknown> | undefined;
  const id = info?.numero_identificacion;
  if (!id) return null;

  const puntaje_global =
    Number(raw.puntaje_global) || Number(raw.score_reportado) || Number(raw.score_real) || 0;

  const puntajes: Estudiante['puntajes'] = {};
  if (raw.puntajes && typeof raw.puntajes === 'object') {
    for (const [key, val] of Object.entries(raw.puntajes as Record<string, unknown>)) {
      puntajes[key] = normalizePuntaje(val);
    }
  }

  const secciones_completadas = Array.isArray(raw.secciones_completadas)
    ? (raw.secciones_completadas as string[])
    : Array.isArray(raw.sesiones)
      ? (raw.sesiones as string[])
      : [];

  return {
    ...(raw as unknown as Estudiante),
    informacion_personal: info as unknown as Estudiante['informacion_personal'],
    puntaje_global,
    puntajes,
    secciones_completadas,
  };
}

function parseStudentsPayload(raw: { estudiantes?: unknown[] } | unknown[]): Estudiante[] {
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.estudiantes) ? raw.estudiantes : [];
  return list
    .map((row) => normalizeEstudianteRecord(row as Record<string, unknown>))
    .filter((e): e is Estudiante => e !== null);
}

function distribucionToCounts(
  dist: Record<string, unknown> | undefined,
  totalRespuestas: number,
): Record<string, number> {
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, NR: 0 };
  if (!dist || totalRespuestas <= 0) return counts;
  const rawVals = Object.values(dist).map((v) => Number(v) || 0);
  const distSum = rawVals.reduce((s, v) => s + v, 0);
  const distEsPorcentaje = distSum > 0 && distSum <= 110 && Object.keys(dist).length >= 2;
  for (const [opt, val] of Object.entries(dist)) {
    const n = Number(val) || 0;
    const key = String(opt).toUpperCase();
    counts[key] = distEsPorcentaje ? Math.round((n / 100) * totalRespuestas) : Math.round(n);
  }
  return counts;
}

function mapEstadisticasGrupo(raw: EstadisticasGrupo): SimulacionEstadisticas {
  const out: SimulacionEstadisticas = { materias: {} };
  for (const [mat, preguntas] of Object.entries(raw.materias || {})) {
    out.materias[mat] = {};
    for (const est of Object.values(preguntas)) {
      const numero = Number(est.numero);
      const total = Number(est.total_respuestas ?? est.total_evaluados ?? 0);
      const dist = distribucionToCounts(
        est.distribucion as Record<string, unknown> | undefined,
        total,
      );
      out.materias[mat][String(numero)] = {
        numero,
        aciertos: Number(est.aciertos) || 0,
        total_respuestas: total,
        porcentaje_acierto: Number(est.porcentaje_acierto ?? est.porcentaje_aciertos) || 0,
        respuesta_correcta: String(est.respuesta_correcta || 'A'),
        distribucion: dist,
      };
    }
  }
  return out;
}

function buildInstitutionQuestionStats(
  estudiantes: Estudiante[],
  estadisticas: EstadisticasGrupo,
): InstitutionQuestionStats {
  const out: InstitutionQuestionStats = {};
  const byInst = new Map<string, Estudiante[]>();

  for (const est of estudiantes) {
    const inst = est.informacion_personal?.institucion || 'SIN INSTITUCION';
    if (!byInst.has(inst)) byInst.set(inst, []);
    byInst.get(inst)!.push(est);
  }

  for (const [inst, lista] of byInst.entries()) {
    out[inst] = {};
    for (const [mat, preguntas] of Object.entries(estadisticas.materias || {})) {
      const rows: InstitutionQuestionStats[string][string] = [];
      for (const est of Object.values(preguntas)) {
        const numero = Number(est.numero);
        const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, NR: 0 };
        let failed = 0;
        let total = 0;
        for (const student of lista) {
          const items = normalizeSubjectResp(getSubjectRespuestas(student, mat), mat);
          if (!items.length) continue;
          const r = items.find((row) => row.numero === numero);
          if (!r) continue;
          const letra =
            r.respuesta_estudiante && counts[r.respuesta_estudiante] !== undefined
              ? r.respuesta_estudiante
              : 'NR';
          counts[letra] += 1;
          total += 1;
          if (!r.es_correcta) failed += 1;
        }
        rows.push({
          num: numero,
          failed,
          total,
          rate: total === 0 ? 0 : failed / total,
          correct: String(est.respuesta_correcta || 'A'),
          counts,
        });
      }
      out[inst][mat] = rows;
    }
  }
  return out;
}

type SimBundle = {
  estudiantes: Estudiante[];
  estadisticas: EstadisticasGrupo;
  estadisticasMapped: SimulacionEstadisticas;
  institutionQuestionStats: InstitutionQuestionStats;
  manifest: SimulationManifest;
};

const bundleCache = new Map<string, SimBundle>();
let coordinatorSummaryCache: Record<string, unknown> | null = null;

function isAllowedSim(simId: string): boolean {
  return (DEMO_LOCAL_SIM_IDS as readonly string[]).includes(simId);
}

export function resolveDemoSimId(simId?: string): string {
  const raw = (simId || '').trim();
  if (raw && isAllowedSim(raw)) return raw;
  return PREVIEW_ACTIVE_SIM;
}

export async function loadLocalSimBundle(simId: string = PREVIEW_ACTIVE_SIM): Promise<SimBundle> {
  const id = resolveDemoSimId(simId);
  if (!isAllowedSim(id)) {
    throw new Error(`Simulacro no disponible en demo local: ${simId}`);
  }
  const cached = bundleCache.get(id);
  if (cached) return cached;

  const [studentsRaw, estadisticas, manifest] = await Promise.all([
    fetchStaticJSON<{ estudiantes: unknown[] }>(`simulations/${id}/students.json`),
    fetchStaticJSON<EstadisticasGrupo>(`simulations/${id}/estadisticas_grupo.json`),
    fetchStaticJSON<SimulationManifest>(`simulations/${id}/manifest.json`),
  ]);

  const estudiantes = parseStudentsPayload(studentsRaw);
  const estadisticasMapped = mapEstadisticasGrupo(estadisticas);
  const institutionQuestionStats = buildInstitutionQuestionStats(estudiantes, estadisticas);

  const bundle: SimBundle = {
    estudiantes,
    estadisticas,
    estadisticasMapped,
    institutionQuestionStats,
    manifest: {
      ...manifest,
      id,
      totalStudents: estudiantes.length,
    },
  };
  bundleCache.set(id, bundle);
  return bundle;
}

export async function loadCoordinatorSummary(): Promise<Record<string, unknown>> {
  if (coordinatorSummaryCache) return coordinatorSummaryCache;
  coordinatorSummaryCache = await fetchStaticJSON<Record<string, unknown>>('coordinator_summary.json');
  return coordinatorSummaryCache;
}

export async function loadStudentById(
  studentId: string,
  simId: string = PREVIEW_ACTIVE_SIM,
): Promise<Estudiante | null> {
  const id = resolveDemoSimId(simId);
  const bundle = await loadLocalSimBundle(id);
  const wanted = studentId.trim();
  const direct = bundle.estudiantes.find(
    (e) => e.informacion_personal?.numero_identificacion === wanted,
  );
  if (direct) return direct;

  try {
    const raw = await fetchStaticJSON<Record<string, unknown>>(
      `simulations/${id}/estudiantes/${wanted}.json`,
    );
    return normalizeEstudianteRecord(raw);
  } catch {
    return null;
  }
}

/** Institución principal del sim activo (filtro inicial coordinador demo). */
export async function getDefaultDemoInstitution(simId: string = PREVIEW_ACTIVE_SIM): Promise<string> {
  const summary = await loadCoordinatorSummary();
  const resolved = resolveDemoSimId(simId);
  const sim = summary[resolved] as { institutions?: Record<string, unknown> } | undefined;
  const keys = sim?.institutions ? Object.keys(sim.institutions) : [];
  if (keys.length > 0) return keys[0];
  const bundle = await loadLocalSimBundle(resolved);
  return bundle.estudiantes[0]?.informacion_personal?.institucion || 'TODAS';
}

export function clearLocalSimCache(): void {
  bundleCache.clear();
  coordinatorSummaryCache = null;
  inflight.clear();
}
