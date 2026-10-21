export type IcfesAreaKey =
    | 'matemáticas'
    | 'lectura crítica'
    | 'sociales y ciudadanas'
    | 'ciencias naturales'
    | 'inglés';

export type IcfesNivelKey = 1 | 2 | 3 | 4;

export interface MarcoSkill {
    /** Identificador estable (para analytics / dedupe) */
    id: string;
    /** Competencia / Afirmación (literal Marco de Referencia) */
    afirmacion: string;
    /** Evidencia (literal Marco de Referencia) */
    evidencia: string;
    /**
     * Skill faltante: “qué no puede hacer” en el nivel superior.
     * En práctica es un resumen operacional de (afirmación + evidencia).
     */
    skillFaltante: string;
    /** Sugerencia de módulo/tema curricular (usado en CASO A) */
    moduloSugerido: string;
}

export interface MarcoNivel {
    nivel: IcfesNivelKey;
    nombre: 'Mínimo' | 'Básico' | 'Satisfactorio' | 'Avanzado';
    skills: MarcoSkill[];
}

export interface MarcoArea {
    area: IcfesAreaKey;
    niveles: Record<IcfesNivelKey, MarcoNivel>;
}

/**
 * Placeholder (scaffold) del cruce oficial:
 * Niveles de Desempeño vs Marcos de Referencia (Afirmaciones/Evidencias).
 *
 * Reemplazar por ingestión real cuando se agreguen los JSON oficiales al repo.
 */
