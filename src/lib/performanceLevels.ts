/**
 * ═══════════════════════════════════════════════════════════════════════
 *  NIVELES DE DESEMPEÑO – ICFES SABER 11° (2022)
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  Fuente oficial: PDFs publicados por el ICFES
 *  Características:
 *    • Particulares por prueba
 *    • Jerárquicos (1 → 4, complejidad creciente)
 *    • Inclusivos (cada nivel supone dominar los anteriores)
 *
 *  Los datos aquí son FIJOS y no cambian con el tiempo.
 */

// ─── Tipos ────────────────────────────────────────────────────────────

export interface NivelDesempenoDescriptor {
    /** Nivel numérico (1, 2, 3 o 4) */
    nivel: 1 | 2 | 3 | 4;
    /** Etiqueta del nivel */
    etiqueta: string;
    /** Puntaje mínimo del rango (inclusive) */
    puntajeMin: number;
    /** Puntaje máximo del rango (inclusive) */
    puntajeMax: number;
    /** Descripción general del nivel */
    descripcionGeneral: string;
    /** Lista de habilidades/competencias demostradas en este nivel */
    habilidades: string[];
}

export interface MateriaNivelesConfig {
    /** Nombre de la materia tal como se usa en el sistema */
    materia: string;
    /** Nombre completo de la prueba según ICFES */
    nombrePrueba: string;
    /** Los 4 niveles de desempeño */
    niveles: [NivelDesempenoDescriptor, NivelDesempenoDescriptor, NivelDesempenoDescriptor, NivelDesempenoDescriptor];
}

// ─── Datos por materia ────────────────────────────────────────────────

const LECTURA_CRITICA: MateriaNivelesConfig = {
    materia: 'lectura crítica',
    nombrePrueba: 'Prueba Lectura Crítica',
    niveles: [
        {
            nivel: 1,
            etiqueta: 'Nivel 1',
            puntajeMin: 0,
            puntajeMax: 35,
            descripcionGeneral: 'Identifica elementos literales en textos continuos y discontinuos sin establecer relaciones de significado.',
            habilidades: [
                'Identifica elementos literales en textos continuos y discontinuos sin establecer relaciones de significado.'
            ]
        },
        {
            nivel: 2,
            etiqueta: 'Nivel 2',
            puntajeMin: 36,
            puntajeMax: 50,
            descripcionGeneral: 'Comprende textos continuos y discontinuos de manera literal. Reconoce información explícita y la relaciona con el contexto.',
            habilidades: [
                'Identifica información local del texto.',
                'Identifica la estructura de textos continuos y discontinuos.',
                'Identifica relaciones básicas entre componentes del texto.',
                'Identifica fenómenos semánticos básicos: sinónimos y antónimos.',
                'Reconoce en un texto la diferencia entre proposición y párrafo.',
                'Reconoce el sentido local y global del texto.',
                'Identifica intenciones comunicativas explícitas.',
                'Identifica relaciones básicas: contraste, similitud y complementación entre textos presentes.'
            ]
        },
        {
            nivel: 3,
            etiqueta: 'Nivel 3',
            puntajeMin: 51,
            puntajeMax: 65,
            descripcionGeneral: 'Interpreta información de textos al inferir contenidos implícitos y reconocer estructuras, estrategias discursivas y juicios valorativos.',
            habilidades: [
                'Jerarquiza la información presente en un texto.',
                'Infiere información implícita en textos continuos y discontinuos.',
                'Establece relaciones intertextuales: definición, causa-efecto, oposición y antecedente-consecuente, entre textos presentes.',
                'Relaciona marcadores textuales en la interpretación de textos.',
                'Reconoce la intención comunicativa del texto.',
                'Reconoce la función de figuras literarias.',
                'Identifica el uso del lenguaje en contexto.',
                'Analiza y sintetiza la información contenida en un texto.',
                'Identifica la estructura sintáctica en textos discontinuos.',
                'Establece la validez de argumentos en un texto.'
            ]
        },
        {
            nivel: 4,
            etiqueta: 'Nivel 4',
            puntajeMin: 66,
            puntajeMax: 100,
            descripcionGeneral: 'Reflexiona a partir de un texto sobre la visión de mundo del autor. Da cuenta de elementos paratextuales significativos. Valora y contrasta los elementos mencionados.',
            habilidades: [
                'Propone soluciones a problemas de interpretación que subyacen en un texto.',
                'Evalúa contenidos, estrategias discursivas y argumentativas presentes en un texto.',
                'Relaciona información de dos o más textos o fragmentos de texto para llegar a una conclusión.',
                'Aplica conceptos de análisis literario para caracterizar diferentes elementos en un texto.',
                'Reconoce los contextos como elementos importantes en la valoración de un texto.',
                'Selecciona elementos locales y construye argumentos que sustentan una tesis con base en textos relacionados.',
                'Asume una postura crítica frente a los planteamientos de un texto.',
                'Plantea hipótesis de lectura a partir de las ideas presentes en un texto.'
            ]
        }
    ]
};

