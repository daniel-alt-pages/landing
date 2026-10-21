import type { Estudiante } from '@shared/types';
import {
  normalizePuntaje,
  type RankingEntry,
} from '@features/simulacro/lib/firestoreService';

const AREA_KEYS = [
  'matemáticas',
  'lectura crítica',
  'sociales y ciudadanas',
  'ciencias naturales',
  'inglés',
] as const;

function normalizeAreaKey(s: string): string {
  return String(s || '')
    .toUpperCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function lookupPuntaje(
  puntajes: RankingEntry['puntajes'],
  key: string,
): unknown {
  if (!puntajes || typeof puntajes !== 'object') return undefined;
  if (key in puntajes) return (puntajes as Record<string, unknown>)[key];
  const target = normalizeAreaKey(key);
  const found = Object.keys(puntajes).find(
    (pk) => normalizeAreaKey(pk) === target,
  );
  return found ? (puntajes as Record<string, unknown>)[found] : undefined;
}

/** Convierte ranking pre-computado en lista Estudiante[] (métricas grupales sin chunks). */
export function studentsFromRankingEntries(entries: RankingEntry[]): Estudiante[] {
  return entries.map((entry) => {
    const puntajes: Record<
      string,
      { puntaje: number; correctas: number; total_preguntas: number }
    > = {};
    for (const key of AREA_KEYS) {
      puntajes[key] = normalizePuntaje(lookupPuntaje(entry.puntajes, key));
    }
    return {
      tipo: 'estudiante',
      informacion_personal: {
        nombres: entry.nombre,
        apellidos: entry.apellidos || '',
        numero_identificacion: entry.numero_identificacion || '',
        institucion: (entry.institucion || '').trim(),
        departamento: (entry.departamento || '').trim(),
        municipio: (entry.municipio || '').trim(),
        telefono: (entry.telefono || '').trim(),
        email: (entry.correo_electronico || '').trim(),
        tipo_identificacion: '',
      },
      puntaje_global: entry.puntaje_global,
      puntajes,
    } as Estudiante;
  });
}
