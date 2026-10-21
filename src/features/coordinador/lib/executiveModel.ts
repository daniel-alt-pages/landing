/**
 * Modelo ejecutivo derivado del panel coordinador.
 *
 * Convierte las métricas del hook `useCoordinadorData` en una vista
 * accionable: qué áreas priorizar, qué temas reforzar, qué decir al directivo.
 *
 * Funciones puras, sin React. Reusado por Resumen UI y export Excel.
 */

import type {
    InstitutionMetrics,
    SubjectStat,
    AlertaEstudiante,
    QuestionStat,
} from '@features/coordinador/hooks/useCoordinadorData';
import { NATIONAL_STATS } from '@features/benchmark/lib/nationalData';
import {
    macroGuia,
    normalizarMateriaAModeloArea,
    complementoPlanInstitucional,
    type IndicadoresPsicometricosCiclo,
} from '@features/coordinador/lib/macroReferencias';
import { countEvaluadosInstitucion } from '@features/coordinador/lib/coordinatorCounts';
import { questionLabel } from '@/lib/questionLabel';
import {
    buildInstitutionalCompetenciasDiagnostico,
    hasUsefulQuestionMetadata,
    resolvePlanFallbackSource,
    summarizeDiagnosticoForPlan,
    type AreaDiagnostico,
    type PlanFallbackSource,
} from '@features/coordinador/lib/referencePerformanceDependencies';
import {
    COORDINADOR_ICFES_COMPETENCIAS_MARCO_ENABLED,
    simulationHasPerQuestionTopics,
} from '@features/coordinador/lib/simulationEligibility';
import {
    referenceModeLabel,
    resolveCoordinatorPedagogicalSource,
} from '@features/coordinador/lib/coordinatorExcelPolicy';

export type { PlanFallbackSource };

export { countEvaluadosInstitucion };

export type Severity = 'critico' | 'alto' | 'moderado' | 'monitoreo' | 'ok';

/** Prioridad relativa del tema (pregunta con alto error) dentro del informe. */
export type TopicImportance = 'critico' | 'alto' | 'moderado';

/** Etiquetas UI para categorías de temas (preguntas críticas). */
export const TOPIC_IMPORTANCE_META: Record<
    TopicImportance,
    { label: string; short: string; color: string; bg: string; ring: string }
> = {
    critico: {
        label: 'Prioridad máxima',
        short: 'Crítico',
        color: '#fb7185',
        bg: 'rgba(244, 63, 94, 0.12)',
        ring: 'rgba(244, 63, 94, 0.35)',
    },
    alto: {
        label: 'Alta prioridad',
        short: 'Alto',
        color: '#fb923c',
        bg: 'rgba(251, 146, 60, 0.12)',
        ring: 'rgba(251, 146, 60, 0.35)',
    },
    moderado: {
        label: 'Prioridad media',
        short: 'Moderado',
        color: '#fbbf24',
        bg: 'rgba(251, 191, 36, 0.12)',
        ring: 'rgba(251, 191, 36, 0.35)',
    },
};

/** Etiqueta corta de severidad por área (compartido UI / resumen). */
export const AREA_SEVERITY_UI: Record<Severity, { label: string; color: string }> = {
    critico: { label: 'Intervención inmediata', color: '#fb7185' },
    alto: { label: 'Prioridad alta', color: '#fb923c' },
    moderado: { label: 'Refuerzo focalizado', color: '#fbbf24' },
    monitoreo: { label: 'Monitoreo', color: '#60a5fa' },
    ok: { label: 'Sostenimiento', color: '#34d399' },
};

export interface AreaInsight {
    name: string;
    key: string;
    avg: number;
    nationalAvg: number;
    delta: number;
    severity: Severity;
    headline: string;
    recomendacion: string;
    /** Si la institución está por debajo del nacional: 1 = área más urgente de todas las débiles. */
    institutionalPriority?: number;
    /** Si está en o por encima del nacional: 1 = mayor fortaleza relativa. */
    leverageRank?: number;
    /** Ningún área alcanza el nacional → se muestran las más altas dentro de la institución. */
    relativaIntra?: boolean;
    /** Orden dentro de las fortalezas intra-institucionales (1 = mejor promedio local). */
    intraRank?: number;
}

