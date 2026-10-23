/** Videos propios (TikTok de SEAMOSGENIOS), servidos desde /landing/videos/. Solo hechos verificados. */
/**
 * Subtítulos: `captions` es la ruta a un .vtt en español (p. ej. '/landing/videos/v3.es.vtt').
 * Política: solo se enlaza un .vtt hecho a partir de una transcripción real y revisada del video.
 * No se generan ni se inventan textos. Mientras no exista el archivo, el campo queda vacío y no se renderiza <track>.
 */
export type VideoItem = { id: string; title: string; caption: string; aria: string; captions?: string };

export const VIDEOS_RESULTADOS: VideoItem[] = [
  { id: 'v3', captions: '', title: 'Mariana · 500/500', caption: 'Puntaje perfecto en el ICFES.', aria: 'Video: Mariana cuenta cómo obtuvo 500 de 500 en el ICFES' },
  { id: 'v5', captions: '', title: 'Ángel David · 475/500', caption: 'Universidad de los Andes, con beca.', aria: 'Video: Ángel David, 475 de 500, becado en la Universidad de los Andes' },
  { id: 'v4', captions: '', title: 'Sebastián · 433/500', caption: 'Universidad ICESI, con beca.', aria: 'Video: Sebastián, 433 de 500, becado en la Universidad ICESI' },
];

export const VIDEO_ESTRATEGIAS: VideoItem = {
  id: 'v2',
  captions: '',
  title: '3 estrategias para el ICFES',
  caption: 'Lo que pocos le cuentan del examen y puede ayudarle a subir su puntaje.',
  aria: 'Video: tres estrategias para el examen ICFES',
};

/** Publicaciones de Instagram de SEAMOSGENIOS (tarjetas estáticas, sin embeds). Solo hechos de las publicaciones. */
export type InstagramPost = { code: string; url: string; title: string; caption: string; alt: string; reel?: boolean };

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

/** v1.0.34 · Favoritos de Instagram (Calendario A 2025 y reel del Calendario B 2026). Solo hechos de las publicaciones. */
export const INSTAGRAM_FAVORITOS: InstagramPost[] = [
  {
    code: 'DP6oEOagIMx',
    url: 'https://www.instagram.com/p/DP6oEOagIMx/',
    title: 'Álbum de puntajes Calendario A 2025 · Parte 1',
    caption: 'Nicole Meneses, de Bucaramanga, obtuvo 500/500: puntaje perfecto en las pruebas ICFES, entre los mejores del país. Así se ve la disciplina con SEAMOSGENIOS.',
    alt: 'Tarjeta de Nicole Meneses, de Bucaramanga, Santander, con 500 de 500 en el ICFES, del álbum de puntajes Calendario A 2025 de SEAMOSGENIOS',
  },
  {
    code: 'DP7D4yRiZZJ',
    url: 'https://www.instagram.com/p/DP7D4yRiZZJ/',
    title: 'Álbum de puntajes Calendario A 2025 · Parte 2',
    caption: 'Thomas López, 480/500, conquistó el primer lugar en todo el departamento de Casanare. Esto no es suerte: es la recompensa de cada simulacro.',
    alt: 'Tarjeta de Thomas López, de Aguazul, Casanare, con 480 de 500 en el ICFES, del álbum de puntajes Calendario A 2025 de SEAMOSGENIOS',
  },
  {
    code: 'DYtFMyTAamc',
    url: 'https://www.instagram.com/reel/DYtFMyTAamc/',
    title: 'El mejor estudiante del Calendario B 2026',
    caption: 'Estamos muy felices por Gabriel. ¿Quiere un resultado así? Prepárese con los mejores en SEAMOSGENIOS.',
    alt: 'Portada del reel «Nuestro mejor puntaje» de SEAMOSGENIOS sobre Gabriel, el mejor estudiante del Calendario B 2026',
    reel: true,
  },
];
