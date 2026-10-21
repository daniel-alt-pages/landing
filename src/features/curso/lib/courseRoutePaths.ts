import type { CourseSectionTab } from '../types/courseTypes';
import { buildPublicStudentCode } from './courseAccessKeys';
import { buildIdentityFromSession } from './courseEntitlements';

export const COURSE_BASE_PATH = '/estudiante/curso';
export const COURSE_STUDENT_PATH_PREFIX = '/estudiante';
export const COURSE_STUDENT_PATH_MARKER = '/curso';

/** Segmentos estáticos bajo `/estudiante/curso/*` (sin `resumen`). */
export const COURSE_SECTION_PATHS: Exclude<CourseSectionTab, 'resumen'>[] = [
  'herramientas',
  'grabaciones',
  'materiales',
  'clases',
  'seguimiento',
];

const ALL_TABS = new Set<CourseSectionTab>(['resumen', ...COURSE_SECTION_PATHS]);

export function isCourseSectionTab(value: string): value is CourseSectionTab {
  return ALL_TABS.has(value as CourseSectionTab);
}

export function courseBasePathForStudentCode(studentCode?: string | null): string {
  const code = String(studentCode || '').trim();
  return code
    ? `${COURSE_STUDENT_PATH_PREFIX}/${encodeURIComponent(code)}/curso`
    : COURSE_BASE_PATH;
}

/** URL Mi Curso del perfil activo (student_id / documento en sesión). */
export function coursePathForSession(): string {
  if (typeof window === 'undefined') return COURSE_BASE_PATH;
  const code = buildPublicStudentCode(buildIdentityFromSession());
  return courseBasePathForStudentCode(code || undefined);
}

export function extractCourseStudentCodeFromPath(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'estudiante') return null;
  if (parts[1] === 'curso') return null;
  if (parts[1] && parts[2] === 'curso') return decodeURIComponent(parts[1]);
  return null;
}

function coursePathRest(pathname: string): string {
  if (pathname.startsWith(COURSE_BASE_PATH)) {
    return pathname.slice(COURSE_BASE_PATH.length).replace(/^\//, '');
  }
  const code = extractCourseStudentCodeFromPath(pathname);
  if (!code) return '';
  const base = courseBasePathForStudentCode(code);
  return pathname.slice(base.length).replace(/^\//, '');
}

export function isCoursePath(pathname: string): boolean {
  if (pathname.startsWith(COURSE_BASE_PATH)) return true;
  return Boolean(extractCourseStudentCodeFromPath(pathname));
}

export function parseCourseSectionFromPath(pathname: string): CourseSectionTab {
  if (!isCoursePath(pathname)) return 'resumen';
  const rest = coursePathRest(pathname);
  if (!rest) return 'resumen';
  const segment = rest.split('/')[0];
  if (segment === 'herramientas') return 'resumen';
  if (isCourseSectionTab(segment) && segment !== 'resumen') return segment;
  return 'resumen';
}

export function courseSectionPath(
  tab: CourseSectionTab,
  recordingId?: string | null,
  studentCode?: string | null,
): string {
  const courseBasePath = courseBasePathForStudentCode(studentCode);
  const base =
    tab === 'resumen' ? courseBasePath : `${courseBasePath}/${tab}`;
  if (tab === 'grabaciones' && recordingId) {
    return `${base}?recording=${encodeURIComponent(recordingId)}`;
  }
  return base;
}