export interface CriticalQuestion {
    materia: string;
    num: number;
    failRate: number;
    failedCount: number;
    total: number;
    importance: TopicImportance;
    /** 1 = tema más prioritario de la lista mostrada (ordenado por severidad). */
    priorityOrder: number;
    rationale: string;
}

/** Paso del plan institucional: base numérica + alineación a marcos ICFES + ítems críticos. */
export interface PlanEstudioPaso {
    orden: number;
    areaNombre: string;
    areaKey: string;
    severidad: Severity;
    institucionalPriority?: number;
    /** Línea breve compatible con listas/export (legado). */
    resumen: string;
    documentoMacro: string | null;
    competenciasMacro: string[];
    practicasAulaMacro: string[];
    evidenciasSeguimiento: string[];
    microAcciones: string[];
    vinculosPreguntasCriticas: Pick<
        CriticalQuestion,
        'materia' | 'num' | 'failRate' | 'importance' | 'priorityOrder'
    >[];
    /** Origen del plan para esta área: ítems, niveles ICFES o ambos. */
    fallbackSource: PlanFallbackSource;
    /** Diagnóstico marco + niveles (cuando aplica). */
    competencyDependencies?: AreaDiagnostico;
    nivelIcfes?: string;
    competenciasDominadas: string[];
    competenciasPorReforzar: string[];
    habilidadesAlcanzadas: string[];
    habilidadesPorReforzar: string[];
    /** Guía operativa y métricas (solo datos locales del repo). */
    guiaCoordinacion: string[];
    hitosTresSemanas: string[];
    indicadoresInstitucion: string[];
}

export interface ExecutiveSummary {
    institutionName: string;
    simulationId: string;
    totalEvaluados: number;
    avg: number;
    median: number;
    tasaAprobacion: number;
    nationalAvg: number;
    deltaNacional: number;
    nivelGeneral: 'Superior' | 'Alto' | 'Medio' | 'Bajo';
    headline: string;
    fortalezas: AreaInsight[];
    /** Cómo se interpreta la cuadrícula de fortalezas (vs ICFES o mejor promedio local). */
    fortalezasContexto: 'vs_nacional' | 'intrains';
    debilidades: AreaInsight[];
    /** Todas las áreas con rangos de prioridad/apalancamiento para UI detallada. */
    allAreas: AreaInsight[];
    recomendaciones: string[];
    planEstudio: string[];
    /** Plan expandido: una fila por área priorizada, con texto de referencia tipo marco MEN/ICFES. */
    planEstudioPasos: PlanEstudioPaso[];
    preguntasCriticas: CriticalQuestion[];
    /** Diagnóstico marco + niveles por área (fallback sin metadata por ítem). */
    competenciasDiagnostico: AreaDiagnostico[];
    /** Origen pedagógico del plan y hojas Excel (metadata, niveles ICFES o híbrido). */
    pedagogicalSource: PlanFallbackSource;
    referenceModeLabel: string;
    riesgoCount: number;
    metodologia: string[];
}

const NIVEL_AREA = (avg: number): { label: string; severity: Severity } => {
    if (avg >= 65) return { label: 'Superior', severity: 'ok' };
    if (avg >= 55) return { label: 'Alto', severity: 'monitoreo' };
    if (avg >= 45) return { label: 'Medio', severity: 'moderado' };
    if (avg >= 35) return { label: 'Bajo', severity: 'alto' };
    return { label: 'Muy bajo', severity: 'critico' };
};

const NIVEL_GLOBAL = (avg: number): 'Superior' | 'Alto' | 'Medio' | 'Bajo' => {
    if (avg >= 400) return 'Superior';
    if (avg >= 325) return 'Alto';
    if (avg >= 250) return 'Medio';
    return 'Bajo';
};

