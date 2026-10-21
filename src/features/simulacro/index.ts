// Simulacro feature barrel export
export * from './lib/firestoreService';
export { getCurrentSimulation, loadStudents, getStudentById, loadStatistics, detectStudentSimulations } from './lib/simulationLoader';
export type { SimulationManifest, SimulationStudentsFile, CurrentSimulation } from './types/simulation';
