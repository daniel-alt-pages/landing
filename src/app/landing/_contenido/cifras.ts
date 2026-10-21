import type { Stat } from './tipos';

export const CIFRAS_TITULO = ['Resultados que', 'abren puertas'] as const;

export const CIFRAS: Stat[] = [
  {
    id: 'estudiantes',
    value: 14000,
    prefix: '+',
    label: 'Estudiantes acompañados',
    note: 'En el grupo de estudio gratuito de SeamosGenios.',
    confirmar: 'Precisar desde qué año se acumulan los +14.000 del grupo gratuito.',
  },
  {
    id: 'colegios',
    value: 65,
    label: 'Instituciones con simulacro',
    note: '65 instituciones. Cada una aplicó al menos un simulacro con SeamosGenios.',
  },
  {
    id: 'sobre-410',
    value: 50,
    prefix: '+',
    label: 'Estudiantes sobre 410',
    note: 'En el nivel más alto de la escala Saber 11.',
  },
  {
    id: 'maximo',
    value: 500,
    suffix: '/500',
    label: 'Puntaje perfecto',
    note: 'Alcanzado por una estudiante del programa en 2025.',
  },
];

export const CIFRAS_NOTAS = [
  'Estudiantes acompañados: acumulado del grupo de estudio gratuito.',
];