/** Promedio nacional por nombre de área (escala 0-100). */
function nationalForArea(name: string): number {
    const map: Record<string, number> = {
        'Matemáticas': NATIONAL_STATS.areas.Matematicas.mean,
        'Lectura Crítica': NATIONAL_STATS.areas.Lectura.mean,
        'Sociales': NATIONAL_STATS.areas.Sociales.mean,
        'Ciencias': NATIONAL_STATS.areas.Ciencias.mean,
        'Inglés': NATIONAL_STATS.areas.Ingles.mean,
    };
    return map[name] ?? 50;
}

function recomendacionPorArea(name: string, severity: Severity): string {
    const intervencion: Record<string, string> = {
        'Matemáticas': 'Refuerzo de razonamiento cuantitativo, álgebra y geometría con ejercicios cronometrados',
        'Lectura Crítica': 'Lectura guiada con análisis de tesis, inferencia y contraargumentación',
        'Sociales': 'Revisión de competencias ciudadanas, análisis de fuentes y comprensión histórica',
        'Ciencias': 'Práctica de interpretación de datos experimentales y aplicación de modelos',
        'Inglés': 'Práctica de reading comprehension y vocabulario en contexto académico',
    };
    const base = intervencion[name] ?? `Refuerzo focalizado en ${name}`;
    if (severity === 'critico') return `Plan de choque: ${base}. Sesiones diarias durante 4 semanas.`;
    if (severity === 'alto') return `Prioridad alta: ${base}. Sesiones 3 veces por semana.`;
    if (severity === 'moderado') return `${base}. Sesiones semanales con seguimiento.`;
    if (severity === 'monitoreo') return `Mantenimiento: ${base}. Revisión quincenal.`;
    return `Sostenimiento del nivel actual: ${base}.`;
}

function buildAreaInsight(s: SubjectStat): AreaInsight {
    // SubjectStat.avg está en escala 0-100 (puntaje materia humanizado).
    const nat = nationalForArea(s.name);
    const delta = Math.round((s.avg - nat) * 10) / 10;
    const nivel = NIVEL_AREA(s.avg);
    const headline =
        delta >= 5
            ? `${s.name}: por encima del nacional (+${delta} pts)`
            : delta >= 0
            ? `${s.name}: cerca del nacional (${delta >= 0 ? '+' : ''}${delta} pts)`
            : delta >= -5
            ? `${s.name}: ligeramente por debajo del nacional (${delta} pts)`
            : `${s.name}: por debajo del nacional (${delta} pts)`;
    return {
        name: s.name,
        key: s.key,
        avg: s.avg,
        nationalAvg: Math.round(nat * 10) / 10,
        delta,
        severity: nivel.severity,
        headline,
        recomendacion: recomendacionPorArea(s.name, nivel.severity),
    };
}

/**
 * Cuando ningún área alcanza el referente nacional (Δ≥0): mostrar igual datos accionables
 * con las líneas de mayor puntaje medio institucional, evitando duplicar el top de priorización.
 */
function fortalezasIntraInstitucion(
    allAreas: AreaInsight[],
    excludeKeys: Set<string>,
    limit = 3
): AreaInsight[] {
    const candidatos = [...allAreas]
        .filter(a => !excludeKeys.has(a.key))
        .sort((a, b) => b.avg - a.avg || b.delta - a.delta)
        .slice(0, limit);

    const pickAndTag = (list: AreaInsight[]): AreaInsight[] =>
        list.map((a, idx) => ({
            ...a,
            relativaIntra: true as const,
            intraRank: idx + 1,
            headline: `${a.name}: mayor promedio local (#${idx + 1}), ${a.avg.toFixed(1)}/100 · nacional ${a.nationalAvg.toFixed(
                1
            )} · ${a.delta >= 0 ? '+' : ''}${a.delta} pts vs nacional.`,
            recomendacion: `Sin área ≥ referente nacional en este simulacro: usa ${a.name} como ancla institucional (buenas prácticas internas) mientras ejecutas refuerzos en prioritarias.`,
        }));

    if (candidatos.length > 0) return pickAndTag(candidatos);

    const fallback = [...allAreas].sort((a, b) => b.avg - a.avg).slice(0, limit);
    return pickAndTag(fallback);
}

