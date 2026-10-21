import type { StudentLookupResult } from '@features/simulacro/lib/firestoreService';

/** Lazy: Firestore lookup solo tras acción explícita del usuario (ayuda, no auth). */
export async function lookupStudentEmailHelp(documentId: string): Promise<StudentLookupResult | null> {
  const { lookupStudentById } = await import('@features/simulacro/lib/firestoreService');
  return lookupStudentById(documentId);
}
