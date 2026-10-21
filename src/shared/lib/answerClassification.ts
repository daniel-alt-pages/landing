import type { Estudiante } from '@shared/types';
import { isNoAnswerOption } from '@features/coordinador/lib/answerOptions';

export interface AnswerLike {
    numero?: number;
    respuesta_estudiante?: string;
    respuesta_correcta?: string;
    es_correcta?: boolean | null;
    sin_respuesta?: boolean;
    sesion_no_presentada?: boolean;
    invalidada?: boolean;
}

export type AnswerClassificationStatus =
    | 'correcta'
    | 'incorrecta'
    | 'sin_respuesta'
    | 'sesion_no_presentada'
    | 'invalidada'
    | 'desconocida';

export function classifyAnswer(r: AnswerLike): AnswerClassificationStatus {
    if (r.invalidada) return 'invalidada';
    if (r.sesion_no_presentada) return 'sesion_no_presentada';
    if (r.sin_respuesta) return 'sin_respuesta';
    const resp = String(r.respuesta_estudiante ?? '').trim();
    if (!resp || isNoAnswerOption(resp)) return 'sin_respuesta';
    if (r.es_correcta === true) return 'correcta';
    if (r.es_correcta === false) return 'incorrecta';
    return 'desconocida';
}

export type SessionCoverageStatus = 'completo' | 'solo_s1' | 'solo_s2' | 'incompleto';

export function getSessionCoverageStatus(student: Estudiante): SessionCoverageStatus {
    const ses =
        (student as Estudiante & { secciones_completadas?: string[] }).secciones_completadas ||
        (student as Estudiante & { sesiones?: string[] }).sesiones ||
        [];
    const norm = ses.map(x => String(x).toUpperCase());
    const hasS1 = norm.some(x => x === 'S1' || x.includes('1'));
    const hasS2 = norm.some(x => x === 'S2' || x.includes('2'));
    if (hasS1 && hasS2) return 'completo';
    if (hasS1) return 'solo_s1';
    if (hasS2) return 'solo_s2';
    if ((student as Estudiante & { sesion_parcial?: boolean }).sesion_parcial) return 'solo_s1';
    return 'incompleto';
}
