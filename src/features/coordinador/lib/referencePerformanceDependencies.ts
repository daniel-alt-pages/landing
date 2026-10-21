/**
 * Catálogo fusionado: Marcos de referencia + Niveles de desempeño Saber 11° (ICFES/MEN).
 * Fallback cuando no hay metadata granular por pregunta.
 */

import { normalizarMateriaAModeloArea } from '@features/coordinador/lib/macroReferencias';
import {
    assignPrioridadOrden,
    buildCompetenciaDominioStats,
    buildHabilidadesNivelDiagnostico,
    buildNivelPosicionStats,
    type DominioEstado,
    type HabilidadDiagnostico,
    type HabilidadNivelDiagnostico,
} from '@features/coordinador/lib/competencyDominanceStats';

export type { DominioEstado, HabilidadDiagnostico };
export { calcProgresoEnRango, flattenUrgentCompetencies } from '@features/coordinador/lib/competencyDominanceStats';

/** Texto metodológico (UI / tooltips). */
export const METODOLOGIA_DOMINIO_ICFES = [
    'Nivel ICFES del área = solo por rango de puntaje del catálogo oficial (no por competencias).',
    'Habilidades de nivel: checklist de `habilidadesNivel` — niveles anteriores alcanzados; en el nivel actual, según % del tramo.',
    'Competencias del marco: % = habilidades del marco cubiertas por habilidades de nivel ya alcanzadas (texto afín en el catálogo).',
    'Estado del área: nivel 3 en consolidación → “En desarrollo”, no “Urgente”, salvo nivel 1 o 2+ niveles de brecha.',
    'Competencia dominada: ≥ nivel 3, tramo consolidado y 100 % habilidades del marco cubiertas por evidencias de nivel.',
    'Anillo y barra: escala 0–100 global; el % “en el tramo” es posición dentro del rango del nivel actual.',
];

export type AreaCanonica =
    | 'Matemáticas'
    | 'Lectura Crítica'
    | 'Sociales'
    | 'Ciencias'
    | 'Inglés';

export interface NivelDesempenoRango {
    nivel: 1 | 2 | 3 | 4;
    min: number;
    max: number;
    etiqueta: string;
    descriptorGeneral: string;
    habilidadesNivel: string[];
}

export interface CompetenciaMarco {
    id: string;
    nombre: string;
    afirmacion: string;
    habilidades: string[];
    /** Peso aproximado en la prueba (0–1), guía ICFES. */
    pesoPrueba?: number;
}

export interface AreaReferencia {
    areaNombre: AreaCanonica;
    documentoRef: string;
    niveles: NivelDesempenoRango[];
    competencias: CompetenciaMarco[];
}

export interface CompetenciaDiagnostico {
    competenciaId: string;
    competenciaNombre: string;
    afirmacion: string;
    estado: DominioEstado;
    /** Dominio estimado de la competencia (promedio habilidades), 0–100. */
    dominioPct: number;
    /** 1 = mayor urgencia dentro del área. */
    prioridad: number;
    habilidadesDetalle: HabilidadDiagnostico[];
    habilidadesDominadas: string[];
    habilidadesPorReforzar: string[];
    interpretacion: string;
}

export interface AreaDiagnostico {
    areaNombre: AreaCanonica;
    puntaje: number;
    nivel: 1 | 2 | 3 | 4;
    nivelEtiqueta: string;
    descriptorNivel: string;
    rangoMin: number;
    rangoMax: number;
    /** % recorrido del tramo del nivel (0 = piso, 100 = techo). */
    progresoEnRangoPct: number;
    dominioNivelPct: number;
    puntosParaSiguienteNivel: number | null;
    etiquetaSiguienteNivel: string | null;
    interpretacionPosicion: string;
    /** Checklist habilidades de nivel (documento ICFES). */
    habilidadesNivel: HabilidadNivelDiagnostico[];
    competencias: CompetenciaDiagnostico[];
    accionesSugeridas: string[];
    fuente: 'nivel_desempeno_icfes' | 'items_detalle';
}

