'use client';

import type { CourseRecordingFilterState } from '@features/curso/lib/courseRecordingsFilters';

type ChipOption = { value: string; label: string };

type RecordingsFilterChipsProps = {
  filters: CourseRecordingFilterState;
  areaOptions: ChipOption[];
  weekOptions?: ChipOption[];
  dateOptions: ChipOption[];
  classTypeOptions: ChipOption[];
  onFiltersChange: (filters: CourseRecordingFilterState) => void;
  className?: string;
};

function chipClass(active: boolean) {
  if (active) {
    return 'bg-[var(--course-text)] text-[var(--course-bg)] shadow-sm';
  }
  return 'border border-[var(--course-border)] bg-[var(--course-surface)] text-[var(--course-text)] hover:bg-[var(--course-surface-muted)]';
}

function ChipRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--course-text-muted)]">
        {label}
      </p>
      <div className="sg-recordings-filter-scroll flex gap-2 overflow-x-auto pb-0.5">{children}</div>
    </div>
  );
}

/** Pills horizontales estilo YouTube — área, fecha y tipo. */
export default function RecordingsFilterChips({
  filters,
  areaOptions,
  weekOptions,
  dateOptions,
  classTypeOptions,
  onFiltersChange,
  className = '',
}: RecordingsFilterChipsProps) {
  const typeOptions = classTypeOptions.filter((o) => o.value !== 'all');

  return (
    <div className={`space-y-3 ${className}`} role="toolbar" aria-label="Filtrar clases">
      {areaOptions.length > 1 ? (
        <ChipRow label="Área">
          {areaOptions.map((opt) => {
            const active = filters.areaKey === opt.value;
            return (
              <button
                key={`area-${opt.value}`}
                type="button"
                onClick={() => onFiltersChange({ ...filters, areaKey: opt.value })}
                className={`inline-flex max-w-[11rem] shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${chipClass(active)}`}
                aria-pressed={active}
                title={opt.value === 'all' ? undefined : opt.label}
              >
                <span className="truncate">
                  {opt.value === 'all' ? 'Todas' : opt.label}
                </span>
              </button>
            );
          })}
        </ChipRow>
      ) : null}

      {weekOptions && weekOptions.length > 1 ? (
        <ChipRow label="Semana del horario">
          {weekOptions.map((opt) => {
            const active = filters.weekKey === opt.value;
            return (
              <button
                key={`week-${opt.value}`}
                type="button"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    weekKey: opt.value,
                    dateKey: opt.value !== 'all' ? 'all' : filters.dateKey,
                  })
                }
                className={`inline-flex max-w-[14rem] shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${chipClass(active)}`}
                aria-pressed={active}
                title={opt.value === 'all' ? undefined : opt.label}
              >
                <span className="truncate">
                  {opt.value === 'all' ? 'Todas' : opt.label}
                </span>
              </button>
            );
          })}
        </ChipRow>
      ) : null}

      <ChipRow label="Fecha">
        {dateOptions.map((opt) => {
          const active = filters.dateKey === opt.value;
          return (
            <button
              key={`date-${opt.value}`}
              type="button"
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  dateKey: opt.value,
                  weekKey: opt.value !== 'all' ? 'all' : filters.weekKey,
                })
              }
              className={`inline-flex shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${chipClass(active)}`}
              aria-pressed={active}
            >
              {opt.label}
            </button>
          );
        })}
      </ChipRow>

      {typeOptions.length > 0 ? (
        <ChipRow label="Tipo de clase">
          <button
            type="button"
            onClick={() => onFiltersChange({ ...filters, classType: 'all' })}
            className={`inline-flex shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${chipClass(filters.classType === 'all')}`}
            aria-pressed={filters.classType === 'all'}
          >
            Todos
          </button>
          {typeOptions.map((opt) => {
            const active = filters.classType === opt.value;
            return (
              <button
                key={`type-${opt.value}`}
                type="button"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    classType: active ? 'all' : opt.value,
                  })
                }
                className={`inline-flex shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${chipClass(active)}`}
                aria-pressed={active}
                title={opt.label}
              >
                {opt.label.length > 24 ? `${opt.label.slice(0, 22)}…` : opt.label}
              </button>
            );
          })}
        </ChipRow>
      ) : null}
    </div>
  );
}