export const MARCO_ICFES_PLACEHOLDER: Record<IcfesAreaKey, MarcoArea> = {
    'lectura crítica': {
        area: 'lectura crítica',
        niveles: {
            1: {
                nivel: 1,
                nombre: 'Mínimo',
                skills: [
                    {
                        id: 'lc-l1-01',
                        afirmacion:
                            'Identifica información explícita y reconoce relaciones simples entre enunciados.',
                        evidencia:
                            'Ubica datos literales y establece conexiones directas (causa–efecto) cuando son explícitas.',
                        skillFaltante:
                            'Ubica información explícita, pero se pierde cuando hay distractores o varias oraciones.',
                        moduloSugerido: 'Lectura literal y búsqueda de información',
                    },
                ],
            },
            2: {
                nivel: 2,
                nombre: 'Básico',
                skills: [
                    {
                        id: 'lc-l2-01',
                        afirmacion:
                            'Infiere información implícita a partir de marcas textuales y del contexto inmediato.',
                        evidencia:
                            'Deriva conclusiones locales (referentes, conectores, intención) sin que el texto lo diga literalmente.',
                        skillFaltante:
                            'Falla al inferir significados implícitos (referentes, intención) cuando el texto exige conectar pistas.',
                        moduloSugerido: 'Inferencias locales (referentes, conectores, intención)',
                    },
                ],
            },
            3: {
                nivel: 3,
                nombre: 'Satisfactorio',
                skills: [
                    {
                        id: 'lc-l3-01',
                        afirmacion:
                            'Evalúa la coherencia y la fuerza argumentativa de un texto (tesis, razones, contraargumentos).',
                        evidencia:
                            'Distingue evidencia relevante, detecta falacias simples y contrasta afirmaciones con soporte textual.',
                        skillFaltante:
                            'No evalúa bien argumentos: confunde opiniones con evidencia o no detecta contraargumentos.',
                        moduloSugerido: 'Evaluación de argumentos (tesis, evidencias, contraargumentos)',
                    },
                ],
            },
            4: {
                nivel: 4,
                nombre: 'Avanzado',
                skills: [
                    {
                        id: 'lc-l4-01',
                        afirmacion:
                            'Integra múltiples textos y perspectivas para construir una postura crítica y sustentada.',
                        evidencia:
                            'Relaciona fuentes, identifica supuestos ideológicos y sintetiza argumentos en una conclusión propia.',
                        skillFaltante:
                            'No integra fuentes ni identifica supuestos ideológicos; se queda en lectura fragmentada.',
                        moduloSugerido: 'Síntesis e inferencia de posturas ideológicas (multi-texto)',
                    },
                ],
            },
        },
    },
    'matemáticas': {
        area: 'matemáticas',
        niveles: {
            1: {
                nivel: 1, nombre: 'Mínimo',
                skills: [
                    {
                        id: 'mat-l1-01',
                        afirmacion: 'Reconoce y usa representaciones numéricas y operaciones básicas en contextos simples.',
                        evidencia: 'Realiza operaciones aritméticas elementales (suma, resta, multiplicación, división) con números enteros y fracciones sencillas en situaciones directas.',
                        skillFaltante: 'Opera con números pero falla cuando hay más de un paso o se requiere seleccionar la operación correcta.',
                        moduloSugerido: 'Operaciones numéricas y sentido numérico básico',
                    },
                    {
                        id: 'mat-l1-02',
                        afirmacion: 'Identifica figuras geométricas básicas y algunas de sus propiedades.',
                        evidencia: 'Reconoce polígonos regulares, calcula perímetros simples y compara longitudes y áreas en contextos directos.',
                        skillFaltante: 'Identifica figuras pero no aplica fórmulas de área/perímetro ni relaciona propiedades.',
                        moduloSugerido: 'Geometría plana: figuras, perímetros y áreas básicas',
                    },
                ],
            },
            2: {
                nivel: 2, nombre: 'Básico',
                skills: [
                    {
                        id: 'mat-l2-01',
                        afirmacion: 'Usa representaciones algebraicas y reconoce relaciones de variación entre magnitudes.',
                        evidencia: 'Interpreta tablas, gráficas lineales y expresiones algebraicas sencillas; reconoce patrones y regularidades en secuencias numéricas.',
                        skillFaltante: 'Lee tablas y gráficas pero no transita entre representaciones ni identifica la relación de proporcionalidad.',
                        moduloSugerido: 'Pensamiento variacional: proporcionalidad y funciones lineales',
                    },
                    {
                        id: 'mat-l2-02',
                        afirmacion: 'Resuelve problemas en contextos cotidianos usando proporcionalidad y porcentajes.',
                        evidencia: 'Aplica razones, proporciones y porcentajes en situaciones directas de la vida diaria (descuentos, tasas, mezclas).',
                        skillFaltante: 'Reconoce la proporción pero falla al trasladar el concepto a contextos no rutinarios.',
                        moduloSugerido: 'Razones, proporciones y porcentajes en contexto',
                    },
                ],
            },
            3: {
                nivel: 3, nombre: 'Satisfactorio',
                skills: [
                    {
                        id: 'mat-l3-01',
                        afirmacion: 'Formula y resuelve problemas en situaciones que requieren modelación matemática.',
                        evidencia: 'Establece relaciones entre variables, construye ecuaciones o inecuaciones, y selecciona estrategias de solución adecuadas para problemas de dos o más pasos.',
                        skillFaltante: 'Reconoce el modelo pero no lo construye autónomamente ni justifica la elección del procedimiento.',
                        moduloSugerido: 'Modelación y resolución de problemas (ecuaciones, sistemas)',
                    },
                    {
                        id: 'mat-l3-02',
                        afirmacion: 'Analiza datos estadísticos e interpreta distribuciones de probabilidad.',
                        evidencia: 'Calcula e interpreta medidas de tendencia central y dispersión; estima probabilidades en experimentos simples y compuestos.',
                        skillFaltante: 'Calcula promedios pero no interpreta variabilidad ni probabilidad en contexto.',
                        moduloSugerido: 'Estadística descriptiva y probabilidad básica',
                    },
                ],
            },
            4: {
                nivel: 4, nombre: 'Avanzado',
                skills: [
                    {
                        id: 'mat-l4-01',
                        afirmacion: 'Justifica procedimientos y razonamientos matemáticos usando argumentos lógicos y generalizaciones.',
                        evidencia: 'Demuestra propiedades, generaliza patrones a expresiones algebraicas y evalúa la validez de argumentos matemáticos en contextos abstractos.',
                        skillFaltante: 'Resuelve problemas complejos pero no articula justificaciones formales ni identifica errores de razonamiento ajenos.',
                        moduloSugerido: 'Razonamiento y argumentación matemática avanzada',
                    },
                ],
            },
        },
    },
    'sociales y ciudadanas': {
        area: 'sociales y ciudadanas',
        niveles: {
            1: {
                nivel: 1, nombre: 'Mínimo',
                skills: [
                    {
                        id: 'soc-l1-01',
                        afirmacion: 'Reconoce hechos históricos y geográficos básicos en contextos dados.',
                        evidencia: 'Ubica eventos y personajes históricos en el tiempo y el espacio; identifica características físicas y humanas de territorios concretos con apoyo de mapas o imágenes.',
                        skillFaltante: 'Ubica hechos pero no establece relaciones causales ni contextualiza en procesos históricos.',
                        moduloSugerido: 'Líneas de tiempo, espacio geográfico y contextos históricos básicos',
                    },
                    {
                        id: 'soc-l1-02',
                        afirmacion: 'Identifica instituciones y normas básicas del sistema político colombiano.',
                        evidencia: 'Reconoce las ramas del poder público, la Constitución de 1991 y derechos fundamentales en situaciones explícitas.',
                        skillFaltante: 'Nombra instituciones pero no comprende sus funciones ni las relaciona con la vida ciudadana.',
                        moduloSugerido: 'Constitución Política, ramas del poder y derechos fundamentales',
                    },
                ],
            },
            2: {
                nivel: 2, nombre: 'Básico',
                skills: [
                    {
                        id: 'soc-l2-01',
                        afirmacion: 'Establece relaciones causales entre procesos históricos, económicos y sociales.',
                        evidencia: 'Relaciona factores (políticos, económicos, culturales) con sus consecuencias en procesos históricos colombianos y latinoamericanos; analiza fuentes primarias y secundarias sencillas.',
                        skillFaltante: 'Describe procesos históricos pero no articula causas múltiples ni consecuencias a largo plazo.',
                        moduloSugerido: 'Causalidad histórica y análisis de fuentes (Colombia y América Latina)',
                    },
                    {
                        id: 'soc-l2-02',
                        afirmacion: 'Interpreta indicadores económicos y sus implicaciones sociales.',
                        evidencia: 'Lee e interpreta datos de PIB, inflación, desempleo y distribución del ingreso en contextos nacionales; relaciona política económica con calidad de vida.',
                        skillFaltante: 'Lee tablas económicas pero no interpreta tendencias ni vincula indicadores con política pública.',
                        moduloSugerido: 'Economía básica: indicadores y política económica colombiana',
                    },
                ],
            },
            3: {
                nivel: 3, nombre: 'Satisfactorio',
                skills: [
                    {
                        id: 'soc-l3-01',
                        afirmacion: 'Argumenta sobre problemáticas sociales actuales desde múltiples perspectivas.',
                        evidencia: 'Contrasta visiones distintas sobre conflicto armado, paz, democracia y derechos humanos; usa evidencia histórica y conceptual para sostener una postura.',
                        skillFaltante: 'Opina sobre temas sociales pero no construye argumentos basados en evidencia ni reconoce la complejidad de las posturas.',
                        moduloSugerido: 'Argumentación en ciencias sociales: conflicto, paz y democracia',
                    },
                    {
                        id: 'soc-l3-02',
                        afirmacion: 'Evalúa el impacto de decisiones colectivas en el bienestar y la convivencia ciudadana.',
                        evidencia: 'Analiza dilemas éticos y cívicos, evalúa políticas públicas en términos de equidad e inclusión, y propone alternativas desde el marco constitucional.',
                        skillFaltante: 'Reconoce dilemas cívicos pero no evalúa consecuencias ni vincula decisiones colectivas con derechos y deberes.',
                        moduloSugerido: 'Ética ciudadana, convivencia y políticas públicas',
                    },
                ],
            },
            4: {
                nivel: 4, nombre: 'Avanzado',
                skills: [
                    {
                        id: 'soc-l4-01',
                        afirmacion: 'Construye interpretaciones históricas y sociales sustentadas en análisis crítico de fuentes y conceptos disciplinares.',
                        evidencia: 'Relaciona procesos históricos globales con dinámicas locales, cuestiona narrativas hegemónicas y propone interpretaciones originales con soporte conceptual de las ciencias sociales.',
                        skillFaltante: 'Comprende contextos históricos complejos pero no cuestiona relatos dominantes ni articula análisis interdisciplinario.',
                        moduloSugerido: 'Pensamiento histórico crítico e interdisciplinariedad en ciencias sociales',
                    },
                ],
            },
        },
    },
    'ciencias naturales': {
        area: 'ciencias naturales',
        niveles: {
            1: {
                nivel: 1, nombre: 'Mínimo',
                skills: [
                    {
                        id: 'cn-l1-01',
                        afirmacion: 'Reconoce conceptos y fenómenos naturales básicos en situaciones cotidianas directas.',
                        evidencia: 'Identifica características de seres vivos, estados de la materia, ciclos naturales y fenómenos físicos elementales cuando se presentan de forma explícita.',
                        skillFaltante: 'Reconoce conceptos aislados pero no los aplica para explicar fenómenos o predecir resultados.',
                        moduloSugerido: 'Conceptos básicos de biología, química y física en contexto cotidiano',
                    },
                    {
                        id: 'cn-l1-02',
                        afirmacion: 'Identifica preguntas y procedimientos básicos del método científico.',
                        evidencia: 'Reconoce las etapas de una experimentación sencilla, identifica variables y distingue observación de inferencia en situaciones guiadas.',
                        skillFaltante: 'Describe pasos del método científico pero no los aplica para diseñar ni evaluar experimentos.',
                        moduloSugerido: 'Método científico e indagación básica',
                    },
                ],
            },
            2: {
                nivel: 2, nombre: 'Básico',
                skills: [
                    {
                        id: 'cn-l2-01',
                        afirmacion: 'Usa conceptos científicos para explicar fenómenos naturales y resolver situaciones-problema simples.',
                        evidencia: 'Aplica leyes y principios (conservación de energía, ciclo celular, reacciones químicas básicas) para explicar situaciones de la naturaleza o del laboratorio con pocos pasos.',
                        skillFaltante: 'Conoce leyes científicas pero falla al aplicarlas para explicar o predecir fenómenos en contextos nuevos.',
                        moduloSugerido: 'Aplicación de conceptos científicos: física, química y biología',
                    },
                    {
                        id: 'cn-l2-02',
                        afirmacion: 'Interpreta datos de experimentos y relaciona variables independientes y dependientes.',
                        evidencia: 'Lee tablas y gráficas de resultados experimentales, identifica tendencias, reconoce variables controladas y formula conclusiones sencillas.',
                        skillFaltante: 'Lee datos pero no identifica la relación entre variables ni distingue correlación de causalidad.',
                        moduloSugerido: 'Interpretación de datos experimentales y relación entre variables',
                    },
                ],
            },
            3: {
                nivel: 3, nombre: 'Satisfactorio',
                skills: [
                    {
                        id: 'cn-l3-01',
                        afirmacion: 'Diseña y evalúa procedimientos experimentales para comprobar hipótesis.',
                        evidencia: 'Formula hipótesis verificables, selecciona variables pertinentes, propone controles adecuados y evalúa la validez de los resultados en función del diseño.',
                        skillFaltante: 'Formula hipótesis pero no diseña experimentos válidos ni evalúa fuentes de error.',
                        moduloSugerido: 'Diseño experimental, hipótesis y control de variables',
                    },
                    {
                        id: 'cn-l3-02',
                        afirmacion: 'Relaciona conocimiento científico con problemáticas ambientales y tecnológicas actuales.',
                        evidencia: 'Explica impactos del cambio climático, biodiversidad, uso de energías y biotecnología desde conceptos científicos; evalúa riesgos y beneficios de desarrollos tecnológicos.',
                        skillFaltante: 'Reconoce problemáticas ambientales pero no las analiza desde marcos conceptuales científicos ni evalúa alternativas.',
                        moduloSugerido: 'Ciencia, tecnología, sociedad y ambiente (CTSA)',
                    },
                ],
            },
            4: {
                nivel: 4, nombre: 'Avanzado',
                skills: [
                    {
                        id: 'cn-l4-01',
                        afirmacion: 'Construye explicaciones científicas complejas integrando múltiples conceptos y modelos teóricos.',
                        evidencia: 'Integra conceptos de física, química y biología para explicar sistemas complejos (ecosistemas, reacciones en cadena, principios termodinámicos aplicados a seres vivos); evalúa modelos alternativos y sus limitaciones.',
                        skillFaltante: 'Maneja conceptos avanzados pero no los articula entre disciplinas ni evalúa críticamente los modelos científicos.',
                        moduloSugerido: 'Integración interdisciplinar y evaluación de modelos científicos',
                    },
                ],
            },
        },
    },
    'inglés': {
        area: 'inglés',
        niveles: {
            1: {
                nivel: 1, nombre: 'Mínimo',
                skills: [
                    {
                        id: 'ing-l1-01',
                        afirmacion: 'Comprende información explícita y específica en textos cortos y simples (nivel A-).',
                        evidencia: 'Localiza datos concretos (nombres, fechas, precios, horarios) en textos breves como avisos, formularios y mensajes simples cuando el vocabulario es familiar.',
                        skillFaltante: 'Identifica palabras sueltas pero no comprende el sentido global del texto ni infiere significados por contexto.',
                        moduloSugerido: 'Lectura de textos simples: vocabulary y comprensión literal (A-)',
                    },
                    {
                        id: 'ing-l1-02',
                        afirmacion: 'Reconoce estructuras gramaticales básicas del inglés en oraciones simples.',
                        evidencia: 'Identifica sujeto, verbo y objeto en oraciones; reconoce tiempos presente y pasado simple en contextos directos.',
                        skillFaltante: 'Reconoce palabras en inglés pero no procesa oraciones completas ni reconoce estructuras gramaticales básicas.',
                        moduloSugerido: 'Gramática básica en inglés: tiempos verbales y estructura oracional',
                    },
                ],
            },
            2: {
                nivel: 2, nombre: 'Básico',
                skills: [
                    {
                        id: 'ing-l2-01',
                        afirmacion: 'Comprende el sentido global y detalles relevantes en textos de uso cotidiano (nivel A1).',
                        evidencia: 'Identifica el tema, la idea principal y detalles de apoyo en textos cortos sobre temas familiares (rutinas, lugares, personas); infiere significado de vocabulario desconocido por contexto.',
                        skillFaltante: 'Comprende el tema general pero pierde detalles importantes o no infiere significados en vocabulario desconocido.',
                        moduloSugerido: 'Comprensión lectora intermedia: idea principal, detalles y vocabulario en contexto (A1)',
                    },
                    {
                        id: 'ing-l2-02',
                        afirmacion: 'Reconoce la intención comunicativa y el tipo textual en textos cotidianos.',
                        evidencia: 'Distingue entre textos descriptivos, narrativos e instructivos; identifica si el propósito es informar, persuadir o entretener en géneros como noticias cortas, anuncios y correos.',
                        skillFaltante: 'Lee el texto pero no distingue el propósito comunicativo ni el tipo textual.',
                        moduloSugerido: 'Tipología textual e intención comunicativa en inglés (A1–A2)',
                    },
                ],
            },
            3: {
                nivel: 3, nombre: 'Satisfactorio',
                skills: [
                    {
                        id: 'ing-l3-01',
                        afirmacion: 'Interpreta textos auténticos de mediana extensión sobre temas generales o específicos (nivel A2).',
                        evidencia: 'Comprende textos de revistas, artículos cortos o ensayos sencillos; infiere información implícita, distingue hechos de opiniones y reconoce la postura del autor.',
                        skillFaltante: 'Comprende textos directos pero falla con información implícita, ironía o postura del autor.',
                        moduloSugerido: 'Inferencia, postura del autor y comprensión de textos auténticos (A2)',
                    },
                    {
                        id: 'ing-l3-02',
                        afirmacion: 'Usa correctamente estructuras gramaticales de nivel intermedio para interpretar oraciones complejas.',
                        evidencia: 'Procesa oraciones con cláusulas subordinadas, voz pasiva, condicionales y tiempos perfectos; usa el contexto gramatical para resolver ambigüedades de significado.',
                        skillFaltante: 'Maneja tiempos simples pero falla con estructuras complejas (pasiva, condicionales, perfectos).',
                        moduloSugerido: 'Gramática intermedia en inglés: estructuras complejas y cláusulas (A2)',
                    },
                ],
            },
            4: {
                nivel: 4, nombre: 'Avanzado',
                skills: [
                    {
                        id: 'ing-l4-01',
                        afirmacion: 'Comprende textos complejos, argumentativos y técnicos, identificando matices y perspectivas implícitas (nivel B+).',
                        evidencia: 'Analiza textos extensos con vocabulario especializado; identifica recursos retóricos, evalúa la solidez de los argumentos y contrasta perspectivas en textos que abordan el mismo tema desde distintos enfoques.',
                        skillFaltante: 'Lee textos avanzados con apoyo pero no detecta matices, ironías ni evalúa críticamente la argumentación.',
                        moduloSugerido: 'Lectura crítica avanzada en inglés: argumentación y perspectivas (B+)',
                    },
                ],
            },
        },
    },
};