function topicImportanceFromFailRate(rate: number): TopicImportance {
    if (rate >= 0.72) return 'critico';
    if (rate >= 0.58) return 'alto';
    return 'moderado';
}

function topicRationale(importance: TopicImportance, rate: number): string {
    const pct = Math.round(rate * 100);
    if (importance === 'critico')
        return `Error institucional muy alto: ${pct} de cada 100 estudiantes falló este ítem. Requiere revisión curricular y práctica masiva.`;
    if (importance === 'alto')
        return `Error institucional alto: ${pct} de cada 100 estudiantes falló este ítem. Priorizar en talleres y simulacros focalizados.`;
    return `Error institucional moderado: ${pct} de cada 100 estudiantes falló este ítem. Monitorear y reforzar el tema asociado.`;
}

function topCriticalQuestions(
    questionAnalysis: Record<string, QuestionStat[]>,
    limit = 16
): CriticalQuestion[] {
    const raw: Omit<CriticalQuestion, 'importance' | 'priorityOrder' | 'rationale'>[] = [];
    Object.entries(questionAnalysis).forEach(([materia, qs]) => {
        qs.forEach(q => {
            if (q.total > 0 && q.rate >= 0.5) {
                raw.push({
                    materia,
                    num: q.num,
                    failRate: q.rate,
                    failedCount: q.failed,
                    total: q.total,
                });
            }
        });
    });
    return raw
        .sort((a, b) => b.failRate - a.failRate)
        .slice(0, limit)
        .map((q, i) => {
            const importance = topicImportanceFromFailRate(q.failRate);
            return {
                ...q,
                importance,
                priorityOrder: i + 1,
                rationale: topicRationale(importance, q.failRate),
            };
        });
}

function criticasPorAreaModelo(
    crit: CriticalQuestion[],
    areaNombre: string
): PlanEstudioPaso['vinculosPreguntasCriticas'] {
    const out = crit.filter(q => normalizarMateriaAModeloArea(q.materia) === areaNombre);
    return out.map(q => ({
        materia: q.materia,
        num: q.num,
        failRate: q.failRate,
        importance: q.importance,
        priorityOrder: q.priorityOrder,
    }));
}

function microAccionesDesdeCriticos(
    areaNombre: string,
    vinc: PlanEstudioPaso['vinculosPreguntasCriticas'],
    recomendacion: string
): string[] {
    const acc: string[] = [];
    if (vinc.length > 0) {
        const top = vinc.slice(0, 3);
        top.forEach(v => {
            acc.push(
                `Taller de recuperación vinculado a ${questionLabel(v.num)} (${Math.round(v.failRate * 100)}% error en la institución).`
            );
        });
        if (vinc.length > 3)
            acc.push(`${vinc.length - 3} ítem(es) más en ${areaNombre} con error ≥50%; calendarizar repetición espaciada.`);
    } else {
        acc.push('Mapear 2 micro-evaluaciones de 10 ítems alineadas al marco antes del siguiente simulacro.');
        acc.push(recomendacion);
    }
    return acc;
}

function microAccionesForPaso(
    areaNombre: string,
    vinc: PlanEstudioPaso['vinculosPreguntasCriticas'],
    recomendacion: string,
    diag: AreaDiagnostico | undefined,
    fallbackSource: PlanFallbackSource
): string[] {
    if (fallbackSource === 'performance_levels' && diag) {
        const acc = [...diag.accionesSugeridas];
        diag.competencias
            .filter(c => c.estado === 'urgente' || c.estado === 'por_reforzar' || c.estado === 'en_desarrollo')
            .slice(0, 2)
            .forEach(c => {
                const hab = c.habilidadesPorReforzar.slice(0, 2).join('; ');
                if (hab)
                    acc.push(
                        `${c.competenciaNombre}: reforzar ${hab}.`
                    );
            });
        return acc.slice(0, 6);
    }
    const fromItems = microAccionesDesdeCriticos(areaNombre, vinc, recomendacion);
    if (fallbackSource === 'hybrid' && diag) {
        return [...fromItems, ...diag.accionesSugeridas.slice(0, 2)].slice(0, 6);
    }
    return fromItems;
}