const MATEMATICAS: MateriaNivelesConfig = {
    materia: 'matemáticas',
    nombrePrueba: 'Prueba Matemáticas',
    niveles: [
        {
            nivel: 1,
            etiqueta: 'Nivel 1',
            puntajeMin: 0,
            puntajeMax: 35,
            descripcionGeneral: 'Lee información puntual relacionada con situaciones cotidianas presentada en tablas o gráficas con escala explícita.',
            habilidades: [
                'Lee información puntual (un dato, por ejemplo) relacionada con situaciones cotidianas y presentada en tablas o gráficas con escala explícita, cuadrícula o, por lo menos, líneas horizontales.'
            ]
        },
        {
            nivel: 2,
            etiqueta: 'Nivel 2',
            puntajeMin: 36,
            puntajeMax: 50,
            descripcionGeneral: 'Compara datos, identifica valores representativos y reconoce conceptos estadísticos básicos.',
            habilidades: [
                'Compara datos de dos variables presentadas en una misma gráfica sin necesidad de hacer operaciones aritméticas.',
                'Identifica valores o puntos representativos en diferentes tipos de registro a partir del significado que tienen en la situación.',
                'Compara la probabilidad de eventos simples cuando los casos posibles son los mismos en ambos eventos.',
                'Toma decisiones sobre la veracidad o falsedad de una afirmación cuando esta se puede explicar verbalizando la lectura directa de la información.',
                'Cambia gráficas de barras a tablas de doble entrada.',
                'Reconoce e interpreta, según el contexto, el significado de promedio simple, moda, mayor, menor, máximo y mínimo.'
            ]
        },
        {
            nivel: 3,
            etiqueta: 'Nivel 3',
            puntajeMin: 51,
            puntajeMax: 70,
            descripcionGeneral: 'Selecciona gráficas, compara información con manipulaciones aritméticas, resuelve problemas geométricos y algebraicos sencillos.',
            habilidades: [
                'Selecciona la gráfica correspondiente a la información de una tabla, teniendo en cuenta la escala, el tipo de variable y el tipo de gráfica.',
                'Compara información gráfica que requiere algunas manipulaciones aritméticas.',
                'Señala información representada en formatos no convencionales (mapas o infografías).',
                'Reconoce errores ocurridos al realizar una transformación entre diferentes tipos de registro.',
                'Reconoce desarrollos planos de una forma tridimensional y viceversa.',
                'Compara la probabilidad de eventos simples en diversos contextos, incluso cuando los casos posibles son diferentes.',
                'Selecciona información necesaria para resolver problemas que involucran operaciones aritméticas.',
                'Selecciona información necesaria para resolver problemas con figuras geométricas elementales.',
                'Cambia la escala cuando la transformación no es convencional.',
                'Justifica afirmaciones utilizando planteamientos y operaciones aritméticas o haciendo uso directo de un concepto.',
                'Identifica información relevante cuando el tipo de registro contiene información de más de tres categorías.',
                'Hace manipulaciones algebraicas sencillas (aritmética de términos semejantes).'
            ]
        },
        {
            nivel: 4,
            etiqueta: 'Nivel 4',
            puntajeMin: 71,
            puntajeMax: 100,
            descripcionGeneral: 'Resuelve problemas complejos con eventos dependientes, modelación algebraica, manipulación de expresiones y toma de decisiones con múltiples propiedades.',
            habilidades: [
                'Resuelve problemas que requieren interpretar información de eventos dependientes.',
                'Realiza transformaciones de subconjuntos de información que pueden requerir el uso de operaciones complejas (cálculos de porcentajes).',
                'Resuelve problemas que requieren construir una representación auxiliar (gráficas y fórmulas) como paso intermedio.',
                'Modela usando lenguaje algebraico información dada en lenguaje natural, tablas o representaciones geométricas.',
                'Manipula expresiones algebraicas o aritméticas haciendo uso de las propiedades de las operaciones.',
                'Modela fenómenos variacionales no explícitos haciendo uso de lenguaje simbólico o gráficas.',
                'Reconoce en diferentes formatos (árboles, listas o diagramas) el espacio muestral de un experimento aleatorio.',
                'Resuelve problemas de conteo que requieren el uso de permutaciones.',
                'Justifica si hay falta de información en una situación problema para tomar una decisión.',
                'Toma decisiones sobre la veracidad o falsedad de una afirmación cuando requiere el uso de varias propiedades o conceptualizaciones formales.'
            ]
        }
    ]
};

