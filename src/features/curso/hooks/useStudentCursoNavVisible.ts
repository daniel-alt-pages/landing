'use client';

import type { CourseIdentity } from '../types/courseTypes';
import { useCourseEntitlementsOptional } from '../context/CourseEntitlementsProvider';
import {
  hasStoredSimulacroSession,
  isCourseOnlyShell,
  isCourseEntryVisible,
} from '../lib/courseEntitlements';

/**
 * Tab «Mi Curso» — lee entitlements del shell (sin re-fetch al cambiar de ruta).
 *
 * Usa la variante opcional del contexto para no romper cuando el hook se
 * renderiza fuera del `CourseEntitlementsProvider` (p. ej. el panel estudiante
 * embebido en el showcase de la landing profesional, que no monta el provider
 * para no arrastrar auth/Firestore). En ese caso `showCursoNav` es `false`.
 */
export function useStudentCursoNavVisible(identityOverrides?: Partial<CourseIdentity>) {
  const ctx = useCourseEntitlementsOptional();
  const entitlements = ctx?.entitlements ?? null;
  const loading = ctx?.loading ?? false;
  const hasSimulacros = hasStoredSimulacroSession();
  const courseOnlyShell = isCourseOnlyShell();
  const showCursoNav = isCourseEntryVisible(loading, entitlements);

  return {
    showCursoNav,
    courseOnlyShell,
    hasSimulacros,
    mode: entitlements?.mode ?? (courseOnlyShell ? 'course_only' : 'results_only'),
  };
}
