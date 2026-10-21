import { auth, isRealAuthUser, waitForRealUser } from '@features/auth/lib/firebase';

/**
 * courseRuntime / snapshots / metrics exigen request.auth en reglas staging.
 * localStorage student_id no basta — hay que esperar usuario Firebase real (Google/direct).
 */
export async function ensureCourseFirestoreAuth(source: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (isRealAuthUser(auth.currentUser)) return true;

  try {
    await waitForRealUser(1200);
    return true;
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ensureCourseFirestoreAuth] sin sesión Firebase real', { source });
    }
    return false;
  }
}
