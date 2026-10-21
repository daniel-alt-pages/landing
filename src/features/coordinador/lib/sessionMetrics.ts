import type { Estudiante } from '@shared/types';
import {
    classifyAnswer,
    getSessionCoverageStatus,
    type AnswerLike,
    type SessionCoverageStatus,
} from '@shared/lib/answerClassification';
import { computeSessionStats, type SessionRow } from '@features/coordinador/lib/coordinatorExcelAnalytics';

export interface SessionImpactMetrics {
    totalStudents: number;
    completeSessions: number;
    onlyS1: number;
    onlyS2: number;
    incomplete: number;
    partialCount: number;
    partialRate: number;
    sessionMissingAnswerCount: number;
    blankAnswerCount: number;
    coverageRate: number;
    rows: SessionRow[];
    byStatus: Record<SessionCoverageStatus, number>;
}

function flattenStudentAnswers(student: Estudiante): AnswerLike[] {
    const out: AnswerLike[] = [];
    const det = student.respuestas_detalladas;
    if (!det) return out;
    Object.values(det).forEach(resps => {
        if (Array.isArray(resps)) {
            out.push(...(resps as AnswerLike[]));
            return;
        }
        if (resps && typeof resps === 'object') {
            out.push(...Object.values(resps as Record<string, AnswerLike>));
        }
    });
    return out;
}

export function computeSessionImpactMetrics(students: Estudiante[]): SessionImpactMetrics {
    const stats = computeSessionStats(students);
    const totalStudents = students.length || 1;
    const partialCount = stats.soloS1 + stats.soloS2 + stats.incompletos;

    let sessionMissingAnswerCount = 0;
    let blankAnswerCount = 0;
    const byStatus: Record<SessionCoverageStatus, number> = {
        completo: stats.ambas,
        solo_s1: stats.soloS1,
        solo_s2: stats.soloS2,
        incompleto: stats.incompletos,
    };

    students.forEach(student => {
        flattenStudentAnswers(student).forEach(answer => {
            const status = classifyAnswer(answer);
            if (status === 'sesion_no_presentada') sessionMissingAnswerCount += 1;
            if (status === 'sin_respuesta') blankAnswerCount += 1;
        });
    });

    return {
        totalStudents: students.length,
        completeSessions: stats.ambas,
        onlyS1: stats.soloS1,
        onlyS2: stats.soloS2,
        incomplete: stats.incompletos,
        partialCount,
        partialRate: students.length > 0 ? partialCount / students.length : 0,
        sessionMissingAnswerCount,
        blankAnswerCount,
        coverageRate: students.length > 0 ? stats.ambas / students.length : 0,
        rows: stats.rows,
        byStatus,
    };
}

export interface NaImpactRow {
    id: string;
    nombre: string;
    institucion: string;
    estado: SessionCoverageStatus;
    sesionFaltante: string;
    global: number;
    naCount: number;
}

export function buildNaImpactRows(students: Estudiante[]): NaImpactRow[] {
    const rows: NaImpactRow[] = [];
    students.forEach(student => {
        const status = getSessionCoverageStatus(student);
        if (status === 'completo') return;
        const answers = flattenStudentAnswers(student);
        const naCount = answers.filter(a => classifyAnswer(a) === 'sesion_no_presentada').length;
        const sesionFaltante =
            status === 'solo_s1' ? 'S2' : status === 'solo_s2' ? 'S1' : 'S1 y S2';
        rows.push({
            id: student.informacion_personal?.numero_identificacion || '',
            nombre: `${student.informacion_personal?.nombres || ''} ${student.informacion_personal?.apellidos || ''}`.trim(),
            institucion: student.informacion_personal?.institucion || '',
            estado: status,
            sesionFaltante,
            global: Number(student.puntaje_global) || 0,
            naCount,
        });
    });
    return rows.sort((a, b) => b.naCount - a.naCount || a.global - b.global);
}
