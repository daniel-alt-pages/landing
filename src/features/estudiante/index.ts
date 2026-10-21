// Estudiante feature — panel alumno + componentes reutilizables
export { useEstudianteSession } from './hooks/useEstudianteSession';
export {
  EstudiantePanelCacheProvider,
  useEstudiantePanelCache,
} from './context/EstudiantePanelCacheProvider';
export { default as EstudianteLoadingState } from './components/EstudianteLoadingState';
export {
  resolveEstudianteDataModule,
  DEFAULT_ESTUDIANTE_DATA_OPTIONS,
  SHOWCASE_ESTUDIANTE_DATA_OPTIONS,
} from './hooks/estudianteDataOptions';
