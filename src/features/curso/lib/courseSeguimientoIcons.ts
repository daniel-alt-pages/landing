const ICON_BASE = '/curso/icons';

/** WebP con alpha en `public/curso/icons/` (generar: ingest-curso-jpg-icons.mjs). */
export const CURSO_SEGUIMIENTO_ICONS = {
  racha: `${ICON_BASE}/racha.webp`,
  horas: `${ICON_BASE}/horas.webp`,
  clasesProgramadas: `${ICON_BASE}/clases-programadas.webp`,
  tasaSemanal: `${ICON_BASE}/tasa-semanal.webp`,
  tasaGlobal: `${ICON_BASE}/tasa-global.webp`,
  asistenciasCompletas: `${ICON_BASE}/asistencias-completas.webp`,
  asistenciasParciales: `${ICON_BASE}/asistencias-parciales.webp`,
  ausencia: `${ICON_BASE}/ausencia.webp`,
  proximasClases: `${ICON_BASE}/proximas-clases.webp`,
} as const;

/** Accesos rápidos del resumen (mismos assets `/curso/icons`). */
export const CURSO_RESUMEN_ICONS = {
  clasesEnVivo: CURSO_SEGUIMIENTO_ICONS.clasesProgramadas,
  asistencia: CURSO_SEGUIMIENTO_ICONS.tasaGlobal,
  grabaciones: CURSO_SEGUIMIENTO_ICONS.asistenciasCompletas,
  materiales: CURSO_SEGUIMIENTO_ICONS.horas,
  seguimiento: CURSO_SEGUIMIENTO_ICONS.tasaSemanal,
} as const;
