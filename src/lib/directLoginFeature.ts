/**
 * Fallback legado doc+fecha. Apagado por defecto: en Firebase Spark no debe ser
 * el login principal porque no emite sesión real para resultados privados.
 */
export function isDirectLoginEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DIRECT_LOGIN_ENABLED === 'true';
}
