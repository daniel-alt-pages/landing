export const PROBLEMA = {
  eyebrow: 'El contexto',
  title: ['El problema', 'que resolvemos'],
  lead:
    'Cada año, estudiantes con capacidad real se quedan por fuera de la universidad. No es falta de talento. Es falta de una medición clara y de un acompañamiento que su institución pueda sostener. Eso es lo que ponemos en sus manos.',
  urbana: {
    filled: 5,
    total: 10,
    title: '5 de cada 10',
    text: 'estudiantes de zona urbana ingresan a la universidad justo después del colegio.',
  },
  rural: {
    filled: 3,
    total: 10,
    title: '3 de cada 10',
    text: 'estudiantes de zona rural lo logran en el mismo momento.',
  },
  fuente: 'Presidencia de la República (2025)',
  fuenteUrl: '',
  confirmar: 'Falta el enlace al documento de Presidencia 2025.',
  ciclo: [
    {
      id: 'problema',
      label: 'Problema',
      text: 'Preparación insuficiente, recursos limitados y metodologías que no responden a la exigencia actual del examen.',
    },
    {
      id: 'consecuencia',
      label: 'Consecuencia',
      text: 'Resultados bajos, menos opciones de ingreso y de becas, y proyectos de vida que se postergan.',
    },
    {
      id: 'oportunidad',
      label: 'Oportunidad',
      text: 'Con medición y acompañamiento, su institución puede acercar a cada estudiante a su mejor puntaje. El primer simulacro le muestra si el camino funciona con los suyos.',
    },
  ],
  cierre: 'Su institución no necesita más promesas. Necesita ver el mapa de su grado 11.',
} as const;
