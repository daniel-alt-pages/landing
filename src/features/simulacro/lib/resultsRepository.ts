/**
 * ResultsRepository — seam local para datos de simulacro/reportes.
 * Adapters: JSON estático (fixtures) + API EduGenios local.
 * No hay adapter Firebase.
 */

import type { Estudiante } from '@/shared/types';

const EDU_API =
  process.env.NEXT_PUBLIC_EDUGENIOS_API_URL || 'http://127.0.0.1:5000';

export type ResultSummary = {
  attemptId: string;
  studentId: string;
  examId: string;
  correct: number;
  total: number;
  rawPercentage: number;
  scaledScore: { value: number; min: number; max: number };
  scoresByArea?: Record<string, { correct: number; total: number; puntaje: number }>;
  area?: string | null;
  areas?: string[];
  scoringPolicyVersion?: string;
  status?: string;
  producedAt?: string;
  projectionVersion?: string;
};

export interface ResultsRepository {
  listSummaries(opts?: { uid?: string; examId?: string; limit?: number }): Promise<ResultSummary[]>;
  getSummary(attemptId: string): Promise<ResultSummary | null>;
  getDetail(attemptId: string): Promise<unknown | null>;
  getV2Projection(attemptId: string): Promise<Estudiante | null>;
  ranking(examId: string): Promise<Array<Record<string, unknown>>>;
  listV2Estudiantes(examId: string, uid?: string): Promise<Estudiante[]>;
  health(): Promise<{ ok: boolean; mode: string; firebase: boolean }>;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${EDU_API}${path}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`[ResultsRepository] ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const eduGeniosApiRepository: ResultsRepository = {
  async listSummaries(opts = {}) {
    const qs = new URLSearchParams();
    if (opts.uid) qs.set('uid', opts.uid);
    if (opts.examId) qs.set('examId', opts.examId);
    if (opts.limit) qs.set('limit', String(opts.limit));
    const data = await apiGet<{ items: ResultSummary[] }>(
      `/api/reportes/intentos?${qs.toString()}`
    );
    return data.items || [];
  },

  async getSummary(attemptId) {
    try {
      const data = await apiGet<{ summary: ResultSummary }>(
        `/api/reportes/intentos/${encodeURIComponent(attemptId)}`
      );
      return data.summary;
    } catch {
      return null;
    }
  },

  async getDetail(attemptId) {
    try {
      const data = await apiGet<{ detail: unknown }>(
        `/api/reportes/intentos/${encodeURIComponent(attemptId)}?detail=true`
      );
      return data.detail ?? null;
    } catch {
      return null;
    }
  },

  async getV2Projection(attemptId) {
    try {
      const data = await apiGet<{ v2: Estudiante }>(
        `/api/reportes/intentos/${encodeURIComponent(attemptId)}?detail=true`
      );
      return data.v2 ?? null;
    } catch {
      return null;
    }
  },

  async ranking(examId) {
    const data = await apiGet<{ items: Array<Record<string, unknown>> }>(
      `/api/reportes/examenes/${encodeURIComponent(examId)}/ranking`
    );
    return data.items || [];
  },

  async listV2Estudiantes(examId, uid) {
    const qs = uid ? `?uid=${encodeURIComponent(uid)}` : '';
    const data = await apiGet<{ estudiantes: Estudiante[] }>(
      `/api/reportes/examenes/${encodeURIComponent(examId)}/proyeccion-v2${qs}`
    );
    return data.estudiantes || [];
  },

  async health() {
    return apiGet(`/api/reportes/health`);
  },
};

/** Adapter JSON estático (fixtures en /public/data). */
export const localJsonRepository: ResultsRepository = {
  async listSummaries() {
    return [];
  },
  async getSummary() {
    return null;
  },
  async getDetail() {
    return null;
  },
  async getV2Projection() {
    return null;
  },
  async ranking() {
    return [];
  },
  async listV2Estudiantes(examId) {
    try {
      const res = await fetch(`/data/simulations/${examId}/students.json`, {
        cache: 'no-store',
      });
      if (!res.ok) return [];
      const data = (await res.json()) as { estudiantes?: Estudiante[] };
      return data.estudiantes || [];
    } catch {
      return [];
    }
  },
  async health() {
    return { ok: true, mode: 'local-json', firebase: false };
  },
};

let activeRepo: ResultsRepository = eduGeniosApiRepository;

export function getResultsRepository(): ResultsRepository {
  return activeRepo;
}

export function setResultsRepository(repo: ResultsRepository) {
  activeRepo = repo;
}

/**
 * Combina API EduGenios + fallback fixtures JSON.
 */
export const hybridLocalRepository: ResultsRepository = {
  async listSummaries(opts) {
    try {
      return await eduGeniosApiRepository.listSummaries(opts);
    } catch {
      return localJsonRepository.listSummaries(opts);
    }
  },
  async getSummary(id) {
    return (
      (await eduGeniosApiRepository.getSummary(id)) ||
      (await localJsonRepository.getSummary(id))
    );
  },
  async getDetail(id) {
    return (
      (await eduGeniosApiRepository.getDetail(id)) ||
      (await localJsonRepository.getDetail(id))
    );
  },
  async getV2Projection(id) {
    return (
      (await eduGeniosApiRepository.getV2Projection(id)) ||
      (await localJsonRepository.getV2Projection(id))
    );
  },
  async ranking(examId) {
    try {
      return await eduGeniosApiRepository.ranking(examId);
    } catch {
      return localJsonRepository.ranking(examId);
    }
  },
  async listV2Estudiantes(examId, uid) {
    try {
      const fromApi = await eduGeniosApiRepository.listV2Estudiantes(examId, uid);
      if (fromApi.length) return fromApi;
    } catch {
      /* fallback */
    }
    return localJsonRepository.listV2Estudiantes(examId, uid);
  },
  async health() {
    try {
      return await eduGeniosApiRepository.health();
    } catch {
      return localJsonRepository.health();
    }
  },
};

setResultsRepository(hybridLocalRepository);