function planEstudioPasosFromAreas(
    insights: AreaInsight[],
    todasCriticas: CriticalQuestion[],
    inst: InstitutionMetrics,
    competenciasDiagnostico: AreaDiagnostico[],
    tieneMetadataItems: boolean,
    indicadoresCicloPorArea?: Record<string, IndicadoresPsicometricosCiclo | undefined>
): PlanEstudioPaso[] {
    const diagByArea = new Map(competenciasDiagnostico.map(d => [d.areaNombre, d]));

    let filtradas = insights
        .filter(a => a.severity === 'critico' || a.severity === 'alto' || a.severity === 'moderado')
        .sort((a, b) => a.delta - b.delta)
        .slice(0, 5);

    if (filtradas.length === 0) {
        filtradas = [...insights].sort((a, b) => a.delta - b.delta).slice(0, 3);
    }

    return filtradas.map((a, idx) => {
        const orden = idx + 1;
        const macro = macroGuia(a.name);
        const vinculos = criticasPorAreaModelo(todasCriticas, a.name);
        const diag = diagByArea.get(a.name as AreaDiagnostico['areaNombre']);
        const fallbackSource = resolvePlanFallbackSource(
            vinculos.length > 0,
            tieneMetadataItems
        );
        const planSummary = diag ? summarizeDiagnosticoForPlan(diag) : null;
        const resumen = diag
            ? `${a.name} (${a.avg.toFixed(0)}/100, ${diag.nivelEtiqueta}): ${diag.descriptorNivel}`
            : `${a.name} (${a.avg.toFixed(0)}/100): ${a.recomendacion}`;
        const sevPlan =
            a.severity === 'critico' || a.severity === 'alto' || a.severity === 'moderado'
                ? a.severity
                : 'moderado';
        const comp = complementoPlanInstitucional({
            areaNombre: a.name,
            severidad: sevPlan,
            avg: a.avg,
            nationalAvg: a.nationalAvg,
            delta: a.delta,
            tasaAprobacion: inst.tasaAprobacion,
            orden,
            totalEvaluados: countEvaluadosInstitucion(inst.students),
            vinculosCriticos: vinculos.length,
            indicadoresCiclo: indicadoresCicloPorArea?.[a.key],
        });

        return {
            orden,
            areaNombre: a.name,
            areaKey: a.key,
            severidad: a.severity,
            institucionalPriority: a.delta < 0 ? a.institutionalPriority : undefined,
            resumen,
            documentoMacro: macro?.documentoRef ?? null,
            competenciasMacro: macro?.competenciasFoco ?? [],
            practicasAulaMacro: macro?.practicasAula ?? [],
            evidenciasSeguimiento: macro?.evidenciaSeguimiento ?? [],
            microAcciones: microAccionesForPaso(
                a.name,
                vinculos,
                a.recomendacion,
                diag,
                fallbackSource
            ),
            vinculosPreguntasCriticas: vinculos,
            fallbackSource,
            competencyDependencies: diag,
            nivelIcfes: planSummary?.nivelIcfes ?? diag?.nivelEtiqueta,
            competenciasDominadas: planSummary?.competenciasDominadas ?? [],
            competenciasPorReforzar: planSummary?.competenciasPorReforzar ?? [],
            habilidadesAlcanzadas: planSummary?.habilidadesAlcanzadas ?? [],
            habilidadesPorReforzar: planSummary?.habilidadesPorReforzar ?? [],
            guiaCoordinacion: comp.guiaCoordinacion,
            hitosTresSemanas: comp.hitosTresSemanas,
            indicadoresInstitucion: comp.indicadoresInstitucion,
        };
    });
}

function planEstudioFromPasos(pasos: PlanEstudioPaso[]): string[] {
    return pasos.map(p => p.resumen);
}