const CIENCIAS_NATURALES: MateriaNivelesConfig = {
    materia: 'ciencias naturales',
    nombrePrueba: 'Prueba Ciencias Naturales',
    niveles: [
        {
            nivel: 1,
            etiqueta: 'Nivel 1',
            puntajeMin: 0,
            puntajeMax: 40,
            descripcionGeneral: 'Reconoce información explícita, presentada de manera ordenada en tablas o gráficas, con un lenguaje cotidiano.',
            habilidades: [
                'Reconoce información explícita, presentada de manera ordenada en tablas o gráficas, con un lenguaje cotidiano y que implica la lectura de una sola variable independiente.'
            ]
        },
        {
            nivel: 2,
            etiqueta: 'Nivel 2',
            puntajeMin: 41,
            puntajeMax: 55,
            descripcionGeneral: 'Reconoce información en tablas, gráficas y esquemas de una sola variable independiente, y la asocia con nociones de los conceptos básicos de las ciencias naturales.',
            habilidades: [
                'Identifica patrones y características a partir de información presentada en textos, gráficas y tablas.',
                'Relaciona esquemas con nociones básicas del conocimiento científico.',
                'Establece predicciones a partir de datos presentados en tablas, gráficas y esquemas en donde se presentan patrones claramente crecientes o decrecientes.',
                'Ordena datos e información en gráficas y tablas.'
            ]
        },
        {
            nivel: 3,
            etiqueta: 'Nivel 3',
            puntajeMin: 56,
            puntajeMax: 70,
            descripcionGeneral: 'Interrelaciona conceptos, leyes y teorías científicas con información presentada en diversos contextos, en los que intervienen dos o más variables.',
            habilidades: [
                'Establece relaciones de causa-efecto usando conceptos, leyes y teorías científicas.',
                'Interpreta gráficas, tablas y modelos para hacer predicciones.',
                'Establece relaciones entre conceptos, leyes y teorías científicas con diseños experimentales y sus resultados.',
                'Diferencia entre evidencias y conclusiones.',
                'Plantea hipótesis basadas en evidencias.',
                'Relaciona variables para explicar algunos fenómenos naturales.'
            ]
        },
        {
            nivel: 4,
            etiqueta: 'Nivel 4',
            puntajeMin: 71,
            puntajeMax: 100,
            descripcionGeneral: 'Usa conceptos, teorías o leyes en la solución de situaciones problema que involucran procedimientos, habilidades, conocimientos y un lenguaje propio de las ciencias naturales.',
            habilidades: [
                'Plantea preguntas de investigación desde las ciencias naturales a partir de un contexto determinado.',
                'Establece conclusiones derivadas de una investigación.',
                'Contrasta modelos de las ciencias naturales con fenómenos cotidianos.',
                'Resuelve situaciones problema haciendo uso de conceptos, leyes y teorías de las ciencias naturales.',
                'Comunica resultados de procesos de investigación científica.',
                'Analiza fenómenos naturales con base en los procedimientos propios de la investigación científica.'
            ]
        }
    ]
};

