import type * as FirestoreService from '@features/simulacro/lib/firestoreService';
import { isDemoEstudianteRoute } from '@/app/demo/_shared/demoRoutePaths';
import { useDemoFirebaseData, isLandingShowcaseContext } from '@/lib/demoDataSource';
import {
  PREVIEW_ACTIVE_SIM,
  PREVIEW_AVAILABLE_SIMS,
} from '@/app/landing-profesional/preview-paneles/_data/seeds/constants';

export type EstudianteFirestoreModule = typeof FirestoreService;

export type EstudianteDataModule = Pick<
  EstudianteFirestoreModule,
  | 'getStudentResults'
  | 'getStudentSimulations'
  | 'getRanking'
  | 'getStatistics'
  | 'getAppConfig'
  | 'hasRespuestasDetalladas'
  | 'enrichStudentWithDetailedAnswers'
  | 'clearStudentSimulationCaches'
  | 'getInvalidaciones'
  | 'getPlannerCustomization'
  | 'savePlannerCustomizationLocal'
  | 'getPlannerUploadQuota'
  | 'uploadPlannerCustomization'
  | 'getAllStudents'
  | 'prefetchStudentData'
>;

export type EstudianteDataOptions = {
  loadDataModule?: () => Promise<EstudianteDataModule>;
  embedDemo?: boolean;
  allowedSimulationIds?: readonly string[];
};

export const DEFAULT_ESTUDIANTE_DATA_OPTIONS: EstudianteDataOptions = {
  loadDataModule: () => import('@features/simulacro/lib/firestoreService'),
};

export const SHOWCASE_ESTUDIANTE_DATA_OPTIONS: EstudianteDataOptions = {
  loadDataModule: async () =>
    (
      useDemoFirebaseData() && !isLandingShowcaseContext()
        ? await import('@features/simulacro/lib/firestoreService')
        : await import('@/app/landing-profesional/preview-paneles/_data/firestoreMock')
    ) as unknown as EstudianteDataModule,
  embedDemo: true,
  allowedSimulationIds: PREVIEW_AVAILABLE_SIMS,
};

export const PREVIEW_SEEDS = {
  activeSim: PREVIEW_ACTIVE_SIM,
  availableSims: PREVIEW_AVAILABLE_SIMS,
};

export async function resolveEstudianteDataModule(
  options: EstudianteDataOptions = DEFAULT_ESTUDIANTE_DATA_OPTIONS,
): Promise<EstudianteDataModule> {
  if (typeof window !== 'undefined') {
    if (isLandingShowcaseContext()) {
      return (await import(
        '@/app/landing-profesional/preview-paneles/_data/firestoreMock'
      )) as unknown as EstudianteDataModule;
    }
    if (isDemoEstudianteRoute(window.location.pathname) && !useDemoFirebaseData()) {
      return (await import(
        '@/app/landing-profesional/preview-paneles/_data/firestoreMock'
      )) as unknown as EstudianteDataModule;
    }
  }
  const loader = options.loadDataModule ?? DEFAULT_ESTUDIANTE_DATA_OPTIONS.loadDataModule!;
  return loader();
}
