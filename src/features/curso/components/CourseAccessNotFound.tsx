'use client';

import Link from 'next/link';

type CourseAccessNotFoundProps = {
  email?: string;
};

export default function CourseAccessNotFound({ email }: CourseAccessNotFoundProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <p className="text-6xl font-black text-[var(--course-border-strong)]">404</p>
        <h1 className="mt-2 text-xl font-bold text-[var(--course-text)]">No tienes acceso a este curso</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--course-text-muted)]">
          {email
            ? `La cuenta ${email} no tiene un curso activo asignado en el sistema.`
            : 'Tu cuenta no tiene un curso activo asignado en el sistema.'}
          {' '}
          Si acabas de inscribirte, espera unos minutos o contacta soporte con tu documento.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-[var(--course-border)] bg-[var(--course-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--course-text)] transition hover:bg-[var(--course-surface-muted)]"
          >
            Volver al inicio de sesión
          </Link>
          <Link
            href="/estudiante/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-[var(--course-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Ir a mis resultados
          </Link>
        </div>
      </div>
    </div>
  );
}