/** Alias del plan: modelo de área con marco + niveles. */
export type AreaReferenceModel = AreaReferencia;
export type PerformanceLevelBand = NivelDesempenoRango;
export type SkillDescriptor = string;
export interface CompetencyDependency {
    areaNombre: AreaCanonica;
    competencia: CompetenciaMarco;
    nivel: PerformanceLevelBand;
    habilidadesMarco: SkillDescriptor[];
    habilidadesNivel: SkillDescriptor[];
}
/** Alias del plan para diagnóstico por área. */
export type AreaCompetencyDiagnosis = AreaDiagnostico;

export type PlanFallbackSource = 'question_metadata' | 'performance_levels' | 'hybrid';

export interface DependencyCatalogRow {
    area: AreaCanonica;
    competencia: string;
    afirmacion: string;
    habilidadMarco: string;
    nivel: number;
    nivelEtiqueta: string;
    rangoMin: number;
    rangoMax: number;
    habilidadNivel: string;
}

export interface DiagnosticoNivelExportRow {
    area: AreaCanonica;
    puntaje: number;
    nivelEtiqueta: string;
    descriptorNivel: string;
    competenciasDominadas: string;
    competenciasPorReforzar: string;
    habilidadesAlcanzadas: string;
    habilidadesPorReforzar: string;
}

export interface PlanCompetenciaExportRow {
    orden: number;
    area: string;
    severidad: string;
    fallbackSource: PlanFallbackSource;
    nivelIcfes: string;
    competenciasDominadas: string;
    competenciasPorReforzar: string;
    acciones: string;
}

const MAT: AreaReferencia = {
    areaNombre: 'Matemáticas',
    documentoRef: 'Marco Matemáticas Saber 11°',
    niveles: [
        {
            nivel: 1,
            min: 0,
            max: 35,
            etiqueta: 'Nivel 1',
            descriptorGeneral:
                'Lee información puntual en tablas/gráficas con escala explícita; dificultad al comparar conjuntos o variables.',
            habilidadesNivel: [
                'Leer un dato puntual en gráfica o tabla con escala clara',
                'Contextos muy familiares o personales',
            ],
        },
        {
            nivel: 2,
            min: 36,
            max: 50,
            etiqueta: 'Nivel 2',
            descriptorGeneral:
                'Compara datos, extrae información local/global directa; probabilidad simple en contextos similares al aula.',
            habilidadesNivel: [
                'Comparar dos variables en una misma gráfica',
                'Identificar promedio, moda, máximo y mínimo en contexto',
                'Comparar probabilidad de eventos simples (mismos casos posibles)',
                'Cambiar gráficas de barras a tablas de doble entrada',
            ],
        },
        {
            nivel: 3,
            min: 51,
            max: 70,
            etiqueta: 'Nivel 3',
            descriptorGeneral:
                'Selecciona información, transformaciones aritméticas/algebraicas sencillas; proporcionalidad y geometría en contextos variados.',
            habilidadesNivel: [
                'Seleccionar gráfica adecuada a partir de tabla o verbalización',
                'Manipulaciones algebraicas sencillas (términos semejantes)',
                'Justificar afirmaciones con un argumento aritmético o conceptual',
                'Resolver problemas con figuras geométricas elementales',
            ],
        },
        {
            nivel: 4,
            min: 71,
            max: 100,
            etiqueta: 'Nivel 4',
            descriptorGeneral:
                'Resuelve y justifica con probabilidad, álgebra, funciones y propiedades formales en contextos abstractos.',
            habilidadesNivel: [
                'Modelar con lenguaje algebraico desde lenguaje natural',
                'Resolver problemas con permutaciones y espacio muestral',
                'Justificar con varias propiedades o conceptualizaciones',
                'Construir representaciones auxiliares (gráficas, fórmulas) como paso intermedio',
            ],
        },
    ],
    competencias: [
        {
            id: 'interpretacion_representacion',
            nombre: 'Interpretación y representación',
            afirmacion:
                'Comprende y transforma la información cuantitativa y esquemática presentada en distintos formatos.',
            pesoPrueba: 0.34,
            habilidades: [
                'Comprender y transformar tablas, gráficas, diagramas y esquemas',
                'Extraer información relevante y establecer relaciones',
                'Identificar tendencias y patrones',
                'Usar registros simbólico, natural y gráfico de forma coherente',
            ],
        },
        {
            id: 'formulacion_ejecucion',
            nombre: 'Formulación y ejecución',
            afirmacion:
                'Frente a un problema con información cuantitativa, plantea e implementa estrategias que llevan a soluciones adecuadas.',
            pesoPrueba: 0.43,
            habilidades: [
                'Plantear y diseñar estrategias de solución',
                'Seleccionar y verificar pertinencia de soluciones',
                'Ejecutar procedimientos y resolver situaciones planteadas',
                'Analizar rutas alternativas de solución',
            ],
        },
        {
            id: 'argumentacion',
            nombre: 'Argumentación',
            afirmacion:
                'Valida procedimientos y estrategias matemáticas utilizadas para dar solución a problemas.',
            pesoPrueba: 0.23,
            habilidades: [
                'Validar o refutar conclusiones y estrategias',
                'Justificar con propiedades, teoremas o procedimientos',
                'Usar ejemplos y contraejemplos',
                'Señalar inconsistencias en razonamientos',
            ],
        },
    ],
};

