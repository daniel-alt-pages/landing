/**
 * Guías alineadas con los **Marcos de Referencia ICFES** usados en el proyecto
 * (`marcos de referencia/`: Lectura, Matemáticas, Sociales y Ciencias). No es
 * texto literal de los PDF; resume ejes de competencia y prácticas coherentes
 * con esos documentos para priorizar el plan de refuerzo institucional.
 */

import { questionLabel } from '@/lib/questionLabel';

export interface MacroReferenciaArea {
    /** Nombre canónico igual a `SubjectStat.name` / insights. */
    areaNombre: string;
    documentoRef: string;
    competenciasFoco: string[];
    practicasAula: string[];
    evidenciaSeguimiento: string[];
}

const BASE = 'Marcos de Referencia ICFES (MEN)';

export const MACRO_POR_AREA: Record<string, MacroReferenciaArea> = {
    'Matemáticas': {
        areaNombre: 'Matemáticas',
        documentoRef: `${BASE} · Matemáticas (04_MARCO_MATEMATICAS)`,
        competenciasFoco: [
            'Interpretación y representación: traducir situaciones a modelos (gráficos, tablas, expresiones).',
            'Formulación y ejecución: argumentar procedimientos y validar plausibilidad de resultados.',
            'Argumentación: explicar y contrastar estrategias frente a problemas abiertos y de contexto.',
        ],
        practicasAula: [
            'Secuencias de problemas con variación de representación (verbal → simbólica → gráfica).',
            'Retroalimentación explícita sobre errores típicos de interpretación y de cálculo mental.',
            'Micro-simulacros con justificación escrita breve (no solo marcar alternativa).',
        ],
        evidenciaSeguimiento: [
            'Rúbrica corta de argumentación en 2–3 ítems por sesión.',
            'Seguimiento de ítems institutionales con ≥50% de error en el simulacro.',
        ],
    },
    'Lectura Crítica': {
        areaNombre: 'Lectura Crítica',
        documentoRef: `${BASE} · Lectura crítica (02_MARCO_LECTURA)`,
        competenciasFoco: [
            'Identificación y comprensión local: localizar información explícita e implícita.',
            'Comprensión global e inferencial: relaciones entre partes del texto y propósito del autor.',
            'Evaluación y posicionamiento crítico: reconocer supuestos, sesgos y validez de argumentos.',
        ],
        practicasAula: [
            'Lectura guiada con preguntas de tipología ICFES (localizar, inferir, evaluar).',
            'Contraste de dos textos breves sobre un mismo tema (punto de vista y evidencia).',
            'Talleres de vocabulario académico en contexto (sin listas aisladas).',
        ],
        evidenciaSeguimiento: [
            'Registro de tipos de pregunta fallada por estudiante en mínimo dos textos/semana.',
            'Comparación del % de acierto por tipo antes/después del ciclo de 3–4 semanas.',
        ],
    },
    Sociales: {
        areaNombre: 'Sociales',
        documentoRef: `${BASE} · Ciencias sociales y competencias ciudadanas (06_MARCO_SOCIALES)`,
        competenciasFoco: [
            'Comprensión de perspectivas: múltiples enfoques históricos y geográficos.',
            'Análisis de problemas sociales y conflictos en contextos variados.',
            'Competencias ciudadanas: participación, convivencia y resolución pacífica.',
        ],
        practicasAula: [
            'Estudio de fuentes primarias y secundarias con matriz de fiabilidad y sesgo.',
            'Mapas conceptuales de causas–consecuencias en casos concretos (local/regional/global).',
            'Debates con normas explícitas de evidencia y contraargumentación.',
        ],
        evidenciaSeguimiento: [
            'Portafolio breve: una fuente analizada + conclusiones argumentadas por grupo.',
            'Ítems de ciudadanía con mayor error: repetición espaciada en el plan semanal.',
        ],
    },
    Ciencias: {
        areaNombre: 'Ciencias',
        documentoRef: `${BASE} · Ciencias naturales (08_MARCO_CIENCIAS)`,
        competenciasFoco: [
            'Uso comprensivo del conocimiento científico en situaciones familiares y nuevas.',
            'Explicación de fenómenos con modelos y evidencia.',
            'Indagación: plantear preguntables, interpretar datos y evaluar la validez de conclusiones.',
        ],
        practicasAula: [
            'Laboratorios o simulaciones con hoja de predicción → observación → ajuste del modelo.',
            'Lectura de gráficos, tablas y experimentos descriptos en enunciados tipo ICFES.',
            'Clasificación de afirmaciones en hecho, hipótesis e inferencia.',
        ],
        evidenciaSeguimiento: [
            'Mini-informes de 1 página con secciones: pregunta, datos, conclusión justificada.',
            'Lista viva de conceptos físico-químico-biológicos recurrentes en ítems con fallo alto.',
        ],
    },
    Inglés: {
        areaNombre: 'Inglés',
        documentoRef: `${BASE} · inglés como lengua extranjera (referencia institucional de competencias comunicativas)`,
        competenciasFoco: [
            'Comprensión lectora en contextos académicos cotidianos (detalle, vocabulario en contexto, referencia).',
            'Inferencia léxica y cohesión textual.',
            'Reconocimiento de propósito y estructura de párrafos breves.',
        ],
        practicasAula: [
            'Skimming + scanning dirigidos antes de responder alternativas.',
            'Tarjetas de raíces, prefijos y falsos cognados con frases ejemplo.',
            'Lecturas graduadas con preguntas de paráfrasis y vocabulario contextual.',
        ],
        evidenciaSeguimiento: [
            'Cuaderno de léxico institucional (20 ítems nuevos/semana revisados oralmente).',
            'Breve dictado de selección léxica o cloze contextual quincenal.',
        ],
    },
};