export const ICFES_AREA_OPTIONS: Array<{ key: IcfesAreaKey; label: string }> = [
    { key: 'matemáticas', label: 'Matemáticas' },
    { key: 'lectura crítica', label: 'Lectura Crítica' },
    { key: 'sociales y ciudadanas', label: 'Sociales y Ciudadanas' },
    { key: 'ciencias naturales', label: 'Ciencias Naturales' },
    { key: 'inglés', label: 'Inglés' },
];

export const ICFES_NIVEL_LABEL: Record<IcfesNivelKey, string> = {
    1: 'Nivel 1 (Mínimo)',
    2: 'Nivel 2 (Básico)',
    3: 'Nivel 3 (Satisfactorio)',
    4: 'Nivel 4 (Avanzado)',
};

export const ICFES_NIVEL_NAME: Record<IcfesNivelKey, MarcoNivel['nombre']> = {
    1: 'Mínimo',
    2: 'Básico',
    3: 'Satisfactorio',
    4: 'Avanzado',
};

/** Puntaje GLOBAL (escala 0–500) → nivel ICFES */
export function scoreToNivel(score: number): IcfesNivelKey | null {
    const s = Number(score) || 0;
    if (s <= 0) return null;
    if (s < 250) return 1;
    if (s < 325) return 2;
    if (s < 400) return 3;
    return 4;
}