const LEC: AreaReferencia = {
    areaNombre: 'Lectura Crítica',
    documentoRef: 'Marco Lectura Crítica Saber 11°',
    niveles: [
        {
            nivel: 1,
            min: 0,
            max: 35,
            etiqueta: 'Nivel 1',
            descriptorGeneral: 'Identifica elementos literales sin establecer relaciones de significado.',
            habilidadesNivel: ['Localizar información explícita sin inferencia'],
        },
        {
            nivel: 2,
            min: 36,
            max: 50,
            etiqueta: 'Nivel 2',
            descriptorGeneral: 'Comprensión literal; reconoce estructura básica y relaciones locales.',
            habilidadesNivel: [
                'Identificar información local del texto',
                'Identificar estructura de textos continuos y discontinuos',
                'Reconocer sinónimos, antónimos y intención comunicativa explícita',
            ],
        },
        {
            nivel: 3,
            min: 51,
            max: 65,
            etiqueta: 'Nivel 3',
            descriptorGeneral: 'Infiere contenidos implícitos; reconoce estructuras y estrategias discursivas.',
            habilidadesNivel: [
                'Inferir información implícita',
                'Establecer relaciones intertextuales (causa-efecto, oposición)',
                'Analizar y sintetizar información del texto',
                'Establecer validez de argumentos',
            ],
        },
        {
            nivel: 4,
            min: 66,
            max: 100,
            etiqueta: 'Nivel 4',
            descriptorGeneral: 'Reflexiona y evalúa contenido, supuestos y estrategias del autor.',
            habilidadesNivel: [
                'Evaluar argumentos y estrategias discursivas',
                'Relacionar varios textos para concluir',
                'Postura crítica y hipótesis de lectura',
                'Considerar contexto en la valoración del texto',
            ],
        },
    ],
    competencias: [
        {
            id: 'lectura_local',
            nombre: 'Identificar y entender contenidos locales',
            afirmacion: 'Identifica y entiende los contenidos locales que conforman un texto.',
            pesoPrueba: 0.25,
            habilidades: [
                'Comprender significado de palabras y frases explícitas',
                'Relaciones semánticas en la frase',
                'Base para comprensión global y crítica',
            ],
        },
        {
            id: 'lectura_global',
            nombre: 'Comprender articulación del texto (sentido global)',
            afirmacion: 'Comprende cómo se articulan las partes de un texto para darle un sentido global.',
            pesoPrueba: 0.42,
            habilidades: [
                'Relacionar elementos locales (frases, párrafos)',
                'Reconocer articulación formal y semántica',
                'Construir sentido global del texto',
            ],
        },
        {
            id: 'lectura_critica',
            nombre: 'Reflexionar y evaluar el contenido',
            afirmacion: 'Reflexiona a partir de un texto y evalúa su contenido.',
            pesoPrueba: 0.33,
            habilidades: [
                'Evaluar validez de argumentos',
                'Detectar supuestos e implicaciones',
                'Reconocer estrategias argumentativas y retóricas',
                'Relacionar texto con variables contextuales',
            ],
        },
    ],
};

