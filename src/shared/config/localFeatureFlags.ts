/**
 * Flags del fork experimental. Pantallas no cableadas no inventan datos.
 */
export const LOCAL_FEATURE_FLAGS = {
  localOnly: true,
  firebase: false,
  /** Núcleo de reportes */
  studentReports: true,
  coordinatorReports: true,
  adminPanel: true,
  /** Fuera del núcleo piloto (UI puede existir; datos no remotos) */
  cursoVacacional: false,
  landingComercial: false,
  recordingsRemote: false,
  pagos: false,
  googleAuthRemote: false,
  singleAreaScaleMax: 100,
  scoringPolicyVersion: 'raw-percent-v1',
} as const;

export type LocalFeatureFlag = keyof typeof LOCAL_FEATURE_FLAGS;

export function isFeatureEnabled(flag: LocalFeatureFlag): boolean {
  return Boolean(LOCAL_FEATURE_FLAGS[flag]);
}
