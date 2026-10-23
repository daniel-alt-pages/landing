/** Videos propios (TikTok de SEAMOSGENIOS), servidos desde /landing/videos/. Solo hechos verificados. */
export type VideoItem = { id: string; title: string; caption: string; aria: string };

export const VIDEOS_RESULTADOS: VideoItem[] = [
  { id: 'v3', title: 'Mariana · 500/500', caption: 'Puntaje perfecto en el ICFES.', aria: 'Video: Mariana cuenta cómo obtuvo 500 de 500 en el ICFES' },
  { id: 'v5', title: 'Ángel David · 475/500', caption: 'Universidad de los Andes, con beca.', aria: 'Video: Ángel David, 475 de 500, becado en la Universidad de los Andes' },
  { id: 'v4', title: 'Sebastián · 433/500', caption: 'Universidad ICESI, con beca.', aria: 'Video: Sebastián, 433 de 500, becado en la Universidad ICESI' },
];

export const VIDEO_ESTRATEGIAS: VideoItem = {
  id: 'v2',
  title: '3 estrategias para el ICFES',
  caption: 'Lo que pocos le cuentan del examen y puede ayudarle a subir su puntaje.',
  aria: 'Video: tres estrategias para el examen ICFES',
};

/** Publicaciones de Instagram de SEAMOSGENIOS (tarjetas estáticas, sin embeds). Solo hechos de las publicaciones. */
export type InstagramPost = { code: string; url: string; title: string; caption: string; alt: string };

export const INSTAGRAM_RESULTADOS_INTRO =
  '14 estudiantes de todo el país, entre 408 y 496 puntos en Calendario B 2026.';

export const INSTAGRAM_POSTS: InstagramPost[] = [
  {
    code: 'DYclQoJkWJ5',
    url: 'https://www.instagram.com/p/DYclQoJkWJ5/',
    title: 'Álbum de puntajes Calendario B 2026 · Parte 1',
    caption: '«Sinceramente el mejor Preicfes de Colombia», Jose Miguel Urrea, 442/500.',
    alt: 'Tarjeta de Gabriel Sutachan Mendez, de Bogotá, con 496 de 500 en el ICFES, del álbum de puntajes Calendario B 2026 de SEAMOSGENIOS',
  },
  {
    code: 'DYdbBCnCaG5',
    url: 'https://www.instagram.com/p/DYdbBCnCaG5/',
    title: 'Álbum de puntajes Calendario B 2026 · Parte 2',
    caption: '«Me mantuve en el mismo promedio que sacaba en sus simulacros», Samara Caro, 470/500.',
    alt: 'Tarjeta de Leysa Luz Martinez, de Sincelejo, Sucre, con 494 de 500 en el ICFES, del álbum de puntajes Calendario B 2026 de SEAMOSGENIOS',
  },
];
