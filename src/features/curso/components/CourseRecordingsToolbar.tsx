'use client';

import { useMemo } from 'react';
import { Star } from 'lucide-react';
import type { SimRecording } from '@features/recordings/lib/recordingsTypes';
import RecordingsFilterChips from '@features/recordings/components/RecordingsFilterChips';
import CourseRecordingsSortMenu from './CourseRecordingsSortMenu';
import {
  buildCourseRecordingAreaOptions,
  buildCourseRecordingClassTypeOptions,
  buildCourseRecordingDateOptions,
  buildCourseRecordingWeekOptions,
  countActiveCourseRecordingFilters,
  EMPTY_COURSE_RECORDING_FILTERS,
  type CourseRecordingFilterState,
  type CourseRecordingSort,
} from '../lib/courseRecordingsFilters';

type CourseRecordingsToolbarProps = {
  allRecordings: SimRecording[];
  filters: CourseRecordingFilterState;
  onFiltersChange: (filters: CourseRecordingFilterState) => void;
  favoriteCount?: number;
  compact?: boolean;
  /** Ocultar tipo de clase cuando ya hay tabs Clases oficiales / Inducciones. */
  hideClassTypeFilter?: boolean;
  courseId?: string;
};

const SORT_LABELS: Record<CourseRecordingSort, string> = {
  clase: 'Por clase (#)',
  newest: 'Más recientes',
  oldest: 'Más antiguas',
  area: 'Por área',
};

/** Filtros bajo el player / encima de la lista relacionada (estilo YouTube). */
export default function CourseRecordingsToolbar({
  allRecordings,
  filters,
  onFiltersChange,
  favoriteCount = 0,
  compact = false,
  hideClassTypeFilter = false,
  courseId,
}: CourseRecordingsToolbarProps) {
  const activeFilterCount = countActiveCourseRecordingFilters(filters);
  const canFilterFavorites = favoriteCount > 0;
  const areaOptions = useMemo(
    () => buildCourseRecordingAreaOptions(allRecordings),
    [allRecordings],
  );
  const dateOptions = useMemo(
    () => buildCourseRecordingDateOptions(allRecordings),
    [allRecordings],
  );
  const weekOptions = useMemo(
    () => (courseId ? buildCourseRecordingWeekOptions(allRecordings, courseId) : []),
    [allRecordings, courseId],
  );
  const classTypeOptions = useMemo(
    () =>
      hideClassTypeFilter
        ? [{ value: 'all', label: 'Todos los tipos' }]
        : buildCourseRecordingClassTypeOptions(allRecordings),
    [allRecordings, hideClassTypeFilter],
  );
  const sortOptions = useMemo(
    () =>
      (Object.keys(SORT_LABELS) as CourseRecordingSort[]).map((key) => ({
        value: key,
        label: SORT_LABELS[key],
      })),
    [],
  );

  const handleFavoritesToggle = () => {
    if (!canFilterFavorites && !filters.favoritesOnly) return;
    onFiltersChange({ ...filters, favoritesOnly: !filters.favoritesOnly });
  };

  return (
    <div className={`space-y-3 ${compact ? '' : 'mb-1'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleFavoritesToggle}
          disabled={!canFilterFavorites && !filters.favoritesOnly}
          className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${
            filters.favoritesOnly
              ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100'
              : 'border-[var(--course-border)] bg-[var(--course-surface)] text-[var(--course-text)] hover:bg-[var(--course-surface-muted)]'
          }`}
          aria-pressed={filters.favoritesOnly}
          title={
            !canFilterFavorites
              ? 'Marca la estrella en una grabación para usar este filtro'
              : undefined
          }
        >
          <Star
            className={`h-3.5 w-3.5 shrink-0 ${
              filters.favoritesOnly ? 'fill-amber-400 text-amber-500' : ''
            }`}
            aria-hidden
          />
          Favoritos
          {favoriteCount > 0 ? (
            <span
              className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                filters.favoritesOnly
                  ? 'bg-amber-500 text-white'
                  : 'bg-[var(--course-surface-muted)] text-[var(--course-text-muted)]'
              }`}
            >
              {favoriteCount}
            </span>
          ) : null}
        </button>

        <div className="inline-flex min-h-9 min-w-0 items-center gap-2">
          <span className="shrink-0 text-xs font-medium text-[var(--course-text-muted)]">Orden</span>
          <CourseRecordingsSortMenu
            value={filters.sort}
            onChange={(sort) =>
              onFiltersChange({ ...filters, sort: sort as CourseRecordingSort })
            }
            options={sortOptions}
            aria-label="Ordenar clases"
          />
        </div>

        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={() => onFiltersChange(EMPTY_COURSE_RECORDING_FILTERS)}
            className="inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-xs font-semibold text-[var(--course-text-muted)] transition hover:bg-[var(--course-surface-muted)] hover:text-[var(--course-text)]"
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>

      <RecordingsFilterChips
        filters={filters}
        areaOptions={areaOptions}
        weekOptions={weekOptions.length > 1 ? weekOptions : undefined}
        dateOptions={dateOptions}
        classTypeOptions={classTypeOptions}
        onFiltersChange={onFiltersChange}
      />
    </div>
  );
}
