export type MenuItem = { href: string; label: string; text: string };

export type MenuGroup = {
  id: string;
  label: string;
  href: string;
  feature: { eyebrow: string; title: string; text: string };
  items: MenuItem[];
};

export const MENU: MenuGroup[] = [
  {
    id: 'plataforma',
    label: 'Plataforma',
    href: '/landing/plataforma',
    feature: {
      eyebrow: 'Plataforma',
      title: 'Datos que se convierten en decisiones',
      text: 'Paneles de coordinación y de estudiante, calificados con el modelo TRI del ICFES.',
    },
    items: [
      { href: '/landing/plataforma#paneles', label: 'Los paneles', text: 'Lo que ve su equipo y lo que ve cada estudiante.' },
      { href: '/landing/plataforma#metodo', label: 'Método ADPMH', text: 'Medir, leer la rúbrica y decidir el siguiente paso.' },
      { href: '/landing/plataforma#capas', label: 'Analítica en cinco capas', text: 'De la respuesta individual a la decisión institucional.' },
      { href: '/landing/plataforma#desafios', label: 'Desafíos', text: 'Práctica diaria por niveles, entre simulacros.' },
      { href: '/landing/plataforma#ruta-dominio', label: 'Hacia la red neuronal', text: 'Cómo evoluciona la personalización.' },
    ],
  },
  {
    id: 'instituciones',
    label: 'Instituciones',
    href: '/landing/instituciones',
    feature: {
      eyebrow: 'Portafolio B2B',
      title: 'Modelo de servicios institucionales',
      text: 'Calendario B-A 2027-1 para colegios y consejos directivos.',
    },
    items: [
      { href: '/landing/instituciones#resumen', label: 'Resumen ejecutivo', text: 'De la evaluación puntual al programa continuo.' },
      { href: '/landing/instituciones#niveles', label: 'Tres niveles', text: 'Medir, intervenir o acompañar la mejora continua.' },
      { href: '/landing/instituciones#programa', label: 'Cómo funciona', text: 'Nivel 1, Nivel 2 y el programa integral.' },
      { href: '/landing/instituciones#plataforma', label: 'Plataforma y datos', text: 'Una vista para cada rol y los entregables.' },
    ],
  },
  {
    id: 'programas',
    label: 'Programas',
    href: '/landing/programas',
    feature: {
      eyebrow: 'Tienda',
      title: 'Elige y paga en línea',
      text: 'Programas, simulacros y cursos. Cada uno se cobra por separado con Bold.',
    },
    items: [
      { href: '/landing/programas', label: 'Elige tu programa', text: 'Compara por necesidad y paga en línea si eres estudiante o familia.' },
      { href: '/landing/programas?tipo=programa', label: 'Programas', text: 'Intensivo y vacacional, con precio y cupos.' },
      { href: '/landing/programas?tipo=simulacro', label: 'Simulacros', text: 'Pruebas sueltas para conocer el nivel.' },
      { href: '/landing/programas#comparar', label: 'Intensivo y vacacional', text: '426 horas frente a 225, y para quién es cada uno.' },
    ],
  },
  {
    id: 'resultados',
    label: 'Resultados',
    href: '/landing/resultados',
    feature: {
      eyebrow: 'Resultados',
      title: 'Puntajes que respaldan la alianza',
      text: '500/500 en 2025, más de 50 estudiantes sobre 410 y 65 instituciones con al menos un simulacro.',
    },
    items: [
      { href: '/landing/resultados#resultados', label: 'Puntajes destacados', text: '500, 496, 480 y grandes mejoras.' },
      { href: '/landing/resultados#voces', label: 'Mensajes 2026-A', text: 'Lo que escribieron estudiantes del Calendario A 2026.' },
      { href: '/landing/resultados#colegios', label: '65 instituciones', text: 'Cada una aplicó al menos un simulacro con SeamosGenios.' },
    ],
  },
  {
    id: 'nosotros',
    label: 'Nosotros',
    href: '/landing/nosotros',
    feature: {
      eyebrow: 'Nosotros',
      title: 'Un equipo que ya recorrió el camino',
      text: 'Tutores de las mejores universidades del país y un fundador reconocido por Samsung.',
    },
    items: [
      { href: '/landing/nosotros#quienes-somos', label: 'Quiénes somos', text: 'Misión, visión y diferenciales.' },
      { href: '/landing/nosotros#fundador', label: 'Nuestro fundador', text: 'De Caño de Aguas a Samsung Innovation Campus.' },
      { href: '/landing/nosotros#equipo', label: 'Equipo de tutores', text: '16 jóvenes de alto rendimiento.' },
    ],
  },
];

export const RECURSOS: MenuItem[] = [
  { href: '/landing#faq', label: 'Preguntas frecuentes', text: '' },
  { href: '/landing/instituciones', label: 'Hablar con instituciones', text: '' },
  { href: '/landing/politica-de-datos', label: 'Política de datos', text: '' },
];
