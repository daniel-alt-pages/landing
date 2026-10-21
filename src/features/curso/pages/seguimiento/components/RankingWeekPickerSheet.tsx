'use client';

import { useEffect } from 'react';
import { CalendarRange, Check, X } from 'lucide-react';
import CourseMobileBottomSheet from '../../../components/CourseMobileBottomSheet';
import type { CourseAttendanceWeekMeta } from '../../../lib/courseAttendanceReport';

type RankingWeekPickerSheetProps = {
  weeks: CourseAttendanceWeekMeta[];
  activeWeekIndex: number;
  onSelect: (weekIndex: number) => void;
  onClose: () => void;
};

export default function RankingWeekPickerSheet({
  weeks,
  activeWeekIndex,
  onSelect,
  onClose,
}: RankingWeekPickerSheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const border = 'border-[var(--course-border)]';
  const muted = 'text-[var(--course-text-muted)]';
  const text = 'text-[var(--course-text)]';

  return (
    <CourseMobileBottomSheet
      onClose={onClose}
      ariaLabelledBy="ranking-week-picker-title"
      reserveBottomNav
      panelClassName={`border ${border} bg-[var(--course-surface)] min-h-0`}
    >
      <header className={`flex items-start gap-3 border-b ${border} px-4 py-3 shrink-0 sm:px-5`}>
        <div className="min-w-0 flex-1">
          <h3
            id="ranking-week-picker-title"
            className={`flex items-center gap-2 text-base font-bold ${text}`}
          >
            <CalendarRange className="h-4 w-4 text-[var(--course-accent)]" aria-hidden />
            Semana del ranking
          </h3>
          <p className={`mt-0.5 text-xs ${muted}`}>
            Elige la semana para ver el ranking semanal.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`shrink-0 rounded-lg p-2 ${muted} hover:bg-[var(--course-surface-muted)]`}
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-5">
        {weeks.map((week) => {
          const selected = week.index === activeWeekIndex;
          return (
            <li key={week.index}>
              <button
                type="button"
                onClick={() => {
                  onSelect(week.index);
                  onClose();
                }}
                className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                  selected
                    ? 'border-[var(--course-accent)]/50 bg-[var(--course-accent)]/10 ring-1 ring-[var(--course-accent)]/25'
                    : `border-[var(--course-border)] bg-[var(--course-surface-muted)]/30 hover:bg-[var(--course-surface-muted)]/60`
                }`}
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black tabular-nums ${
                    selected
                      ? 'bg-[var(--course-accent)] text-white'
                      : 'bg-[var(--course-surface-muted)] text-[var(--course-text-muted)]'
                  }`}
                >
                  {week.index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-bold ${text}`}>{week.heading}</p>
                  <p className={`mt-0.5 text-[11px] ${muted}`}>
                    {week.scheduledClasses} clase{week.scheduledClasses === 1 ? '' : 's'} programada
                    {week.scheduledClasses === 1 ? '' : 's'}
                  </p>
                </div>
                {selected ? (
                  <Check className="h-5 w-5 shrink-0 text-[var(--course-accent)]" aria-hidden />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </CourseMobileBottomSheet>
  );
}
