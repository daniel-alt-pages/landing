/**
 * Demo coordinador: misma lógica que producción (`useCoordinadorData`) con datos locales
 * vía `firestoreMock`. El estado vive en `CoordinadorDataProvider` (shell), no por pestaña.
 */
'use client';

export { DEMO_COORDINADOR_DATA_OPTIONS } from '@features/coordinador/hooks/coordinadorDataOptions';
export { useCoordinadorDataFromContext as useCoordinadorData } from '@features/coordinador/context/CoordinadorDataProvider';
export type {
  CoordinadorData,
  InstitutionMetrics,
  SubjectStat,
  QuestionStat,
  AlertaEstudiante,
} from '@features/coordinador/hooks/useCoordinadorData';
