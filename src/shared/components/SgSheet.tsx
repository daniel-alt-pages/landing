'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

type SgSheetProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export default function SgSheet({
  open,
  title,
  description,
  onClose,
  children,
  footer,
}: SgSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/45 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sg-sheet-title"
        tabIndex={-1}
        className="flex h-dvh max-h-dvh w-full max-w-lg flex-col overflow-hidden rounded-none border border-[var(--course-border)] bg-[var(--course-surface)] shadow-2xl sm:h-auto sm:max-h-[min(90dvh,640px)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--course-border)] px-5 py-4">
          <div>
            <h2 id="sg-sheet-title" className="text-lg font-bold text-[var(--course-text)]">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-[var(--course-text-muted)]">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--course-border)] text-[var(--course-text-muted)] transition hover:bg-[var(--course-surface-muted)]"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>

        {footer ? (
          <div className="border-t border-[var(--course-border)] px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
