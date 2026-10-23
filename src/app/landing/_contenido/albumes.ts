/** Álbumes de puntajes de /resultados. URLs reales de las publicaciones en videos.ts (INSTAGRAM_POSTS y INSTAGRAM_FAVORITOS, v1.0.34). */
export type AlbumFoto = { src: string; alt: string };
export type Album = { id: string; titulo: string; url: string; fotos: AlbumFoto[] };

const f = (src: string, alt: string): AlbumFoto => ({ src: `/landing/albumes/${src}.webp`, alt });

export const ALBUMES: Album[] = [
  {
    id: 'b2026-1',
    titulo: 'Álbum Calendario B 2026 · Parte 1',
    url: 'https://www.instagram.com/p/DYclQoJkWJ5/',
    fotos: [
      f('b2026-1-08', 'Gabriel Sutachan Mendez 496/500'),
      f('b2026-1-09', 'Isabela Barreiro Cárdenas 494/500'),
      f('b2026-1-10', 'Jose Miguel Urrea Gómez 442/500'),
      f('b2026-1-11', 'Josias Acuña Arias 478/500'),
      f('b2026-1-12', 'Ana María Lizarazo 437/500'),
      f('b2026-1-13', 'Gloria Juliana Rivera 468/500'),
      f('b2026-1-14', 'Laura Camila Guzmán 408/500'),
    ],
  },
  {
    id: 'b2026-2',
    titulo: 'Álbum Calendario B 2026 · Parte 2',
    url: 'https://www.instagram.com/p/DYdbBCnCaG5/',
    fotos: [
      f('b2026-2-16', 'Leysa Luz Martinez 494/500'),
      f('b2026-2-17', 'Thomas Muñoz Florez 476/500'),
      f('b2026-2-18', 'Luna Alejandra Cárdenas 479/500'),
      f('b2026-2-19', 'Samara Caro Ortega 470/500'),
      f('b2026-2-20', 'María José Cortes Chaliyal 409/500'),
      f('b2026-2-21', 'Laura Gómez Suárez 473/500'),
      f('b2026-2-22', 'Juan Diego Zambrano 445/500'),
    ],
  },
  {
    id: 'a2025-1',
    titulo: 'Álbum Calendario A 2025 · Parte 1',
    url: 'https://www.instagram.com/p/DP6oEOagIMx/',
    fotos: [f('a2025-1-01', 'Nicole Meneses 500/500')],
  },
  {
    id: 'a2025-2',
    titulo: 'Álbum Calendario A 2025 · Parte 2',
    url: 'https://www.instagram.com/p/DP7D4yRiZZJ/',
    fotos: [
      f('a2025-2-02', 'Thomas López 480/500'),
      f('a2025-2-03', 'Jholger Enríquez 476/500'),
      f('a2025-2-04', 'Mario Urueta 457/500'),
      f('a2025-2-05', 'Paula López 447/500'),
      f('a2025-2-06', 'Valeria Ocampo 438/500'),
      f('a2025-2-07', 'Sebastián Martínez 433/500'),
      f('a2025-2-08', 'Sharlene Tapia 427/500'),
      f('a2025-2-09', 'Luis de Brigard 425/500'),
      f('a2025-2-10', 'Sara Palacio 424/500'),
      f('a2025-2-11', 'Mathías González 412/500'),
      f('a2025-2-12', 'Abimael Figueroa 404/500'),
      f('a2025-2-13', 'Andrés Pérez 383/500'),
    ],
  },
];
