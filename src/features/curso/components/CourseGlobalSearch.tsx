'use client';

import { useState } from 'react';
import { Clapperboard, FolderOpen, Link2 } from 'lucide-react';
import CourseChromeSearchField from './CourseChromeSearchField';
import type { CourseDoc, CourseSectionTab } from '../types/courseTypes';
import { useCourseSearch, type CourseSearchResult } from '../hooks/useCourseSearch';

const KIND_ICON = {
  recording: Clapperboard,
  material: FolderOpen,
  class: Link2,
} as const;

type CourseGlobalSearchProps = {
  course: CourseDoc;
  onNavigate: (tab: CourseSectionTab, opts?: { recordingId?: string }) => void;
  compact?: boolean;
};

export default function CourseGlobalSearch({
  course,
  onNavigate,
  compact = false,
}: CourseGlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const { results, hasQuery } = useCourseSearch(course, query);

  const handleSelect = (item: CourseSearchResult) => {
    onNavigate(item.tab, item.recordingId ? { recordingId: item.recordingId } : undefined);
    setQuery('');
    setFocused(false);
  };

  return (
    <div className="relative">
      <CourseChromeSearchField
        value={query}
        onChange={setQuery}
        placeholder={compact ? 'Buscar…' : 'Grabaciones, materiales, clases…'}
        ariaLabel="Buscar en el curso"
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 150)}
      />

      {focused && hasQuery ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-[60] max-h-72 overflow-y-auto rounded-xl border border-[var(--course-border)] bg-[var(--course-surface)] py-2 shadow-lg"
          role="listbox"
          aria-label="Resultados de búsqueda"
        >
          {results.length ? (
            results.slice(0, 12).map((item) => {
              const Icon = KIND_ICON[item.kind];
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(item)}
                  className="flex w-full min-h-11 items-start gap-3 px-4 py-2.5 text-left transition hover:bg-[var(--course-accent-soft)]"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--course-accent)]" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[var(--course-text)]">
                      {item.title}
                    </span>
                    {item.subtitle ? (
                      <span className="block truncate text-xs text-[var(--course-text-muted)]">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })
          ) : (
            <p className="px-4 py-3 text-sm text-[var(--course-text-muted)]">
              Sin resultados para &quot;{query.trim()}&quot;
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
