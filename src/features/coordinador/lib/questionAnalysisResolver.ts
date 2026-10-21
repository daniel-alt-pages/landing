/**
 * Garantiza questionAnalysis completo (claves + distribución de opciones)
 * usando estadísticas agregadas y/o respuestas hidratadas por estudiante.
 */
import type { Estudiante } from '@shared/types';
import type { QuestionStat } from '@features/coordinador/hooks/coordinadorTypes';
import type { SimulacionEstadisticas } from '@features/simulacro/lib/firestoreService';
import {
    distribucionToCounts,
    hasDetailedAnswers,
    normalizeCountsRecord,
} from '@features/coordinador/lib/coordinadorDataHelpers';
import { normalizeAnswerOption } from '@features/coordinador/lib/answerOptions';
import { classifyAnswer, type AnswerLike } from '@shared/lib/answerClassification';
import { hasHighNoAnswerRate, noAnswerCount } from '@features/coordinador/lib/answerOptions';

function enrichQuestionStatRow(stat: QuestionStat): QuestionStat {
    const sessionMissingCount = noAnswerCount(stat.counts);
    const blankCount = stat.blankCount ?? 0;
    const sessionMissingRate = stat.total > 0 ? sessionMissingCount / stat.total : 0;
    return {
        ...stat,
        sessionMissingCount,
        blankCount,
        sessionMissingRate,
        highSessionMissing: hasHighNoAnswerRate(stat.counts, stat.total, 0.2),
    };
}

function hasOptionCounts(q: QuestionStat): boolean {
    return Object.values(q.counts || {}).some(v => (Number(v) || 0) > 0);
}

export function buildQuestionAnalysisFromAggregate(
    aggregateStats: SimulacionEstadisticas
): Record<string, QuestionStat[]> {
    const questionAnalysis: Record<string, QuestionStat[]> = {};
    Object.entries(aggregateStats.materias).forEach(([materia, preguntas]) => {
        const stats = Object.values(preguntas)
            .map(p => {
                const failed =
                    p.total_respuestas > 0
                        ? Math.round(p.total_respuestas * (1 - p.porcentaje_acierto / 100))
                        : p.total_respuestas - p.aciertos;
                const counts = p.distribucion_counts
                    ? normalizeCountsRecord(p.distribucion_counts)
                    : distribucionToCounts(
                          p.distribucion as Record<string, unknown> | undefined,
                          p.total_respuestas
                      );
                return {
                    num: p.numero,
                    failed,
                    total: p.total_respuestas,
                    rate: p.total_respuestas > 0 ? failed / p.total_respuestas : 0,
                    correct: p.respuesta_correcta,
                    counts,
                    studentMap: {} as Record<string, string[]>,
                } satisfies QuestionStat;
            })
            .filter(q => !String(q.correct || '').toUpperCase().includes('ANULADA'))
            .sort((a, b) => b.rate - a.rate);
        if (stats.length > 0) questionAnalysis[materia] = stats.map(enrichQuestionStatRow);
    });
    return questionAnalysis;
}

