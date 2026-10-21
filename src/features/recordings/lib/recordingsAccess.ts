import { isDemoCoordinadorRoute, isDemoEstudianteRoute } from '@/app/demo/_shared/demoRoutePaths';
import { isLandingShowcaseContext } from '@/lib/demoDataSource';
import type { SimRecordingsCatalog } from '@features/recordings/lib/recordingsTypes';

/** Grabaciones = beneficio de matrícula de pago; no demo ni showcase público. */
export function isPaidRecordingsContext(pathname?: string | null): boolean {
  if (typeof window !== 'undefined' && isLandingShowcaseContext()) return false;
  const path = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '');
  if (isDemoEstudianteRoute(path)) return false;
  if (isDemoCoordinadorRoute(path)) return false;
  return true;
}

/** Panel de clases grabadas — nav principal oculto; solo barra por área. */
export function isRecordingsClasesRoute(pathname?: string | null): boolean {
  const path = (pathname ?? (typeof window !== 'undefined' ? window.location.pathname : ''))
    .replace(/\/+$/, '');
  return path.endsWith('/clases') || path.includes('/clases/');
}

/**
 * Acceso a catálogo sim. Si `allowedDocumentIds` está vacío/ausente → abierto.
 * Coordinador siempre pasa. Estudiante sin documento en lista → no.
 */
export function canAccessSimRecordingsCatalog(
  catalog: SimRecordingsCatalog | null | undefined,
  opts: {
    documentId?: string | null;
    audience?: 'estudiante' | 'coordinador';
  } = {},
): boolean {
  if (!catalog?.recordings?.length) return false;
  if (opts.audience === 'coordinador') return true;
  const allow = catalog.allowedDocumentIds;
  if (!allow?.length) return true;
  const norm = String(opts.documentId ?? '').trim();
  if (!norm) return false;
  return allow.some((id) => String(id).trim() === norm);
}

/** ponytail: smoke — allowlist + coordinador bypass. */
export function selfCheckSimRecordingsAccess(): void {
  const base = {
    simulationId: 'SG11-TEST',
    recordings: [
      {
        id: 'r1',
        title: 't',
        area: 'matemáticas',
        session: 1 as const,
        driveFileId: 'x',
      },
    ],
  };
  const open = canAccessSimRecordingsCatalog(base, { documentId: '1', audience: 'estudiante' });
  const locked = canAccessSimRecordingsCatalog(
    { ...base, allowedDocumentIds: ['1069486724'] },
    { documentId: '999', audience: 'estudiante' },
  );
  const ok = canAccessSimRecordingsCatalog(
    { ...base, allowedDocumentIds: ['1069486724'] },
    { documentId: '1069486724', audience: 'estudiante' },
  );
  const coord = canAccessSimRecordingsCatalog(
    { ...base, allowedDocumentIds: ['1069486724'] },
    { documentId: '999', audience: 'coordinador' },
  );
  if (!open || locked || !ok || !coord) {
    throw new Error('selfCheckSimRecordingsAccess failed');
  }
}
