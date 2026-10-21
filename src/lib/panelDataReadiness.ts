import { isDeployedClientBuild, PROD_FIREBASE_HOSTS } from '@/lib/deploy-env';
import { PRISMIC_APP_ICON } from '@/lib/prismicAssets';

/** @deprecated Usar PRISMIC_APP_ICON */
export const SG_APP_ICON_URL = PRISMIC_APP_ICON;

export type PublicationStatusPayload = {
  status?: string;
  visible?: boolean;
  expectedStudents?: number;
  uploadedStudents?: number;
  completedStudents?: number;
  answerDetailsUploaded?: number;
  failedStudents?: number;
  panelsAvailableAt?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  message?: string;
};

export type PanelReadinessState = {
  simId: string;
  ready: boolean;
  status: PublicationStatusPayload | null;
};

export const PROFILE_RESULTS_COUNTDOWN_HOURS = 16;
const PROFILE_RELEASE_STORAGE_KEY = 'sg_profile_results_release_at';

export function isProdClientHost(): boolean {
  if (!isDeployedClientBuild) return false;
  if (typeof window === 'undefined') return false;
  return PROD_FIREBASE_HOSTS.includes(
    window.location.hostname as (typeof PROD_FIREBASE_HOSTS)[number],
  );
}

export function shouldShowProfileResultsCountdown(): boolean {
  return isProdClientHost() && shouldEnforcePanelDataGate();
}

export function resolveProfileReleaseDate(status: PublicationStatusPayload | null): Date | null {
  const fromRemote = parseReleaseDate(status);
  if (fromRemote) return fromRemote;

  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(PROFILE_RELEASE_STORAGE_KEY);
  if (stored) {
    const parsed = new Date(stored);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const hours =
    Number(process.env.NEXT_PUBLIC_PROFILE_RESULTS_HOURS) || PROFILE_RESULTS_COUNTDOWN_HOURS;
  const target = new Date(Date.now() + hours * 60 * 60 * 1000);
  localStorage.setItem(PROFILE_RELEASE_STORAGE_KEY, target.toISOString());
  return target;
}

export function parseReleaseDate(status: PublicationStatusPayload | null): Date | null {
  const raw = status?.panelsAvailableAt?.trim();
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const envRaw = process.env.NEXT_PUBLIC_PANEL_RELEASE_AT?.trim();
  if (envRaw) {
    const parsed = new Date(envRaw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

/** Paneles abiertos solo tras publicación explícita (hasta nuevo aviso del equipo). */
export function arePanelsPublishedForUsers(status: PublicationStatusPayload | null): boolean {
  if (!status) return false;
  return status.visible === true || status.status === 'published';
}

/** @deprecated Usar arePanelsPublishedForUsers */
export function isPanelDataReady(status: PublicationStatusPayload | null): boolean {
  return arePanelsPublishedForUsers(status);
}

export function shouldEnforcePanelDataGate(): boolean {
  if (!isDeployedClientBuild) return false;
  const flag = process.env.NEXT_PUBLIC_PANEL_DATA_GATE?.trim().toLowerCase();
  return flag === 'true' || flag === '1' || flag === 'on';
}

/**
 * Bloqueo de paneles solo por variable de build (sin consultas a Firestore).
 * Se desactiva con NEXT_PUBLIC_PANEL_DATA_GATE=false + nuevo deploy.
 */
export function getStaticPanelLockState(skip = false): PanelReadinessState {
  if (skip || !shouldEnforcePanelDataGate() || !isProdClientHost()) {
    return { simId: '', ready: true, status: null };
  }

  const simId = process.env.NEXT_PUBLIC_ACTIVE_SIMULATION?.trim() || 'SG11-26';
  return {
    simId,
    ready: false,
    status: {
      status: 'uploading',
      visible: false,
      panelsAvailableAt: process.env.NEXT_PUBLIC_PANEL_RELEASE_AT?.trim() || null,
    },
  };
}

export function arePanelsLockedForUsers(skip = false): boolean {
  return !getStaticPanelLockState(skip).ready;
}

/** Ruta única de espera mientras los paneles no están publicados. */
export const PANEL_UPLOAD_ROUTE = '/subiendo-resultados';

const PANEL_RETURN_PATH_KEY = 'sg_panel_return_path';

export function isPanelUploadRoute(pathname: string): boolean {
  return pathname === PANEL_UPLOAD_ROUTE || pathname.startsWith(`${PANEL_UPLOAD_ROUTE}/`);
}

/** Rutas de panel real (estudiante/coordinador), excluye demo y la pantalla de espera. */
export function isProtectedPanelRoute(pathname: string): boolean {
  if (isPanelUploadRoute(pathname)) return false;
  if (pathname.startsWith('/demo') || pathname.startsWith('/d/')) return false;
  return pathname.startsWith('/estudiante') || pathname.startsWith('/coordinador');
}

export function savePanelReturnPath(path: string): void {
  if (typeof window === 'undefined') return;
  if (!path || isPanelUploadRoute(path)) return;
  sessionStorage.setItem(PANEL_RETURN_PATH_KEY, path);
}

export function consumePanelReturnPath(): string {
  if (typeof window === 'undefined') return '/login';
  const stored = sessionStorage.getItem(PANEL_RETURN_PATH_KEY);
  sessionStorage.removeItem(PANEL_RETURN_PATH_KEY);
  if (stored && !isPanelUploadRoute(stored)) return stored;
  return '/login';
}

export function uploadProgressPercent(status: PublicationStatusPayload | null): number {
  if (!status) return 0;
  const expected = Number(status.expectedStudents) || 0;
  const uploaded = Number(status.uploadedStudents ?? status.completedStudents) || 0;
  if (expected <= 0) return 0;
  return Math.min(100, Math.round((uploaded / expected) * 100));
}
