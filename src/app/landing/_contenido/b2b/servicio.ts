/** Plataforma, simulacros, entregables y gobierno del servicio B2B. */

export type MarcaEntrega = 'si' | 'parcial' | 'no';

export function marcaEntregable(celda: string): MarcaEntrega {
  const texto = celda.toLowerCase();
  if (texto.startsWith('no aplica') || texto.startsWith('no incluye') || texto === 'no') return 'no';
  if (texto === 'incluido' || texto.startsWith('incluid')) return 'si';
  return 'parcial';
}

export const B2B_MODULOS_VISIBLES = ['Tablero', 'Resultados', 'Alertas', 'Comunicación'] as const;

export const B2B_PLATAFORMA = {
  eyebrow: 'Plataforma',
  title: ['Evaluación, plataforma,', 'datos y analítica'] as const,
  lead: 'La plataforma conecta la experiencia académica con el seguimiento y ofrece una vista según el rol.',
  headers: ['Módulo', 'Estudiante', 'Familia', 'Docente o directivo'],
  rows: [
    ['Tablero', 'Avance personal', 'Avance del hijo', 'Vista institucional y de grupos'],
    ['Calendario', 'Clases y enlaces', 'Consulta de agenda', 'Seguimiento de la programación'],
    ['Asistencia', 'Histórico personal', 'Asistencia del hijo', 'Institución y grupos'],
    ['Evaluaciones', 'Pruebas y simulacros', 'Resultados del hijo', 'Resultados agregados y autorizados'],
    ['Resultados', 'Detalle individual', 'Detalle del hijo', 'Institución, grupos, áreas y competencias'],
    ['Material y grabaciones', 'Acceso', 'Según la configuración', 'Según los permisos'],
    ['Comunicación', 'Noticias, mensajería y grupos', 'Noticias y PQRS', 'Noticias, mensajería y PQRS'],
    ['Alertas', 'Personales', 'Del hijo', 'Institucionales'],
  ],
  grabaciones: [
    'Las clases y encuentros sincrónicos se graban, se guardan en el ecosistema de SEAMOSGENIOS y se publican para los usuarios autorizados.',
    'Meet puede generar notas, transcripciones y el chat del encuentro.',
    'El uso público o promocional de imagen o voz no está incluido y requiere autorización.',
  ],
  asistencia: 'La asistencia se captura desde Google Meet. Las excepciones pueden requerir validación. El estudiante debe entrar con su cuenta o con su nombre completo; si no se identifica, la asistencia no puede garantizarse.',
};

export const B2B_SIMULACROS = {
  title: ['Simulacros de', 'SEAMOSGENIOS'] as const,
  headers: ['Aspecto', 'Definición'],
  rows: [
    ['Diseño', 'Instrumentos tipo Saber 11, construidos y revisados por SEAMOSGENIOS.'],
    ['Configuración', 'Ventana, población, dificultad y alcance según el producto.'],
    ['Aplicación', 'Preferentemente digital. La aplicación física la gestiona la institución, en las condiciones indicadas.'],
    ['Calificación', 'Modelo de evaluación y analítica de SEAMOSGENIOS.'],
    ['Control', 'Validación de claves, resultados e incidencias antes de publicar.'],
    ['Resultado', 'Reporte individual e institucional, según el nivel contratado.'],
    ['Retroalimentación', 'Espacios en vivo cuando el producto los incluye.'],
  ],
  rigor: 'Los cambios se reportan como avance observado. Comparar cohortes no prueba que el programa sea la única causa.',
  dedicada: 'Horarios, grupos o sesiones exclusivas fuera del estándar se cotizan aparte.',
  analitica: [
    'Puntaje global y por área.',
    'Distribuciones, percentiles y comparativos.',
    'Competencias y preguntas críticas.',
    'Por grupo y por cohorte.',
    'Evolución histórica, si hay mediciones previas.',
    'Alertas de rendimiento, inasistencia o participación en el Nivel 3.',
    'Benchmark anonimizado de instituciones focalizadas y comparativos externos.',
  ],
  cohorte: 'Por regla operativa, los estudiantes institucionales pueden unirse a las clases del PreICFES de SEAMOSGENIOS y compartir infraestructura académica y comunidad. El acompañamiento, los informes, las reuniones, las configuraciones y los refuerzos de la institución sí son exclusivos.',
};

export const B2B_ENTREGABLES = {
  title: ['Entregables', 'e informes'] as const,
  lead: 'Los entregables dependen del nivel contratado. Esta es la configuración estándar.',
  headers: ['Entregable', 'Nivel 1', 'Nivel 2', 'Nivel 3'],
  rows: [
    ['Resultado individual de simulacro', 'Incluido', 'Incluido', 'Incluido'],
    ['Informe institucional por aplicación', 'Incluido', 'Incluido', 'Incluido'],
    ['Benchmark de instituciones focalizadas', 'Incluido', 'Incluido', 'Incluido'],
    ['Socialización de resultados', 'Incluido', 'Incluido', 'Incluido'],
    ['Plan de formación focalizada', 'No aplica', 'Incluido', 'Según la necesidad'],
    ['Clases focalizadas', 'No aplica', 'Complemento ampliable', 'Incluidas en el programa y en los refuerzos'],
    ['Grabaciones y material de formación', 'No aplica', 'Incluido', 'Incluido'],
    ['Tablero continuo', 'No aplica', 'Parcial', 'Incluido'],
    ['Seguimiento de asistencia y actividad', 'No aplica', 'Limitado a la intervención', 'Incluido'],
    ['Encuentros con familias', 'No aplica', 'No aplica', 'Incluido'],
    ['Cortes institucionales', 'No aplica', 'Cierre de la intervención', 'Incluido'],
    ['Plan de acción', 'Recomendaciones', 'Básico', 'Incluido'],
    ['Informe histórico', 'Si hay datos y se acuerda', 'Si hay datos y se acuerda', 'Incluido, con más profundidad'],
    ['Plan de mejora interciclo', 'No aplica', 'No aplica', 'Incluido en la modalidad anual'],
  ],
  extra: [
    'Simulacro o instrumento exclusivo para la institución.',
    'Simulacros adicionales.',
    'Horas focalizadas adicionales al paquete contratado.',
    'Cohortes o franjas horarias dedicadas.',
    'Informes extraordinarios o cortes adicionales.',
    'Sesiones adicionales con familias, docentes o directivos.',
    'Configuraciones especiales de plataforma o integración.',
  ],
};

