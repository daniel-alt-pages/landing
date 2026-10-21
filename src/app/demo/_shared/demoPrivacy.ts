import type { Estudiante } from '@shared/types';
import { isDemoCoordinadorRoute, isDemoEstudianteRoute } from '@/app/demo/_shared/demoRoutePaths';

/** Institución del demo local (fixtures sintéticos EduGenios). */
export const DEMO_INSTITUTION = 'IE Demo EduGenios';

/** Coordinador demo local: solo simulacro piloto. */
export const DEMO_IETAC_SIMS = ['EDU-PILOT-01'] as const;

/** Estudiante demo local — fixture `public/data/simulations/EDU-PILOT-01`. */
export const DEMO_STUDENT_ID = '1000000001';
export const DEMO_STUDENT_FULL_NAME = 'Ana Demo';

/** Sims con JSON local para el estudiante demo. */
export const DEMO_STUDENT_SIMS = ['EDU-PILOT-01'] as const;

export const DEMO_STUDENT_DEFAULT_SIM = 'EDU-PILOT-01';

export const DEMO_MASK = '***';

export type DemoPersonalSlice = {
  nombres?: string;
  apellidos?: string;
  numero_identificacion?: string;
  institucion?: string;
  email?: string;
  municipio?: string;
};

export function isDemoInstitutionName(name: string | undefined | null): boolean {
  const n = String(name ?? '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return (
    n.includes('IETAC') ||
    n.includes('DEMO EDUGENIOS') ||
    n.includes('IE DEMO') ||
    n.includes('EDUGENIOS')
  );
}

export function shouldMaskDemoPii(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return (
    isDemoEstudianteRoute(path) ||
    isDemoCoordinadorRoute(path) ||
    path.startsWith('/acceso-demo/coordinador') ||
    sessionStorage.getItem('demo_mode') === '1'
  );
}

export function maskPersonalForDemo<T extends DemoPersonalSlice>(info: T): T {
  return {
    ...info,
    nombres: DEMO_MASK,
    apellidos: DEMO_MASK,
    numero_identificacion: DEMO_MASK,
    email: info.email ? DEMO_MASK : info.email,
    institucion: DEMO_INSTITUTION,
  };
}

export function maskEstudianteForDemo(estudiante: Estudiante): Estudiante {
  if (!estudiante?.informacion_personal) return estudiante;
  return {
    ...estudiante,
    informacion_personal: maskPersonalForDemo(estudiante.informacion_personal),
  };
}

export function maskEstudianteListForDemo(
  students: Estudiante[],
  options?: { force?: boolean },
): Estudiante[] {
  const mask = options?.force ?? shouldMaskDemoPii();
  if (!mask) return students;
  return students
    .filter((s) => isDemoInstitutionName(s.informacion_personal?.institucion))
    .map(maskEstudianteForDemo);
}

export function filterCoordinatorSummaryForDemo(
  summary: Record<string, unknown>,
  allowedSimIds: readonly string[],
): Record<string, unknown> {
  const allowSims = new Set(allowedSimIds);
  const out: Record<string, unknown> = {};
  for (const [simId, raw] of Object.entries(summary)) {
    if (!allowSims.has(simId)) continue;
    const data = raw as { institutions?: Record<string, unknown> };
    const institutions = data.institutions ?? {};
    const ietacOnly = Object.fromEntries(
      Object.entries(institutions).filter(([name]) => isDemoInstitutionName(name)),
    );
    out[simId] = { ...data, institutions: ietacOnly };
  }
  return out;
}

export function displayDocumentId(
  documentId: string | undefined | null,
  mask = shouldMaskDemoPii(),
): string {
  if (mask) return DEMO_MASK;
  const v = String(documentId ?? '').trim();
  return v || '—';
}

export function displayStudentName(
  nombres: string | undefined,
  apellidos: string | undefined,
  mask = shouldMaskDemoPii(),
): string {
  if (mask) return `${DEMO_MASK} ${DEMO_MASK}`;
  const full = `${nombres ?? ''} ${apellidos ?? ''}`.trim();
  return full || '—';
}
