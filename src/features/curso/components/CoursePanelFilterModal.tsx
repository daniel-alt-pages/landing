'use client';

import { X } from 'lucide-react';
import CoursePanelModalShell from './CoursePanelModalShell';

type CoursePanelFilterModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onClear: () => void;
  onApply: () => void;
  children: React.ReactNode;
};

export default function CoursePanelFilterModal({
  open,
  title,
  description,
  onClose,
  onClear,
  onApply,
  children,
}: CoursePanelFilterModalProps) {
  return (
    <CoursePanelModalShell
      open={open}
      onClose={onClose}
      ariaLabelledBy="course-filter-modal-title"
      panelClassName="flex h-dvh max-h-dvh w-full max-w-lg flex-col overflow-hidden rounded-none border border-[var(--course-border)] bg-[var(--course-surface)] shadow-2xl sm:h-auto sm:max-h-[min(90dvh,640px)] sm:rounded-3xl"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[var(--course-border)] px-5 py-4">
        <div>
          <h2
            id="course-filter-modal-title"
            className="text-lg font-bold text-[var(--course-text)]"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-[var(--course-text-muted)]">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--course-border)] text-[var(--course-text-muted)] hover:bg-[var(--course-surface-muted)]"
          aria-label="Cerrar filtros"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>

      <div className="flex gap-2 border-t border-[var(--course-border)] px-5 py-4">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)] text-sm font-semibold text-[var(--course-text)] hover:bg-[var(--course-surface-muted)]/80"
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={() => {
            onApply();
            onClose();
          }}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[var(--course-accent)] text-sm font-semibold text-white hover:opacity-90"
        >
          Aplicar
        </button>
      </div>
    </CoursePanelModalShell>
  );
}