const SOC: AreaReferencia = {
    areaNombre: 'Sociales',
    documentoRef: 'Marco Sociales y Ciudadanas Saber 11°',
    niveles: [
        {
            nivel: 1,
            min: 0,
            max: 40,
            etiqueta: 'Nivel 1',
            descriptorGeneral:
                'Reconoce derechos básicos y conflictos simples; no usa conceptos sociales ni modelos con soltura.',
            habilidadesNivel: ['Reconocer derechos y conflictos en situaciones sencillas'],
        },
        {
            nivel: 2,
            min: 41,
            max: 55,
            etiqueta: 'Nivel 2',
            descriptorGeneral: 'Identifica deberes del Estado, dimensiones y contexto de fuentes en situaciones cercanas.',
            habilidadesNivel: [
                'Identificar derechos y deberes constitucionales',
                'Relacionar conducta con cosmovisión',
                'Reconocer efectos de soluciones y dimensiones',
            ],
        },
        {
            nivel: 3,
            min: 56,
            max: 70,
            etiqueta: 'Nivel 3',
            descriptorGeneral: 'Identifica prejuicios, conceptos básicos y valora fuentes en contextos más complejos.',
            habilidadesNivel: [
                'Reconocer intenciones y prejuicios en enunciados',
                'Identificar dimensiones (económica, política, cultural, ambiental)',
                'Comparar opiniones e intereses de actores',
                'Valorar alcances de fuentes',
            ],
        },
        {
            nivel: 4,
            min: 71,
            max: 100,
            etiqueta: 'Nivel 4',
            descriptorGeneral:
                'Analiza enunciados, modelos conceptuales y alternativas de solución con evidencia.',
            habilidadesNivel: [
                'Conocer mecanismos de participación y control',
                'Comparar argumentos e intereses de actores',
                'Analizar fuentes primarias y secundarias',
                'Relacionar modelos conceptuales con decisiones sociales',
            ],
        },
    ],
    competencias: [
        {
            id: 'pensamiento_social',
            nombre: 'Pensamiento social',
            afirmacion:
                'Comprende modelos conceptuales y dimensiones espacio-temporales de eventos y prácticas sociales.',
            pesoPrueba: 0.3,
            habilidades: [
                'Usar conceptos básicos de ciencias sociales',
                'Ubicar eventos en tiempo y espacio',
                'Aplicar marco constitucional y ciudadano',
            ],
        },
        {
            id: 'interpretacion_perspectivas',
            nombre: 'Interpretación y análisis de perspectivas',
            afirmacion: 'Contextualiza y evalúa fuentes; comprende perspectivas de actores y grupos.',
            pesoPrueba: 0.4,
            habilidades: [
                'Reconocer opiniones e intereses de actores',
                'Evaluar fuentes primarias y secundarias',
                'Valorar credibilidad y sesgos',
                'Analizar argumentos en contexto',
            ],
        },
        {
            id: 'pensamiento_reflexivo_sistemico',
            nombre: 'Pensamiento reflexivo y sistémico',
            afirmacion:
                'Evalúa usos de las ciencias sociales; comprende dimensiones en problemas y soluciones.',
            pesoPrueba: 0.3,
            habilidades: [
                'Identificar modelos conceptuales y sus usos',
                'Analizar efectos de medidas en varias dimensiones',
                'Ponderar alternativas de solución',
            ],
        },
    ],
};

