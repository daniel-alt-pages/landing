import type { CourseMaterialOpenNotice } from '../types/courseTypes';

/** Cierre SG11-20 (fallback si el JSON aún no trae closesAt). */
export const SG11_20_FORM_CLOSES_AT = '2026-06-21T23:59:59-05:00';

export function simulacroFormSessionCount(notice: CourseMaterialOpenNotice): number {
  return notice.links?.filter((link) => link.url.trim()).length ?? 0;
}

export function resolveSimulacroClosesAt(notice: CourseMaterialOpenNotice): Date | null {
  const raw = notice.closesAt?.trim() || SG11_20_FORM_CLOSES_AT;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function simulacroClosureExpired(closesAt: Date, now = Date.now()): boolean {
  return closesAt.getTime() <= now;
}
