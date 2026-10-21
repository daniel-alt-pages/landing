import type { CoordTab } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-coordinador/tour/tour-config';
import {
  studentNavIdFromTab,
  studentTabFromNavId,
} from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/student-embed-navigation';
import type { ShowcaseDashboardTab } from '@/app/landing-profesional/contenido-landing/carrusel-metodo-cientifico/demo-panel-estudiante/types/showcase.types';

export const DEMO_ESTUDIANTE_BASE = '/demo/estudiante';
export const DEMO_COORDINADOR_LEGACY_BASE = '/demo/coordinador';
export const DEMO_COORDINADOR_BASE = '/d/c';

/** Slugs opacos para tabs demo coordinador (evita `/d/c/estudiantes` legible). */
export const DEMO_COORD_TAB_SLUGS: Record<Exclude<CoordTab, 'resumen'>, string> = {
  pensum: '7fpk2m',
  desempeno: '4dnq8x',
  estudiantes: '9esx3v',
  respuestas: '5rsp7k',
  analisis: '6alv1k',
  comparativa: '2cjr5w',
  historico: '8hwt0n',
};

const DEMO_COORD_SLUG_TO_TAB = Object.fromEntries(
  Object.entries(DEMO_COORD_TAB_SLUGS).map(([tab, slug]) => [slug, tab]),
) as Record<string, CoordTab>;

const LEGACY_COORD_TAB_NAMES = new Set<CoordTab>([
  'pensum',
  'desempeno',
  'estudiantes',
  'respuestas',
  'analisis',
  'comparativa',
  'historico',
]);

const STUDENT_NAV_IDS = new Set(['dashboard', 'estadisticas', 'analisis', 'ranking', 'perfil']);

/** Tabs bloqueados en `/demo/estudiante` (privacidad / alcance demo). */
export const DEMO_ESTUDIANTE_BLOCKED_NAV_IDS = ['ranking', 'perfil'] as const;

/** Segmentos estáticos permitidos bajo `/demo/estudiante/*`. */
export const DEMO_ESTUDIANTE_ALLOWED_TABS = ['estadisticas', 'analisis'] as const;

export function isDemoEstudianteNavBlocked(navId: string): boolean {
  return (DEMO_ESTUDIANTE_BLOCKED_NAV_IDS as readonly string[]).includes(navId);
}

export function isDemoEstudianteNavAllowed(navId: string): boolean {
  return !isDemoEstudianteNavBlocked(navId);
}

export function isDemoEstudianteRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === DEMO_ESTUDIANTE_BASE || pathname.startsWith(`${DEMO_ESTUDIANTE_BASE}/`);
}

export function isDemoCoordinadorRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === DEMO_COORDINADOR_BASE ||
    pathname.startsWith(`${DEMO_COORDINADOR_BASE}/`) ||
    pathname === DEMO_COORDINADOR_LEGACY_BASE ||
    pathname.startsWith(`${DEMO_COORDINADOR_LEGACY_BASE}/`)
  );
}

export function demoEstudiantePath(navId?: string): string {
  const id = navId ?? 'dashboard';
  if (id === 'dashboard' || isDemoEstudianteNavBlocked(id)) return DEMO_ESTUDIANTE_BASE;
  return `${DEMO_ESTUDIANTE_BASE}/${id}`;
}

export function demoCoordinadorPath(tab?: CoordTab): string {
  const t = tab ?? 'resumen';
  if (t === 'resumen') return DEMO_COORDINADOR_BASE;
  const slug = DEMO_COORD_TAB_SLUGS[t as Exclude<CoordTab, 'resumen'>];
  return `${DEMO_COORDINADOR_BASE}/${slug}`;
}

/** Rutas legibles antiguas (`/d/c/estudiantes`) → redirigir al slug opaco. */
export function demoCoordinadorLegacyReadableTab(pathname: string): CoordTab | null {
  const base = pathname.startsWith(DEMO_COORDINADOR_LEGACY_BASE)
    ? DEMO_COORDINADOR_LEGACY_BASE
    : DEMO_COORDINADOR_BASE;
  const prefix = `${base}/`;
  if (!pathname.startsWith(prefix)) return null;
  const segment = pathname.slice(prefix.length).split('/')[0]?.trim();
  if (!segment || !LEGACY_COORD_TAB_NAMES.has(segment as CoordTab)) return null;
  if (DEMO_COORD_SLUG_TO_TAB[segment]) return null;
  return segment as CoordTab;
}

export function parseDemoEstudianteNavId(pathname: string): string {
  const prefix = `${DEMO_ESTUDIANTE_BASE}/`;
  if (!pathname.startsWith(prefix)) return 'dashboard';
  const segment = pathname.slice(prefix.length).split('/')[0]?.trim();
  if (!segment || !STUDENT_NAV_IDS.has(segment)) return 'dashboard';
  return segment;
}

export function parseDemoCoordinadorTab(pathname: string): CoordTab {
  const base = pathname.startsWith(DEMO_COORDINADOR_LEGACY_BASE)
    ? DEMO_COORDINADOR_LEGACY_BASE
    : DEMO_COORDINADOR_BASE;
  const prefix = `${base}/`;
  if (!pathname.startsWith(prefix)) return 'resumen';
  const segment = pathname.slice(prefix.length).split('/')[0]?.trim();
  if (!segment) return 'resumen';
  if (DEMO_COORD_SLUG_TO_TAB[segment]) return DEMO_COORD_SLUG_TO_TAB[segment];
  if (LEGACY_COORD_TAB_NAMES.has(segment as CoordTab)) return segment as CoordTab;
  return 'resumen';
}

export function showcaseTabFromDemoNavId(navId: string): ShowcaseDashboardTab {
  return studentTabFromNavId(navId);
}

export function demoNavIdFromShowcaseTab(tab: ShowcaseDashboardTab): string {
  return studentNavIdFromTab(tab);
}
