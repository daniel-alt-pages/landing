'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import CourseMobileBottomSheet from '../../../components/CourseMobileBottomSheet';
import type { CourseAttendanceReport, CourseAttendanceReportRow } from '../../../lib/courseAttendanceReport';
import {
  ATTENDANCE_RANKING_SORT_LABELS,
  type AttendanceRankingEntry,
  type AttendanceRankingRanksByPerson,
  type AttendanceRankingSort,
} from '../../../lib/courseAttendanceRanking';
import AttendanceStudentModalBody from './AttendanceStudentModalBody';
import RankingStudentContextPanel from './RankingStudentContextPanel';
import { buildExcusaDatesForEmail } from '../../../lib/courseAttendanceExcusas';
import WeeklyStreakCard from './WeeklyStreakCard';
import { displayVacacionalInstitution } from '../../../lib/vacacionalCourseLabels';

type CourseAttendanceStudentModalProps = {
  row: CourseAttendanceReportRow;
  entry: AttendanceRankingEntry;
  report: CourseAttendanceReport;
  ranksByPerson: AttendanceRankingRanksByPerson;
  activeSort?: AttendanceRankingSort;
  isCurrentUser?: boolean;
  onClose: () => void;
  headerMeta?: ReactNode;
  matchWarning?: boolean;
  streakStaleWarning?: boolean;
};

export default function CourseAttendanceStudentModal({
  row,
  entry,
  report,
  ranksByPerson,
  activeSort,
  isCurrentUser,
  onClose,
  headerMeta,
  matchWarning,
  streakStaleWarning,
}: CourseAttendanceStudentModalProps) {
  const personRanks = ranksByPerson.get(row.personKey) || {};
  const compositeScore = entry.compositeScore ?? 0;
  const institutionLabel = row.institution
    ? displayVacacionalInstitution(row.institution)
    : null;

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

  const handleClose = (e?: { preventDefault?: () => void; stopPropagation?: () => void }) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    onClose();
  };

  return (
    <CourseMobileBottomSheet
      onClose={onClose}
      ariaLabelledBy="course-attendance-modal-title"
      reserveBottomNav
      zIndexClass="z-[200]"
      panelClassName={`border ${border} bg-[var(--course-surface)] min-h-0 overflow-hidden`}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className={`relative z-20 shrink-0 border-b ${border} bg-[var(--course-surface)]`}>
          <header className="flex items-start gap-3 px-4 py-2.5 sm:px-5 sm:py-2.5">
            <div className="min-w-0 flex-1">
              <h3 id="course-attendance-modal-title" className={`text-base font-bold truncate ${text}`}>
                {row.rosterName || row.displayName}
                {isCurrentUser ? (
                  <span className="ml-2 text-[10px] font-bold uppercase text-[var(--course-accent)]">
                    Tú
                  </span>
                ) : null}
              </h3>
            </div>
            <button
              type="button"
              onPointerDown={handleClose}
              onClick={handleClose}
              className={`relative z-30 shrink-0 rounded-lg p-2.5 ${muted} hover:bg-[var(--course-surface-muted)] active:bg-[var(--course-surface-muted)]`}
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="px-4 pb-3 sm:px-5">
            <WeeklyStreakCard
              embedded
              recentSessions={row.recentSessions}
              courseId={row.courseId}
              excusaDates={buildExcusaDatesForEmail(report.excusas, row.emailLower)}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <div className={`space-y-2 border-b ${border} px-4 py-3 sm:px-5`}>
            {institutionLabel ? <p className={`text-xs truncate ${muted}`}>{institutionLabel}</p> : null}
            {row.emailLower ? (
              <p className={`text-xs truncate ${muted}`}>{row.emailLower}</p>
            ) : null}
            <RankingStudentContextPanel row={row} variant="stack" />
            {headerMeta}
            {personRanks.overall ? (
              <p className="text-sm font-black text-[var(--course-accent)]">
                #{personRanks.overall} general · {compositeScore} pts
              </p>
            ) : activeSort && personRanks[activeSort] ? (
              <p className="text-xs font-semibold text-[var(--course-accent)]">
                #{personRanks[activeSort]} en {ATTENDANCE_RANKING_SORT_LABELS[activeSort]}
              </p>
            ) : null}
          </div>

          <AttendanceStudentModalBody
            row={row}
            entry={entry}
            report={report}
            ranksByPerson={ranksByPerson}
            variant="course"
            matchWarning={matchWarning}
            streakStaleWarning={streakStaleWarning}
            scrollContainer={false}
            isCurrentUser={isCurrentUser}
          />
        </div>
      </div>
    </CourseMobileBottomSheet>
  );
}
