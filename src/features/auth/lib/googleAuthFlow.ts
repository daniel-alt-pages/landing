'use client';

import type { UserCredential } from 'firebase/auth';
import { loadGoogleAuth } from './loadGoogleAuth';

type GoogleLoginStart =
  | { status: 'signed-in'; result: UserCredential }
  | { status: 'redirecting' };

function googleAuthCode(err: unknown): string {
  return String((err as { code?: string } | null)?.code || '');
}

function googleAuthMessage(err: unknown): string {
  return String((err as { message?: string } | null)?.message || '').toLowerCase();
}

export function isStorageBlockedGoogleAuthError(err: unknown): boolean {
  const message = googleAuthMessage(err);
  return (
    message.includes('missing initial state') ||
    message.includes('sessionstorage is inaccessible') ||
    message.includes('storage-partitioned') ||
    (message.includes('failed to execute') && message.includes('storage'))
  );
}

export function shouldFallbackToRedirect(err: unknown): boolean {
  const code = googleAuthCode(err);
  return (
    code === 'auth/popup-blocked' ||
    code === 'auth/cancelled-popup-request' ||
    code === 'auth/operation-not-supported-in-this-environment' ||
    isStorageBlockedGoogleAuthError(err)
  );
}

function isMobileOrInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Android|iPhone|iPad|iPod|Mobile|FBAN|FBAV|Instagram|Line\/|WhatsApp|wv\)/i.test(ua);
}

export async function startGoogleLogin(options: { forceRedirect?: boolean } = {}): Promise<GoogleLoginStart> {
  const { signInWithPopup, signInWithRedirect, auth, googleProvider } = await loadGoogleAuth();

  if (options.forceRedirect || isMobileOrInAppBrowser()) {
    await signInWithRedirect(auth, googleProvider);
    return { status: 'redirecting' };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { status: 'signed-in', result: result as unknown as UserCredential };
  } catch (err) {
    if (!shouldFallbackToRedirect(err)) throw err;
    await signInWithRedirect(auth, googleProvider);
    return { status: 'redirecting' };
  }
}

export async function finishGoogleRedirectLogin(): Promise<UserCredential | null> {
  const { getRedirectResult, auth } = await loadGoogleAuth();
  return getRedirectResult(auth);
}