/**
 * Umbrales oficiales ICFES por área (escala 0–100).
 * Fuente: documentos "Niveles de desempeño Saber 11° 2022" del ICFES.
 * n1Max: techo inclusive del Nivel 1 (Mínimo).
 * n2Max: techo inclusive del Nivel 2 (Básico).
 * n3Max: techo inclusive del Nivel 3 (Satisfactorio).
 * ≥ n3Max+1: Nivel 4 (Avanzado).
 */
export type AreaThresholds = { n1Max: number; n2Max: number; n3Max: number };

export const ICFES_AREA_THRESHOLDS: Record<IcfesAreaKey, AreaThresholds> = {
    'lectura crítica':       { n1Max: 35, n2Max: 50, n3Max: 65 },
    'matemáticas':           { n1Max: 35, n2Max: 50, n3Max: 70 },
    'ciencias naturales':    { n1Max: 40, n2Max: 55, n3Max: 70 },
    'sociales y ciudadanas': { n1Max: 40, n2Max: 55, n3Max: 70 },
    'inglés':                { n1Max: 36, n2Max: 57, n3Max: 70 },
};

/** Puntaje de ÁREA (escala 0–100) → nivel ICFES.
 *  Usa los umbrales oficiales por área cuando se proporciona `area`. */
export function areaScoreToNivel(score: number, area?: IcfesAreaKey): IcfesNivelKey | null {
    const s = Number(score) || 0;
    if (s <= 0) return null;
    const th: AreaThresholds = area
        ? ICFES_AREA_THRESHOLDS[area]
        : ICFES_AREA_THRESHOLDS['lectura crítica'];
    if (s <= th.n1Max) return 1;
    if (s <= th.n2Max) return 2;
    if (s <= th.n3Max) return 3;
    return 4;
}

