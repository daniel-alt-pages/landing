/**
 * LOCAL-ONLY: Google Auth remoto deshabilitado.
 * Usa sesión local / fixtures / login directo.
 */
import {
  auth,
  googleProvider,
  __createLocalUser,
  __setLocalAuthUser,
} from '@features/auth/lib/firebase';

type GoogleAuthBundle = {
  signInWithPopup: (a: typeof auth, p: typeof googleProvider) => Promise<{ user: ReturnType<typeof __createLocalUser> }>;
  signInWithRedirect: () => Promise<never>;
  getRedirectResult: () => Promise<null>;
  auth: typeof auth;
  googleProvider: typeof googleProvider;
};

let googleAuthReady: Promise<GoogleAuthBundle> | null = null;

export function loadGoogleAuth(): Promise<GoogleAuthBundle> {
  if (!googleAuthReady) {
    googleAuthReady = Promise.resolve({
      async signInWithPopup() {
        const user = __createLocalUser({
          uid: 'local-demo-student',
          email: 'ana.demo@edugenios.local',
          displayName: 'Ana Demo',
        });
        __setLocalAuthUser(user);
        return { user };
      },
      async signInWithRedirect() {
        throw new Error('[reports-experimental] LOCAL-ONLY: redirect Google deshabilitado');
      },
      async getRedirectResult() {
        return null;
      },
      auth,
      googleProvider,
    });
  }
  return googleAuthReady;
}
