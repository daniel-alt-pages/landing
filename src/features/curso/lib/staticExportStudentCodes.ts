export const STATIC_EXPORT_PLACEHOLDER_STUDENT_CODE = 'sg_demo';

/** Opt-in local QA: pre-render every roster code (never default in staging/prod deploy). */
function shouldExportFullStudentRoster(): boolean {
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT_FULL_STUDENTS === 'true') return true;
  if (process.env.NODE_ENV === 'production') return false;
  if (process.env.NEXT_PUBLIC_PANELS_ONLY === 'true') return false;
  return true;
}

/**
 * Static export: staging/prod publish one technical shell (`sg_demo`); runtime uses
 * Google Auth + Firestore. Full roster only in dev or explicit opt-in flag.
 */
export function studentCodesForStaticExport(fullCodes: () => string[]): string[] {
  if (shouldExportFullStudentRoster()) {
    return fullCodes();
  }
  return [STATIC_EXPORT_PLACEHOLDER_STUDENT_CODE];
}
