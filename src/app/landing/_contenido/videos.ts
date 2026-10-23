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