export function buildQuestionAnalysisFromStudents(
    students: Estudiante[]
): Record<string, QuestionStat[]> {
    const questionAnalysis: Record<string, QuestionStat[]> = {};
    const qRaw: Record<
        string,
            Record<
            number,
            {
                failed: number;
                total: number;
                correct: string;
                counts: Record<string, number>;
                studentMap: Record<string, string[]>;
                blankCount?: number;
            }
        >
    > = {};

    students.forEach(est => {
        if (!est.respuestas_detalladas) return;
        Object.entries(est.respuestas_detalladas).forEach(([materia, resps]) => {
            if (!qRaw[materia]) qRaw[materia] = {};

            let items: AnswerLike[] = [];
            if (Array.isArray(resps)) {
                items = (resps as unknown as Record<string, unknown>[]).map(r => ({
                    numero: Number(r.numero) || 0,
                    respuesta_estudiante: String(r.respuesta_estudiante || r.respuesta || ''),
                    respuesta_correcta: String(r.respuesta_correcta || r.correcta || '?'),
                    es_correcta: r.es_correcta as boolean | null | undefined,
                    sin_respuesta: r.sin_respuesta as boolean | undefined,
                    sesion_no_presentada: r.sesion_no_presentada as boolean | undefined,
                    invalidada: r.invalidada as boolean | undefined,
                }));
            } else if (resps && typeof resps === 'object') {
                items = Object.entries(resps as Record<string, Record<string, unknown>>).map(
                    ([qNum, r]) => ({
                        numero: parseInt(qNum, 10) || Number(r.numero) || 0,
                        respuesta_estudiante: String(r.respuesta_estudiante || r.respuesta || ''),
                        respuesta_correcta: String(r.respuesta_correcta || r.correcta || '?'),
                        es_correcta: r.es_correcta as boolean | null | undefined,
                        sin_respuesta: r.sin_respuesta as boolean | undefined,
                        sesion_no_presentada: r.sesion_no_presentada as boolean | undefined,
                        invalidada: r.invalidada as boolean | undefined,
                    })
                );
            }

            const nombre =
                `${est.informacion_personal?.nombres || ''} ${est.informacion_personal?.apellidos || ''}`.trim();
            items.forEach(r => {
                const num = r.numero;
                if (!num || num <= 0) return;
                if (!qRaw[materia][num]) {
                    qRaw[materia][num] = {
                        failed: 0,
                        total: 0,
                        correct: r.respuesta_correcta || '?',
                        counts: {},
                        studentMap: {},
                        blankCount: 0,
                    };
                }
                const q = qRaw[materia][num];
                q.total++;
                const status = classifyAnswer(r);
                if (status === 'incorrecta' || status === 'sin_respuesta' || status === 'sesion_no_presentada') {
                    q.failed++;
                }
                if (status === 'sin_respuesta') q.blankCount = (q.blankCount || 0) + 1;
                const opt = normalizeAnswerOption(r.respuesta_estudiante || '');
                q.counts[opt] = (q.counts[opt] || 0) + 1;
                if (!q.studentMap[opt]) q.studentMap[opt] = [];
                q.studentMap[opt].push(nombre);
            });
        });
    });

    Object.entries(qRaw).forEach(([materia, questions]) => {
        questionAnalysis[materia] = Object.entries(questions)
            .map(([num, stat]) =>
                enrichQuestionStatRow({
                    num: parseInt(num, 10),
                    ...stat,
                    rate: stat.total > 0 ? stat.failed / stat.total : 0,
                })
            )
            .filter(q => !String(q.correct || '').toUpperCase().includes('ANULADA'))
            .sort((a, b) => b.rate - a.rate);
    });

    return questionAnalysis;
}

function aggregateLookup(
    aggregateStats: SimulacionEstadisticas | null,
    materia: string,
    num: number
): Pick<QuestionStat, 'correct' | 'counts' | 'total' | 'failed' | 'rate'> | null {
    if (!aggregateStats) return null;
    const preguntas = aggregateStats.materias[materia];
    if (!preguntas) return null;
    const hit = Object.values(preguntas).find(p => p.numero === num);
    if (!hit) return null;
    const counts = hit.distribucion_counts
        ? normalizeCountsRecord(hit.distribucion_counts)
        : distribucionToCounts(hit.distribucion as Record<string, unknown> | undefined, hit.total_respuestas);
    const failed =
        hit.total_respuestas > 0
            ? Math.round(hit.total_respuestas * (1 - hit.porcentaje_acierto / 100))
            : hit.total_respuestas - hit.aciertos;
    return {
        correct: hit.respuesta_correcta,
        counts,
        total: hit.total_respuestas,
        failed,
        rate: hit.total_respuestas > 0 ? failed / hit.total_respuestas : 0,
    };
}

