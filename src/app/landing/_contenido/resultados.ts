import type { ResultCard } from './tipos';

export const AREA_LABELS = [
  'Lectura crítica',
  'Matemáticas',
  'Sociales y ciudadanas',
  'Ciencias naturales',
  'Inglés',
] as const;

export const RESULTADOS_DESTACADOS: ResultCard[] = [
  {
    id: 'nicole',
    name: 'Nicole Mariana Meneses Meléndez',
    city: 'Bucaramanga, Santander',
    global: 500,
    areas: [100, 100, 100, 100, 100],
    confirmar: 'Confirmar el orden de las áreas y el permiso de imagen. Sin autorización se muestran iniciales.',
  },
  {
    id: 'gabriel',
    name: 'Gabriel Sutachán Méndez',
    city: 'Bogotá D.C.',
    global: 496,
    areas: [89, 100, 100, 100, 100],
    confirmar: 'Confirmar el orden de las áreas y el permiso de imagen.',
  },
  {
    id: 'thomas',
    name: 'Thomas Alejandro López Godoy',
    city: 'Aguazul, Casanare',
    global: 480,
    areas: [100, 100, 83, 100, 100],
    confirmar: 'Confirmar el orden de las áreas y el permiso de imagen.',
  },
  {
    id: 'hellen',
    name: 'Hellen Daniela Mantilla Corzo',
    city: 'Bucaramanga, Santander',
    global: 477,
    areas: [100, 100, 100, 80, 100],
    confirmar: 'Confirmar el orden de las áreas y el permiso de imagen.',
  },
];

export const RESULTADOS_SUPERACION: ResultCard[] = [
  {
    id: 'diego',
    name: 'Diego Urbano',
    city: 'Colombia',
    global: 477,
    from: 360,
    detail: 'Pasó de 360 a 477 puntos.',
    confirmar: 'Permiso de imagen pendiente.',
  },
  {
    id: 'angel',
    name: 'Ángel Pacheco',
    city: 'Colombia',
    global: 475,
    from: 308,
    detail: 'Pasó de 308 a 475 puntos.',
    confirmar: 'Permiso de imagen pendiente.',
  },
  {
    id: 'daniel-c',
    name: 'Daniel Cuspoca',
    city: 'Colombia',
    global: 477,
    from: 348,
    detail: 'Pasó de 348 a 477 puntos.',
    confirmar: 'Permiso de imagen pendiente.',
  },
  {
    id: 'david',
    name: 'David Cardona',
    city: 'Medicina en la Universidad ICESI',
    global: 477,
    detail: 'Medicina en la Universidad ICESI.',
    confirmar: 'Permiso de imagen pendiente.',
  },
];

/** El muro 2026-1 del PDF trae fotos. No se publica hasta tener autorización. La tarjeta duplicada de Luna Cárdenas no entra. */
export const MURO_2026: ResultCard[] = [];

export const MURO_NOTA =
  'El muro de resultados 2026-1 se publica cuando cada estudiante, o su acudiente si es menor de edad, autorice el uso de la imagen. La tarjeta duplicada de Luna Cárdenas queda fuera.';