/** Resuelve el bloque macro; si no hay coincidencia exacta por nombre de área, devuelve null. */
export function macroGuia(areaNombre: string): MacroReferenciaArea | null {
    return MACRO_POR_AREA[areaNombre] ?? null;
}

export type SeveridadPlan = 'critico' | 'alto' | 'moderado';

/** Complemento curricular/operativo generado en código (sin APIs externas). */
export interface ComplementoPlanLocal {
    guiaCoordinacion: string[];
    hitosTresSemanas: string[];
    indicadoresInstitucion: string[];
}

export interface IndicadoresPsicometricosCiclo {
    /** Simulación usada como inicio de ciclo (baseline). */
    inicioSimId: string;
    /** Simulación usada como cierre de ciclo (endline). */
    cierreSimId: string;
    /** % (0-100) estudiantes con puntaje < 40/100 en el área. */
    pctBajo40Inicio: number | null;
    /** % (0-100) estudiantes con puntaje < 40/100 en el área. */
    pctBajo40Cierre: number | null;
    /** Ítems priorizados (P#) con error inicio vs cierre. */
    itemsPrioritarios?: { num: number; errorInicioPct: number | null; errorCierrePct: number | null }[];
    /** Proxy/registro de refuerzo docente si existe en datos. */
    pctGruposConRefuerzo?: number | null;
}

/**
 * Texto adicional para coordinación: calendario tipo 3 semanas e indicadores
 * medibles, parametrizados por severidad y métricas del simulacro.
 */
