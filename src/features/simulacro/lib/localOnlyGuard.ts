/**
 * Intercepta lecturas Firestore en el fork: nunca salen a la red.
 */
export function assertNoRemoteFirestore(source: string): never {
  throw new Error(
    `[reports-experimental] LOCAL-ONLY: lectura Firestore bloqueada (${source}). Usa fixtures JSON o /api/reportes.`
  );
}
