export type FaqItem = {
  question: string;
  answer: string;
  confirmar?: string;
};

export const FAQ_TITULO = ['Preguntas frecuentes'] as const;

export const FAQ: FaqItem[] = [
  {
    question: '¿Cuánto cuesta la alianza?',
    answer:
      'El valor depende del número de estudiantes de grado 11 y de los componentes que su institución elija. Lo definimos con usted en la reunión de 30 minutos, sin compromiso.',
    confirmar: 'El equipo comercial debe escribir el rango de precio que sí se puede publicar.',
  },
  {
    question: '¿El primer simulacro es realmente gratis?',
    answer:
      'Sí. El primer simulacro para su institución no tiene costo ni lo obliga a contratar. Sus estudiantes reciben su análisis y su equipo directivo, el panel de coordinación.',
  },
  {
    question: '¿Cuánto dura el programa?',
    answer:
      'En el Calendario B, el Intensivo son 16 semanas y unas 426 horas en vivo. El Vacacional son 8 semanas y unas 225 horas en vivo. Si su institución arma una alianza a la medida, el cronograma se ajusta en la reunión. El detalle semana a semana está en Programas.',
    confirmar:
      'Confirmar que 16 semanas y 426 horas, y 8 semanas y 225 horas, son las cifras publicables del Calendario B 2027-1. Aún no hay fechas de día, solo semanas.',
  },
  {
    question: '¿Qué necesitan los estudiantes para conectarse?',
    answer:
      'Un celular o un computador con internet. El simulacro se presenta en la plataforma. El material llega en PDF y también dentro de la plataforma, con pizarra para socializar las preguntas.',
    confirmar: 'Confirmar requisitos mínimos de equipo y de conectividad.',
  },
  {
    question: '¿Funciona en zonas rurales con poca conectividad?',
    answer:
      'Sí, el modelo está pensado para eso: las clases quedan grabadas y el material se puede descargar. En la reunión revisamos su caso para proponer lo que su institución sí puede sostener.',
    confirmar: 'El equipo debe decir qué sí se puede hacer con poca conectividad.',
  },
  {
    question: '¿Cuántas preguntas tiene cada simulacro?',
    answer:
      '254 preguntas en las cinco áreas del ICFES: Lectura crítica, Matemáticas, Sociales y ciudadanas, Ciencias naturales e Inglés. El mismo formato del examen real.',
  },
  {
    question: '¿Cómo se calcula el puntaje?',
    answer:
      'Con el modelo TRI que usa el ICFES. Es una aproximación rigurosa al puntaje real, no el resultado del examen de Estado que publica el ICFES.',
  },
  {
    question: '¿Cuándo llegan los resultados?',
    answer:
      'En la semana siguiente al simulacro cada estudiante tiene su dashboard con puntaje global, desglose por área, ranking y plan de estudio.',
  },
  {
    question: '¿Qué ve el rector o el coordinador?',
    answer:
      'El rendimiento de la institución por área, por grupo y por estudiante, las brechas prioritarias y reportes listos para decidir qué reforzar antes del examen.',
  },
  {
    question: '¿Qué es Desafíos?',
    answer:
      'La práctica entre simulacros. El estudiante avanza por niveles cortos de preguntas por competencia, ve su resultado al instante y gana experiencia y recompensas. Complementa el simulacro, no lo reemplaza.',
  },
  {
    question: '¿Sus docentes participan?',
    answer:
      'Sí. La alianza incluye asesoría docente y material listo para el aula. Su equipo sigue al mando y gana una herramienta para decidir con datos.',
  },
  {
    question: '¿Cómo protegen los datos de los estudiantes?',
    answer:
      'Tratamos los datos según la Ley 1581 de 2012 y el Decreto 1377 de 2013. Los testimonios y fotos de esta página se publican con la autorización expresa de sus autores.',
  },
];

/** FAQ de /programas: solo preguntas de estudiantes y familias, con respuestas ya publicadas en el sitio. */
const deFaq = (q: string) => FAQ.find((item) => item.question === q)!;
export const FAQ_FAMILIAS: FaqItem[] = [
  {
    question: '¿Cuánto dura el programa?',
    answer: 'En el Calendario B, el Intensivo son 16 semanas y unas 426 horas en vivo. El Vacacional son 8 semanas y unas 225 horas en vivo. Arriba puede compararlos.',
  },
  {
    question: '¿Qué necesito para conectarme?',
    answer: 'Un celular o un computador con internet. El simulacro se presenta en la plataforma. El material llega en PDF y también dentro de la plataforma.',
  },
  {
    question: '¿Sirve si tengo poca conectividad?',
    answer: 'Las clases quedan grabadas y el material se puede descargar. Si tiene dudas sobre su caso, escríbanos por WhatsApp.',
  },
  deFaq('¿Cuántas preguntas tiene cada simulacro?'),
  deFaq('¿Cómo se calcula el puntaje?'),
  deFaq('¿Cuándo llegan los resultados?'),
  deFaq('¿Qué es Desafíos?'),
  {
    question: '¿Cómo protegen mis datos?',
    answer: 'Tratamos los datos según la Ley 1581 de 2012 y el Decreto 1377 de 2013.',
  },
];
