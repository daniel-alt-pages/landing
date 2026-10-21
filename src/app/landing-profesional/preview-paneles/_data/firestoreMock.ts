/**
 * Mock local del `firestoreService` para previews aislados.
 *
 * Carga JSON reales en `public/data/simulations/SG11-19/` — sin Firestore ni seeds.
 */

import type { Estudiante, EstadisticasGrupo } from '@shared/types';
import type {
  PlannerCustomizationPayload,
  PlannerMergedProfile,
  PlannerQuotaState,
  PlannerSessionState,
} from '@features/simulacro/types/simulation';
import {
  clearLocalSimCache,
  loadCoordinatorSummary,
  loadLocalSimBundle,
  loadStudentById,
  resolveDemoSimId,
} from './localSimData';
import { normalizePuntaje } from './normalizePuntaje';
import {
  filterCoordinatorSummaryForDemo,
  isDemoInstitutionName,
  maskEstudianteForDemo,
  maskEstudianteListForDemo,
} from '@/app/demo/_shared/demoPrivacy';
import { PREVIEW_ACTIVE_SIM, PREVIEW_AVAILABLE_SIMS, PREVIEW_STUDENT_ID } from './seeds/constants';

export { normalizePuntaje };

function resolveSimId(simId?: string): string {
  return resolveDemoSimId(simId);
}

// ─── Tipos públicos (alineados con firestoreService) ──────────────────

export interface AppConfig {
  activeSimulation: string;
  availableSimulations: string[];
  consoleEnabled?: boolean;
  dataVersion?: string;
  simVersions?: Record<string, number>;
  partialSimulations?: string[];
}

export interface StudentProfile {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  institucion?: string;
  departamento?: string;
  simulacros?: string[];
}

export interface InvalidacionItem {
  simulacro: string;
  sesion: string;
  numero_pregunta: number;
  materia: string;
  motivo?: string;
}

export interface SimulationManifest {
  id: string;
  name: string;
  date: string;
  totalStudents: number;
}

export interface RankingEntry {
  nombre: string;
  apellidos?: string;
  institucion?: string;
  numero_identificacion: string;
  puntaje_global: number;
  posicion: number;
  puntajes?: Record<string, number | { puntaje: number; correctas: number; total_preguntas: number }>;
}

export interface PreguntaEstadistica {
  numero: number;
  aciertos: number;
  total_respuestas: number;
  porcentaje_acierto: number;
  respuesta_correcta: string;
  distribucion: Record<string, number>;
}

export interface SimulacionEstadisticas {
  materias: Record<string, Record<string, PreguntaEstadistica>>;
}

export type InstitutionQuestionStats = Record<
  string,
  Record<
    string,
    Array<{
      num: number;
      failed: number;
      total: number;
      rate: number;
      correct: string;
      counts: Record<string, number>;
    }>
  >
>;

// ─── API mock (datos reales locales SG11-19) ───────────────────────────

export async function getAppConfig(): Promise<AppConfig> {
  return {
    activeSimulation: PREVIEW_ACTIVE_SIM,
    availableSimulations: [...PREVIEW_AVAILABLE_SIMS],
    consoleEnabled: false,
    dataVersion: 'preview-local-sg11-19',
    simVersions: {},
    partialSimulations: [],
  };
}

export async function getRemoteConfig(): Promise<{ consoleEnabled: boolean }> {
  return { consoleEnabled: false };
}

export async function applyConsoleProtection(): Promise<void> {
  // no-op en preview
}

export async function listAvailableSimulations(): Promise<string[]> {
  return [...PREVIEW_AVAILABLE_SIMS];
}

export async function getStudentSimulations(_studentId: string): Promise<string[]> {
  return [...PREVIEW_AVAILABLE_SIMS];
}

export async function prefetchStudentData(studentId: string, _options?: unknown): Promise<void> {
  await loadLocalSimBundle();
  if (studentId) await loadStudentById(studentId, PREVIEW_ACTIVE_SIM);
}

export async function warmupCoordinatorCache(): Promise<void> {
  await Promise.all([
    ...PREVIEW_AVAILABLE_SIMS.map((id) => loadLocalSimBundle(id)),
    loadCoordinatorSummary(),
  ]);
}

