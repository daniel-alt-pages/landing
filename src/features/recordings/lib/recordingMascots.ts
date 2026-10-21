import { sgAreaColor, type SgAreaKey } from '@shared/lib/sgAreaColors';

const MASCOT_BASE = '/images/recordings/mascotas';

/** Mascota oficial SG por área ICFES (WebP optimizado desde SVG fuente). */
export const RECORDING_MASCOT_SRC: Record<SgAreaKey, string> = {
  'lectura crítica': `${MASCOT_BASE}/lectura-critica.webp`,
  matemáticas: `${MASCOT_BASE}/matematicas.webp`,
  'sociales y ciudadanas': `${MASCOT_BASE}/sociales-ciudadanas.webp`,
  'ciencias naturales': `${MASCOT_BASE}/ciencias-naturales.webp`,
  inglés: `${MASCOT_BASE}/ingles.webp`,
};

export const ALL_RECORDING_MASCOT_SRCS = Object.values(RECORDING_MASCOT_SRC);

/** Ilustración grupal para promo / hero (desde GRUPO-DE-MASCOTAS.svg). */
export const RECORDING_MASCOT_GROUP_SRC = `${MASCOT_BASE}/grupo-de-mascotas.webp`;

export function recordingMascotSrc(areaKey: string): string {
  const c = sgAreaColor(areaKey);
  if (c.key in RECORDING_MASCOT_SRC) {
    return RECORDING_MASCOT_SRC[c.key as SgAreaKey];
  }
  return RECORDING_MASCOT_SRC.matemáticas;
}
