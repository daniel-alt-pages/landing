/**
 * Detecta si estamos en localhost (dev/demo local).
 * En producción (Firebase Hosting) → bloquea consola.
 * En local (localhost / 127.0.0.1) → consola libre para debug.
 */
const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname === '[::1]');

export const SECURITY_CONFIG = {
    // true = bloquea consola. Solo se activa en producción.
    disableConsoleAccess: !isLocalhost,

    // Mensaje opcional para mostrar si alguien intenta abrir la consola (solo visible en logs antes de bloquear)
    warningMessage: "Acceso restringido. Esta acción ha sido reportada."
};
