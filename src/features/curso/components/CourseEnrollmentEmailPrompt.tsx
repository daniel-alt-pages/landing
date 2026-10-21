'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Mail, RefreshCw } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@features/auth/lib/firebase';
import { clearCourseSessionCaches } from '../lib/clearCourseSessionCaches';
import { maskEnrollmentEmail } from '../lib/courseEnrollmentEmailHint';

type CourseEnrollmentEmailPromptProps = {
  currentEmail?: string;
  enrollmentEmail?: string | null;
  onSwitchAccount: () => void;
};

export default function CourseEnrollmentEmailPrompt({
  currentEmail,
  enrollmentEmail,
  onSwitchAccount,
}: CourseEnrollmentEmailPromptProps) {
  const [loading, setLoading] = useState(false);

  const handleSwitchAccount = async () => {
    setLoading(true);
    try {
      clearCourseSessionCaches();
      await signOut(auth);
      onSwitchAccount();
    } catch {
      onSwitchAccount();
    } finally {
      setLoading(false);
    }
  };

  const maskedEnrollment = enrollmentEmail ? maskEnrollmentEmail(enrollmentEmail) : null;
  const showMismatch = Boolean(
    currentEmail &&
      enrollmentEmail &&
      currentEmail.trim().toLowerCase() !== enrollmentEmail.trim().toLowerCase(),
  );

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-[var(--course-surface)] p-6 shadow-[var(--course-shadow)]">
        <div className="flex items-center gap-2 text-amber-700">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wide">Correo no verificado</p>
        </div>

        <h1 className="mt-2 text-xl font-bold text-[var(--course-text)]">
          Usa el correo del formulario de inscripción
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[var(--course-text-muted)]">
          Para entrar al curso debes iniciar sesión con el <strong>mismo Gmail</strong> que pusiste
          cuando llenaste el formulario de inscripción del vacacional. Otro correo de Google no tiene
          acceso, aunque veas tus simulacros con esa cuenta.
        </p>

        {currentEmail ? (
          <p className="mt-3 rounded-lg border border-[var(--course-border)] bg-[var(--course-surface-muted)] px-3 py-2 text-sm text-[var(--course-text)]">
            Entraste con: <strong className="font-semibold">{currentEmail}</strong>
          </p>
        ) : null}

        {maskedEnrollment ? (
          <div className="mt-4 rounded-xl border border-[var(--course-accent)]/25 bg-[var(--course-accent-soft)] px-4 py-3">
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--course-surface)] shadow-sm">
                <Mail className="h-4 w-4 text-[var(--course-accent)]" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--course-text)]">Correo de tu inscripción</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--course-text-muted)]">
                  {showMismatch
                    ? `Inicia sesión con ${maskedEnrollment} (el que registraste en el formulario).`
                    : `Si no recuerdas tu Gmail, busca el que usaste al inscribirte — suele ser similar a ${maskedEnrollment}.`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-[var(--course-accent)]/25 bg-[var(--course-accent-soft)] px-4 py-3 text-sm leading-relaxed text-[var(--course-text-muted)]">
            Revisa el correo que escribiste en el formulario de inscripción del curso vacacional y
            vuelve a entrar con esa cuenta de Google.
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleSwitchAccount()}
          disabled={loading}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-violet-500/25 transition hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          {loading ? 'Cerrando sesión…' : 'Entrar con otro Gmail'}
        </button>

        <Link
          href="/estudiante/dashboard"
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-[var(--course-border)] bg-[var(--course-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--course-text)] transition hover:bg-[var(--course-surface-muted)]"
        >
          Volver a mis simulacros
        </Link>

        <p className="mt-3 text-center text-xs text-[var(--course-text-muted)]">
          ¿El correo del formulario ya no existe? Escríbenos a soporte con tu documento.
        </p>
      </div>
    </div>
  );
}