const SOCIALES_CIUDADANAS: MateriaNivelesConfig = {
    materia: 'sociales y ciudadanas',
    nombrePrueba: 'Prueba Sociales y Ciudadanas',
    niveles: [
        {
            nivel: 1,
            etiqueta: 'Nivel 1',
            puntajeMin: 0,
            puntajeMax: 40,
            descripcionGeneral: 'Reconoce derechos ciudadanos básicos, factores generadores de conflicto y creencias que explican comportamientos.',
            habilidades: [
                'Reconoce algunos derechos ciudadanos en situaciones sencillas.',
                'Reconoce factores que generan un conflicto.',
                'Identifica creencias que explican algunos comportamientos.'
            ]
        },
        {
            nivel: 2,
            etiqueta: 'Nivel 2',
            puntajeMin: 41,
            puntajeMax: 55,
            descripcionGeneral: 'Reconoce deberes del Estado colombiano y situaciones de protección o vulneración de derechos en el marco del Estado social de derecho.',
            habilidades: [
                'Identifica relaciones entre conductas de las personas y sus cosmovisiones.',
                'Reconoce las dimensiones presentes en una situación, problema, decisión tomada o propuesta de solución. Además, contextualiza fuentes y procesos sociales.',
                'Identifica derechos ciudadanos y deberes del Estado establecidos en la Constitución Política de Colombia.',
                'Relaciona la conducta de una persona con su cosmovisión o forma de entender el mundo.',
                'Reconoce los efectos de una solución y las dimensiones que privilegia.',
                'Identifica contextos o procesos en los que se inscribe una fuente o evento.'
            ]
        },
        {
            nivel: 3,
            etiqueta: 'Nivel 3',
            puntajeMin: 56,
            puntajeMax: 70,
            descripcionGeneral: 'Identifica prejuicios o intenciones contenidos en una afirmación y reconoce las dimensiones e intereses involucrados en un problema o alternativa de solución.',
            habilidades: [
                'Valora y contextualiza la información presentada en una fuente.',
                'Reconoce intenciones y prejuicios, así como argumentos similares o diferentes dados en un contexto o una situación específica.',
                'Identifica dimensiones (económicas, políticas, culturales, ambientales, etc.) involucradas en situaciones, problemáticas o propuestas de solución.',
                'Identifica y compara opiniones e intereses de diferentes actores involucrados en una situación problemática y establece relaciones entre esas posturas y posibles soluciones.',
                'Reconoce algunos conceptos básicos de las ciencias sociales.',
                'Identifica supuestos y usos de algunos modelos conceptuales.',
                'Relaciona contextos históricos y/o geográficos con fuentes, situaciones y prácticas sociales.',
                'Valora la información contenida en una fuente y reconoce sus alcances.'
            ]
        },
        {
            nivel: 4,
            etiqueta: 'Nivel 4',
            puntajeMin: 71,
            puntajeMax: 100,
            descripcionGeneral: 'Conoce procedimientos constitucionales, compara argumentos e intereses, y analiza fuentes primarias y secundarias con profundidad.',
            habilidades: [
                'Conoce los procedimientos de reforma a la Constitución Política de Colombia, los mecanismos de participación ciudadana y las funciones de los organismos de control.',
                'Compara enunciados o argumentos, así como intereses y posiciones de actores en contextos en los que se discuten situaciones problemáticas o sus alternativas de solución.',
                'Relaciona propuestas de solución a un problema con su contexto de implementación o con sus posibles impactos en ciertas dimensiones.',
                'Entiende problemáticas, eventos o procesos sociales a partir del uso de conceptos básicos de las ciencias sociales o a partir de contextos históricos y/o geográficos.',
                'Analiza fuentes (primarias y secundarias) para valorar inferencias o identificar intenciones, características de los actores involucrados y contextos.',
                'Establece relaciones entre modelos conceptuales y fuentes que los abordan o decisiones sociales que los aplican.'
            ]
        }
    ]
};