export async function getStudentResults(
  studentId: string,
  simId?: string,
  _force?: boolean,
): Promise<Estudiante | null> {
  const targetSim = resolveSimId(simId);
  const wantedId = (studentId || '').trim();
  let resolvedId =
    wantedId === '' || wantedId === 'demo' ? PREVIEW_STUDENT_ID : wantedId;

  let found = await loadStudentById(resolvedId, targetSim);
  if (!found && resolvedId !== PREVIEW_STUDENT_ID) {
    found = await loadStudentById(PREVIEW_STUDENT_ID, targetSim);
  }
  if (!found) return null;
  if (!isDemoInstitutionName(found.informacion_personal?.institucion)) return null;
  return maskEstudianteForDemo(found);
}

export async function getStudentResultsByName(name: string, simId?: string): Promise<Estudiante | null> {
  const bundle = await loadLocalSimBundle(resolveSimId(simId));
  const lower = name.toLowerCase();
  return (
    bundle.estudiantes.find((e) => {
      const fullName = `${e.informacion_personal.nombres} ${e.informacion_personal.apellidos}`.toLowerCase();
      return fullName.includes(lower);
    }) || null
  );
}

export async function enrichStudentWithDetailedAnswers(student: Estudiante, _simId?: string): Promise<Estudiante> {
  return student;
}

export async function getAllStudents(simId?: string): Promise<Estudiante[]> {
  const bundle = await loadLocalSimBundle(resolveSimId(simId));
  return maskEstudianteListForDemo(
    bundle.estudiantes.filter((e) =>
      isDemoInstitutionName(e.informacion_personal?.institucion),
    ),
  );
}

export async function getRanking(simId?: string): Promise<RankingEntry[]> {
  const bundle = await loadLocalSimBundle(resolveSimId(simId));
  const estudiantes = bundle.estudiantes.filter((e) =>
    isDemoInstitutionName(e.informacion_personal?.institucion),
  );
  const ordenados = [...estudiantes].sort((a, b) => (b.puntaje_global || 0) - (a.puntaje_global || 0));
  return ordenados.map((est, idx) => {
    const masked = maskEstudianteForDemo(est);
    const info = masked.informacion_personal;
    const realId = String(est.informacion_personal.numero_identificacion ?? '').trim();
    return {
    nombre: info.nombres,
    apellidos: info.apellidos,
    institucion: info.institucion,
    numero_identificacion: realId,
    puntaje_global: est.puntaje_global || 0,
    posicion: idx + 1,
    puntajes: Object.fromEntries(
      Object.entries(est.puntajes).map(([key, val]) => [
        key,
        {
          puntaje: val.puntaje,
          correctas: val.correctas,
          total_preguntas: val.total_preguntas,
        },
      ]),
    ),
  };
  });
}

export async function getStatistics(simId?: string): Promise<EstadisticasGrupo> {
  const bundle = await loadLocalSimBundle(resolveSimId(simId));
  return bundle.estadisticas;
}

export async function getInvalidaciones(_simId?: string): Promise<InvalidacionItem[]> {
  return [];
}

export async function getSimulationManifest(simId: string): Promise<SimulationManifest> {
  const bundle = await loadLocalSimBundle(resolveSimId(simId));
  return bundle.manifest;
}

export async function getSimulationEstadisticas(simId: string): Promise<SimulacionEstadisticas | null> {
  const bundle = await loadLocalSimBundle(resolveSimId(simId));
  return bundle.estadisticasMapped;
}

export async function getInstitutionQuestionStats(simId: string): Promise<InstitutionQuestionStats | null> {
  const bundle = await loadLocalSimBundle(resolveSimId(simId));
  return bundle.institutionQuestionStats;
}

export async function getCoordinatorSummary(): Promise<Record<string, any>> {
  const full = await loadCoordinatorSummary();
  return filterCoordinatorSummaryForDemo(full, PREVIEW_AVAILABLE_SIMS);
}

export async function getNationalRankings(): Promise<any[]> {
  return [];
}

export async function getStudentsByEmail(_email: string): Promise<StudentProfile[]> {
  const featured = await loadStudentById(PREVIEW_STUDENT_ID, PREVIEW_ACTIVE_SIM);
  if (!featured) return [];
  return [
    {
      id: featured.informacion_personal.numero_identificacion,
      email: featured.informacion_personal.correo_electronico || 'demo@seamosgenios.co',
      nombre: featured.informacion_personal.nombres,
      apellidos: featured.informacion_personal.apellidos,
      institucion: featured.informacion_personal.institucion,
      departamento: featured.informacion_personal.departamento,
      simulacros: [...PREVIEW_AVAILABLE_SIMS],
    },
  ];
}

