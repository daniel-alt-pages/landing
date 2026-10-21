export const PAGINAS = {
  plataforma: {
    eyebrow: 'Plataforma',
    title: ['Datos claros para', 'decidir a tiempo'],
    lead: 'Vea en video lo que verá su coordinación y cada estudiante. El método, la analítica y la práctica diaria, listos para decidir si este es el modelo de su institución.',
  },
  programas: {
    eyebrow: 'Programas',
    title: ['El año completo', 'en un solo calendario'],
    lead: 'Intensivo, vacacional y simulacros abiertos. Usted ve qué pasa cada semana y cuál prueba corresponde a cada grupo.',
  },
  instituciones: {
    eyebrow: 'Portafolio B2B · Calendario B-A 2027-1',
    title: ['Preparación Saber 11 medible y acompañada', 'para que más estudiantes lleguen a la universidad.'],
    lead: 'Propuesta base para Colegios y Consejos Directivos. La institución elige la profundidad: evaluación puntual, formación focalizada o programa integral.',
  },
  resultados: {
    eyebrow: 'Resultados',
    title: ['La evidencia', 'habla por nosotros'],
    lead: '500/500, mejoras de más de 100 puntos y los mensajes de estudiantes del Calendario A 2026. La evidencia que un rector puede mostrar.',
  },
  nosotros: {
    eyebrow: 'Nosotros',
    title: ['Jóvenes que ya', 'recorrieron el camino'],
    lead: 'Un fundador reconocido por Samsung Innovation Campus y un equipo de tutores de las mejores universidades del país, con puntajes que hoy enseñan a alcanzar.',
  },
} as const;

export const CIERRE = {
  title: ['Su institución puede', 'ser el próximo caso'],
  lead: '30 minutos para ver la plataforma con sus datos en mente, o el simulacro gratis para probarlo con los grados 9, 10 y 11. Le respondemos en un día hábil.',
  cards: [
    {
      id: 'reunion',
      title: 'Reunión de 30 minutos',
      text: 'Vea la plataforma en vivo: el panel de rectoría y el de cada estudiante. Resolvemos dudas de calendario, de los grados 9, 10 y 11, y del primer simulacro. Sin costo y sin compromiso.',
      cta: 'Agendar reunión de 30 min',
      mascot: '/landing/mascotas/ingles.webp',
      mascotAlt: 'Mascota de SEAMOSGENIOS frente a un computador, lista para mostrar la plataforma',
    },
    {
      id: 'simulacro',
      title: 'Simulacro gratis',
      text: 'Un simulacro con el formato del Saber 11 para los grados 9, 10 y 11. En la semana siguiente cada estudiante tiene su análisis y su rectoría, el panel de coordinación. No obliga a contratar.',
      cta: 'Solicitarlo',
      mascot: '/landing/mascotas/lectura-critica.webp',
      mascotAlt: 'Mascota de SEAMOSGENIOS con libros, lista para el simulacro',
    },
    {
      id: 'whatsapp',
      title: 'Hablar por WhatsApp',
      text: 'Un asesor institucional le escribe directo para agendar la reunión o coordinar el simulacro. Puede preguntar por cupos, fechas y qué necesita su colegio. Respondemos en un día hábil.',
      cta: 'Abrir WhatsApp',
      mascot: '/landing/mascotas/sociales-ciudadanas.webp',
      mascotAlt: 'Mascota de SEAMOSGENIOS señalando, lista para conversar',
    },
  ],
  formTitulo: 'Cuéntenos de su institución',
  formLead: 'Un asesor le contactará para agendar la reunión o coordinar el simulacro.',
} as const;
