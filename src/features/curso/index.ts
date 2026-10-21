export { default as CursoPageView } from './pages/CursoPageView';
export { SeguimientoPanel } from './pages/seguimiento';
export { useCourseEntitlements } from './hooks/useCourseEntitlements';
export { useCourseWorkspace } from './hooks/useCourseWorkspace';
export { useCourseMetrics } from './hooks/useCourseMetrics';
export { useStudentCursoNavVisible } from './hooks/useStudentCursoNavVisible';
export {
  resolveStudentEntitlements,
  setCourseOnlySession,
  readCourseOnlyFlag,
} from './lib/courseEntitlements';
export type {
  CourseDoc,
  CourseAccessDoc,
  CourseStudentMetrics,
  ParentAccessDoc,
  CourseEntitlementsResult,
  StudentPanelMode,
} from './types/courseTypes';
