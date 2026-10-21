// Coordinador feature — API pública del panel
export { CoordinadorDataProvider, useCoordinadorDataFromContext } from './context/CoordinadorDataProvider';
export { useCoordinadorData } from './hooks/useCoordinadorData';
export { useCoordinadorFilters } from './hooks/useCoordinadorFilters';
export { default as CoordinadorEmbedShell } from './shell/CoordinadorEmbedShell';
export type {
  CoordinadorData,
  InstitutionMetrics,
  SubjectStat,
  QuestionStat,
  AlertaEstudiante,
} from './hooks/coordinadorTypes';

export { CoordinadorDashboardView } from './pages/dashboard/CoordinadorDashboardView';
export { CoordinadorAnalisisView } from './pages/analisis/CoordinadorAnalisisView';
export { CoordinadorEstudiantesView } from './pages/estudiantes/CoordinadorEstudiantesView';
export { CoordinadorRespuestasView } from './pages/respuestas/CoordinadorRespuestasView';
export { CoordinadorComparativaView } from './pages/comparativa/CoordinadorComparativaView';
export { CoordinadorHistoricoView } from './pages/historico/CoordinadorHistoricoView';
export { CoordinadorDesempenoView } from './pages/desempeno/CoordinadorDesempenoView';
export { PensumView } from './pages/pensum/PensumPage';

export { default as CoordinadorContextHeader } from './components/CoordinadorContextHeader';