const CIE: AreaReferencia = {
    areaNombre: 'Ciencias',
    documentoRef: 'Marco Ciencias Naturales Saber 11°',
    niveles: [
        {
            nivel: 1,
            min: 0,
            max: 40,
            etiqueta: 'Nivel 1',
            descriptorGeneral: 'Reconoce información explícita en tablas/gráficas simples; indagación limitada.',
            habilidadesNivel: ['Leer una variable en tabla o gráfica ordenada'],
        },
        {
            nivel: 2,
            min: 41,
            max: 55,
            etiqueta: 'Nivel 2',
            descriptorGeneral: 'Asocia datos con nociones básicas (tiempo, velocidad, materia).',
            habilidadesNivel: [
                'Identificar patrones en tablas y gráficas',
                'Relacionar esquemas con nociones científicas básicas',
                'Predicciones con patrones crecientes/decrecientes',
            ],
        },
        {
            nivel: 3,
            min: 56,
            max: 70,
            etiqueta: 'Nivel 3',
            descriptorGeneral: 'Interrelaciona conceptos y leyes con dos o más variables.',
            habilidadesNivel: [
                'Interpretar gráficas y modelos para predecir',
                'Diferenciar evidencia y conclusión',
                'Plantear hipótesis basadas en evidencias',
            ],
        },
        {
            nivel: 4,
            min: 71,
            max: 100,
            etiqueta: 'Nivel 4',
            descriptorGeneral: 'Usa teorías y procedimientos de indagación en situaciones problema.',
            habilidadesNivel: [
                'Plantear preguntas de investigación',
                'Comunicar resultados de indagación',
                'Contrastar modelos con fenómenos cotidianos',
                'Resolver con leyes y teorías científicas',
            ],
        },
    ],
    competencias: [
        {
            id: 'uso_comprensivo',
            nombre: 'Uso comprensivo del conocimiento científico',
            afirmacion:
                'Asocia fenómenos naturales con conceptos científicos e identifica características con evidencia.',
            pesoPrueba: 0.3,
            habilidades: [
                'Identificar características de fenómenos biológicos, físicos y químicos',
                'Establecer relaciones concepto–fenómeno',
                'Reconocer impacto de recursos y tecnologías',
            ],
        },
        {
            id: 'explicacion_fenomenos',
            nombre: 'Explicación de fenómenos',
            afirmacion:
                'Explica y modela fenómenos con observaciones, patrones y evidencia científica.',
            pesoPrueba: 0.3,
            habilidades: [
                'Explicar fenómenos con modelos y leyes',
                'Usar modelos para predecir',
                'Analizar uso de recursos y efectos en salud/entorno',
            ],
        },
        {
            id: 'indagacion',
            nombre: 'Indagación',
            afirmacion:
                'Comprende la investigación científica; analiza datos y deriva conclusiones con evidencia.',
            pesoPrueba: 0.4,
            habilidades: [
                'Formular preguntas investigables',
                'Diseñar y evaluar procedimientos',
                'Interpretar tablas, gráficas y patrones',
                'Derivar conclusiones con evidencia',
            ],
        },
    ],
};

const ING: AreaReferencia = {
    areaNombre: 'Inglés',
    documentoRef: 'Marco Inglés / MCER (Saber 11°)',
    niveles: [
        {
            nivel: 1,
            min: 0,
            max: 47,
            etiqueta: 'A−',
            descriptorGeneral: 'Desempeños mínimos; vocabulario y estructuras muy básicos.',
            habilidadesNivel: ['Ítems de menor complejidad de la prueba'],
        },
        {
            nivel: 2,
            min: 48,
            max: 57,
            etiqueta: 'A1',
            descriptorGeneral: 'Expresiones cotidianas y frases sencillas; interacción elemental.',
            habilidadesNivel: [
                'Comprensión de expresiones muy frecuentes',
                'Información personal básica',
            ],
        },
        {
            nivel: 3,
            min: 58,
            max: 67,
            etiqueta: 'A2',
            descriptorGeneral: 'Áreas de experiencia relevantes; intercambios sencillos y directos.',
            habilidadesNivel: [
                'Frases de uso frecuente en contextos conocidos',
                'Describir pasado y entorno en términos sencillos',
            ],
        },
        {
            nivel: 4,
            min: 68,
            max: 100,
            etiqueta: 'B1+',
            descriptorGeneral: 'Comprensión de textos; gramática y léxico en contexto (B1 y superior).',
            habilidadesNivel: [
                'Comprensión lectora literal e inferencial',
                'Gramática y vocabulario en contexto',
                'Propósito comunicativo y cohesión textual',
            ],
        },
    ],
    competencias: [
        {
            id: 'pragmatica',
            nombre: 'Competencia pragmática',
            afirmacion: 'Reconoce propósito comunicativo y contexto de avisos y textos breves.',
            habilidades: ['Identificar dónde aparecería un aviso según su propósito'],
        },
        {
            id: 'lexico',
            nombre: 'Competencia léxica',
            afirmacion: 'Relaciona descripciones con vocabulario en contexto.',
            habilidades: ['Asociar palabras con definiciones o situaciones'],
        },
        {
            id: 'comprension_lectora',
            nombre: 'Comprensión lectora',
            afirmacion: 'Comprende textos en inglés (detalle, paráfrasis, inferencia).',
            habilidades: [
                'Lectura literal (paráfrasis)',
                'Inferencia sobre intención del autor',
                'Ideas generales y particulares del texto',
            ],
        },
        {
            id: 'gramatica_contexto',
            nombre: 'Gramática en contexto',
            afirmacion: 'Selecciona formas lingüísticas adecuadas al completar textos.',
            habilidades: [
                'Completar textos con forma gramatical correcta',
                'Vocabulario contextual en pasajes largos',
            ],
        },
    ],
};

