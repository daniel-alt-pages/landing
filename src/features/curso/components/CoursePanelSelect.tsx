'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type CoursePanelSelectOption = { value: string; label: string };

type CoursePanelSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: CoursePanelSelectOption[];
  'aria-label'?: string;
  variant?: 'pill' | 'field';
  className?: string;
  disabled?: boolean;
};

const TRIGGER_BASE =
  'inline-flex items-center justify-between gap-2 text-left font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--course-accent)]/40 disabled:cursor-not-allowed disabled:opacity-50';

function triggerClassForVariant(variant: 'pill' | 'field'): string {
  if (variant === 'field') {
    return `${TRIGGER_BASE} min-h-11 w-full rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)] px-3 py-2.5 text-sm text-[var(--course-text)] hover:bg-[var(--course-surface)]`;
  }
  return `${TRIGGER_BASE} min-h-9 w-full min-w-[9.75rem] max-w-[12.5rem] rounded-full border border-[var(--course-border)] bg-[var(--course-surface)] px-3 py-1.5 text-xs text-[var(--course-text)] hover:bg-[var(--course-surface-muted)]`;
}

const MENU_CLASS =
  'absolute left-0 right-0 top-[calc(100%+0.35rem)] z-[90] overflow-hidden rounded-xl border border-[var(--course-border)] bg-[var(--course-surface)] p-1 shadow-[var(--course-shadow-lg)] ring-1 ring-black/5';

const OPTION_BASE =
  'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--course-accent)]/40';

/** Desplegable del panel curso — sin `<select>` nativo del OS. */
export default function CoursePanelSelect({
  value,
  onChange,
  options,
  'aria-label': ariaLabel,
  variant = 'field',
  className = '',
  disabled = false,
}: CoursePanelSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={triggerClassForVariant(variant)}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[var(--course-text-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <ul role="listbox" aria-label={ariaLabel} className={MENU_CLASS}>
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`${OPTION_BASE} ${
                    active
                      ? 'bg-[var(--course-accent-soft)] text-[var(--course-accent)]'
                      : 'text-[var(--course-text)] hover:bg-[var(--course-surface-muted)]'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {active ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
