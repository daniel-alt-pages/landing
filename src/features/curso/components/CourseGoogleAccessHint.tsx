'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Mail } from 'lucide-react';
import { readCourseAccessEmail } from '../lib/courseStudentSession';

type CourseGoogleAccessHintProps = {
  className?: string;
  /** Enlace al compilado personalizado del estudiante (PDF en Drive). */
  compiladoHref?: string | null;
  compiladoTitle?: string | null;
  /** Ej. "preguntas 1 a 75" del título de la clase. */
  questionRangeLabel?: string | null;
};

/** Aviso: materiales y notas Gemini requieren el correo registrado en el vacacional. */
export default function CourseGoogleAccessHint({
  className = '',
  compiladoHref,
  compiladoTitle,
  questionRangeLabel,
}: CourseGoogleAccessHintProps) {
  const [email, setEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    setEmail(readCourseAccessEmail());
  }, []);

  const showCompilado = Boolean(compiladoHref?.trim());

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)]/80 px-3 py-2.5 text-xs leading-relaxed text-[var(--course-text-muted)] sm:flex-row sm:items-center sm:justify-between sm:gap-3 ${className}`}
      role="note"
    >
      <div className="flex min-w-0 gap-2">
        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--course-accent)]" aria-hidden />
        <p className="min-w-0">
          {email ? (
            <>
              Para ver notas de Gemini, PDFs y materiales en Google, abre el enlace con{' '}
              <span className="font-semibold text-[var(--course-text)]">{email}</span> — el mismo
              correo de tu registro y acceso a este panel.
            </>
          ) : (
            <>
              Para ver notas de Gemini y materiales en Google, inicia sesión con el correo que
              registraste en el formulario del vacacional (el mismo con que accedes al curso).
            </>
          )}
        </p>
      </div>

      {showCompilado && compiladoHref ? (
        <a
          href={compiladoHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-[var(--course-border)] bg-[var(--course-surface)] px-3 py-2 text-xs font-semibold text-[var(--course-text)] shadow-sm transition hover:border-[var(--course-accent)] hover:bg-[var(--course-accent-soft)] hover:text-[var(--course-accent)] sm:self-center"
        >
          <span className="text-left leading-snug">
            <span className="block">Abrir mi compilado</span>
            {questionRangeLabel ? (
              <span className="block text-[10px] font-medium text-[var(--course-text-muted)]">
                {questionRangeLabel}
              </span>
            ) : compiladoTitle ? (
              <span className="block text-[10px] font-medium text-[var(--course-text-muted)] line-clamp-2">
                {compiladoTitle}
              </span>
            ) : null}
          </span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
        </a>
      ) : null}
    </div>
  );
}
