/**
 * Flags de build (NEXT_PUBLIC_* se inlined en compile time).
 * `build:panels` activa PANELS_ONLY + ADMIN_LOCAL_ONLY.
 */

/** Firebase producción — ReportesSG (simulacros-sg). */
export const PROD_FIREBASE_PROJECT_ID = 'simulacros-sg';
export const PROD_APP_URL =
    process.env.NEXT_PUBLIC_APP_URL || 'https://simulacros-sg.web.app';
export const PROD_FIREBASE_HOSTS = [
    'simulacros-sg.web.app',
    'simulacros-sg.firebaseapp.com',
] as const;

export const isPanelsOnlyDeploy =
    process.env.NEXT_PUBLIC_PANELS_ONLY === 'true';

/** Panel admin (/admin, /admin-panel) excluido del bundle y hosting de producción. */
export const isAdminLocalOnly =
    process.env.NEXT_PUBLIC_ADMIN_LOCAL_ONLY === 'true';

/** Firebase de pruebas (Fase 3 reglas). */
export const isStagingFirebase =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'pruebas-sg-aa586' ||
    process.env.NEXT_PUBLIC_FIREBASE_ENV === 'staging';

/** Hosting staging/prod (`next build`). `next dev` local queda excluido. */
export const isDeployedClientBuild = process.env.NODE_ENV === 'production';

/** Demo estudiante (`/demo/estudiante/*`): habilitada en fork local experimental. */
export const isStudentDemoEnabled = true;

/** Login desactivado de momento: no bloquear demo. */
export const isStudentDemoBlockedInProd = false;
