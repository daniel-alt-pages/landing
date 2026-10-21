/**
 * Enlace oculto demo coordinador — token AES (misma clave que coordinatorBypass).
 * Uso: `/acceso-demo/coordinador?token=<url-encoded>`
 */
import CryptoJS from 'crypto-js';
import { grantDemoCoordinadorAccess } from './demoCoordinadorAccess';

const SECRET_KEY = process.env.NEXT_PUBLIC_COORDINATOR_SECRET || 'sg-coord-secret-2026';

export type DemoCoordinadorAccessPayload = {
  kind: 'demo_coord';
  expiresAt: number;
  createdAt: number;
};

export function generateDemoCoordinadorAccessToken(expirationDays = 30): string {
  const now = Date.now();
  const payload: DemoCoordinadorAccessPayload = {
    kind: 'demo_coord',
    createdAt: now,
    expiresAt: now + expirationDays * 24 * 60 * 60 * 1000,
  };
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(payload), SECRET_KEY).toString();
  return encodeURIComponent(encrypted);
}

export function validateDemoCoordinadorAccessToken(token: string): boolean {
  try {
    const decrypted = CryptoJS.AES.decrypt(decodeURIComponent(token), SECRET_KEY).toString(
      CryptoJS.enc.Utf8,
    );
    if (!decrypted) return false;
    const payload = JSON.parse(decrypted) as DemoCoordinadorAccessPayload;
    if (payload.kind !== 'demo_coord') return false;
    if (Date.now() > payload.expiresAt) return false;
    return true;
  } catch {
    return false;
  }
}

/** Valida token y deja sesión demo en `sessionStorage`. */
export function unlockDemoCoordinadorFromToken(token: string): boolean {
  if (!validateDemoCoordinadorAccessToken(token)) return false;
  grantDemoCoordinadorAccess();
  return true;
}
