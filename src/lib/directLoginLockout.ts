/**
 * Bloqueo local tras fallos de login documento + fecha (mitigación sin Blaze).
 * Persiste en localStorage por número de documento.
 */

import type { DirectStudentLoginError } from '@features/simulacro/lib/firestoreService';

export const DIRECT_LOGIN_MAX_ATTEMPTS = 3;
export const DIRECT_LOGIN_LOCK_MS = 30 * 60 * 1000;

export interface DirectLoginLockState {
    attempts: number;
    lockedUntil: number;
}

const STORAGE_PREFIX = 'sg_direct_login_lock:';

export const DIRECT_LOGIN_FAILURE_ERRORS: DirectStudentLoginError[] = [
    'invalid-input',
    'invalid-document',
    'invalid-birth-date',
    'not-found',
    'birth-date-missing',
    'birth-date-mismatch',
    'functions-unavailable',
];

export function normalizeDirectLoginId(id: string): string {
    return String(id || '').replace(/\D/g, '').trim();
}

function lockKey(studentId: string): string {
    return `${STORAGE_PREFIX}${normalizeDirectLoginId(studentId)}`;
}

function readState(studentId: string): DirectLoginLockState {
    const key = lockKey(studentId);
    if (!key || key === STORAGE_PREFIX) {
        return { attempts: 0, lockedUntil: 0 };
    }
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return { attempts: 0, lockedUntil: 0 };
        const parsed = JSON.parse(raw) as Partial<DirectLoginLockState>;
        return {
            attempts: Number(parsed.attempts) || 0,
            lockedUntil: Number(parsed.lockedUntil) || 0,
        };
    } catch {
        return { attempts: 0, lockedUntil: 0 };
    }
}

function writeState(studentId: string, state: DirectLoginLockState): void {
    const key = lockKey(studentId);
    if (!key || key === STORAGE_PREFIX) return;
    try {
        localStorage.setItem(key, JSON.stringify(state));
    } catch {
        /* ignore quota */
    }
}

export function getDirectLoginLock(studentId: string): DirectLoginLockState {
    const state = readState(studentId);
    const now = Date.now();
    if (state.lockedUntil > 0 && state.lockedUntil <= now) {
        const reset = { attempts: 0, lockedUntil: 0 };
        writeState(studentId, reset);
        return reset;
    }
    return state;
}

export function isDirectLoginLocked(studentId: string): boolean {
    const state = getDirectLoginLock(studentId);
    return state.lockedUntil > Date.now();
}

export function getDirectLoginLockRemainingMs(studentId: string): number {
    const state = getDirectLoginLock(studentId);
    return Math.max(0, state.lockedUntil - Date.now());
}

export function recordDirectLoginFailure(studentId: string): DirectLoginLockState {
    const now = Date.now();
    const current = getDirectLoginLock(studentId);
    if (current.lockedUntil > now) return current;

    const attempts = current.attempts + 1;
    const lockedUntil =
        attempts >= DIRECT_LOGIN_MAX_ATTEMPTS ? now + DIRECT_LOGIN_LOCK_MS : 0;

    const next: DirectLoginLockState = { attempts, lockedUntil };
    writeState(studentId, next);
    return next;
}

export function clearDirectLoginLock(studentId: string): void {
    const key = lockKey(studentId);
    if (!key || key === STORAGE_PREFIX) return;
    try {
        localStorage.removeItem(key);
    } catch {
        /* ignore */
    }
}

export function shouldCountDirectLoginFailure(
    error?: DirectStudentLoginError
): error is DirectStudentLoginError {
    return !!error && DIRECT_LOGIN_FAILURE_ERRORS.includes(error);
}

export function formatLockRemaining(ms: number): string {
    if (ms <= 0) return '0 min';
    const totalMinutes = Math.ceil(ms / 60000);
    if (totalMinutes < 60) return `${totalMinutes} min`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
}
