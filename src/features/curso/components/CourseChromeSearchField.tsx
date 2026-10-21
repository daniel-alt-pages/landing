'use client';

import { Search, X } from 'lucide-react';

type CourseChromeSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
};

/** Input compacto del chrome — mismo estilo para búsqueda global y ranking. */
export default function CourseChromeSearchField({
  value,
  onChange,
  placeholder = 'Buscar…',
  ariaLabel = 'Buscar',
  className = '',
  onFocus,
  onBlur,
}: CourseChromeSearchFieldProps) {
  return (
    <label className={`relative block min-w-0 ${className}`}>
      <span className="sr-only">{ariaLabel}</span>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--course-text-muted)]"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className="min-h-9 w-full rounded-lg border border-[var(--course-border)] bg-[var(--course-surface)] py-1.5 pl-8 pr-8 text-sm text-[var(--course-text)] placeholder:text-[var(--course-text-muted)] focus:border-[var(--course-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--course-accent)]/20"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[var(--course-text-muted)] hover:bg-[var(--course-surface-muted)]"
          aria-label="Limpiar búsqueda"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </label>
  );
}
