export const HERO = {
  eyebrow: 'Programa nacional de fortalecimiento académico · Saber 11',
  title: ['Sepa qué reforzar', 'antes del Saber 11'],
  rotatingPrefix: 'Una alianza para',
  rotating: ['subir el promedio de su institución', 'ver qué reforzar antes del examen', 'probar el modelo sin costo'],
  lead:
    'Aplicamos un simulacro con formato ICFES y al día siguiente su rectoría ve en qué competencias está cada curso, y cada estudiante ve qué estudiar.',
  bullets: [
    'Una pantalla para rectoría y otra para cada estudiante',
    'Análisis al día siguiente del simulacro',
    'El primer simulacro no tiene costo ni lo obliga a contratar',
  ],
  prueba: 'Ya lo aplicamos con 716 estudiantes de 9 colegios oficiales de Soacha.',
  trust: '65 instituciones ya aplicaron al menos un simulacro.',
  ctaPrimary: 'Agendar reunión de 30 min',
  ctaSecondary: 'Solicitar simulacro gratis',
  ctaWhatsapp: 'Prefiero escribir por WhatsApp',
  micro: ['Primer simulacro sin costo', 'Sin compromiso de contratación', 'Respuesta en 1 día hábil'],
  confirmar: 'Confirmar el plazo de respuesta de 1 día hábil.',
  badge: '500/500 · puntaje perfecto de una estudiante en 2025',
  roles: [
    { id: 'rector', label: 'Soy rector o coordinador', href: '/landing/instituciones' },
    { id: 'docente', label: 'Soy docente', href: '/landing/plataforma#metodo' },
    { id: 'estudiante', label: 'Soy estudiante o familia', href: '/landing/programas' },
  ],
} as const;

export const PILARES = {
  title: ['Todo lo que su institución', 'necesita para el Saber 11'],
  lead: 'Tres razones por las que un rector da el paso. Elija la que más le urge hoy.',
  items: [
    {
      id: 'medir',
      eyebrow: 'Plataforma',
      title: 'Vea el mapa antes del examen',
      text: '254 preguntas, el mismo formato del Saber 11, y un panel que le dice qué área y qué salón necesitan refuerzo. Usted decide con datos, no con intuición.',
      href: '/landing/plataforma',
      cta: 'Ver detalles',
    },
    {
      id: 'acompanar',
      eyebrow: 'Instituciones',
      title: 'Acompañe sin cargar su operación',
      text: 'Clases en vivo, grabaciones a cualquier hora, material listo para el aula y asesoría a sus docentes. Su equipo sigue al mando. Nosotros ponemos el método.',
      href: '/landing/instituciones',
      cta: 'Ver detalles',
    },
    {
      id: 'demostrar',
      eyebrow: 'Resultados',
      title: 'Lleve la evidencia a su comunidad',
      text: 'Promedios, puntajes máximos y el avance de cada estudiante, listos para presentarlos a familias, docentes y a la secretaría.',
      href: '/landing/resultados',
      cta: 'Ver detalles',
    },
  ],
} as const;