function recomendacionesGenerales(
    inst: InstitutionMetrics,
    fortalezas: AreaInsight[],
    debilidades: AreaInsight[],
    riesgo: number
): string[] {
    const recs: string[] = [];

    if (inst.tasaAprobacion < 30) {
        recs.push(
            `Tasa de aprobación crítica: solo el ${inst.tasaAprobacion} por ciento del grupo alcanzó 300 puntos. Activar plan institucional de remediación con seguimiento semanal directivo.`
        );
    } else if (inst.tasaAprobacion < 50) {
        recs.push(
            `Tasa de aprobación del ${inst.tasaAprobacion} por ciento, aún por debajo de la mitad del grupo. Priorizar tutorías focalizadas en estudiantes con puntaje entre 200 y 299.`
        );
    } else if (inst.tasaAprobacion >= 70) {
        recs.push(
            `Tasa de aprobación del ${inst.tasaAprobacion} por ciento: resultado sólido. Sostener buenas prácticas y desafiar al grupo Alto hacia nivel Superior.`
        );
    }

    if (debilidades.length > 0) {
        const top = debilidades[0];
        recs.push(
            `Área de mayor oportunidad: ${top.name}. ${top.recomendacion}`
        );
    }

    if (fortalezas.length > 0) {
        const top = fortalezas[0];
        recs.push(
            `Apalancar fortaleza institucional en ${top.name} (${top.avg.toFixed(0)}/100) para metodologías replicables en otras áreas.`
        );
    }

    if (inst.coefVar > 25) {
        recs.push(
            `Alta dispersión interna: el coeficiente de variación es del ${inst.coefVar} por ciento, lo que indica resultados muy desiguales. Diferenciar trayectorias: ruta de remediación y ruta de profundización.`
        );
    }

    if (riesgo > 0) {
        recs.push(
            `${riesgo} estudiantes en riesgo activo. Asignar tutor responsable y reportar avances cada 15 días.`
        );
    }

    if (inst.iqr > 100) {
        recs.push(
            `La brecha entre los puntajes del cuartil superior e inferior supera los 100 puntos. Revisar el acompañamiento al cuartil inferior para reducir la desigualdad de resultados.`
        );
    }

    return recs;
}

