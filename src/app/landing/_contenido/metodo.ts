export const METODO = {
  eyebrow: 'Método ADPMH',
  title: ['Cada respuesta', 'cuenta una historia'],
  lead: 'SEAMOSGENIOS patrocina el sistema ADPMH: análisis detallado para mejorar habilidades. Un simulacro deja de ser una nota y se convierte en una lectura precisa de qué sabe cada estudiante y qué le falta.',
  pasos: [
    {
      n: '01',
      title: 'Medición',
      text: 'El simulacro replica el formato Saber 11. Cada respuesta queda ligada al estudiante, al área y a la sesión.',
    },
    {
      n: '02',
      title: 'Rúbrica',
      text: 'Cruzamos cada respuesta con la competencia, la dificultad y el tipo de pregunta. Un error deja de ser solo “incorrecto”.',
    },
    {
      n: '03',
      title: 'Reporte',
      text: 'El estudiante ve qué repetir. Su coordinación ve el grupo, las brechas y a quién acompañar primero.',
    },
    {
      n: '04',
      title: 'Siguiente paso',
      text: 'Desafíos convierte el diagnóstico en práctica diaria, con el mismo banco de preguntas.',
    },
  ],
} as const;

export const CAPAS = {
  eyebrow: 'Analítica en cinco capas',
  title: ['De la respuesta individual', 'a la decisión institucional'],
  lead: 'Un proceso con base científica, sin promesas de diagnóstico clínico y sin reemplazar el criterio de sus docentes.',
  items: [
    {
      n: '01',
      title: 'Medición educativa',
      text: 'Respuestas trazables por estudiante, área y sesión. Evidencia estructurada, no una nota aislada.',
    },
    {
      n: '02',
      title: 'Procesamiento psicométrico',
      text: 'Puntajes, distribuciones, niveles de desempeño y señales de consistencia para leer patrones de error.',
    },
    {
      n: '03',
      title: 'Analítica por estudiante',
      text: 'Desempeño global, áreas fuertes, áreas críticas, ranking, histórico y foco de estudio.',
    },
    {
      n: '04',
      title: 'Analítica institucional',
      text: 'La información agregada por curso y grado para priorizar refuerzos con evidencia, no con impresiones.',
    },
    {
      n: '05',
      title: 'Ciclo de retroalimentación',
      text: 'Clases en vivo, grabaciones y reportes cierran el ciclo entre medir, explicar, repasar y volver a decidir.',
    },
  ],
} as const;

export const DESAFIOS = {
  eyebrow: 'Desafíos',
  title: ['Práctica diaria que', 'crea hábito de estudio'],
  lead: 'Entre un simulacro y otro, sus estudiantes no se desconectan. Desafíos los lleva por niveles cortos, al estilo de las mejores apps de aprendizaje, con el rigor del banco de preguntas ICFES.',
  items: [
    {
      title: 'Niveles de 10 preguntas',
      text: 'Sesiones ágiles por área y competencia. Cada nivel tiene una meta clara y entrega resultados al instante.',
    },
    {
      title: 'Diagnóstico en cada cierre',
      text: 'Al terminar, el estudiante identifica qué competencia domina y cuál debe reforzar, junto con su historial acumulado.',
    },
    {
      title: 'Experiencia, rachas y cofres',
      text: 'Cada actividad suma puntos de experiencia. Al subir de nivel y mantener su racha diaria, el estudiante desbloquea recompensas que mantienen alta su constancia.',
    },
    {
      title: 'Revisión pregunta por pregunta',
      text: 'Cualquier nivel superado se puede consultar nuevamente con su respectiva retroalimentación y explicación paso a paso.',
    },
  ],
  nota: 'Desafíos complementa el simulacro. El puntaje global de 0 a 500 siempre sale del simulacro completo.',
} as const;

export const RUTA_DOMINIO = {
  eyebrow: 'Hacia la red neuronal',
  title: ['Personalización que', 'se construye con datos'],
  lead: 'Personalizar solo con “acertó o falló” produce recomendaciones superficiales. Por eso nuestra ruta avanza por fases, y cada una se apoya en la anterior.',
  fases: [
    { n: '1', title: 'Metadata', text: 'Cada pregunta lleva rúbrica, competencia, intención y dificultad.' },
    { n: '2', title: 'Eventos', text: 'Cada respuesta queda registrada con su contexto.' },
    { n: '3', title: 'Reglas', text: 'Recomendaciones basadas en criterios pedagógicos explícitos.' },
    { n: '4', title: 'Modelo estadístico', text: 'Patrones de desempeño a partir de miles de respuestas.' },
    { n: '5', title: 'Red neuronal', text: 'Personalización avanzada sobre una base de datos estable.' },
  ],
  nota: 'Hoy los reportes se generan con reglas y estadística. La red neuronal es la siguiente fase de la ruta.',
} as const;

export const CALENDARIO_2026 = {
  eyebrow: 'Calendario A 2026',
  estudiantes: 72,
  promedio: 358,
  maximo: 476,
  sobre400: 15,
  nota: 'Ranking de Seamos Genios, corte del 1 de octubre de 2026: 72 estudiantes con puntaje publicado. Promedio redondeado.',
} as const;
