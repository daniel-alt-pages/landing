'use client';

import { ExternalLink, FileText, X } from 'lucide-react';
import type { ClassMaterialPickerOptions } from '../lib/courseVacacionalClassMaterialAccess';
import CourseGoogleAccessHint from './CourseGoogleAccessHint';
import CoursePanelModalShell from './CoursePanelModalShell';

type CourseClassMaterialPickerModalProps = {
  open: boolean;
  options: ClassMaterialPickerOptions | null;
  materialsLoading?: boolean;
  onClose: () => void;
};

export default function CourseClassMaterialPickerModal({
  open,
  options,
  materialsLoading = false,
  onClose,
}: CourseClassMaterialPickerModalProps) {
  const hasGemini = Boolean(options?.gemini?.url);
  const hasCompilado = Boolean(options?.compilado?.url);
  const hasExtra = (options?.extraAttachments.length ?? 0) > 0;
  const hasAny = hasGemini || hasCompilado || hasExtra;

  return (
    <CoursePanelModalShell
      open={open && Boolean(options)}
      onClose={onClose}
      ariaLabelledBy="class-material-picker-title"
      zIndexClass="z-[75]"
      panelClassName="flex h-dvh max-h-dvh w-full max-w-lg flex-col overflow-hidden rounded-none border border-[var(--course-border)] bg-[var(--course-surface)] shadow-2xl sm:h-auto sm:max-h-[min(90dvh,640px)] sm:rounded-3xl"
    >
      {options ? (
        <>
          <div className="flex items-start justify-between gap-3 border-b border-[var(--course-border)] px-5 py-4">
            <div className="min-w-0">
              <h2
                id="class-material-picker-title"
                className="text-lg font-bold text-[var(--course-text)]"
              >
                Materiales de la clase
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-[var(--course-text-muted)]">
                {options.sessionTitle}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--course-border)] text-[var(--course-text-muted)] hover:bg-[var(--course-surface-muted)]"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
            <CourseGoogleAccessHint />

            {materialsLoading ? (
              <p className="text-sm text-[var(--course-text-muted)]">Cargando tu compilado…</p>
            ) : null}

            {!materialsLoading && !hasAny ? (
              <p className="rounded-xl border border-dashed border-[var(--course-border)] bg-[var(--course-surface-muted)] px-4 py-3 text-sm text-[var(--course-text-muted)]">
                Aún no hay notas ni compilado publicado para esta clase.
              </p>
            ) : null}

            {hasGemini ? (
              <a
                href={options.gemini!.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)]/80 px-4 py-3 transition hover:border-[var(--course-accent)] hover:bg-[var(--course-accent-soft)]"
              >
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--course-surface)] text-[var(--course-accent)] shadow-sm"
                  aria-hidden
                >
                  <FileText className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[var(--course-text)]">
                    Notas de la clase
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--course-text-muted)]">
                    Resumen y apuntes de Gemini en Google Docs
                  </span>
                </span>
                <ExternalLink
                  className="mt-1 h-4 w-4 shrink-0 text-[var(--course-text-muted)]"
                  aria-hidden
                />
              </a>
            ) : null}

            {hasCompilado ? (
              <a
                href={options.compilado!.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)]/80 px-4 py-3 transition hover:border-[var(--course-accent)] hover:bg-[var(--course-accent-soft)]"
              >
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-[10px] font-black uppercase text-white shadow-sm"
                  aria-hidden
                >
                  PDF
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[var(--course-text)]">
                    {options.compiladoLabel ?? options.compilado!.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--course-text-muted)]">
                    Tu compilado personalizado del área (PDF en Drive)
                  </span>
                </span>
                <ExternalLink
                  className="mt-1 h-4 w-4 shrink-0 text-[var(--course-text-muted)]"
                  aria-hidden
                />
              </a>
            ) : !materialsLoading && options.areaKey ? (
              <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-xs text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100">
                No encontramos tu compilado de esta área. Revisa la pestaña Materiales o contacta
                soporte si acabas de registrarte.
              </p>
            ) : null}

            {hasExtra ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--course-text-muted)]">
                  Otros de esta sesión
                </p>
                {options.extraAttachments.map((att) => (
                  <a
                    key={att.url}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded-lg border border-[var(--course-border)] px-3 py-2 text-sm font-medium text-[var(--course-text)] hover:bg-[var(--course-surface-muted)]"
                  >
                    <span className="truncate">{att.title || 'Material'}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="border-t border-[var(--course-border)] px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)] text-sm font-semibold text-[var(--course-text)] hover:bg-[var(--course-border)]/40"
            >
              Cerrar
            </button>
          </div>
        </>
      ) : null}
    </CoursePanelModalShell>
  );
}
