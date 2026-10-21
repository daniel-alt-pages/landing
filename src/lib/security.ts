/**
 * 🛡️ Client-Side Security Utilities
 * 
 * Protecciones aplicadas en el navegador:
 *  - Rate limiting de requests a Firestore
 *  - Sanitización de inputs
 *  - Detección de bots
 *  - Protección contra enumeración de datos
 */

// ========================================
// Rate Limiter para Firestore Reads
// ========================================

interface RateLimitBucket {
    count: number;
    resetTime: number;
}

const buckets = new Map<string, RateLimitBucket>();

/**
 * Rate limiter client-side para proteger contra abuso de Firestore reads.
 * @param key - Identificador de la operación (ej: 'getStudentByEmail')
 * @param maxRequests - Máximo de requests permitidos en la ventana
 * @param windowMs - Ventana de tiempo en milisegundos
 * @returns true si la request está permitida, false si se excedió el límite
 */
export function clientRateLimit(key: string, maxRequests: number = 20, windowMs: number = 60000): boolean {
    // 🛡️ Check global abuse detector first
    if (isGloballyBlocked()) {
        return false;
    }

    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now > bucket.resetTime) {
        buckets.set(key, { count: 1, resetTime: now + windowMs });
        trackGlobalRequest();
        return true;
    }

    bucket.count++;

    if (bucket.count > maxRequests) {
        console.warn(`[Security] Rate limit exceeded for operation: ${key}`);
        return false;
    }

    trackGlobalRequest();
    return true;
}

// ========================================
// 🛡️ Global Abuse Detector (Anti HTTP-Flood / DDoS)
// ========================================
// Monitorea el TOTAL de requests a Firestore por sesión.
// Si se supera el umbral global, bloquea TODAS las operaciones.
// Esto protege tu cuota gratuita de Firestore (50K reads/día).

const GLOBAL_MAX_REQUESTS = 200;     // Max 200 requests totales...
const GLOBAL_WINDOW_MS = 5 * 60000;  // ...en una ventana de 5 minutos
const GLOBAL_BLOCK_MS = 10 * 60000;  // Bloqueo de 10 minutos si se excede

let globalRequestCount = 0;
let globalWindowStart = Date.now();
let globalBlockedUntil = 0;

function trackGlobalRequest(): void {
    const now = Date.now();

    // Reset window si expiró
    if (now > globalWindowStart + GLOBAL_WINDOW_MS) {
        globalRequestCount = 0;
        globalWindowStart = now;
    }

    globalRequestCount++;

    // Detectar abuso
    if (globalRequestCount > GLOBAL_MAX_REQUESTS) {
        globalBlockedUntil = now + GLOBAL_BLOCK_MS;
        console.error(
            `[🛡️ ABUSE DETECTED] ${globalRequestCount} requests in ${Math.round(GLOBAL_WINDOW_MS / 1000)}s. ` +
            `All Firestore operations blocked for ${Math.round(GLOBAL_BLOCK_MS / 60000)} minutes.`
        );

        // Intentar guardar en sessionStorage para persistir entre navigaciones
        try {
            sessionStorage.setItem('sg_abuse_blocked', String(globalBlockedUntil));
        } catch { /* ignore */ }
    }
}

function isGloballyBlocked(): boolean {
    const now = Date.now();

    // Check memoria
    if (globalBlockedUntil > now) {
        return true;
    }

    // Check sessionStorage (persiste entre navigaciones SPA)
    try {
        const stored = sessionStorage.getItem('sg_abuse_blocked');
        if (stored) {
            const blockedUntil = parseInt(stored, 10);
            if (blockedUntil > now) {
                return true;
            } else {
                sessionStorage.removeItem('sg_abuse_blocked');
            }
        }
    } catch { /* ignore */ }

    return false;
}

/**
 * Retorna info del estado actual del abuse detector (para debugging/UI).
 */
export function getAbuseDetectorStatus(): {
    requestCount: number;
    maxRequests: number;
    isBlocked: boolean;
    blockedUntilMs: number;
} {
    return {
        requestCount: globalRequestCount,
        maxRequests: GLOBAL_MAX_REQUESTS,
        isBlocked: isGloballyBlocked(),
        blockedUntilMs: Math.max(0, globalBlockedUntil - Date.now()),
    };
}