export const REFERENCIA_POR_AREA: Record<AreaCanonica, AreaReferencia> = {
    'Matemáticas': MAT,
    'Lectura Crítica': LEC,
    Sociales: SOC,
    Ciencias: CIE,
    Inglés: ING,
};

export function resolverAreaCanonica(
    materiaOrArea: string
): AreaCanonica | null {
    const fromMacro = normalizarMateriaAModeloArea(materiaOrArea);
    if (fromMacro) return fromMacro as AreaCanonica;
    const m = materiaOrArea.toLowerCase();
    if (m.includes('matem')) return 'Matemáticas';
    if (m.includes('lectura')) return 'Lectura Crítica';
    if (m.includes('social') || m.includes('ciudadan')) return 'Sociales';
    if (m.includes('cienc') || m.includes('natural')) return 'Ciencias';
    if (m.includes('ingl')) return 'Inglés';
    return null;
}

export function getAreaReferencia(materiaOrArea: string): AreaReferencia | null {
    const canon = resolverAreaCanonica(materiaOrArea);
    return canon ? REFERENCIA_POR_AREA[canon] : null;
}

/** Nivel de desempeño ICFES (1–4) según puntaje de área 0–100. */
export function resolveNivelDesempeno(
    materiaOrArea: string,
    puntaje: number
): { nivel: 1 | 2 | 3 | 4; rango: NivelDesempenoRango } | null {
    const ref = getAreaReferencia(materiaOrArea);
    if (!ref) return null;
    const p = Math.max(0, Math.min(100, Math.round(puntaje)));
    const rango =
        ref.niveles.find(n => p >= n.min && p <= n.max) ??
        ref.niveles[ref.niveles.length - 1];
    return { nivel: rango.nivel, rango };
}

function accionesDesdeDiagnostico(
    area: AreaCanonica,
    nivel: number,
    competencias: CompetenciaDiagnostico[],
    posicion: { progresoEnRangoPct: number; puntosParaSiguienteNivel: number | null }
): string[] {
    const ref = REFERENCIA_POR_AREA[area];
    const urgentes = competencias.filter(c => c.estado === 'urgente' || c.estado === 'por_reforzar');
    const acc: string[] = [];

    if (posicion.progresoEnRangoPct <= 15) {
        acc.push(
            `${area}: puntaje en el piso del ${ref.niveles[nivel - 1]?.etiqueta ?? 'nivel'} (${posicion.progresoEnRangoPct}% del tramo ${ref.niveles.find(n => n.nivel === nivel)?.min}–${ref.niveles.find(n => n.nivel === nivel)?.max}). Priorizar habilidades base.`
        );
    }

    urgentes.slice(0, 3).forEach(c => {
        const hab = c.habilidadesDetalle.find(h => h.estado === 'por_reforzar');
        acc.push(
            `Prioridad ${c.prioridad} · ${c.competenciaNombre} (dominio ${c.dominioPct}%): ${hab?.nombre ?? c.habilidadesPorReforzar[0] ?? c.afirmacion}${hab ? ` — faltan ${hab.brechaRangoPct} p.p. del tramo` : ''}.`
        );
    });

    if (posicion.puntosParaSiguienteNivel != null && posicion.puntosParaSiguienteNivel <= 8) {
        acc.push(`A ${posicion.puntosParaSiguienteNivel} puntos de subir de nivel en ${area}; consolidar competencias dominadas antes del salto.`);
    }

    if (acc.length === 0) {
        acc.push(`Consolidar ${area} con micro-simulacros por competencia (dominio medio ${Math.round(competencias.reduce((s, c) => s + c.dominioPct, 0) / Math.max(1, competencias.length))}%).`);
    }
    return acc.slice(0, 5);
}

