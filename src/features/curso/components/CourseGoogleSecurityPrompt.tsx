'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ShieldCheck } from 'lucide-react';
import type { User } from 'firebase/auth';
import { loadGoogleAuth } from '@features/auth/lib/loadGoogleAuth';
import { finishGoogleRedirectLogin, startGoogleLogin } from '@features/auth/lib/googleAuthFlow';
import {
  buildIdentityFromSession,
  resolveStudentEntitlements,
  setCourseOnlySession,
} from '../lib/courseEntitlements';
import { clearCourseSessionCaches } from '../lib/clearCourseSessionCaches';
import { logAccess } from '@/lib/accessLogService';

type CourseGoogleSecurityPromptProps = {
  onAuthenticated: () => void;
};

const PROFILE_SESSION_KEYS = [
  'student_id',
  'student_data',
  'simulacro_selected',
  'selected_profile_id',
  'linked_profiles',
] as const;

function snapshotProfileSession(): Record<string, string> {
  return Object.fromEntries(
    PROFILE_SESSION_KEYS.flatMap((key) => {
      const value = localStorage.getItem(key);
      return value === null ? [] : [[key, value]];
    }),
  );
}

function clearProfileSession(): void {
  PROFILE_SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
}

function restoreProfileSession(snapshot: Record<string, string>): void {
  clearProfileSession();
  Object.entries(snapshot).forEach(([key, value]) => localStorage.setItem(key, value));
}

export default function CourseGoogleSecurityPrompt({
  onAuthenticated,
}: CourseGoogleSecurityPromptProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeGoogleCourseAuth = useCallback(async (user: User) => {
      const { auth } = await loadGoogleAuth();
      clearCourseSessionCaches();
      const email = user.email?.trim().toLowerCase();

      if (!email) {
        setError('No pudimos obtener tu correo de Google. Intenta de nuevo.');
        return;
      }

      const profileSnapshot = snapshotProfileSession();
      const hadSelectedProfile = Boolean(profileSnapshot.student_id);
      if (!hadSelectedProfile) {
        localStorage.setItem('student_email', email);
        if (user.displayName) {
          localStorage.setItem('student_name', user.displayName);
        }
      }

      let entitlements = await resolveStudentEntitlements(
        buildIdentityFromSession({ emailLower: email }),
      );

      if (!entitlements.features.miCurso && hadSelectedProfile) {
        clearProfileSession();
        localStorage.setItem('student_email', email);
        if (user.displayName) {
          localStorage.setItem('student_name', user.displayName);
        }
        entitlements = await resolveStudentEntitlements({ emailLower: email });
        if (!entitlements.features.miCurso) {
          restoreProfileSession(profileSnapshot);
        }
      }

      if (!entitlements.features.miCurso) {
        await auth.signOut();
        setError('No encontramos acceso al curso con esta cuenta. Verifica tu inscripción o contacta a soporte.');
        return;
      }

      if (!localStorage.getItem('student_id')) setCourseOnlySession(true);

      logAccess(email, 'estudiante', user.displayName || 'Mi Curso', undefined, user.uid);
      onAuthenticated();
      router.refresh();
  }, [onAuthenticated, router]);

  useEffect(() => {
    let cancelled = false;
    const finishRedirect = async () => {
      try {
        const result = await finishGoogleRedirectLogin();
        if (!result || cancelled) return;
        setLoading(true);
        setError(null);
        await completeGoogleCourseAuth(result.user);
      } catch {
        if (!cancelled) setError('No pudimos verificar tu acceso con Google. Intenta de nuevo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void finishRedirect();
    return () => {
      cancelled = true;
    };
  }, [completeGoogleCourseAuth]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const started = await startGoogleLogin();
      if (started.status === 'redirecting') return;
      await completeGoogleCourseAuth(started.result.user);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') {
        setError('Cerraste la ventana de Google. Vuelve a intentar cuando quieras.');
      } else if (code === 'auth/popup-blocked') {
        setError('Tu navegador bloqueó la ventana de Google. Permite popups e intenta de nuevo.');
      } else {
        setError('No pudimos verificar tu acceso con Google. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--course-border)] bg-[var(--course-surface)] p-6 shadow-[var(--course-shadow)]">
        <div className="flex items-center gap-2 text-[var(--course-accent)]">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wide">Acceso seguro al curso</p>
        </div>
        <h1 className="mt-2 text-xl font-bold text-[var(--course-text)]">Inicia sesión con Google</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--course-text-muted)]">
          Para proteger tus clases y materiales, confirmamos tu identidad con Google. No cambia tu
          inscripción: solo verifica que eres tú.
        </p>

        <div className="mt-4 rounded-xl border border-[var(--course-accent)]/25 bg-[var(--course-accent-soft)] px-4 py-3">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--course-surface)] shadow-sm">
              <Mail className="h-4 w-4 text-[var(--course-accent)]" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--course-text)]">Usa tu correo de inscripción</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--course-text-muted)]">
                Inicia sesión con el <strong>mismo Gmail</strong> del formulario vacacional. Si ya
                entraste a simulacros con otro perfil, no importa: el correo de Google manda.
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void handleGoogleSignIn()}
          disabled={loading}
          className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--course-border)] bg-[var(--course-surface)] px-4 py-3 text-sm font-semibold text-[var(--course-text)] shadow-sm transition hover:bg-[var(--course-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-[var(--course-border)]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </span>
          {loading ? 'Verificando acceso…' : 'Continuar con Google'}
        </button>

        <p className="mt-3 text-center text-xs text-[var(--course-text-muted)]">
          ¿Problemas para entrar? Contacta a soporte con tu documento.
        </p>
      </div>
    </div>
  );
}
