import { isDeployedClientBuild, isPanelsOnlyDeploy, isStagingFirebase } from '@/lib/deploy-env';

export type DemoDataSource = 'firebase' | 'local';

/** Fuente de datos para rutas /demo/* y /d/c/* (única regla canónica). */
export function resolveDemoDataSource(): DemoDataSource {
    const source = process.env.NEXT_PUBLIC_DEMO_DATA_SOURCE;
    if (source === 'firebase') return 'firebase';
    if (source === 'local') return 'local';
    // Staging y hosting prod (panels-only) leen Firestore; JSON local no va al hosting.
    if (isStagingFirebase || (isPanelsOnlyDeploy && isDeployedClientBuild)) return 'firebase';
    return 'local';
}

export function useDemoFirebaseData(): boolean {
    return resolveDemoDataSource() === 'firebase';
}

/** Showcase embebido en landing: nunca debe consumir reads Firestore. */
export function isLandingShowcaseContext(): boolean {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    return (
      path === '/' ||
      path === '/landing' ||
      path.startsWith('/landing/') ||
      path === '/landing-profesional' ||
      path.startsWith('/landing-profesional/')
    );
}

/** Demo interactivo (/demo/*, /d/c/*) puede usar Firebase; landing showcase no. */
export function shouldDemoRouteUseFirebase(): boolean {
    if (isLandingShowcaseContext()) return false;
    return useDemoFirebaseData();
}
