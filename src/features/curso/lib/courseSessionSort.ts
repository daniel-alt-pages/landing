import type { CourseRecentSession } from '../types/courseTypes';

/** Extrae número de clase del topic (ej. "CLASE #3" → 3). */
export function classNumberFromTopic(topic?: string): number {
  const match = (topic || '').match(/#?\s*(\d+)/i);
  return match ? Number(match[1]) : -1;
}

/** Historial: fecha desc → hora inicio desc → número de clase desc. */
export function compareSessionsHistorialDesc(
  a: CourseRecentSession,
  b: CourseRecentSession,
): number {
  const dateCmp = b.date.localeCompare(a.date);
  if (dateCmp !== 0) return dateCmp;

  const isoCmp = (b.startsAtIso || '').localeCompare(a.startsAtIso || '');
  if (isoCmp !== 0) return isoCmp;

  const numA = classNumberFromTopic(a.topic);
  const numB = classNumberFromTopic(b.topic);
  if (numA !== numB) return numB - numA;

  return (b.topic || '').localeCompare(a.topic || '');
}