export const B2B_GOBIERNO = {
  eyebrow: 'Gobierno',
  title: ['Gobierno del servicio', 'y corresponsabilidad'] as const,
  lead: 'La mejora requiere responsabilidades claras. SEAMOSGENIOS acompaña, y no sustituye el compromiso del estudiante, la familia o la institución.',
  partes: [
    { title: 'SEAMOSGENIOS', text: 'Presta el servicio contratado: enseñar, evaluar, analizar, informar, acompañar, operar la plataforma, gestionar entregables y atender los canales.' },
    { title: 'Institución', text: 'Da información correcta y oportuna, designa responsables, facilita la comunicación, promueve la participación y atiende alertas y compromisos internos.' },
    { title: 'Estudiante', text: 'Asiste, se identifica, presenta las evaluaciones, participa y cumple las reglas de convivencia y de uso de la plataforma.' },
    { title: 'Familia', text: 'Acompaña, consulta el seguimiento, atiende las alertas y usa los canales formales.' },
    { title: 'Docentes y directivos', text: 'Interpretan la información, participan en los cortes y convierten los hallazgos en acciones.' },
  ],
  roles: [
    ['Dirección y líder de cuenta', 'Relación institucional, decisiones de alcance y escalamiento.'],
    ['Coordinación académica', 'Planeación, seguimiento, análisis, informes y reuniones.'],
    ['Liderazgo tecnológico', 'Plataforma, calificación, analítica, reportes y soporte de arquitectura.'],
    ['Tutores', 'Formación, retroalimentación y acompañamiento académico.'],
    ['Administración y soporte', 'Usuarios, accesos, atención operativa, pagos, facturación y PQRS.'],
  ],
};

export const B2B_CANALES = {
  title: ['Comunicaciones,', 'soporte y PQRS'] as const,
  lead: 'Cada canal cumple una función distinta, para que la información crítica no quede dispersa.',
  canales: [
    { title: 'Noticias', text: 'Información institucional, general o segmentada. Comunicación unidireccional.' },
    { title: 'Mensajería', text: 'Conversación y coordinación dentro de la plataforma.' },
    { title: 'PQRS', text: 'Canal formal, trazable, con radicado, estado e historial.' },
    { title: 'Notificaciones', text: 'Alertas automáticas o recordatorios.' },
    { title: 'Grupos y comunidad', text: 'Interacción académica y social definida para el programa.' },
    { title: 'Correo', text: 'Comunicación formal y respaldo cuando corresponde.' },
    { title: 'WhatsApp', text: 'Coordinación rápida con la institución. No sustituye los canales formales.' },
  ],
  flujo: ['Radicar, con número de caso.', 'Clasificar tipo y prioridad.', 'Asignar un responsable.', 'Gestionar con evidencia.', 'Responder y cerrar, con el tiempo y el resultado.'],
};

export const B2B_CALIDAD = {
  title: ['Indicadores de seguimiento', 'y calidad'] as const,
  lead: 'Los indicadores orientan acciones. No todos son garantías contractuales de resultado.',
  tipos: [
    { title: 'Alcance', text: 'Estudiantes vinculados, estudiantes activos y grupos.' },
    { title: 'Ejecución', text: 'Clases programadas y realizadas, horas ejecutadas y simulacros aplicados.' },
    { title: 'Participación', text: 'Asistencia, actividad en la plataforma, pruebas presentadas y desafíos completados.' },
    { title: 'Académico', text: 'Puntaje, áreas, competencias, ganancia observada y evolución por prueba.' },
    { title: 'Alertas', text: 'Inasistencia, inactividad, evaluaciones no presentadas y bajo rendimiento.' },
    { title: 'Institucional', text: 'Cortes realizados, acciones acordadas y avance de compromisos.' },
    { title: 'Servicio', text: 'PQRS, incidencias, tiempos de atención y satisfacción.' },
    { title: 'Continuidad', text: 'Renovación, participación en el siguiente ciclo y plan de mejora ejecutado.' },
  ],
  sla: [
    'Horas dictadas.',
    'Simulacros aplicados.',
    'Informes entregados a tiempo.',
    'Publicación de resultados.',
    'Plataforma disponible.',
    'Reuniones realizadas.',
    'Atención oportuna de PQRS.',
  ],
  observados: [
    'Puntaje global.',
    'Incremento de puntos y porcentaje de mejora.',
    'Avance observado.',
    'Resultados del Saber 11 publicados por el ICFES.',
    'Delta de puntaje, retención y desempeño en el Saber 11.',
    'Resultado de la institución en el Saber 11 (ICFES).',
  ],
  promesa: 'SEAMOSGENIOS no promete un puntaje específico: el resultado requiere el compromiso de toda la comunidad educativa. Se garantiza un sistema riguroso para alcanzarlo.',
};
