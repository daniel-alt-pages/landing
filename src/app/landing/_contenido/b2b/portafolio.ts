/** Partes del Portafolio B2B 2027-1 que se muestran como diagramas. Solo contenido del PDF (página indicada). */

/** p.12: flechas del ecosistema de 4 actores. */
export const B2B_ECOSISTEMA = {
  titulo: 'El ecosistema articulado de los 4 actores',
  centro: { title: 'SEAMOSGENIOS', sub: 'Plataforma, datos y acompañamiento', text: 'Orquestador pedagógico y analítico institucional.' },
  estudiante: { title: 'Estudiante', sub: 'Formación y seguimiento', text: 'PreICFES, práctica y orientación.' },
  docentes: { title: 'Docentes', sub: 'Datos y herramientas', text: 'Sala interactiva tipo Quizizz o Kahoot y banco de preguntas.' },
  familias: { title: 'Familias', sub: 'Seguimiento sencillo', text: 'Tablero privado y 2 encuentros (3 h).' },
  directivos: { title: 'Directivos y rectoría', sub: 'Gestión y decisiones estratégicas', text: 'Panel institucional en vivo y hasta 15 h de comité.' },
  flujos: [
    'Docentes → estudiante: clases y seguimiento.',
    'Familias → estudiante: motivación y apoyo.',
    'Estudiante ↔ SEAMOSGENIOS: aprendizaje y datos.',
    'SEAMOSGENIOS ↔ docentes: herramientas y diagnósticos.',
    'SEAMOSGENIOS ↔ familias: alertas y reportes.',
    'SEAMOSGENIOS ↔ directivos: informes y planes.',
    'Directivos → docentes: respaldo y coordinación. Directivos → familias: respaldo institucional.',
  ],
};

/** p.14: fechas del acta de ejemplo (ilustrativas en el PDF). */
export const B2B_ACTA_FECHAS = ['15/05', '18/05', '12/05', '10/05'] as const;

/** p.15: umbrales y protocolo. */
export const B2B_ALERTAS_CADENA = ['Detección automática', 'Coordinación SEAMOSGENIOS', 'Estudiante', 'Familia', 'Coordinación del colegio'] as const;

/** p.19: cohorte compartida y dedicada. */
export const B2B_COHORTE = {
  compartida: {
    title: 'Cohorte compartida (estándar)',
    points: [
      'Como regla operativa, los estudiantes institucionales pueden incorporarse a las mismas clases del PreICFES de SEAMOSGENIOS.',
      'Se comparte la infraestructura académica y una experiencia amplia de comunidad.',
      'El acompañamiento, los informes, las reuniones, las configuraciones y los refuerzos de la institución sí son exclusivos.',
    ],
  },
  dedicada: {
    title: 'Cohorte dedicada (se cotiza aparte)',
    points: [
      'Para instituciones que requieren horarios, grupos o sesiones completamente exclusivas fuera de la configuración estándar.',
      'El alcance se define como una modalidad adicional.',
      'Se cotiza de manera independiente.',
    ],
  },
};

/** pp.21–22: tipos de comunicación. */
export const B2B_COMUNICACION = [
  { tipo: 'Unidireccional', canales: [{ title: 'Noticias', text: 'Información general o segmentada.' }, { title: 'Notificaciones', text: 'Alertas automáticas o recordatorios.' }] },
  { tipo: 'Multidireccional', canales: [{ title: 'Mensajería', text: 'Conversación y coordinación dentro de la plataforma.' }, { title: 'Grupos y comunidad', text: 'Interacción académica y social definida para el programa.' }] },
  { tipo: 'Formal', canales: [{ title: 'Correo', text: 'Comunicación formal y respaldo cuando corresponda.' }, { title: 'PQRS', text: 'Canal formal, trazable, con radicado, estado e historial.' }] },
  { tipo: 'Externa', canales: [{ title: 'WhatsApp', text: 'Canal complementario de coordinación rápida, sobre todo con la institución. No sustituye los canales formales.' }] },
] as const;