// ========================================
// Input Sanitization
// ========================================

/**
 * Sanitiza un string para prevenir XSS y SQL/NoSQL injection.
 * Elimina tags HTML, caracteres de control, y patrones peligrosos.
 */
export function sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';

    return input
        // Remover tags HTML
        .replace(/<[^>]*>/g, '')
        // Remover caracteres de control
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Remover patrones de SQL injection
        .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/gi, '')
        // Remover operadores NoSQL
        .replace(/\$(?:where|gt|lt|ne|regex|exists|or|and|not|in|nin)/gi, '')
        // Remover JavaScript protocol
        .replace(/javascript\s*:/gi, '')
        // Remover event handlers
        .replace(/on\w+\s*=/gi, '')
        // Trim whitespace
        .trim();
}

/**
 * Valida que un email tenga formato correcto (previene injection via email field).
 */
export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    // Regex estricta para email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
}

/**
 * Valida que un ID de estudiante sea seguro (solo alfanumérico).
 */
export function isValidStudentId(id: string): boolean {
    if (!id || typeof id !== 'string') return false;
    // Solo permitir números y guiones (formato de cédula colombiana)
    const idRegex = /^[0-9A-Za-z\-]{3,20}$/;
    return idRegex.test(id);
}

/**
 * Valida que un simulation ID sea seguro (formato SG11-XX).
 */
export function isValidSimulationId(simId: string): boolean {
    if (!simId || typeof simId !== 'string') return false;
    const simRegex = /^SG\d{2}-\d{2}$/;
    return simRegex.test(simId);
}

// ========================================
// Bot Detection (Heurístico Simple)
// ========================================

/**
 * Detección básica de bots basada en user-agent y comportamiento.
 * No es 100% fiable, pero filtra bots automatizados obvios.
 */
export function isProbablyBot(): boolean {
    if (typeof navigator === 'undefined') return false;

    const ua = navigator.userAgent.toLowerCase();

    // Bots conocidos
    const botPatterns = [
        'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
        'python-requests', 'httpclient', 'java/', 'go-http-client',
        'node-fetch', 'axios', 'puppeteer', 'playwright', 'selenium',
        'headlesschrome', 'phantomjs',
    ];

    if (botPatterns.some(pattern => ua.includes(pattern))) {
        return true;
    }

    // Navegadores sin WebGL (posible headless)
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return true;
    } catch {
        // Si falla la detección, no bloquear
    }

    return false;
}

// ========================================
// Anti-Enumeration Protection
// ========================================

/**
 * Introduce un delay aleatorio para prevenir ataques de timing.
 * Esto evita que un atacante pueda determinar si un usuario existe
 * basándose en el tiempo de respuesta.
 */
export async function antiTimingDelay(minMs: number = 200, maxMs: number = 500): Promise<void> {
    const delay = minMs + Math.random() * (maxMs - minMs);
    await new Promise(resolve => setTimeout(resolve, delay));
}

// ========================================
// Honeypot Field Checker (para formularios)
// ========================================

/**
 * Verifica si un campo honeypot fue llenado (indicador de bot).
 * Agrega un campo oculto en tus formularios con name="website" (invisible para humanos).
 * Si algún bot lo llena, esta función lo detecta.
 */
export function isHoneypotFilled(honeypotValue: string): boolean {
    return honeypotValue !== '' && honeypotValue !== undefined;
}

// ========================================
// Secure localStorage Wrapper
// ========================================

const STORAGE_PREFIX = 'sg_sec_';

/**
 * Guarda datos en localStorage con un wrapper seguro.
 * Codifica en base64 para dificultar lectura casual (no es encriptación real).
 */
export function secureStorageSet(key: string, value: string): void {
    try {
        const encoded = btoa(encodeURIComponent(value));
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, encoded);
    } catch {
        // Storage full or unavailable
    }
}

/**
 * Lee datos del localStorage securizado.
 */
export function secureStorageGet(key: string): string | null {
    try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
        if (!raw) return null;
        return decodeURIComponent(atob(raw));
    } catch {
        return null;
    }
}

/**
 * Elimina un dato del localStorage securizado.
 */
export function secureStorageRemove(key: string): void {
    try {
        localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch {
        // Ignore
    }
}
