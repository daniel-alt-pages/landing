'use client';

import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useCourseRecordingsFiltersOptional } from '../context/CourseRecordingsFiltersContext';

type CourseRecordingsSearchBarProps = {
  compact?: boolean;
  className?: string;
  /** Modo expandido (desktop): barra ocupa el centro del chrome. */
  expanded?: boolean;
  onRequestCollapse?: () => void;
};

/** Buscador de grabaciones — vive en el chrome del panel curso. */
export default function CourseRecordingsSearchBar({
  compact = false,
  className = '',
  expanded = false,
  onRequestCollapse,
}: CourseRecordingsSearchBarProps) {
  const ctx = useCourseRecordingsFiltersOptional();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!expanded) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [expanded]);

  if (!ctx) return null;

  const { filters, patchFilters } = ctx;

  const handleCollapse = () => {
    if (filters.query) patchFilters({ query: '' });
    onRequestCollapse?.();
  };

  return (
    <label className={`relative block min-w-0 ${className}`}>
      <span className="sr-only">Buscar grabaciones</span>
      {expanded && onRequestCollapse ? (
        <button
          type="button"
          onClick={handleCollapse}
          className="absolute left-1.5 top-1/2 z-[1] inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[var(--course-text-muted)] hover:bg-[var(--course-border)]"
          aria-label="Cerrar búsqueda"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--course-text-muted)]"
          aria-hidden
        />
      )}
      <input
        ref={inputRef}
        type="search"
        value={filters.query}
        onChange={(e) => patchFilters({ query: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && expanded) handleCollapse();
        }}
        placeholder="Buscar clases"
        className={`w-full rounded-full border border-[var(--course-border)] bg-[var(--course-surface-muted)] py-2 text-sm text-[var(--course-text)] placeholder:text-[var(--course-text-muted)] transition focus:border-[var(--course-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--course-accent)]/25 ${
          expanded && onRequestCollapse ? 'min-h-9 pl-9 pr-9' : 'pl-9 pr-9'
        } ${compact ? 'min-h-9' : 'min-h-10'}`}
      />
      {filters.query && !expanded ? (
        <button
          type="button"
          onClick={() => patchFilters({ query: '' })}
          className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[var(--course-text-muted)] hover:bg-[var(--course-border)]"
          aria-label="Limpiar búsqueda"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </label>
  );
}
