/** Sincroniza nav móvil (tab Clases) con el simulacro activo del estudiante. */
export const STUDENT_SIMULATION_EVENT = 'sg-student-simulation';

export function broadcastStudentSimulation(simulationId: string): void {
  if (typeof window === 'undefined' || !simulationId) return;
  window.dispatchEvent(
    new CustomEvent(STUDENT_SIMULATION_EVENT, {
      detail: { simulationId },
    }),
  );
}

export function readStudentSelectedSimulacro(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('simulacro_selected') || '';
}