export function buildExecutiveSummary(args: {
    inst: InstitutionMetrics | null;
    simulationId: string;
    questionAnalysis: Record<string, QuestionStat[]>;
    alertas: {
        critico: AlertaEstudiante[];
        alto: AlertaEstudiante[];
        moderado: AlertaEstudiante[];
        monitoreo: AlertaEstudiante[];
    };
    /** Métricas psicométricas pre/post para enriquecer indicadores del plan (opcional). */
    indicadoresCicloPorArea?: Record<string, IndicadoresPsicometricosCiclo | undefined>;
}): ExecutiveSummary | null {
    const { inst, simulationId, questionAnalysis, alertas, indicadoresCicloPorArea } = args;
    if (!inst) return null;

    const baseInsights = inst.subjectStats
        .filter(s => s.countStudents > 0)
        .map(buildAreaInsight);

    const weakSorted = [...baseInsights].filter(a => a.delta < 0).sort((a, b) => a.delta - b.delta);
    const strongSorted = [...baseInsights].filter(a => a.delta >= 0).sort((a, b) => b.delta - a.delta);

    const allAreas: AreaInsight[] = baseInsights.map(a => {
        const institutionalPriority =
            a.delta < 0 ? weakSorted.findIndex(x => x.key === a.key) + 1 : undefined;
        const leverageRank =
            a.delta >= 0 ? strongSorted.findIndex(x => x.key === a.key) + 1 : undefined;
        return { ...a, institutionalPriority, leverageRank };
    });

    const debilidades = weakSorted.slice(0, 3).map(a => allAreas.find(x => x.key === a.key)!);

    const debKeys = new Set(debilidades.map(d => d.key));

    let fortalezasContexto: 'vs_nacional' | 'intrains';
    let fortalezas: AreaInsight[];
    if (strongSorted.length > 0) {
        fortalezasContexto = 'vs_nacional';
        fortalezas = strongSorted.slice(0, 3).map(a => allAreas.find(x => x.key === a.key)!);
    } else {
        fortalezasContexto = 'intrains';
        fortalezas = fortalezasIntraInstitucion(allAreas, debKeys, 3);
    }

    const riesgoCount =
        alertas.critico.length + alertas.alto.length + alertas.moderado.length;

    const recomendaciones = recomendacionesGenerales(
        inst,
        fortalezas,
        debilidades,
        riesgoCount
    );

    // `questionAnalysis` exists for many simulations because we have answer details,
    // but only SG11-17 has curricular metadata that can turn items into Pensum topics.
    const tieneMetadataCurricularReal =
        simulationHasPerQuestionTopics(simulationId) && hasUsefulQuestionMetadata(questionAnalysis);
    const preguntasCriticas = tieneMetadataCurricularReal
        ? topCriticalQuestions(questionAnalysis, 16)
        : [];
    const competenciasDiagnostico: AreaDiagnostico[] = COORDINADOR_ICFES_COMPETENCIAS_MARCO_ENABLED
        ? buildInstitutionalCompetenciasDiagnostico(
              inst.subjectStats.map(s => ({ name: s.name, avg: s.avg }))
          )
        : [];
    const pedagogicalSource = resolveCoordinatorPedagogicalSource(
        simulationId,
        questionAnalysis,
        preguntasCriticas.length
    );
    const planEstudioPasos = planEstudioPasosFromAreas(
        allAreas,
        preguntasCriticas,
        inst,
        competenciasDiagnostico,
        tieneMetadataCurricularReal,
        indicadoresCicloPorArea
    );
    const planEstudio = planEstudioFromPasos(planEstudioPasos);

    const nationalAvg = NATIONAL_STATS.global.mean;
    const deltaNacional = Math.round(inst.avg - nationalAvg);
    const nivelGeneral = NIVEL_GLOBAL(inst.avg);

    const headline = (() => {
        if (inst.avg >= 350) {
            return `Resultado destacado: promedio ${inst.avg}/500 (${
                deltaNacional >= 0 ? '+' : ''
            }${deltaNacional} vs nacional). Sostener metodología.`;
        }
        if (inst.avg >= 280) {
            return `Resultado sólido: promedio ${inst.avg}/500. Foco en cerrar brechas en áreas débiles para escalar a nivel Alto.`;
        }
        if (inst.avg >= 220) {
            return `Resultado en zona media: promedio ${inst.avg}/500. Activar plan institucional de remediación.`;
        }
        return `Resultado en alerta: promedio ${inst.avg}/500. Intervención inmediata requerida.`;
    })();

    const metodologia = [
        'Aprobación = % de estudiantes con puntaje global ≥ 300.',
        'Niveles: Superior ≥400, Alto 325–399, Medio 250–324, Bajo <250.',
        'Promedios por área en escala 0–100 (curva ICFES humanizada).',
        'Comparativo nacional: ICFES 2025, score_analysis_report.',
        `Fuente pedagógica: ${referenceModeLabel(pedagogicalSource)}.`,
        pedagogicalSource === 'performance_levels'
            ? 'Plan y diagnóstico por competencias: catálogo local niveles de desempeño + marcos ICFES (MEN).'
            : pedagogicalSource === 'hybrid'
              ? 'Plan híbrido: ítems críticos con metadata curricular + diagnóstico por niveles ICFES.'
              : 'Preguntas críticas: ítems con tasa de fallo ≥ 50% del grupo institucional.',
        'Fortalezas: si ningún área iguala o supera el referente nacional, el panel lista las de mayor promedio local (no duplicadas en “Áreas a priorizar”).',
    ];

    return {
        institutionName: inst.name,
        simulationId,
        totalEvaluados: countEvaluadosInstitucion(inst.students),
        avg: inst.avg,
        median: inst.median,
        tasaAprobacion: inst.tasaAprobacion,
        nationalAvg,
        deltaNacional,
        nivelGeneral,
        headline,
        fortalezas,
        fortalezasContexto,
        debilidades,
        allAreas,
        recomendaciones,
        planEstudio,
        planEstudioPasos,
        preguntasCriticas,
        competenciasDiagnostico,
        pedagogicalSource,
        referenceModeLabel: referenceModeLabel(pedagogicalSource),
        riesgoCount,
        metodologia,
    };
}
