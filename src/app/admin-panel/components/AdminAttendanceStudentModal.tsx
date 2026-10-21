'use client';

import { useMemo } from 'react';
import type {
  AdminAttendanceReport,
  AdminAttendanceReportRow,
} from '@features/admin/lib/fetchAdminCourseAttendanceReport';
import {
  type AttendanceRankingEntry,
  type AttendanceRankingRanksByPerson,
} from '@features/curso/lib/courseAttendanceRanking';
import CourseAttendanceStudentModal from '@features/curso/pages/seguimiento/components/CourseAttendanceStudentModal';
import {
  displayVacacionalInstitution,
  VACACIONAL_COURSE_DISPLAY_LABEL,
} from '@features/curso/lib/vacacionalCourseLabels';
import { AdminModalLightScope } from './adminModalLightScope';

type AdminAttendanceStudentModalProps = {
  row: AdminAttendanceReportRow;
  entry: AttendanceRankingEntry;
  report: AdminAttendanceReport;
  ranksByPerson: AttendanceRankingRanksByPerson;
  onClose: () => void;
};

export default function AdminAttendanceStudentModal({
  row,
  entry,
  report,
  ranksByPerson,
  onClose,
}: AdminAttendanceStudentModalProps) {
  const geoLine = [row.enrollmentMunicipio, row.enrollmentDepartamento].filter(Boolean).join(' · ');

  const streakLooksStale = useMemo(
    () =>
      entry.classStreak > entry.sessionsCompleted || entry.dayStreak > entry.sessionsCompleted,
    [entry.classStreak, entry.dayStreak, entry.sessionsCompleted],
  );

  const headerMeta = (
    <div className="mt-1 space-y-0.5 text-xs text-[var(--course-text-muted)]">
      {row.documento ? <p>Doc. {row.documento}</p> : null}
      {row.institution ? (
        <p className="truncate">{displayVacacionalInstitution(row.institution)}</p>
      ) : row.courseId ? (
        <p className="uppercase tracking-wide">{VACACIONAL_COURSE_DISPLAY_LABEL}</p>
      ) : null}
      {geoLine ? <p className="truncate">{geoLine}</p> : null}
    </div>
  );

  return (
    <AdminModalLightScope>
      <CourseAttendanceStudentModal
        row={row}
        entry={entry}
        report={report}
        ranksByPerson={ranksByPerson}
        onClose={onClose}
        headerMeta={headerMeta}
        matchWarning={Boolean(row.matchWarning)}
        streakStaleWarning={streakLooksStale}
      />
    </AdminModalLightScope>
  );
}
