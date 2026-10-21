/**
 * Sistema de Enlaces Encriptados para Coordinadores
 * 
 * Permite generar enlaces especiales que bypasean el modo mantenimiento
 * y tienen acceso directo sin consumir presupuesto de reads normal.
 * 
 * Características:
 * - Enlaces con token encriptado único por coordinador
 * - Expiración configurable (default: 30 días)
 * - Bypass automático de MaintenanceGate
 * - Presupuesto de reads elevado (500 sesión, 150/min)
 * - Auditoría de accesos
 */

import CryptoJS from 'crypto-js';

// Clave secreta para encriptación (debe estar en variables de entorno en producción)
const SECRET_KEY = process.env.NEXT_PUBLIC_COORDINATOR_SECRET || 'sg-coord-secret-2026';

export interface CoordinatorBypassToken {
    coordinatorEmail: string;
    institution: string;
    expiresAt: number; // timestamp
    createdAt: number;
    permissions: {
        bypassMaintenance: boolean;
        elevatedReads: boolean;
    };
}

/**
 * Genera un token encriptado para un coordinador
 */
export function generateCoordinatorBypassToken(
    coordinatorEmail: string,
    institution: string,
    expirationDays: number = 30
): string {
    const now = Date.now();
    const expiresAt = now + (expirationDays * 24 * 60 * 60 * 1000);
    
    const payload: CoordinatorBypassToken = {
        coordinatorEmail,
        institution,
        expiresAt,
        createdAt: now,
        permissions: {
            bypassMaintenance: true,
            elevatedReads: true,
        },
    };
    
    const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(payload),
        SECRET_KEY
    ).toString();
    
    // URL-safe base64
    return encodeURIComponent(encrypted);
}

/**
 * Valida y decodifica un token de coordinador
 */
export function validateCoordinatorBypassToken(
    token: string
): CoordinatorBypassToken | null {
    try {
        const decrypted = CryptoJS.AES.decrypt(
            decodeURIComponent(token),
            SECRET_KEY
        ).toString(CryptoJS.enc.Utf8);
        
        if (!decrypted) return null;
        
        const payload: CoordinatorBypassToken = JSON.parse(decrypted);
        
        // Verificar expiración
        if (Date.now() > payload.expiresAt) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('[CoordinatorBypass] Token expirado');
            }
            return null;
        }

        return payload;
    } catch {
        if (process.env.NODE_ENV === 'development') {
            console.warn('[CoordinatorBypass] Token inválido o corrupto');
        }
        return null;
    }
}

/**
 * Genera un enlace completo con token de bypass
 */
export function generateCoordinatorBypassLink(
    coordinatorEmail: string,
    institution: string,
    baseUrl: string = 'https://simulacros-sg.web.app',
    expirationDays: number = 30
): string {
    const token = generateCoordinatorBypassToken(
        coordinatorEmail,
        institution,
        expirationDays
    );
    
    return `${baseUrl}/coordinador?bypass=${token}`;
}

/**
 * Verifica si hay un token de bypass válido en la URL actual
 */
export function checkBypassToken(): CoordinatorBypassToken | null {
    if (typeof window === 'undefined') return null;
    
    const params = new URLSearchParams(window.location.search);
    const token = params.get('bypass');
    
    if (!token) return null;
    
    const validated = validateCoordinatorBypassToken(token);
    
    if (validated) {
        // Guardar en localStorage para persistir entre navegaciones
        localStorage.setItem('coordinator_bypass', JSON.stringify(validated));
        localStorage.setItem('coordinator_email', validated.coordinatorEmail);
        localStorage.setItem('coordinator_institution', validated.institution);
        
        if (process.env.NODE_ENV === 'development') {
            console.log('[CoordinatorBypass] Token activado', {
                email: validated.coordinatorEmail,
                institution: validated.institution,
                expiresInDays: Math.round(
                    (validated.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)
                ),
            });
        }
        
        // Limpiar URL para no exponer el token
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', cleanUrl);
    }
    
    return validated;
}

/**
 * Obtiene el token de bypass activo (desde URL o localStorage)
 */
export function getActiveBypassToken(): CoordinatorBypassToken | null {
    // Primero verificar URL
    const urlToken = checkBypassToken();
    if (urlToken) return urlToken;
    
    // Luego verificar localStorage
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem('coordinator_bypass');
    if (!stored) return null;
    
    try {
        const payload: CoordinatorBypassToken = JSON.parse(stored);
        
        // Verificar expiración
        if (Date.now() > payload.expiresAt) {
            console.warn('[CoordinatorBypass] Token almacenado expirado, limpiando...');
            localStorage.removeItem('coordinator_bypass');
            return null;
        }
        
        return payload;
    } catch {
        return null;
    }
}

/**
 * Verifica si el usuario actual tiene bypass activo
 */
export function hasBypassActive(): boolean {
    return getActiveBypassToken() !== null;
}

/**
 * Limpia el token de bypass
 */
export function clearBypassToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('coordinator_bypass');
}

/**
 * Hook para React que verifica bypass al montar
 */
export function useCoordinatorBypass() {
    if (typeof window === 'undefined') return null;
    
    // Verificar en mount
    const token = getActiveBypassToken();
    
    return {
        hasBypass: !!token,
        token,
        clear: clearBypassToken,
    };
}