export async function getStudentByEmail(email: string): Promise<StudentProfile | null> {
  const lista = await getStudentsByEmail(email);
  return lista[0] || null;
}

export interface StudentLookupResult {
  id: string;
  nombre: string;
  apellidos: string;
  simulacros: string[];
  institucion?: string;
}

export async function lookupStudentById(idNumber: string): Promise<StudentLookupResult | null> {
  const match = await loadStudentById(idNumber, PREVIEW_ACTIVE_SIM);
  if (!match) return null;
  return {
    id: match.informacion_personal.numero_identificacion,
    nombre: match.informacion_personal.nombres,
    apellidos: match.informacion_personal.apellidos,
    simulacros: [...PREVIEW_AVAILABLE_SIMS],
    institucion: match.informacion_personal.institucion,
  };
}

export interface IdBirthLoginResult {
  ok: boolean;
  studentId?: string;
  message?: string;
}

export async function loginStudentByIdAndBirthDate(): Promise<IdBirthLoginResult> {
  return { ok: false, message: 'Login deshabilitado en preview' };
}

export async function getCoordinatorByToken(_token: string): Promise<unknown | null> {
  return null;
}

// ─── Planner (stubs en memoria) ────────────────────────────────────────

const _plannerStore = new Map<string, PlannerCustomizationPayload>();

function _emptyMerged(): PlannerMergedProfile {
  return { global: null, simulation: null, merged: null, cloudUpdatedAt: 0 };
}

export async function getPlannerCustomization(
  studentId: string,
  simId: string,
): Promise<PlannerMergedProfile> {
  const cached = _plannerStore.get(`${studentId}_${simId}`);
  if (!cached) return _emptyMerged();
  return { global: cached, simulation: cached, merged: cached, cloudUpdatedAt: cached.updatedAt || 0 };
}

export function savePlannerCustomizationLocal(
  studentId: string,
  simId: string,
  payload: PlannerCustomizationPayload,
  _scope: 'global' | 'simulation' = 'global',
): PlannerMergedProfile {
  const stamped: PlannerCustomizationPayload = { ...payload, source: 'local', updatedAt: Date.now() };
  _plannerStore.set(`${studentId}_${simId}`, stamped);
  return { global: stamped, simulation: stamped, merged: stamped, cloudUpdatedAt: stamped.updatedAt || 0 };
}

export async function getPlannerUploadQuota(_studentId: string): Promise<PlannerQuotaState> {
  return {
    dateKey: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    uploadsUsed: 0,
    uploadsLimit: 3,
    remaining: 3,
  };
}

export async function uploadPlannerCustomization(
  studentId: string,
  simId: string,
  payload: PlannerCustomizationPayload,
  _scope: 'global' | 'simulation' = 'global',
): Promise<{ ok: boolean; quota: PlannerQuotaState; reason?: string }> {
  const stamped: PlannerCustomizationPayload = { ...payload, source: 'cloud', updatedAt: Date.now() };
  _plannerStore.set(`${studentId}_${simId}`, stamped);
  const quota = await getPlannerUploadQuota(studentId);
  return { ok: true, quota };
}

// ─── Cache stubs (la API real las expone, no romper imports) ───────────

export const CACHE_VERSION = 'preview_v1';

export function getCacheStatus(): {
  hits: number;
  misses: number;
  size: number;
} {
  return { hits: 0, misses: 0, size: 0 };
}

export function clearCache(): void {
  clearLocalSimCache();
}

export function hasRespuestasDetalladas(e: Estudiante | null | undefined): boolean {
  if (!e) return false;
  const rd = (e as Estudiante & { respuestas_detalladas?: Record<string, unknown> }).respuestas_detalladas;
  return Boolean(rd && Object.keys(rd).length > 0);
}

export function clearStudentSimulationCaches(_studentId: string, _simId: string): void {
  clearLocalSimCache();
}

export type PlannerSessionStateAlias = PlannerSessionState;

export { PREVIEW_STUDENT_ID, PREVIEW_ACTIVE_SIM };
