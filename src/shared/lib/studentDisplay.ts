import type { Estudiante } from '@shared/types';

type StudentLike = Pick<Estudiante, 'informacion_personal'> | Estudiante;

export function studentFullName(
    student: StudentLike,
    opts?: { uppercase?: boolean; firstOnly?: boolean },
): string {
    const ip = student.informacion_personal;
    if (!ip) return '';

    if (opts?.firstOnly) {
        const first = (ip.nombres || '').split(/\s+/).filter(Boolean)[0] || '';
        const last = (ip.apellidos || '').split(/\s+/).filter(Boolean)[0] || '';
        const name = `${first} ${last}`.trim();
        return opts.uppercase ? name.toUpperCase() : name;
    }

    const name = `${ip.nombres || ''} ${ip.apellidos || ''}`.trim();
    return opts?.uppercase ? name.toUpperCase() : name;
}

export function studentDocumentId(student: StudentLike): string {
    return String(student.informacion_personal?.numero_identificacion ?? '').trim();
}

export function studentDepartamento(student: StudentLike): string {
    const ip = student.informacion_personal as
        | (StudentLike['informacion_personal'] & { departamento?: string })
        | undefined;
    return String(ip?.departamento ?? ip?.municipio ?? '').trim();
}

export function studentInstitucion(student: StudentLike): string {
    return String(student.informacion_personal?.institucion ?? '').trim();
}

/** Lowercase haystack for client-side search filters. */
export function studentSearchHaystack(student: StudentLike): string {
    return [
        studentFullName(student),
        studentDocumentId(student),
        studentDepartamento(student),
        studentInstitucion(student),
    ]
        .join(' ')
        .toLowerCase();
}

export function matchesStudentSearch(
    student: StudentLike,
    query: string,
    opts?: { includeDocumentId?: boolean },
): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const haystack =
        opts?.includeDocumentId === false
            ? [studentFullName(student), studentDepartamento(student), studentInstitucion(student)]
                  .join(' ')
                  .toLowerCase()
            : studentSearchHaystack(student);
    return haystack.includes(q);
}

export function getStudentSubjectScore(student: Estudiante, materia: string): number {
    const p = student.puntajes?.[materia];
    if (!p) return 0;
    return typeof p === 'object' ? (p as { puntaje?: number }).puntaje || 0 : Number(p) || 0;
}

export type StudentPerformanceLevel = {
    label: string;
    color: string;
    key: 'superior' | 'alto' | 'medio' | 'bajo';
};

/** Bandas ICFES usadas en tablas coordinador (371 / 301 / 201). */
export function getStudentPerformanceLevel(global: number): StudentPerformanceLevel {
    if (global >= 371) return { label: 'Superior', color: '#34d399', key: 'superior' };
    if (global >= 301) return { label: 'Alto', color: '#60a5fa', key: 'alto' };
    if (global >= 201) return { label: 'Medio', color: '#fbbf24', key: 'medio' };
    return { label: 'Bajo', color: '#ef4444', key: 'bajo' };
}

export const STUDENT_LEVEL_FILTERS = [
    { value: 'all', label: 'Todos', color: '#8b5cf6' },
    { value: 'superior', label: 'Superior', color: '#34d399' },
    { value: 'alto', label: 'Alto', color: '#60a5fa' },
    { value: 'medio', label: 'Medio', color: '#fbbf24' },
    { value: 'bajo', label: 'Bajo', color: '#ef4444' },
] as const;

export function normalizeSimulationId(simId: string): string {
    return String(simId || '').trim().toUpperCase();
}

export function formatSimulationLabel(simId: string): string {
    const id = normalizeSimulationId(simId);
    if (!id) return 'simulacro activo';
    if (id.startsWith('SG11-')) return `Simulacro ${id.slice(5)}`;
    return id;
}

type StudentSimTagged = Estudiante & {
    _sourceSimulation?: string;
    simulacro?: string;
    sim_id?: string;
};

export function getStudentSourceSimulation(student: Estudiante): string | undefined {
    const tagged = student as StudentSimTagged;
    return tagged._sourceSimulation || tagged.simulacro || tagged.sim_id;
}

export function tagStudentForSimulation(student: Estudiante, simId: string): Estudiante {
    if (!simId) return student;
    return { ...student, _sourceSimulation: normalizeSimulationId(simId) } as Estudiante;
}

/** Solo estudiantes con puntaje en el simulacro indicado (sin mezclar otros). */
export function studentParticipatedInSimulation(student: Estudiante, simId: string): boolean {
    if ((student.puntaje_global || 0) <= 0) return false;
    const expected = normalizeSimulationId(simId);
    if (!expected) return true;
    const source = getStudentSourceSimulation(student);
    if (source && normalizeSimulationId(source) !== expected) return false;
    return true;
}

export function filterStudentsForSimulation(students: Estudiante[], simId: string): Estudiante[] {
    if (!simId) return students.filter((s) => (s.puntaje_global || 0) > 0);
    return students.filter((s) => studentParticipatedInSimulation(s, simId));
}
