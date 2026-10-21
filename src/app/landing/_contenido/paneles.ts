export const PANELES = {
  title: ['Una plataforma que convierte', 'datos en decisiones'],
  lead: 'Calificamos con el modelo TRI del ICFES para aproximar el puntaje real. Vea en video lo que recibe su equipo directivo y lo que recibe cada estudiante.',
  tabs: [
    {
      id: 'coordinador',
      label: 'Panel de coordinación',
      quote: 'Los datos del simulacro se convierten en una decisión pedagógica, no en una hoja de cálculo más.',
      text: 'Directivos y coordinadores ven el rendimiento de la institución en una sola pantalla, detectan brechas a tiempo y deciden con evidencia qué reforzar y con quién.',
      bullets: [
        'Rendimiento por área, por grupo y por estudiante.',
        'Alertas tempranas sobre las brechas que más pesan.',
        'Reportes listos para el consejo académico y el rector.',
        'Comparación entre simulacros para ver si el refuerzo funcionó.',
      ],
      videos: [
        { id: '0FOpVLCr5uA', title: 'Panel principal' },
        { id: 'VsD0GTpNVZQ', title: 'Resultados por área' },
        { id: 'SC45PRt_RkI', title: 'Análisis de respuestas' },
        { id: 'SV9JXcKJ5Ww', title: 'Métricas de desempeño' },
      ],
    },
    {
      id: 'estudiante',
      label: 'Panel de estudiante',
      quote: 'Cada estudiante sabe en qué se equivocó y qué hacer antes del próximo simulacro.',
      text: 'El estudiante consulta su resultado global, su desempeño por área, su posición en el ranking y recomendaciones concretas para mejorar. Las preguntas siguen el estilo de la prueba real.',
      bullets: [
        'Resultado global y por área, en la escala de 0 a 500.',
        'Revisión de cada pregunta fallada.',
        'Recomendaciones para el siguiente simulacro.',
      ],
      videos: [
        { id: 'MOPf18v_aoA', title: 'Inicio de sesión' },
        { id: '0FOpVLCr5uA', title: 'Panel principal' },
        { id: 'pfVTR9dsGDE', title: 'Navegar entre simulacros' },
        { id: 'Ta4cFLuSvAo', title: 'Ranking general' },
        { id: 'p9owMWP1KUU', title: 'Perfil por área' },
        { id: 'rnmumHDFlzE', title: 'Métricas por área' },
        { id: 'SC45PRt_RkI', title: 'Análisis de respuestas' },
      ],
    },
  ],
} as const;
