/**
 * Smoke test: bloqueo local doc+fecha (sin navegador).
 * Ejecutar: npm run verify:direct-login-lockout
 * (desde reportes-sg-next)
 */

const DIRECT_LOGIN_MAX_ATTEMPTS = 3;
const DIRECT_LOGIN_LOCK_MS = 30 * 60 * 1000;
const STORAGE_PREFIX = 'sg_direct_login_lock:';

const store = new Map();

global.localStorage = {
    getItem(key) {
        return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
        store.set(key, value);
    },
    removeItem(key) {
        store.delete(key);
    },
};

function normalizeDirectLoginId(id) {
    return String(id || '').replace(/\D/g, '').trim();
}

function lockKey(studentId) {
    return `${STORAGE_PREFIX}${normalizeDirectLoginId(studentId)}`;
}

function readState(studentId) {
    const key = lockKey(studentId);
    if (!key || key === STORAGE_PREFIX) return { attempts: 0, lockedUntil: 0 };
    const raw = localStorage.getItem(key);
    if (!raw) return { attempts: 0, lockedUntil: 0 };
    return JSON.parse(raw);
}

function writeState(studentId, state) {
    localStorage.setItem(lockKey(studentId), JSON.stringify(state));
}

function getDirectLoginLock(studentId) {
    const state = readState(studentId);
    const now = Date.now();
    if (state.lockedUntil > 0 && state.lockedUntil <= now) {
        const reset = { attempts: 0, lockedUntil: 0 };
        writeState(studentId, reset);
        return reset;
    }
    return state;
}

function recordDirectLoginFailure(studentId) {
    const now = Date.now();
    const current = getDirectLoginLock(studentId);
    if (current.lockedUntil > now) return current;
    const attempts = current.attempts + 1;
    const lockedUntil = attempts >= DIRECT_LOGIN_MAX_ATTEMPTS ? now + DIRECT_LOGIN_LOCK_MS : 0;
    const next = { attempts, lockedUntil };
    writeState(studentId, next);
    return next;
}

function assert(cond, msg) {
    if (!cond) {
        console.error('FAIL:', msg);
        process.exit(1);
    }
}

const doc = '1002367670';
let s = recordDirectLoginFailure(doc);
assert(s.attempts === 1 && s.lockedUntil === 0, 'attempt 1');
s = recordDirectLoginFailure(doc);
assert(s.attempts === 2 && s.lockedUntil === 0, 'attempt 2');
s = recordDirectLoginFailure(doc);
assert(s.attempts === 3 && s.lockedUntil > Date.now(), 'attempt 3 locks');
assert(getDirectLoginLock(doc).lockedUntil > Date.now(), 'still locked');

console.log('OK: direct login lockout (3 fails → 30 min)');
