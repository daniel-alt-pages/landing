export type Historia = {
  id: string;
  chip: string;
  title: string;
  text: string;
  href: string;
  images: { src: string; alt: string }[];
};

export const HISTORIAS: Historia[] = [
  {
    id: 'jovenes-bogota',
    chip: 'Jóvenes Bogotá',
    title: 'PreICFES Gratuito Jóvenes Bogotá',
    text: 'Con la publicación de los resultados del Saber 11, el equipo recuerda el camino recorrido con esa cohorte. El puntaje abre la siguiente etapa: seguir apuntando a la educación superior.',
    href: 'https://www.instagram.com/p/Ddtyy4PkRYs/',
    images: [0, 1, 2, 3].map((index) => ({
      src: `/landing/historias/jovenes-bogota-${index + 1}-1080.webp`,
      alt: `Publicación de resultados del PreICFES Gratuito Jóvenes Bogotá, imagen ${index + 1} de 4`,
    })),
  },
  {
    id: 'soacha',
    chip: 'Soacha',
    title: 'Nueve instituciones de Soacha',
    text: '716 estudiantes de grado undécimo, de nueve instituciones de Soacha, cerraron este ciclo junto a la Universidad Distrital, la Secretaría de Educación de Soacha y PreICFES Gratuito Jóvenes Bogotá.',
    href: 'https://www.instagram.com/p/DdsJ41FiSYO/',
    images: [0, 1, 2, 3].map((index) => ({
      src: `/landing/historias/soacha-${index + 1}-1080.webp`,
      alt: `Simulacro con instituciones de Soacha, imagen ${index + 1} de 4`,
    })),
  },
  {
    id: 'casanare',
    chip: 'Casanare',
    title: 'Veinte instituciones de Casanare',
    text: 'Un simulacro gratuito llegó a 420 estudiantes de grado undécimo en 20 instituciones de Casanare. La retroalimentación en vivo queda a cargo del equipo de tutores.',
    href: 'https://www.instagram.com/p/DaQ0I8GCQWI/',
    images: [0, 1].map((index) => ({
      src: `/landing/historias/casanare-${index + 1}-1080.webp`,
      alt: `Simulacro con instituciones de Casanare, imagen ${index + 1} de 2`,
    })),
  },
];
