import { describe, expect, it, vi, afterEach } from 'vitest';

describe('studentCodesForStaticExport', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns only sg_demo on deployed production build', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { studentCodesForStaticExport, STATIC_EXPORT_PLACEHOLDER_STUDENT_CODE } =
      await import('./staticExportStudentCodes');
    expect(
      studentCodesForStaticExport(() => ['sg_aaa', 'sg_bbb']),
    ).toEqual([STATIC_EXPORT_PLACEHOLDER_STUDENT_CODE]);
  });

  it('returns only sg_demo when NEXT_PUBLIC_PANELS_ONLY is true', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_PANELS_ONLY', 'true');
    const { studentCodesForStaticExport, STATIC_EXPORT_PLACEHOLDER_STUDENT_CODE } =
      await import('./staticExportStudentCodes');
    expect(
      studentCodesForStaticExport(() => ['sg_aaa', 'sg_bbb']),
    ).toEqual([STATIC_EXPORT_PLACEHOLDER_STUDENT_CODE]);
  });

  it('returns full roster list in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_PANELS_ONLY', '');
    vi.stubEnv('NEXT_PUBLIC_STATIC_EXPORT_FULL_STUDENTS', '');
    const { studentCodesForStaticExport } = await import('./staticExportStudentCodes');
    expect(studentCodesForStaticExport(() => ['sg_aaa', 'sg_bbb'])).toEqual(['sg_aaa', 'sg_bbb']);
  });

  it('returns full roster when NEXT_PUBLIC_STATIC_EXPORT_FULL_STUDENTS is true', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_PANELS_ONLY', 'true');
    vi.stubEnv('NEXT_PUBLIC_STATIC_EXPORT_FULL_STUDENTS', 'true');
    const { studentCodesForStaticExport } = await import('./staticExportStudentCodes');
    expect(studentCodesForStaticExport(() => ['sg_aaa', 'sg_bbb'])).toEqual(['sg_aaa', 'sg_bbb']);
  });
});
