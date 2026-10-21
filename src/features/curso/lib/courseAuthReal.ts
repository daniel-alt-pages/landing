'use client';

import { onAuthStateChanged } from 'firebase/auth';
import { auth, isRealAuthUser, waitForRealUser } from '@features/auth/lib/firebase';

const COURSE_GOOGLE_WAIT_MS = 8_000;

/** Firebase autenticado y no anónimo (Google / email real). */
export function hasRealGoogleAuthSync(): boolean {
  if (typeof window === 'undefined') return false;
  return isRealAuthUser(auth.currentUser);
}

/** Espera sesión Firebase real antes de leer courseAccess/courses. */
export async function waitForCourseGoogleAuth(
  timeoutMs = COURSE_GOOGLE_WAIT_MS,
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (hasRealGoogleAuthSync()) return true;

  try {
    await waitForRealUser(timeoutMs);
    return hasRealGoogleAuthSync();
  } catch {
    return false;
  }
}

/** Resuelve cuando hay usuario real o timeout (para gates UI). */
export function watchCourseGoogleAuth(
  onReady: (hasGoogle: boolean) => void,
  timeoutMs = COURSE_GOOGLE_WAIT_MS,
): () => void {
  if (typeof window === 'undefined') {
    onReady(false);
    return () => {};
  }

  if (hasRealGoogleAuthSync()) {
    onReady(true);
    return () => {};
  }

  let settled = false;
  const finish = (hasGoogle: boolean) => {
    if (settled) return;
    settled = true;
    onReady(hasGoogle);
  };

  const timeout = window.setTimeout(() => finish(hasRealGoogleAuthSync()), timeoutMs);
  const unsub = onAuthStateChanged(auth, (user) => {
    if (isRealAuthUser(user)) {
      window.clearTimeout(timeout);
      finish(true);
    }
  });

  return () => {
    window.clearTimeout(timeout);
    unsub();
  };
}
