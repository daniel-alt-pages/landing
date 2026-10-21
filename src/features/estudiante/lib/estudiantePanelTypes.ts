import type { Estudiante } from '@shared/types';
import type { RankingEntry } from '@features/simulacro/lib/firestoreService';

export type EstudiantePanelBundle = {
  studentId: string;
  simId: string;
  estudiante: Estudiante | null;
  todos: Estudiante[];
  rankingEntries: RankingEntry[];
  updatedAt: number;
};

export function estudiantePanelCacheKey(studentId: string, simId: string): string {
  return `estudiante-panel:${studentId}:${simId}`;
}
