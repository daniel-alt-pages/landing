/**
 * Bootstrap LOCAL-ONLY para el fork experimental.
 * No inicializa Firebase. Falla si hay variables Firebase en el entorno.
 */

type LocalUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
  getIdToken: (force?: boolean) => Promise<string>;
  getIdTokenResult: (force?: boolean) => Promise<{
    token: string;
    claims: Record<string, unknown>;
  }>;
};

type AuthListener = (user: LocalUser | null) => void;

const FIREBASE_ENV_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
  "NEXT_PUBLIC_FIREBASE_ENV",
  "FIREBASE_API_KEY",
  "FIREBASE_PROJECT_ID",
  "GOOGLE_APPLICATION_CREDENTIALS",
] as const;

function assertLocalOnly(): void {
  const present = FIREBASE_ENV_KEYS.filter((k) => {
    const v = process.env[k];
    return typeof v === "string" && v.trim().length > 0;
  });
  if (present.length > 0) {
    throw new Error(
      `[reports-experimental] LOCAL-ONLY: variables Firebase detectadas (${present.join(
        ", "
      )}). Elimínalas del entorno antes de arrancar.`
    );
  }
}

assertLocalOnly();

const listeners = new Set<AuthListener>();
let currentUser: LocalUser | null = null;

function notify() {
  for (const l of listeners) l(currentUser);
}

export function __setLocalAuthUser(user: LocalUser | null) {
  currentUser = user;
  notify();
}

export function __createLocalUser(partial: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}): LocalUser {
  const token = `local-token:${partial.uid}`;
  return {
    uid: partial.uid,
    email: partial.email ?? null,
    displayName: partial.displayName ?? null,
    isAnonymous: false,
    getIdToken: async () => token,
    getIdTokenResult: async () => ({
      token,
      claims: {
        localOnly: true,
        email: partial.email ?? null,
      },
    }),
  };
}

const auth = {
  get currentUser() {
    return currentUser;
  },
  onAuthStateChanged(cb: AuthListener) {
    listeners.add(cb);
    cb(currentUser);
    return () => listeners.delete(cb);
  },
  signOut: async () => {
    currentUser = null;
    notify();
  },
};

/** Stub compatible con GoogleAuthProvider (no abre popups remotos). */
const googleProvider = {
  setCustomParameters: () => googleProvider,
  addScope: () => googleProvider,
};

/**
 * Stub Firestore mínimo para que `doc(db, …)` no explote al construir refs.
 * Cualquier lectura/escritura real debe quedar en ramas isLocal o fallar en getDoc.
 */
const db = {
  type: "firestore",
  toJSON: () => ({ localOnly: true }),
  app: {
    name: "[LOCAL-ONLY]",
    options: { projectId: "local-only-no-firebase" },
    automaticDataCollectionEnabled: false,
  },
  _settings: { localOnly: true },
} as unknown as Record<string, unknown>;

export function onAuthStateChanged(
  _auth: typeof auth,
  cb: AuthListener
): () => void {
  return auth.onAuthStateChanged(cb);
}

export async function waitForAuth(): Promise<void> {
  return Promise.resolve();
}

export function isRealAuthUser(
  user: LocalUser | null | undefined
): user is LocalUser {
  return !!user && !user.isAnonymous;
}

export async function waitForRealUser(timeoutMs = 7000): Promise<LocalUser> {
  if (isRealAuthUser(currentUser)) return currentUser;
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      unsub();
      reject(
        new Error(
          "No hay sesión local. Usa login demo o fixtures de auth_index."
        )
      );
    }, timeoutMs);
    const unsub = auth.onAuthStateChanged((user) => {
      if (!isRealAuthUser(user)) return;
      clearTimeout(t);
      unsub();
      resolve(user);
    });
  });
}

export { auth, googleProvider, db };
export type { LocalUser };
