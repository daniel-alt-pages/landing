'use client';

type CourseSelectorProps = {
  courseIds: string[];
  selectedCourseId: string;
  labels?: Record<string, string>;
  onSelect: (courseId: string) => void;
};

export default function CourseSelector({
  courseIds,
  selectedCourseId,
  labels,
  onSelect,
}: CourseSelectorProps) {
  if (courseIds.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Seleccionar curso">
      {courseIds.map((id) => {
        const active = id === selectedCourseId;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`min-h-10 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              active
                ? 'border-[var(--course-accent)] bg-[var(--course-accent-soft)] text-[var(--course-accent)] shadow-sm'
                : 'border-[var(--course-border)] bg-[var(--course-surface)] text-[var(--course-text-muted)] hover:border-[var(--course-accent)] hover:text-[var(--course-accent)]'
            }`}
            aria-pressed={active}
          >
            {labels?.[id] || id}
          </button>
        );
      })}
    </div>
  );
}