/** Completa claves y conteos faltantes desde estadísticas agregadas (claves del simulacro). */
export function enrichQuestionAnalysisFromAggregate(
    questionAnalysis: Record<string, QuestionStat[]>,
    aggregateStats: SimulacionEstadisticas | null
): Record<string, QuestionStat[]> {
    if (!aggregateStats) return questionAnalysis;

    const out: Record<string, QuestionStat[]> = {};
    const materias = new Set([
        ...Object.keys(questionAnalysis),
        ...Object.keys(aggregateStats.materias),
    ]);

    materias.forEach(materia => {
        const existing = questionAnalysis[materia] || [];
        const byNum = new Map(existing.map(q => [q.num, q]));
        const preguntas = aggregateStats.materias[materia] || {};

        Object.values(preguntas).forEach(p => {
            const prev = byNum.get(p.numero);
            const agg = aggregateLookup(aggregateStats, materia, p.numero);
            if (!agg) return;

            const merged: QuestionStat = prev
                ? {
                      ...prev,
                      correct:
                          prev.correct && prev.correct !== '?'
                              ? prev.correct
                              : agg.correct,
                      counts: hasOptionCounts(prev) ? prev.counts : agg.counts,
                      total: prev.total > 0 ? prev.total : agg.total,
                      failed: prev.failed > 0 ? prev.failed : agg.failed,
                      rate:
                          prev.total > 0
                              ? prev.rate
                              : agg.rate,
                  }
                : {
                      num: p.numero,
                      correct: agg.correct,
                      counts: agg.counts,
                      total: agg.total,
                      failed: agg.failed,
                      rate: agg.rate,
                      studentMap: {},
                  };
            byNum.set(p.numero, enrichQuestionStatRow(merged));
        });

        const rows = [...byNum.values()]
            .filter(q => !String(q.correct || '').toUpperCase().includes('ANULADA'))
            .sort((a, b) => b.rate - a.rate);
        if (rows.length > 0) out[materia] = rows;
    });

    return Object.keys(out).length > 0 ? out : questionAnalysis;
}

export function resolveQuestionAnalysisForExport(args: {
    questionAnalysis: Record<string, QuestionStat[]>;
    aggregateStats: SimulacionEstadisticas | null;
    students: Estudiante[];
    institutionScoped?: boolean;
}): Record<string, QuestionStat[]> {
    const { questionAnalysis, aggregateStats, students, institutionScoped = true } = args;
    const studentsHaveAnswers = students.some(s => hasDetailedAnswers(s));

    let resolved = questionAnalysis;
    if (institutionScoped && studentsHaveAnswers) {
        const fromStudents = buildQuestionAnalysisFromStudents(students);
        if (Object.keys(fromStudents).length > 0) resolved = fromStudents;
    }

    resolved = enrichQuestionAnalysisFromAggregate(resolved, aggregateStats);

    if (!Object.keys(resolved).length && aggregateStats) {
        resolved = buildQuestionAnalysisFromAggregate(aggregateStats);
    }

    return resolved;
}

async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<R>
): Promise<R[]> {
    const out: R[] = new Array(items.length);
    let idx = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (idx < items.length) {
            const i = idx++;
            out[i] = await fn(items[i]);
        }
    });
    await Promise.all(workers);
    return out;
}

/** Hidrata respuestas_detalladas (claves + opciones) desde estudiantes/{id}.json o Firestore. */
export async function hydrateStudentsForQuestionAnalysis(
    students: Estudiante[],
    simulationId: string
): Promise<Estudiante[]> {
    if (!students.length || !simulationId) return students;
    const { enrichStudentWithDetailedAnswers } = await import(
        '@features/simulacro/lib/firestoreService'
    );
    return mapWithConcurrency(students, 8, async student =>
        hasDetailedAnswers(student)
            ? student
            : enrichStudentWithDetailedAnswers(student, simulationId)
    );
}