const INGLES: MateriaNivelesConfig = {
    materia: 'inglés',
    nombrePrueba: 'Prueba Inglés',
    niveles: [
        {
            nivel: 1,
            etiqueta: 'Pre A1',
            puntajeMin: 0,
            puntajeMax: 36,
            descripcionGeneral: 'Reconoce y comprende información simple e identifica vocabulario básico de su entorno.',
            habilidades: [
                'Comprende oraciones, preguntas, instrucciones o conversaciones cuando se utiliza vocabulario simple.',
                'Identifica palabras simples en frases sencillas que incluyen personas o lugares que le son familiares en su cotidianidad.'
            ]
        },
        {
            nivel: 2,
            etiqueta: 'A1',
            puntajeMin: 37,
            puntajeMax: 57,
            descripcionGeneral: 'Comprende enunciados simples relacionados con situaciones comunicativas sencillas y cotidianas, que incluyen la interpretación y la descripción de su entorno.',
            habilidades: [
                'Identifica el uso de lenguaje básico para proporcionar información personal, saludos, despedidas, indicaciones de lugares y acciones del presente.',
                'Entiende información e indicaciones que encuentra en avisos de acuerdo con el contexto donde se aplica.'
            ]
        },
        {
            nivel: 3,
            etiqueta: 'A2',
            puntajeMin: 58,
            puntajeMax: 70,
            descripcionGeneral: 'Comprende información específica en textos informativos y descriptivos sencillos.',
            habilidades: [
                'Comprende textos que abordan temáticas relacionadas con sus contextos inmediatos, tales como ocupaciones, personas, objetos, lugares o situaciones familiares.',
                'Identifica vocabulario simple en textos cortos que narran acciones o eventos presentes, pasados o futuros.',
                'Interpreta enunciados que expresan puntos de vista particulares en una situación comunicativa simple.',
                'Identifica y comprende información literal o parafraseada en textos cortos.'
            ]
        },
        {
            nivel: 4,
            etiqueta: 'B1',
            puntajeMin: 71,
            puntajeMax: 100,
            descripcionGeneral: 'Posee vocabulario y estructuras del lenguaje que le permiten inferir y comprender un mayor rango de textos que abarcan temáticas de diferentes campos.',
            habilidades: [
                'Comprende textos sobre temas generales y específicos en ámbitos como el laboral, académico, cultural y personal.',
                'Infiere el significado de palabras desconocidas a partir del contexto dado.',
                'Identifica puntos de vista como sentimientos, deseos e intenciones en escritos determinados.'
            ]
        }
    ]
};

// ─── Mapa indexado por nombre de materia ──────────────────────────────

export const NIVELES_DESEMPENO: Record<string, MateriaNivelesConfig> = {
    'lectura crítica': LECTURA_CRITICA,
    'matemáticas': MATEMATICAS,
    'ciencias naturales': CIENCIAS_NATURALES,
    'sociales y ciudadanas': SOCIALES_CIUDADANAS,
    'inglés': INGLES,
};

// ─── Funciones utilitarias ────────────────────────────────────────────

/**
 * Determina el nivel de desempeño de un estudiante en una materia dado su puntaje.
 * Retorna el descriptor del nivel alcanzado.
 */
/** Nivel global ICFES (suma 5 áreas, escala ~0–500). Misma lógica que pipeline. */
export function getNivelDesempenoGlobal(puntajeGlobal: number): string {
    if (puntajeGlobal >= 400) return 'Superior';
    if (puntajeGlobal >= 350) return 'Alto';
    if (puntajeGlobal >= 300) return 'Medio';
    return 'Bajo';
}

export function getNivelDesempeno(materia: string, puntaje: number): NivelDesempenoDescriptor | null {
    const config = NIVELES_DESEMPENO[materia.toLowerCase()];
    if (!config) return null;

    // Los niveles están ordenados 1 → 4; recorremos de mayor a menor para
    // encontrar el nivel más alto que el estudiante alcanza.
    for (let i = config.niveles.length - 1; i >= 0; i--) {
        if (puntaje >= config.niveles[i].puntajeMin) {
            return config.niveles[i];
        }
    }
    return config.niveles[0];
}

/**
 * Obtiene las habilidades que el estudiante domina (su nivel + los inferiores)
 * y las que le falta desarrollar (niveles superiores).
 */
