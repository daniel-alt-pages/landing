import type { SgAreaKey } from '@shared/lib/sgAreaColors';
import { sgAreaColor } from '@shared/lib/sgAreaColors';

const AREA_TAGS: Record<SgAreaKey, string[]> = {
  'lectura crítica': ['inferencia', 'argumentación', 'comprensión'],
  matemáticas: ['álgebra', 'geometría', 'estadística'],
  'sociales y ciudadanas': ['democracia', 'convivencia', 'derechos'],
  'ciencias naturales': ['biología', 'química', 'física'],
  inglés: ['reading', 'grammar', 'vocabulary'],
};

export function recordingCoverTags(areaKey: string): string[] {
  const c = sgAreaColor(areaKey);
  if (c.key in AREA_TAGS) return AREA_TAGS[c.key as SgAreaKey];
  return ['retro', 'ICFES', 'repaso'];
}
