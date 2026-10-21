import type * as FirestoreService from '@features/simulacro/lib/firestoreService';
import {
  PREVIEW_ACTIVE_SIM,
  PREVIEW_AVAILABLE_SIMS,
} from '@/app/landing-profesional/preview-paneles/_data/seeds/constants';
import { DEMO_INSTITUTION } from '@/app/demo/_shared/demoPrivacy';
import { useDemoFirebaseData } from '@/lib/demoDataSource';

export type CoordinadorFirestoreModule = typeof FirestoreService;

export const COORD_STORAGE_KEYS = {
  institution: 'coordinator_institution',
  selectedInstitution: 'coordinator_selected_institution',
  selectedSimulation: 'coordinator_selected_simulation',
} as const;

export type CoordinadorStorageKeys = {
  institution: string;
  selectedInstitution: string;
  selectedSimulation: string;
};

/** Subconjunto usado por el hook (mock y prod comparten la misma forma). */
export type CoordinadorDataModule = {
  listAvailableSimulations: CoordinadorFirestoreModule['listAvailableSimulations'];
  getAppConfig: CoordinadorFirestoreModule['getAppConfig'];
  getCoordinatorSummary: CoordinadorFirestoreModule['getCoordinatorSummary'];
  getAllStudents: CoordinadorFirestoreModule['getAllStudents'];
  getRanking: CoordinadorFirestoreModule['getRanking'];
  getSimulationEstadisticas: CoordinadorFirestoreModule['getSimulationEstadisticas'];
  getInstitutionQuestionStats: CoordinadorFirestoreModule['getInstitutionQuestionStats'];
  enrichStudentWithDetailedAnswers: CoordinadorFirestoreModule['enrichStudentWithDetailedAnswers'];
  CACHE_VERSION: string;
};

export type CoordinadorDataOptions = {
  storageKeys?: CoordinadorStorageKeys;
  loadDataModule?: () => Promise<CoordinadorDataModule>;
  /** Si no hay institución en storage, se persiste este valor al montar. */
  bootstrapInstitution?: string;
  /** Demo: lista todos los sims del config, sin filtrar por institución base. */
  allSimulationsUnfiltered?: boolean;
  /** Demo/showcase: acota selector y summary a estos simulacros. */
  allowedSimulationIds?: readonly string[];
};

export const DEFAULT_COORDINADOR_DATA_OPTIONS: Required<
  Pick<CoordinadorDataOptions, 'storageKeys' | 'loadDataModule'>
> &
  CoordinadorDataOptions = {
  storageKeys: COORD_STORAGE_KEYS,
  loadDataModule: () => import('@features/simulacro/lib/firestoreService'),
};

export const DEMO_COORDINADOR_DATA_OPTIONS: CoordinadorDataOptions = {
  storageKeys: {
    institution: 'demo_coordinator_institution',
    selectedInstitution: 'demo_coordinator_selected_institution',
    selectedSimulation: 'demo_coordinator_selected_simulation',
  },
  loadDataModule: async () =>
    (
      useDemoFirebaseData()
        ? await import('@features/simulacro/lib/firestoreService')
        : await import('@/app/landing-profesional/preview-paneles/_data/firestoreMock')
    ) as CoordinadorDataModule,
  /** Demo: solo IETAC (institución única del showcase). */
  bootstrapInstitution: DEMO_INSTITUTION,
  allSimulationsUnfiltered: false,
  allowedSimulationIds: PREVIEW_AVAILABLE_SIMS,
};
