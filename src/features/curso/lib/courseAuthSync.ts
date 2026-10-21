import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@features/auth/lib/firebase';
import { isValidEmail } from '@/lib/security';
import { clearCourseSessionCaches } from './clearCourseSessionCaches';

let cachedAuthEmail: string | undefined;
let cachedAuthStudentId: string | undefined;
let authSyncStarted = false;

function applyAuthUser(user: import('firebase/auth').User | null): void {
  if (user && !user.isAnonymous && user.email && isValidEmail(user.email)) {
    cachedAuthEmail = user.email.trim().toLowerCase();
    void user
      .getIdTokenResult()
      .then((result) => {
        const sid = String(result.claims.studentId || '').trim();
        cachedAuthStudentId = sid || undefined;
      })
      .catch(() => {
        cachedAuthStudentId = undefined;
      });
    return;
  }
  if (cachedAuthEmail || cachedAuthStudentId) {
    clearCourseSessionCaches();
  }
  cachedAuthEmail = undefined;
  cachedAuthStudentId = undefined;
}

/** Cache sync de email/claims Firebase para buildIdentityFromSession (sin await). */
export function initCourseAuthIdentitySync(): void {
  if (typeof window === 'undefined' || authSyncStarted) return;
  authSyncStarted = true;
  onAuthStateChanged(auth, applyAuthUser);
  applyAuthUser(auth.currentUser);
}

export function readCachedAuthEmail(): string | undefined {
  return cachedAuthEmail;
}

export function readCachedAuthStudentId(): string | undefined {
  return cachedAuthStudentId;
}
