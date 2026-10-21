export const PANTALLAS_NOTA =
  'Ilustraciones de ejemplo del inicio del estudiante, el panel de coordinación y Desafíos. Reemplazar por capturas reales del producto antes de producción.';

export const PANTALLAS = [
  {
    id: 'estudiante',
    titulo: 'Inicio del estudiante',
    texto: 'Abre la semana con atajos para practicar, la agenda y las cinco áreas del Saber 11.',
    src: '/landing/pantallas/estudiante.webp',
    alt: 'Inicio del estudiante: atajos para repasar, simulacros, reto del día y desafíos, más la agenda y las cinco áreas.',
  },
  {
    id: 'coordinador',
    titulo: 'Panel de coordinación',
    texto: 'Rectoría ve el promedio del grupo, el área que se queda atrás y qué salón conviene reforzar.',
    src: '/landing/pantallas/coordinador.webp',
    alt: 'Panel de coordinación del grado 11: promedio 381 de 500, barras por área y dos grupos a reforzar.',
  },
  {
    id: 'desafios',
    titulo: 'Desafíos',
    texto: 'Entre simulacros, el estudiante avanza por niveles de 10 preguntas. El puntaje de 0 a 500 sigue saliendo del simulacro completo.',
    src: '/landing/pantallas/desafios.webp',
    alt: 'Camino de desafíos de Matemáticas: niveles completos, el nivel 4 listo para continuar y la racha de días.',
  },
] as const;