/** Diagnóstico por área a partir del puntaje 0–100 (institución o estudiante). */
export function buildAreaDiagnostico(
    materiaOrArea: string,
    puntaje: number
): AreaDiagnostico | null {
    const canon = resolverAreaCanonica(materiaOrArea);
    if (!canon) return null;
    const ref = REFERENCIA_POR_AREA[canon];
    const resolved = resolveNivelDesempeno(canon, puntaje);
    if (!resolved) return null;

    const posicion = buildNivelPosicionStats(puntaje, resolved.rango, ref.niveles);
    const habilidadesNivel = buildHabilidadesNivelDiagnostico(
        resolved.nivel,
        posicion.progresoEnRangoPct,
        ref.niveles
    );
    const competenciasRaw = ref.competencias.map(c =>
        buildCompetenciaDominioStats(
            c,
            posicion.progresoEnRangoPct,
            resolved.nivel,
            puntaje,
            ref.niveles,
            habilidadesNivel,
            resolved.rango.etiqueta
        )
    );
    const competencias: CompetenciaDiagnostico[] = assignPrioridadOrden(competenciasRaw);

    return {
        areaNombre: canon,
        puntaje: Math.round(puntaje),
        nivel: resolved.nivel,
        nivelEtiqueta: resolved.rango.etiqueta,
        descriptorNivel: resolved.rango.descriptorGeneral,
        rangoMin: posicion.rangoMin,
        rangoMax: posicion.rangoMax,
        progresoEnRangoPct: posicion.progresoEnRangoPct,
        dominioNivelPct: posicion.dominioNivelPct,
        puntosParaSiguienteNivel: posicion.puntosParaSiguienteNivel,
        etiquetaSiguienteNivel: posicion.etiquetaSiguienteNivel,
        interpretacionPosicion: posicion.interpretacionPosicion,
        habilidadesNivel,
        competencias,
        accionesSugeridas: accionesDesdeDiagnostico(canon, resolved.nivel, competencias, posicion),
        fuente: 'nivel_desempeno_icfes',
    };
}

export function buildInstitutionalCompetenciasDiagnostico(
    areas: { name: string; avg: number }[]
): AreaDiagnostico[] {
    return areas
        .map(a => buildAreaDiagnostico(a.name, a.avg))
        .filter((d): d is AreaDiagnostico => d != null)
        .sort((a, b) => a.puntaje - b.puntaje);
}

/** Puntajes por materia desde objeto `puntajes` del estudiante. */
export function buildStudentCompetenciasDiagnostico(
    puntajes: Record<string, { puntaje?: number }> | undefined
): AreaDiagnostico[] {
    if (!puntajes) return [];
    const out: AreaDiagnostico[] = [];
    for (const [materia, data] of Object.entries(puntajes)) {
        const p = Number(data?.puntaje) || 0;
        if (p <= 0) continue;
        const d = buildAreaDiagnostico(materia, p);
        if (d) out.push(d);
    }
    return out.sort((a, b) => a.puntaje - b.puntaje);
}

/** Alias plan: diagnóstico institucional por áreas. */
export const buildInstitutionAreaDiagnosis = buildInstitutionalCompetenciasDiagnostico;
/** Alias plan: diagnóstico estudiante por áreas. */
export const buildStudentAreaDiagnosis = buildStudentCompetenciasDiagnostico;

/** ¿Hay análisis por ítem usable? No implica metadata curricular/pensum. */
export function hasUsefulQuestionMetadata(
    questionAnalysis: Record<string, { total?: number; rate?: number }[]>
): boolean {
    const items = Object.values(questionAnalysis).flat();
    if (items.length < 3) return false;
    return items.some(q => (q.total ?? 0) >= 5 && (q.rate ?? 0) > 0);
}

/**
 * Plan de competencias por niveles de desempeño + marco ICFES.
 * Este panel es independiente del pensum: usa puntajes por área, no metadata por ítem.
 */