export function getPerfilHabilidades(materia: string, puntaje: number): {
    nivelActual: NivelDesempenoDescriptor;
    habilidadesDominadas: string[];
    habilidadesEnDesarrollo: string[];
    habilidadesPorDesarrollar: string[];
    nivelSiguiente: NivelDesempenoDescriptor | null;
    progreso: number; // 0-100 progreso dentro del nivel actual
    progresoGlobal: number; // 0-100 progreso de 0 a nivel 4
    esPuntajePerfecto: boolean;
} | null {
    const config = NIVELES_DESEMPENO[materia.toLowerCase()];
    if (!config) return null;

    const nivelActual = getNivelDesempeno(materia, puntaje);
    if (!nivelActual) return null;

    const habilidadesDominadas: string[] = [];
    const habilidadesEnDesarrollo: string[] = [];
    const habilidadesPorDesarrollar: string[] = [];

    // Si es puntaje máximo (100 pts), TODAS las habilidades son dominadas sin excepción
    const esPuntajeMaximo = puntaje >= 100;
    // También consideramos "dominado el nivel actual" si el estudiante está en el
    // nivel más alto (nivel 4) Y alcanzó el puntaje máximo de ese nivel
    const esNivelMaximoDominado = esPuntajeMaximo ||
        (nivelActual.nivel === 4 && puntaje >= nivelActual.puntajeMax);

    for (const nivel of config.niveles) {
        if (esNivelMaximoDominado) {
            // Puntaje perfecto o nivel máximo alcanzado → TODO es dominado
            habilidadesDominadas.push(...nivel.habilidades);
        } else if (nivel.nivel < nivelActual.nivel) {
            // Niveles completamente superados
            habilidadesDominadas.push(...nivel.habilidades);
        } else if (nivel.nivel === nivelActual.nivel) {
            // Nivel actual: las habilidades están "en desarrollo" (parcialmente adquiridas)
            habilidadesEnDesarrollo.push(...nivel.habilidades);
        } else {
            // Niveles superiores: por desarrollar
            habilidadesPorDesarrollar.push(...nivel.habilidades);
        }
    }

    // Nivel siguiente
    const idxActual = config.niveles.findIndex(n => n.nivel === nivelActual.nivel);
    const nivelSiguiente = idxActual < config.niveles.length - 1
        ? config.niveles[idxActual + 1]
        : null;

    // Progreso dentro del nivel actual (0-100)
    const rangoNivel = nivelActual.puntajeMax - nivelActual.puntajeMin;
    const progresoDentro = rangoNivel > 0
        ? Math.min(100, Math.max(0, ((puntaje - nivelActual.puntajeMin) / rangoNivel) * 100))
        : 100;

    // Progreso global (nivel 1 = 0-25%, nivel 2 = 25-50%, etc.)
    const baseGlobal = (nivelActual.nivel - 1) * 25;
    const progresoGlobal = baseGlobal + (progresoDentro * 25) / 100;

    return {
        nivelActual,
        habilidadesDominadas,
        habilidadesEnDesarrollo,
        habilidadesPorDesarrollar,
        nivelSiguiente,
        progreso: Math.round(progresoDentro),
        progresoGlobal: Math.round(progresoGlobal),
        esPuntajePerfecto: puntaje === 100,
    };
}

/**
 * Config visual por nivel para componentes de UI
 */
export function getNivelVisualConfig(nivel: number): {
    color: string;
    bgGradient: string;
    borderColor: string;
    textColor: string;
    glowColor: string;
    emoji: string;
    badgeClass: string;
} {
    switch (nivel) {
        case 4:
            return {
                color: 'emerald',
                bgGradient: 'from-emerald-500/20 to-teal-500/10',
                borderColor: 'border-emerald-500/30',
                textColor: 'text-emerald-400',
                glowColor: 'bg-emerald-500/20',
                emoji: '🏆',
                badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            };
        case 3:
            return {
                color: 'blue',
                bgGradient: 'from-blue-500/20 to-cyan-500/10',
                borderColor: 'border-blue-500/30',
                textColor: 'text-blue-400',
                glowColor: 'bg-blue-500/20',
                emoji: '⭐',
                badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            };
        case 2:
            return {
                color: 'amber',
                bgGradient: 'from-amber-500/20 to-orange-500/10',
                borderColor: 'border-amber-500/30',
                textColor: 'text-amber-400',
                glowColor: 'bg-amber-500/20',
                emoji: '📚',
                badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            };
        default:
            return {
                color: 'rose',
                bgGradient: 'from-rose-500/20 to-red-500/10',
                borderColor: 'border-rose-500/30',
                textColor: 'text-rose-400',
                glowColor: 'bg-rose-500/20',
                emoji: '🚀',
                badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
            };
    }
}