export function complementoPlanInstitucional(args: {
    areaNombre: string;
    severidad: SeveridadPlan;
    avg: number;
    nationalAvg: number;
    delta: number;
    tasaAprobacion: number;
    orden: number;
    totalEvaluados: number;
    vinculosCriticos: number;
    indicadoresCiclo?: IndicadoresPsicometricosCiclo;
}): ComplementoPlanLocal {
    const {
        areaNombre,
        severidad,
        avg,
        nationalAvg,
        delta,
        tasaAprobacion,
        orden,
        totalEvaluados,
        vinculosCriticos,
        indicadoresCiclo,
    } = args;

    const brecha = delta < 0 ? `${Math.abs(delta).toFixed(1)} pts por debajo del nacional` : `${delta.toFixed(1)} pts vs nacional`;
    const intensidad =
        severidad === 'critico'
            ? 'intervención concentrada (frecuencia alta y seguimiento directivo quincenal)'
            : severidad === 'alto'
              ? 'bloques de refuerzo recurrentes (mínimo 3 contactos/semana con la línea)'
              : 'refuerzo focalizado semanal con revisión de avances';

    const guiaCoordinacion: string[] = [
        `Este paso ${orden} prioriza ${areaNombre} (${avg.toFixed(0)}/100 frente a ${nationalAvg.toFixed(0)} nacional; ${brecha}). La institución tiene ${tasaAprobacion.toFixed(0)}% de aprobación global y ${totalEvaluados} evaluados en este simulacro.`,
        `Coordinación académica: convocar a docentes de la línea, repartir responsables por grupo y alinear el refuerzo con las competencias del marco ICFES de esta área (no solo “más ítems”).`,
        `Ajuste de intensidad: ${intensidad}. ${
            vinculosCriticos > 0
                ? `Hay ${vinculosCriticos} ítem(es) crítico(s) en esta área: usar sus enunciados en talleres.`
                : 'Aún sin ítems críticos listados para esta área: priorizar micro-evaluables alineados al marco.'
        }`,
    ];

    const hitosCritico = [
        `Semana 1: diagnóstico rápido en ${areaNombre} (10–12 ítems) + reunión de línea con rúbrica del marco.`,
        `Semana 2: tres sesiones de profundización (problemas/textos reutilizando formatos del simulacro) y tutorías al cuartil inferior.`,
        `Semana 3: simulacro corto institucional + análisis de error por competencia y ajuste del plan siguiente.`,
    ];
    const hitosAlto = [
        `Semana 1: taller de recuperación en ${areaNombre} + registro de errores por tipo de pregunta o competencia.`,
        `Semana 2: práctica guiada en aula (dos bloques) + una sesión de refuerzo extracurricular opcional.`,
        `Semana 3: evaluación formativa breve y decisión de mantener o intensificar según resultados.`,
    ];
    const hitosModerado = [
        `Semana 1: activación del plan de ${areaNombre} con una práctica marco-semana.`,
        `Semana 2: consolidación con retroalimentación entre pares docentes.`,
        `Semana 3: revisión de avances con indicadores acordados (ver abajo).`,
    ];

    const hitosTresSemanas =
        severidad === 'critico' ? hitosCritico : severidad === 'alto' ? hitosAlto : hitosModerado;

    const metaArea =
        severidad === 'critico'
            ? 'reducir al menos 8 puntos en promedio de área'
            : severidad === 'alto'
              ? 'reducir al menos 5 puntos en promedio de área'
              : 'ganar al menos 3 puntos en promedio de área o estabilizar sobre 50/100';

    const indicadoresInstitucion: string[] = (() => {
        const lines: string[] = [];

        const pct = (v: number | null | undefined) =>
            v == null || Number.isNaN(v) ? '—' : `${v.toFixed(1)}%`;

        if (indicadoresCiclo?.inicioSimId && indicadoresCiclo?.cierreSimId) {
            const d =
                indicadoresCiclo.pctBajo40Inicio != null && indicadoresCiclo.pctBajo40Cierre != null
                    ? indicadoresCiclo.pctBajo40Cierre - indicadoresCiclo.pctBajo40Inicio
                    : null;
            const delta =
                d == null
                    ? '—'
                    : `${d >= 0 ? '+' : ''}${d.toFixed(1)} pp`;
            lines.push(
                `% <40/100 en ${areaNombre} (inicio ${indicadoresCiclo.inicioSimId} → cierre ${indicadoresCiclo.cierreSimId}): ${pct(
                    indicadoresCiclo.pctBajo40Inicio
                )} → ${pct(indicadoresCiclo.pctBajo40Cierre)} (${delta}).`
            );
        } else {
            lines.push(
                `% de estudiantes por debajo de 40/100 en ${areaNombre} al inicio vs al cierre del ciclo de 3 semanas.`
            );
        }

        lines.push(`Meta numérica sugerida: ${metaArea} respecto al resultado actual (${avg.toFixed(0)}/100).`);

        if (indicadoresCiclo?.pctGruposConRefuerzo != null) {
            lines.push(
                `Participación docente (registro): ${pct(indicadoresCiclo.pctGruposConRefuerzo)} de grupos con ≥1 sesión explícita de refuerzo (libro de clase/acta).`
            );
        } else {
            lines.push(
                `Participación docente: % de grupos con al menos una sesión explícita de refuerzo registrada en el libro de clase o acta (pendiente de registro en datos).`
            );
        }

        const items = indicadoresCiclo?.itemsPrioritarios?.filter(Boolean) ?? [];
        if (items.length > 0) {
            const parts = items
                .slice(0, 5)
                .map(it => {
                    const di =
                        it.errorInicioPct != null && it.errorCierrePct != null
                            ? it.errorCierrePct - it.errorInicioPct
                            : null;
                    const dTxt =
                        di == null ? '—' : `${di >= 0 ? '+' : ''}${di.toFixed(1)} pp`;
                    return `${questionLabel(it.num)}: ${pct(it.errorInicioPct)} → ${pct(it.errorCierrePct)} (${dTxt})`;
                });
            lines.push(`Ítems prioritarios (error inicio → cierre): ${parts.join(' · ')}.`);
        } else {
            lines.push(
                `Si aplica: descenso del % de error en los ítems prioritarios para ${areaNombre} en un mini-simulacro de seguimiento.`
            );
        }

        return lines;
    })();

    return { guiaCoordinacion, hitosTresSemanas, indicadoresInstitucion };
}

/** Relaciona etiquetas de `questionAnalysis.materia` con el nombre estándar del área. */
export function normalizarMateriaAModeloArea(materia: string): string | null {
    const m = materia.toLowerCase().trim();
    if (m.includes('matemát') || m.includes('matematic')) return 'Matemáticas';
    if (m.includes('lectura') || m.includes('critica') || m.includes('crítica')) return 'Lectura Crítica';
    if (m.includes('social') || m.includes('ciudadan')) return 'Sociales';
    if (m.includes('cienc') || m.includes('natural')) return 'Ciencias';
    if (m.includes('inglés') || m.includes('ingles')) return 'Inglés';
    return null;
}
