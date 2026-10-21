/**
 * Mensajes visibles al estudiante: solo lenguaje natural.
 * Nunca exponer err.message, códigos internos, IDs de simulacro ni rutas técnicas.
 */
import type { DirectStudentLoginError } from '@features/simulacro/lib/firestoreService';
import { formatLockRemaining } from '@/lib/directLoginLockout';

export const STUDENT_ERRORS = {
    loadFailed:
        'No pudimos cargar tu información en este momento. Espera unos segundos e intenta de nuevo.',
    emptyResults:
        'Todavía no hay resultados disponibles para mostrar. Cierra sesión, vuelve a entrar y, si sigue igual, habla con tu coordinador.',
    partialUpdate:
        'Estamos actualizando parte de tu información. Lo que ves puede estar incompleto por ahora.',
    incompleteData:
        'Parte de tu información de resultados está incompleta. Tu coordinador puede ayudarte a revisarlo.',
    simNotFound:
        'No encontramos resultados para el simulacro que elegiste. Prueba otro en el selector o habla con tu coordinador.',
    sessionExpired: 'Tu sesión terminó. Vuelve a ingresar para ver tus resultados.',
    accessDenied:
        'No pudimos validar tu acceso. Cierra sesión e intenta de nuevo; si tienes correo asignado, usa Google.',
    tooManyRequests:
        'Hubo muchas consultas seguidas. Espera unos segundos y vuelve a intentar.',
    bootstrapFailed: 'No pudimos cargar tu panel. Intenta de nuevo en un momento.',
    noSimulations:
        'No pudimos cargar tus resultados. Intenta de nuevo o entra con Google si tienes correo asignado.',
    resultsNeedGoogle:
        'Entraste con documento y fecha. Para ver tus puntajes, cierra sesión e ingresa con Google usando tu correo asignado.',
    demoUnavailable:
        'No hay datos de demostración disponibles en este momento. Recarga la página o escríbenos.',
    analysisDetailFailed:
        'No pudimos cargar el detalle pregunta por pregunta. Espera unos segundos e intenta de nuevo.',
    analysisNotFound:
        'No encontramos resultados para mostrar en este momento. Prueba otro simulacro o habla con tu coordinador.',
    analysisTimeout: 'La carga tardó demasiado. Reintenta en un momento.',
    analysisLoadFailed:
        'No pudimos cargar el análisis. Revisa tu conexión e intenta de nuevo.',
    photoUploadFailed: 'No pudimos subir tu foto. Intenta de nuevo en un momento.',
    profileSaveFailed: 'No pudimos guardar los cambios. Intenta de nuevo.',
    directLoginInvalidDocument:
        'Revisa el número de documento. Verifica que esté completo y bien escrito.',
    directLoginInvalidBirthDate:
        'Revisa la fecha de nacimiento. Verifica día, mes y año.',
    directLoginInvalidBoth:
        'Revisa el documento y la fecha de nacimiento antes de intentar de nuevo.',
    directLoginDocumentMismatch:
        'El número de documento no coincide. Revísalo e intenta de nuevo.',
    directLoginBirthDateMismatch:
        'La fecha de nacimiento no coincide. Revísala (día, mes y año).',
    directLoginBirthDateMissing:
        'Aún no puedes entrar solo con documento y fecha. Si tienes correo asignado, usa Google; si no, escríbenos.',
    directLoginRateLimited: 'Hiciste varios intentos seguidos. Espera un minuto y vuelve a intentar.',
    directLoginNetworkBlocked:
        'No pudimos conectar desde esta red. Prueba otra red o entra con Google si tienes correo asignado.',
    directLoginServiceLimited:
        'Este método está temporalmente limitado. Usa Google o consulta con un asesor.',
    directLoginGenericFail:
        'No pudimos confirmar tus datos. Revisa documento y fecha, o entra con Google si tienes correo asignado.',
    directLoginUnexpected: 'No pudimos completar el ingreso. Intenta de nuevo en un momento.',
} as const;

const DIRECT_LOGIN_GOOGLE_HINT =
    ' También puedes entrar con Google si tienes correo asignado.';

function withGoogleHint(base: string, attempts: number): string {
    return attempts > 0 && attempts < 3 ? `${base}${DIRECT_LOGIN_GOOGLE_HINT}` : base;
}

/** Mensajes login documento + fecha: indican qué campo revisar, sin códigos ni datos internos. */
export function directLoginUserMessage(
    code?: DirectStudentLoginError,
    opts?: { attempts?: number; locked?: boolean; lockRemainingMs?: number },
): string {
    if (opts?.locked && (opts.lockRemainingMs ?? 0) > 0) {
        return `Por seguridad pausamos este ingreso ${formatLockRemaining(opts.lockRemainingMs!)}. Puedes usar Google o hablar con un asesor.`;
    }

    const attempts = opts?.attempts ?? 0;

    switch (code) {
        case 'invalid-document':
            return withGoogleHint(STUDENT_ERRORS.directLoginInvalidDocument, attempts);
        case 'invalid-birth-date':
            return withGoogleHint(STUDENT_ERRORS.directLoginInvalidBirthDate, attempts);
        case 'invalid-input':
            return withGoogleHint(STUDENT_ERRORS.directLoginInvalidBoth, attempts);
        case 'not-found':
            return withGoogleHint(
                'No encontramos tu registro con ese documento. Verifica el número o prueba de nuevo en unos segundos.',
                attempts,
            );
        case 'birth-date-mismatch':
            return withGoogleHint(STUDENT_ERRORS.directLoginBirthDateMismatch, attempts);
        case 'birth-date-missing':
            return STUDENT_ERRORS.directLoginBirthDateMissing;
        case 'rate-limited':
            return STUDENT_ERRORS.directLoginRateLimited;
        case 'client-blocked':
            return withGoogleHint(STUDENT_ERRORS.directLoginNetworkBlocked, attempts);
        case 'functions-unavailable':
            return STUDENT_ERRORS.directLoginServiceLimited;
        case 'results-need-google':
            return STUDENT_ERRORS.resultsNeedGoogle;
        default:
            return withGoogleHint(STUDENT_ERRORS.directLoginGenericFail, attempts);
    }
}

/** Siempre devuelve un mensaje seguro; el detalle técnico queda solo en consola. */
export function studentFacingErrorFromUnknown(_err: unknown): string {
    return STUDENT_ERRORS.loadFailed;
}

export function isRetryableStudentError(message: string): boolean {
    return (
        message === STUDENT_ERRORS.tooManyRequests ||
        message === STUDENT_ERRORS.loadFailed
    );
}