export function usesPlanPorNivelesDesempeno(
    _simulationId: string,
    _questionAnalysis: Record<string, { total?: number; rate?: number }[]>
): boolean {
    return true;
}

/** Resumen de listas para plan / Excel a partir de un diagnóstico de área. */
export function summarizeDiagnosticoForPlan(d: AreaDiagnostico) {
    const competenciasDominadas = d.competencias
        .filter(c => c.estado === 'dominada')
        .map(c => `${c.competenciaNombre} (${c.dominioPct}%)`);
    const competenciasPorReforzar = d.competencias
        .filter(c => c.estado === 'urgente' || c.estado === 'por_reforzar' || c.estado === 'en_desarrollo')
        .sort((a, b) => a.prioridad - b.prioridad)
        .map(c => `${c.competenciaNombre} (${c.dominioPct}%)`);
    const habilidadesAlcanzadas = [
        ...new Set(
            d.competencias.flatMap(c =>
                c.habilidadesDetalle.filter(h => h.estado === 'dominada').map(h => h.nombre)
            )
        ),
    ];
    const habilidadesPorReforzar = [
        ...new Set(
            d.competencias.flatMap(c =>
                c.habilidadesDetalle.filter(h => h.estado !== 'dominada').map(h => `${h.nombre} (${h.dominioPct}%)`)
            )
        ),
    ];
    return {
        competenciasDominadas,
        competenciasPorReforzar,
        habilidadesAlcanzadas,
        habilidadesPorReforzar,
        nivelIcfes: d.nivelEtiqueta,
    };
}

export function diagnosticoToExportRow(d: AreaDiagnostico): DiagnosticoNivelExportRow {
    const s = summarizeDiagnosticoForPlan(d);
    return {
        area: d.areaNombre,
        puntaje: d.puntaje,
        nivelEtiqueta: `${d.nivelEtiqueta} (${d.progresoEnRangoPct}% tramo)`,
        descriptorNivel: d.interpretacionPosicion,
        competenciasDominadas: s.competenciasDominadas.join(' · ') || '—',
        competenciasPorReforzar: s.competenciasPorReforzar.join(' · ') || '—',
        habilidadesAlcanzadas: s.habilidadesAlcanzadas.slice(0, 8).join(' · ') || '—',
        habilidadesPorReforzar: s.habilidadesPorReforzar.slice(0, 8).join(' · ') || '—',
    };
}

/** Catálogo plano área → competencia → habilidades (marco + por nivel). */
export function exportDependencyCatalogRows(): DependencyCatalogRow[] {
    const rows: DependencyCatalogRow[] = [];
    for (const ref of Object.values(REFERENCIA_POR_AREA)) {
        for (const comp of ref.competencias) {
            for (const hab of comp.habilidades) {
                for (const nivel of ref.niveles) {
                    for (const hNivel of nivel.habilidadesNivel) {
                        rows.push({
                            area: ref.areaNombre,
                            competencia: comp.nombre,
                            afirmacion: comp.afirmacion,
                            habilidadMarco: hab,
                            nivel: nivel.nivel,
                            nivelEtiqueta: nivel.etiqueta,
                            rangoMin: nivel.min,
                            rangoMax: nivel.max,
                            habilidadNivel: hNivel,
                        });
                    }
                    if (nivel.habilidadesNivel.length === 0) {
                        rows.push({
                            area: ref.areaNombre,
                            competencia: comp.nombre,
                            afirmacion: comp.afirmacion,
                            habilidadMarco: hab,
                            nivel: nivel.nivel,
                            nivelEtiqueta: nivel.etiqueta,
                            rangoMin: nivel.min,
                            rangoMax: nivel.max,
                            habilidadNivel: nivel.descriptorGeneral,
                        });
                    }
                }
            }
        }
    }
    return rows;
}

export function resolvePlanFallbackSource(
    tieneItemsCriticos: boolean,
    tieneMetadataItems: boolean
): PlanFallbackSource {
    if (tieneItemsCriticos && tieneMetadataItems) return 'hybrid';
    if (tieneItemsCriticos) return 'question_metadata';
    return 'performance_levels';
}
