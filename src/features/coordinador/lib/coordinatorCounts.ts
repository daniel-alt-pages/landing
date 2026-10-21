import type { Estudiante } from '@shared/types';

/** Estudiantes con puntaje global > 0 (ranking, Excel, resumen ejecutivo). */
export function countEvaluadosInstitucion(students: Estudiante[]): number {
    return students.filter(s => (Number(s.puntaje_global) || 0) > 0).length;
}
