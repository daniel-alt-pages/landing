'use client';

import type { CourseRecordingCatalogSegment } from '@features/recordings/lib/recordingsTypes';
import {
  COURSE_RECORDING_SEGMENT_HINTS,
  COURSE_RECORDING_SEGMENT_LABELS,
} from '../lib/courseRecordingsSegments';

type CourseRecordingsSegmentTabsProps = {
  activeSegment: CourseRecordingCatalogSegment;
  onSegmentChange: (segment: CourseRecordingCatalogSegment) => void;
  counts: Record<CourseRecordingCatalogSegment, number>;
  compact?: boolean;
};

export default function CourseRecordingsSegmentTabs({
  activeSegment,
  onSegmentChange,
  counts,
  compact = false,
}: CourseRecordingsSegmentTabsProps) {
  const segments: CourseRecordingCatalogSegment[] = ['official', 'induction'];

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <div
        className="flex gap-1 rounded-xl border border-[var(--course-border)] bg-[var(--course-surface-muted)] p-1"
        role="tablist"
        aria-label="Tipo de grabación"
      >
        {segments.map((segment) => {
          const active = activeSegment === segment;
          const count = counts[segment];
          return (
            <button
              key={segment}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={count === 0}
              onClick={() => onSegmentChange(segment)}
              className={`min-h-9 flex-1 rounded-lg px-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 sm:px-3 sm:text-sm ${
                active
                  ? 'bg-[var(--course-surface)] text-[var(--course-text)] shadow-sm'
                  : 'text-[var(--course-text-muted)] hover:text-[var(--course-text)]'
              }`}
            >
              <span>{COURSE_RECORDING_SEGMENT_LABELS[segment]}</span>
              <span className="ml-1 tabular-nums text-[var(--course-text-muted)]">({count})</span>
            </button>
          );
        })}
      </div>
      {!compact ? (
        <p className="text-[11px] leading-snug text-[var(--course-text-muted)]">
          {COURSE_RECORDING_SEGMENT_HINTS[activeSegment]}
        </p>
      ) : null}
    </div>
  );
}
